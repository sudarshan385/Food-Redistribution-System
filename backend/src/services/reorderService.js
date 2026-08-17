const pool = require("../config/db");

// ============================================================
// CREATE REORDER REQUEST
// ============================================================

const createReorder = async (
    foodName,
    quantity,
    userId
) => {

    if (!foodName) {
        throw new Error("Food name is required");
    }

    const numericQuantity = Number(quantity);

    if (
        !Number.isFinite(numericQuantity) ||
        numericQuantity <= 0
    ) {
        throw new Error(
            "Reorder quantity must be greater than 0"
        );
    }

    // ------------------------------------------------------------
    // Find real food item in PostgreSQL
    // ------------------------------------------------------------

    const foodResult = await pool.query(
        `SELECT *
         FROM food_item
         WHERE LOWER(TRIM(food_name))
               = LOWER(TRIM($1))
           AND status = 'AVAILABLE'
         ORDER BY food_id DESC
         LIMIT 1`,
        [foodName]
    );

    if (foodResult.rows.length === 0) {
        throw new Error(
            "Food item not found or unavailable"
        );
    }

    const food = foodResult.rows[0];

    // ------------------------------------------------------------
    // Check existing pending reorder
    // ------------------------------------------------------------

    const existingResult = await pool.query(
        `SELECT
            reorder_id,
            food_id,
            requested_quantity,
            status,
            source,
            created_by,
            created_at,
            completed_at
         FROM reorder_request
         WHERE food_id = $1
           AND status = 'PENDING'
         ORDER BY created_at DESC
         LIMIT 1`,
        [food.food_id]
    );

    if (existingResult.rows.length > 0) {

        return {
            ...existingResult.rows[0],
            food_name: food.food_name,
            category: food.category,
            current_stock: food.quantity,
            existing: true
        };
    }

    // ------------------------------------------------------------
    // Create reorder request
    // ------------------------------------------------------------

    const result = await pool.query(
        `INSERT INTO reorder_request
        (
            food_id,
            requested_quantity,
            status,
            source,
            created_by
        )
        VALUES
        (
            $1,
            $2,
            'PENDING',
            'AI',
            $3
        )
        RETURNING
            reorder_id,
            food_id,
            requested_quantity,
            status,
            source,
            created_by,
            created_at,
            completed_at`,
        [
            food.food_id,
            numericQuantity,
            userId || null
        ]
    );

    // ------------------------------------------------------------
    // Transaction history
    // ------------------------------------------------------------

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
            food.food_id,
            userId || null,
            `AI REORDER REQUEST - ${numericQuantity} UNITS`
        ]
    );

    // ------------------------------------------------------------
    // Return normalized response
    // ------------------------------------------------------------

    return {
        ...result.rows[0],
        food_name: food.food_name,
        category: food.category,
        current_stock: food.quantity,
        existing: false
    };
};


// ============================================================
// GET ALL REORDERS
// ============================================================

const getAllReorders = async () => {

    const result = await pool.query(
        `SELECT
            r.reorder_id,
            r.food_id,
            f.food_name,
            f.category,
            f.quantity AS current_stock,
            r.requested_quantity,
            r.status,
            r.source,
            r.created_by,
            r.created_at,
            r.completed_at
         FROM reorder_request r
         JOIN food_item f
           ON f.food_id = r.food_id
         ORDER BY r.created_at DESC`
    );

    return result.rows;
};


// ============================================================
// GET REORDER BY ID
// ============================================================

const getReorderById = async (reorderId) => {

    const result = await pool.query(
        `SELECT
            r.reorder_id,
            r.food_id,
            f.food_name,
            f.category,
            f.quantity AS current_stock,
            r.requested_quantity,
            r.status,
            r.source,
            r.created_by,
            r.created_at,
            r.completed_at
         FROM reorder_request r
         JOIN food_item f
           ON f.food_id = r.food_id
         WHERE r.reorder_id = $1`,
        [reorderId]
    );

    if (result.rows.length === 0) {
        throw new Error(
            "Reorder request not found"
        );
    }

    return result.rows[0];
};


// ============================================================
// UPDATE REORDER STATUS
// ============================================================

