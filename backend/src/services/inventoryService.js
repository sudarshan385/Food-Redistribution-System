const pool = require("../config/db");
const getExpiryStatus = require("../utils/expiryStatus");
const generateQR = require("../utils/qrGenerator");
const generateBarcode = require("../utils/barcodeGenerator");

// ============================================================
// AI SERVICE
// ============================================================

const aiService = require("./aiService");


// ============================================================
// AI BATCH QUEUE / LOCK
// ============================================================
//
// Only ONE AI batch is allowed to run at a time.
//
// If multiple foods are added while AI is running,
// they will wait instead of starting multiple AI jobs.
//
// ============================================================

let aiBatchRunning = false;

let aiBatchPending = false;


// ============================================================
// RUN AI SAFELY
// ============================================================

const runAIAnalysisSafely = async () => {

    // --------------------------------------------------------
    // If AI is already running
    // --------------------------------------------------------

    if (aiBatchRunning) {

        console.log();
        console.log(
            "AI batch is already running."
        );

        console.log(
            "Marking AI refresh as pending..."
        );

        aiBatchPending = true;

        return {

            success: true,

            status: "QUEUED",

            message:
                "AI analysis is already running. New inventory will be included in the next AI analysis."

        };

    }


    // --------------------------------------------------------
    // Start AI
    // --------------------------------------------------------

    aiBatchRunning = true;

    aiBatchPending = false;


    try {

        console.log();
        console.log(
            "========================================"
        );

        console.log(
            "STARTING AI BATCH"
        );

        console.log(
            "========================================"
        );


        const result =
            await aiService.runBatchPrediction();


        console.log();
        console.log(
            "AI BATCH COMPLETED SUCCESSFULLY"
        );

        console.log(
            "========================================"
        );


        return {

            success: true,

            status: "COMPLETED",

            message:
                "AI analysis completed successfully.",

            result

        };

    } catch (error) {

        console.error();
        console.error(
            "========================================"
        );

        console.error(
            "AI BATCH FAILED"
        );

        console.error(
            "========================================"
        );

        console.error(
            error.message
        );


        return {

            success: false,

            status: "FAILED",

            message:
                "AI analysis failed.",

            error:
            error.message

        };

    } finally {

        aiBatchRunning = false;


        // ----------------------------------------------------
        // Check whether another inventory item was added while
        // AI was running.
        // ----------------------------------------------------

        if (aiBatchPending) {

            console.log();
            console.log(
                "Pending AI refresh detected."
            );

            console.log(
                "Running AI again with latest inventory..."
            );


            aiBatchPending = false;


            // Run asynchronously.
            //
            // Do not await here because the original
            // inventory request has already completed.

            setImmediate(
                async () => {

                    await runAIAnalysisSafely();

                }
            );

        }

    }

};


// ============================================================
// SAVE TRANSACTION HISTORY
// ============================================================

