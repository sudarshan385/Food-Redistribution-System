const express = require("express");

const {
    getDemandForecast,
    getWasteRisk,
    getReorderRecommendations,
    getBatchSummary,
    runBatchPrediction
} = require("../controllers/aiController");

const router = express.Router();

router.get(
    "/demand",
    getDemandForecast
);

router.get(
    "/waste-risk",
    getWasteRisk
);

router.get(
    "/reorder",
    getReorderRecommendations
);

router.get(
    "/batch/summary",
    getBatchSummary
);

router.post(
    "/batch/run",
    runBatchPrediction
);

module.exports = router;