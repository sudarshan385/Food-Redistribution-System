const pool = require("../config/db");
const getExpiryStatus = require("../utils/expiryStatus");

// Get Dashboard
const getDashboard = async (userId, role) => {

    let baseQuery = "";
    let params = [];
    
    // If role is 2 (Donor), only show their food.
    // Otherwise (Admin, NGO, Volunteer), show all food in the system.
    if (role === 2) {
        baseQuery = "WHERE donor_id = $1";
        params = [userId];
    }

    const availableCond = baseQuery ? "AND status = 'AVAILABLE'" : "WHERE status = 'AVAILABLE'";
    const removedCond = baseQuery ? "AND status = 'REMOVED'" : "WHERE status = 'REMOVED'";

    // Total Food
    const totalFood = await pool.query(
        `SELECT COUNT(*) 
         FROM food_item
         ${baseQuery}`,
        params
    );

    // Available Food
    const availableFood = await pool.query(
        `SELECT COUNT(*)
         FROM food_item
         ${baseQuery} ${availableCond}`,
        params
    );

    // Removed Food
    const removedFood = await pool.query(
        `SELECT COUNT(*)
         FROM food_item
         ${baseQuery} ${removedCond}`,
        params
    );

    // Category Analytics
    const categoryResult = await pool.query(
        `SELECT category,
                COUNT(*) AS count
         FROM food_item
         ${baseQuery} ${availableCond}
         GROUP BY category`,
        params
    );

    // Expiry Analytics
    const expiryResult = await pool.query(
        `SELECT expiry_date
         FROM food_item
         ${baseQuery} ${availableCond}`,
        params
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