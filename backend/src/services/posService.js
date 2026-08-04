const pool = require("../config/db");

// Get POS Products
const getProducts = async (donorId) => {

    const result = await pool.query(

        `SELECT *
         FROM food_item
         WHERE donor_id = $1
           AND status = 'AVAILABLE'
         ORDER BY food_id DESC`,

        [donorId]

    );

    return result.rows;

};

// Import Product from POS
const addProduct = async (data, donorId) => {

    const {
        food_name,
        category,
        quantity,
        expiry_date,
        storage_condition
    } = data;

    const result = await pool.query(

        `INSERT INTO food_item
         (
             donor_id,
             food_name,
             category,
             quantity,
             expiry_date,
             storage_condition
         )
         VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,

        [
            donorId,
            food_name,
            category,
            quantity,
            expiry_date,
            storage_condition
        ]

    );

    return result.rows[0];

};

module.exports = {
    getProducts,
    addProduct
};