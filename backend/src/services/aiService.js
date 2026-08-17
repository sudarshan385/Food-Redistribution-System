const AI_SERVICE_URL =
    process.env.AI_SERVICE_URL ||
    "http://127.0.0.1:8000";

// ============================================================
// HELPER
// ============================================================

async function requestAI(
    url,
    options = {}
) {

    console.log(
        "AI REQUEST:",
        url
    );

    const response =
        await fetch(
            url,
            options
        );

    let data;

    try {

        data =
            await response.json();

    } catch {

        data = null;

    }

    if (!response.ok) {

        throw new Error(

            `AI service returned ${response.status}: ` +
            `${data?.detail || data?.message || "Unknown error"}`

        );

    }

    return data;

}

// ============================================================
// HEALTH
// ============================================================

async function getHealth() {

    return requestAI(
        `${AI_SERVICE_URL}/health`
    );

}

// ============================================================
// DEMAND FORECAST
// ============================================================

async function getDemandForecast() {

    return requestAI(
        `${AI_SERVICE_URL}/predict/demand`
    );

}

// ============================================================
// ALL WASTE RISK
// ============================================================

async function getWasteRisk() {

    return requestAI(
        `${AI_SERVICE_URL}/predict/waste-risk`
    );

}

// ============================================================
// WASTE RISK FOR ONE FOOD
// ============================================================

async function getWasteRiskByFoodId(
    foodId
) {

    return requestAI(

        `${AI_SERVICE_URL}/predict/waste-risk/${foodId}`

    );

}

// ============================================================
// ALL REORDER
// ============================================================

async function getReorderRecommendations() {

    return requestAI(
        `${AI_SERVICE_URL}/recommend/reorder`
    );

}

// ============================================================
// REORDER FOR ONE FOOD
// ============================================================

async function getReorderByFoodId(
    foodId
) {

    return requestAI(

        `${AI_SERVICE_URL}/recommend/reorder/${foodId}`

    );

}

// ============================================================
// BATCH SUMMARY
// ============================================================

async function getBatchSummary() {

    return requestAI(
        `${AI_SERVICE_URL}/batch/summary`
    );

}

// ============================================================
// RUN BATCH
// ============================================================

async function runBatchPrediction() {

    return requestAI(

        `${AI_SERVICE_URL}/batch/run`,

        {
            method: "POST"
        }

    );

}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    getHealth,

    getDemandForecast,

    getWasteRisk,

    getWasteRiskByFoodId,

    getReorderRecommendations,

    getReorderByFoodId,

    getBatchSummary,

    runBatchPrediction

};