const updateReorderStatus = async (
    reorderId,
    status
) => {

    const allowedStatuses = [
        "PENDING",
        "ORDERED",
        "COMPLETED",
        "CANCELLED"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new Error(
            "Invalid reorder status"
        );
    }


    // ========================================================
    // START TRANSACTION
    // ========================================================

    await pool.query("BEGIN");

    try {

        // ----------------------------------------------------
        // GET REORDER + LOCK ROW
        // ----------------------------------------------------

        const reorderResult = await pool.query(
            `SELECT
                r.reorder_id,
                r.food_id,
                r.requested_quantity,
                r.status,
                f.food_name,
                f.quantity AS current_stock
             FROM reorder_request r
             JOIN food_item f
               ON f.food_id = r.food_id
             WHERE r.reorder_id = $1
             FOR UPDATE`,
            [reorderId]
        );


        if (reorderResult.rows.length === 0) {

            throw new Error(
                "Reorder request not found"
            );

        }


        const reorder =
            reorderResult.rows[0];


        // ----------------------------------------------------
        // PREVENT DUPLICATE COMPLETION
        // ----------------------------------------------------

        if (
            reorder.status === "COMPLETED" &&
            status === "COMPLETED"
        ) {

            throw new Error(
                "Reorder is already completed"
            );

        }


        // ----------------------------------------------------
        // COMPLETED LOGIC
        // ----------------------------------------------------

        if (status === "COMPLETED") {

            if (
                reorder.status !== "ORDERED"
            ) {

                throw new Error(
                    "Only ORDERED reorders can be completed"
                );

            }


            const requestedQuantity =
                Number(
                    reorder.requested_quantity
                );


            if (
                !Number.isFinite(
                    requestedQuantity
                ) ||
                requestedQuantity <= 0
            ) {

                throw new Error(
                    "Invalid reorder quantity"
                );

            }


            // ------------------------------------------------
            // UPDATE INVENTORY
            // ------------------------------------------------

            await pool.query(
                `UPDATE food_item
                 SET quantity = quantity + $1
                 WHERE food_id = $2`,
                [
                    requestedQuantity,
                    reorder.food_id
                ]
            );


            // ------------------------------------------------
            // UPDATE REORDER
            // ------------------------------------------------

            const completedResult =
                await pool.query(
                    `UPDATE reorder_request
                     SET
                         status = 'COMPLETED',
                         completed_at = CURRENT_TIMESTAMP
                     WHERE reorder_id = $1
                     RETURNING
                         reorder_id,
                         food_id,
                         requested_quantity,
                         status,
                         source,
                         created_by,
                         created_at,
                         completed_at`,
                    [reorderId]
                );


            // ------------------------------------------------
            // TRANSACTION HISTORY
            // ------------------------------------------------

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
                    reorder.food_id,
                    null,
                    `REORDER RECEIVED - ${requestedQuantity} UNITS`
                ]
            );


            await pool.query("COMMIT");


            return {
                ...completedResult.rows[0],
                food_name:
                reorder.food_name,
                previous_stock:
                    Number(reorder.current_stock),
                new_stock:
                    Number(reorder.current_stock) +
                    requestedQuantity
            };

        }


        // ----------------------------------------------------
        // NORMAL STATUS UPDATE
        // ----------------------------------------------------

        const completedAt =
            status === "COMPLETED"
                ? new Date()
                : null;


        const result = await pool.query(
            `UPDATE reorder_request
             SET
                 status = $1,
                 completed_at = $2
             WHERE reorder_id = $3
             RETURNING
                 reorder_id,
                 food_id,
                 requested_quantity,
                 status,
                 source,
                 created_by,
                 created_at,
                 completed_at`,
            [
                status,
                completedAt,
                reorderId
            ]
        );


        await pool.query("COMMIT");


        return {
            ...result.rows[0],
            food_name:
            reorder.food_name
        };

    } catch (error) {

        await pool.query("ROLLBACK");

        throw error;

    }

};


// ============================================================
// EXPORT ALL FUNCTIONS
// ============================================================

module.exports = {
    createReorder,
    getAllReorders,
    getReorderById,
    updateReorderStatus
};