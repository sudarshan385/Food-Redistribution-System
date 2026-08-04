const pool = require("../config/db");
const getExpiryStatus = require("../utils/expiryStatus");

// Get Dashboard
const getDashboard = async (donorId) => {

    // Total Food
    const totalFood = await pool.query(
        `SELECT COUNT(*) 
         FROM food_item
         WHERE donor_id = $1`,
        [donorId]
    );

    // Available Food
    const availableFood = await pool.query(
        `SELECT COUNT(*)
         FROM food_item
         WHERE donor_id = $1
         AND status = 'AVAILABLE'`,
        [donorId]
    );

    // Removed Food
    const removedFood = await pool.query(
        `SELECT COUNT(*)
         FROM food_item
         WHERE donor_id = $1
         AND status = 'REMOVED'`,
        [donorId]
    );

    // Category Analytics
    const categoryResult = await pool.query(
        `SELECT category,
                COUNT(*) AS count
         FROM food_item
         WHERE donor_id = $1
           AND status = 'AVAILABLE'
         GROUP BY category`,
        [donorId]
    );

    // Expiry Analytics
    const expiryResult = await pool.query(
        `SELECT expiry_date
         FROM food_item
         WHERE donor_id = $1
           AND status = 'AVAILABLE'`,
        [donorId]
    );

    let fresh = 0;
    let warning = 0;
    let nearExpiry = 0;
    let expired = 0;

    expiryResult.rows.forEach(item => {

        const status = getExpiryStatus(item.expiry_date);

        if (status === "FRESH") {
            fresh++;
        } else if (status === "WARNING") {
            warning++;
        } else if (status === "NEAR_EXPIRY") {
            nearExpiry++;
        } else {
            expired++;
        }

    });

    return {

        totalFood: Number(totalFood.rows[0].count),

        availableFood: Number(availableFood.rows[0].count),

        removedFood: Number(removedFood.rows[0].count),

        freshFood: fresh,

        warningFood: warning,

        nearExpiryFood: nearExpiry,

        expiredFood: expired,

        categoryAnalytics: categoryResult.rows

    };

};

module.exports = {
    getDashboard
};