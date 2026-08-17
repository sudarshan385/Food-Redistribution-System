const pool = require("../config/db");

// ============================================================
// RECORD SALE
// ============================================================

const recordSale = async (
    foodId,
    quantitySold,
    unitPrice,
    userId
) => {

    const quantity = Number(quantitySold);
    const price = Number(unitPrice || 0);

    if (!foodId) {
        throw new Error("Food ID is required");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(
            "Sale quantity must be greater than 0"
        );
    }

    if (!Number.isFinite(price) || price < 0) {
        throw new Error(
            "Unit price cannot be negative"
        );
    }

    if (!userId) {
        throw new Error(
            "User ID is required"
        );
    }


    // ========================================================
    // START TRANSACTION
    // ========================================================

    await pool.query("BEGIN");

    try {

        // ----------------------------------------------------
        // GET FOOD ITEM
        // ----------------------------------------------------

        const foodResult = await pool.query(
            `SELECT
                 food_id,
                 donor_id,
                 food_name,
                 quantity,
                 status
             FROM food_item
             WHERE food_id = $1
                 FOR UPDATE`,
            [foodId]
        );


        if (foodResult.rows.length === 0) {

            throw new Error(
                "Food item not found"
            );

        }


        const food = foodResult.rows[0];


        // ----------------------------------------------------
        // CHECK STATUS
        // ----------------------------------------------------

        if (food.status !== "AVAILABLE") {

            throw new Error(
                "Food item is not available"
            );

        }


        // ----------------------------------------------------
        // CHECK STOCK
        // ----------------------------------------------------

        const currentStock =
            Number(food.quantity);

        if (currentStock < quantity) {

            throw new Error(
                `Insufficient stock. Available: ${currentStock}`
            );

        }


        // ----------------------------------------------------
        // NEW STOCK
        // ----------------------------------------------------

        const newStock =
            currentStock - quantity;


        // ----------------------------------------------------
        // UPDATE INVENTORY
        // ----------------------------------------------------

        await pool.query(
            `UPDATE food_item
             SET quantity = $1
             WHERE food_id = $2`,
            [
                newStock,
                foodId
            ]
        );


        // ----------------------------------------------------
        // RECORD SALE
        // IMPORTANT:
        // Your actual table has user_id, NOT donor_id.
        // ----------------------------------------------------

        const saleResult = await pool.query(
            `INSERT INTO sales_transactions
             (
                 food_id,
                 quantity_sold,
                 unit_price,
                 sale_date,
                 user_id
             )
             VALUES
                 (
                     $1,
                     $2,
                     $3,
                     CURRENT_TIMESTAMP,
                     $4
                 )
                 RETURNING
                sale_id,
                food_id,
                quantity_sold,
                unit_price,
                sale_date,
                user_id`,
            [
                foodId,
                quantity,
                price,
                userId
            ]
        );


        // ----------------------------------------------------
        // TRANSACTION HISTORY
        // ----------------------------------------------------

        await pool.query(
            `INSERT INTO transaction_history
             (
                 food_id,
                 user_id,
                 action
             )
             VALUES
                 (
                     $1,
                     $2,
                     $3
                 )`,
            [
                foodId,
                userId,
                `POS SALE - ${quantity} UNITS`
            ]
        );


        // ----------------------------------------------------
        // COMMIT
        // ----------------------------------------------------

        await pool.query("COMMIT");


        return {

            sale: saleResult.rows[0],

            food: {

                food_id:
                food.food_id,

                food_name:
                food.food_name,

                previous_stock:
                currentStock,

                new_stock:
                newStock

            }

        };

    } catch (error) {

        await pool.query("ROLLBACK");

        throw error;

    }

};


// ============================================================
// GET SALES HISTORY
// ============================================================

const getSalesHistory = async (
    userId
) => {

    const result = await pool.query(
        `SELECT
             s.sale_id,
             s.food_id,
             f.food_name,
             f.category,
             s.quantity_sold,
             s.unit_price,
             s.sale_date,
             s.user_id
         FROM sales_transactions s
                  JOIN food_item f
                       ON f.food_id = s.food_id
         WHERE s.user_id = $1
         ORDER BY s.sale_date DESC`,
        [userId]
    );

    return result.rows;
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    recordSale,
    getSalesHistory
};