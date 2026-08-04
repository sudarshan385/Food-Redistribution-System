const pool = require("../config/db");
const getExpiryStatus = require("../utils/expiryStatus");
const generateQR = require("../utils/qrGenerator");
const generateBarcode = require("../utils/barcodeGenerator");
// Save Transaction History
const saveHistory = async (foodId, userId, action) => {

    await pool.query(
        `INSERT INTO transaction_history
             (food_id, user_id, action)
         VALUES ($1, $2, $3)`,
        [
            foodId,
            userId,
            action
        ]
    );

};

// Get All Food
const getAllFood = async (donorId) => {

    const result = await pool.query(
        `SELECT *
         FROM food_item
         WHERE donor_id = $1
           AND status = 'AVAILABLE'
         ORDER BY food_id DESC`,
        [donorId]
    );

    const food = result.rows.map(item => ({
        ...item,
        expiry_status: getExpiryStatus(item.expiry_date)
    }));

    return food;



};

// Get Food By ID
const getFoodById = async (id, donorId) => {

    const result = await pool.query(
        `SELECT *
         FROM food_item
         WHERE food_id = $1
           AND donor_id = $2`,
        [
            id,
            donorId
        ]
    );

    if (result.rows.length === 0) {
        throw new Error("Food Item Not Found");
    }

    return result.rows[0];

};
// Get Food By Barcode
const getFoodByBarcode = async (barcode) => {

    console.log("Searching:", barcode);

    const result = await pool.query(

        `SELECT *
         FROM food_item
         WHERE barcode=$1`,

        [barcode]

    );

    console.log(result.rows);

    if(result.rows.length===0){
        throw new Error("Food Item Not Found");
    }

    return result.rows[0];

};

// Add Food
// Add Food
const addFood = async (foodData, donorId) => {

    const {
        food_name,
        category,
        quantity,
        expiry_date,
        storage_condition
    } = foodData;

    // Generate Barcode
    const barcode = generateBarcode();

    console.log("Generated Barcode:", barcode);

    const result = await pool.query(

        `INSERT INTO food_item
         (
             donor_id,
             food_name,
             category,
             quantity,
             expiry_date,
             storage_condition,
             barcode
         )
         VALUES($1,$2,$3,$4,$5,$6,$7)
             RETURNING *`,

        [
            donorId,
            food_name,
            category,
            quantity,
            expiry_date,
            storage_condition,
            barcode
        ]

    );

    const food = result.rows[0];

    console.log("Inserted Food:", food);

    const qr = await generateQR(barcode);
    console.log(qr.substring(0, 50));

    await pool.query(

        `UPDATE food_item
         SET qr_code = $1
         WHERE food_id = $2`,

        [
            qr,
            food.food_id
        ]

    );

    food.barcode = barcode;
    food.qr_code = qr;

    await saveHistory(
        food.food_id,
        donorId,
        "ADD FOOD"
    );

    return food;

};
// Update Food
const updateFood = async (id, foodData, userId) => {

    const {
        food_name,
        category,
        quantity,
        expiry_date,
        storage_condition
    } = foodData;

    const result = await pool.query(
        `UPDATE food_item
         SET food_name = $1,
             category = $2,
             quantity = $3,
             expiry_date = $4,
             storage_condition = $5
         WHERE food_id = $6
           AND donor_id = $7
             RETURNING *`,
        [
            food_name,
            category,
            quantity,
            expiry_date,
            storage_condition,
            id,
            userId
        ]
    );

    if (result.rows.length === 0) {
        throw new Error("Food Item Not Found");
    }

    await saveHistory(
        id,
        userId,
        "UPDATE FOOD"
    );

    return result.rows[0];

};

// Delete Food (Soft Delete)
const deleteFood = async (id, userId) => {

    const result = await pool.query(
        `UPDATE food_item
         SET status = 'REMOVED'
         WHERE food_id = $1
         AND donor_id = $2
         RETURNING *`,
        [
            id,
            userId
        ]
    );

    if (result.rows.length === 0) {
        throw new Error("Food Item Not Found");
    }

    await saveHistory(
        id,
        userId,
        "DELETE FOOD"
    );

    return result.rows[0];

};
// NGO - View All Available Food
const getAvailableFood = async () => {

    const result = await pool.query(
        `SELECT *
         FROM food_item
         WHERE status = 'AVAILABLE'
         ORDER BY food_id DESC`
    );

    const food = result.rows.map(item => ({
        ...item,
        expiry_status: getExpiryStatus(item.expiry_date)
    }));

    return food;

};

module.exports = {
    addFood,
    getAllFood,
    getAvailableFood,
    getFoodById,
    getFoodByBarcode,
    updateFood,
    deleteFood
};