const saveHistory = async (
    foodId,
    userId,
    action
) => {

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


// ============================================================
// GET ALL FOOD
// ============================================================

const getAllFood = async (
    donorId
) => {

    const result = await pool.query(

        `SELECT *
         FROM food_item
         WHERE donor_id = $1
           AND status = 'AVAILABLE'
         ORDER BY food_id DESC`,

        [
            donorId
        ]

    );


    const food = result.rows.map(
        item => ({

            ...item,

            expiry_status:
                getExpiryStatus(
                    item.expiry_date
                )

        })
    );


    return food;

};


// ============================================================
// GET FOOD BY ID
// ============================================================

const getFoodById = async (
    id,
    donorId
) => {

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


    if (
        result.rows.length === 0
    ) {

        throw new Error(
            "Food Item Not Found"
        );

    }


    return result.rows[0];

};


// ============================================================
// GET FOOD BY BARCODE
// ============================================================

const getFoodByBarcode = async (
    barcode
) => {

    console.log(
        "Searching:",
        barcode
    );


    const result = await pool.query(

        `SELECT *
         FROM food_item
         WHERE barcode = $1`,

        [
            barcode
        ]

    );


    console.log(
        result.rows
    );


    if (
        result.rows.length === 0
    ) {

        throw new Error(
            "Food Item Not Found"
        );

    }


    return result.rows[0];

};


// ============================================================
// ADD FOOD
// ============================================================

const addFood = async (
    foodData,
    donorId
) => {

    const {

        food_name,

        category,

        quantity,

        expiry_date,

        storage_condition

    } = foodData;


    // ========================================================
    // GENERATE BARCODE
    // ========================================================

    const barcode =
        generateBarcode();


    console.log(
        "Generated Barcode:",
        barcode
    );


    // ========================================================
    // INSERT FOOD
    // ========================================================

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
         VALUES
             (
                 $1,
                 $2,
                 $3,
                 $4,
                 $5,
                 $6,
                 $7
             )
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


    const food =
        result.rows[0];


    console.log(
        "Inserted Food:",
        food
    );


    // ========================================================
    // GENERATE QR CODE
    // ========================================================

    const qr =
        await generateQR(
            barcode
        );


    console.log(
        "Generated QR:"
    );

    console.log(
        qr.substring(
            0,
            50
        )
    );


    // ========================================================
    // SAVE QR CODE
    // ========================================================

    await pool.query(

        `UPDATE food_item
         SET qr_code = $1
         WHERE food_id = $2`,

        [

            qr,

            food.food_id

        ]

    );


    food.barcode =
        barcode;

    food.qr_code =
        qr;


    // ========================================================
    // SAVE TRANSACTION HISTORY
    // ========================================================

    await saveHistory(

        food.food_id,

        donorId,

        "ADD FOOD"

    );


    // ========================================================
    // AUTOMATIC AI ANALYSIS
    // ========================================================

    console.log();

    console.log(
        "========================================"
    );

    console.log(
        "NEW FOOD ADDED"
    );

    console.log(
        "========================================"
    );

    console.log(
        "Food ID:",
        food.food_id
    );

    console.log(
        "Food Name:",
        food.food_name
    );

    console.log(
        "Quantity:",
        food.quantity
    );

    console.log(
        "Expiry:",
        food.expiry_date
    );


    const aiAnalysis =
        await runAIAnalysisSafely();


    // ========================================================
    // ATTACH AI STATUS
    // ========================================================

    food.ai_analysis =
        aiAnalysis;


    // ========================================================
    // RETURN FOOD
    // ========================================================

    return food;

};


// ============================================================
// UPDATE FOOD
// ============================================================

const updateFood = async (
    id,
    foodData,
    userId
) => {

    const {

        food_name,

        category,

        quantity,

        expiry_date,

        storage_condition

    } = foodData;


    const result = await pool.query(

        `UPDATE food_item
         SET
             food_name = $1,
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


    if (
        result.rows.length === 0
    ) {

        throw new Error(
            "Food Item Not Found"
        );

    }


    // ========================================================
    // SAVE HISTORY
    // ========================================================

    await saveHistory(

        id,

        userId,

        "UPDATE FOOD"

    );


    return result.rows[0];

};


// ============================================================
// DELETE FOOD
// ============================================================

const deleteFood = async (
    id,
    userId
) => {

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


    if (
        result.rows.length === 0
    ) {

        throw new Error(
            "Food Item Not Found"
        );

    }


    // ========================================================
    // SAVE HISTORY
    // ========================================================

    await saveHistory(

        id,

        userId,

        "DELETE FOOD"

    );


    return result.rows[0];

};


// ============================================================
// GET AVAILABLE FOOD
// ============================================================

const getAvailableFood = async () => {

    const result = await pool.query(

        `SELECT *
         FROM food_item
         WHERE status = 'AVAILABLE'
         ORDER BY food_id DESC`

    );


    const food = result.rows.map(
        item => ({

            ...item,

            expiry_status:
                getExpiryStatus(
                    item.expiry_date
                )

        })
    );


    return food;

};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    addFood,

    getAllFood,

    getAvailableFood,

    getFoodById,

    getFoodByBarcode,

    updateFood,

    deleteFood

};