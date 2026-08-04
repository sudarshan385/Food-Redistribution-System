const historyService = require("../services/historyService");

// Get Transaction History
exports.getHistory = async (req, res) => {

    try {

        const history = await historyService.getHistory(
            req.user.userId
        );

        res.status(200).json({
            success: true,
            count: history.length,
            history
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};