const pool = require("../config/db");

// Get Expiry Alerts
const getExpiryAlerts = async (donorId) => {

    const result = await pool.query(

        `SELECT *
         FROM food_item
         WHERE donor_id = $1
           AND expiry_date <= CURRENT_DATE + INTERVAL '2 days'
           AND status = 'AVAILABLE'
         ORDER BY expiry_date`,

        [donorId]

    );

    return result.rows;

};

module.exports = {
    getExpiryAlerts
};