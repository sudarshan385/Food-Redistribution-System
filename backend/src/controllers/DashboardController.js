const dashboardService = require("../services/dashboardService");

// Get Dashboard
exports.getDashboard = async (req, res) => {

    try {

        const dashboard = await dashboardService.getDashboard(
            req.user.userId
        );

        res.status(200).json({
            success: true,
            dashboard
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};