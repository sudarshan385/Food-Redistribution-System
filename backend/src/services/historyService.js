const pool = require("../config/db");

// Get Transaction History
const getHistory = async (userId) => {

    const result = await pool.query(

        `SELECT
             th.transaction_id,
             th.action,
             th.created_at,
             u.name,
             fi.food_name
         FROM transaction_history th
                  LEFT JOIN users u
                            ON th.user_id = u.user_id
                  LEFT JOIN food_item fi
                            ON th.food_id = fi.food_id
         WHERE th.user_id = $1
         ORDER BY th.created_at DESC`,

        [userId]

    );

    return result.rows;

};

module.exports = {
    getHistory
};