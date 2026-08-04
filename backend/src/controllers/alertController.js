const alertService = require("../services/alertService");

// Get Expiry Alerts
exports.getAlerts = async (req, res) => {

    try {

        const alerts = await alertService.getExpiryAlerts(
            req.user.userId
        );

        res.status(200).json({
            success: true,
            count: alerts.length,
            alerts
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};