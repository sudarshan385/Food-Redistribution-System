const aiService = require("../services/aiService");

// ============================================================
// DEMAND FORECAST
// ============================================================

async function getDemandForecast(req, res) {
    try {
        const result = await aiService.getDemandForecast();

        res.status(200).json(result);

    } catch (error) {
        console.error(
            "Demand forecast error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to get demand forecast",
            error: error.message
        });
    }
}

// ============================================================
// WASTE RISK
// ============================================================

async function getWasteRisk(req, res) {
    try {
        const result = await aiService.getWasteRisk();

        res.status(200).json(result);

    } catch (error) {
        console.error(
            "Waste risk error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to get waste-risk predictions",
            error: error.message
        });
    }
}

// ============================================================
// REORDER RECOMMENDATIONS
// ============================================================

async function getReorderRecommendations(req, res) {
    try {
        const result =
            await aiService.getReorderRecommendations();

        res.status(200).json(result);

    } catch (error) {
        console.error(
            "Reorder recommendation error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to get reorder recommendations",
            error: error.message
        });
    }
}

// ============================================================
// BATCH SUMMARY
// ============================================================

async function getBatchSummary(req, res) {
    try {
        const result = await aiService.getBatchSummary();

        res.status(200).json(result);

    } catch (error) {
        console.error(
            "Batch summary error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to get AI batch status",
            error: error.message
        });
    }
}

// ============================================================
// RUN BATCH
// ============================================================

async function runBatchPrediction(req, res) {
    try {
        const result =
            await aiService.runBatchPrediction();

        res.status(200).json(result);

    } catch (error) {
        console.error(
            "Batch prediction error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to run AI batch prediction",
            error: error.message
        });
    }
}

module.exports = {
    getDemandForecast,
    getWasteRisk,
    getReorderRecommendations,
    getBatchSummary,
    runBatchPrediction
};