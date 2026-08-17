import api from "./api.js";
import axios from "axios";

// ── Circuit breaker ──────────────────────────────────────────────
// When the AI service (port 8001) is unreachable, skip all calls
// for CIRCUIT_OPEN_DURATION_MS so Vite doesn't spam proxy errors.
const CIRCUIT_OPEN_DURATION_MS = 60_000; // 1 minute
const AI_REQUEST_TIMEOUT_MS = 4_000;     // 4-second timeout per request

let circuitOpenUntil = 0; // timestamp (ms) until which we skip AI calls

function isCircuitOpen() {
    return Date.now() < circuitOpenUntil;
}

function openCircuit() {
    circuitOpenUntil = Date.now() + CIRCUIT_OPEN_DURATION_MS;
    console.warn(
        `[aiService] AI service unreachable — circuit breaker open for ${CIRCUIT_OPEN_DURATION_MS / 1000}s. ` +
        `No AI requests will be attempted until ${new Date(circuitOpenUntil).toLocaleTimeString()}.`
    );
}

/** Reset the circuit breaker (e.g. after a successful call). */
export function resetCircuit() {
    circuitOpenUntil = 0;
}

/**
 * Wrapper that makes an AI-service request with:
 *  - Circuit breaker check (skip if service is known-down)
 *  - Short timeout so it fails fast
 *  - Auto-opens circuit on network / connection errors
 */
async function aiRequest(method, url, data = undefined) {
    if (isCircuitOpen()) {
        throw new Error("AI service circuit breaker is open — skipping request");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
        const config = { signal: controller.signal };
        let response;
        if (method === "post") {
            response = await axios.post(url, data, config);
        } else {
            response = await axios.get(url, config);
        }

        // Successful response → make sure circuit is closed
        resetCircuit();
        return response.data;
    } catch (err) {
        // Network-level failures (ECONNREFUSED, timeout, abort) → open circuit
        if (
            !err.response || // no HTTP response at all (connection refused / network error)
            err.code === "ECONNABORTED" ||
            err.name === "CanceledError" ||
            err.message?.includes("ECONNREFUSED")
        ) {
            openCircuit();
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}

// ── Public API (unchanged signatures) ────────────────────────────

export const getDemandForecast = () =>
    aiRequest("get", `/ai-api/predict/demand`);

export const getWasteRisk = () =>
    aiRequest("get", `/ai-api/predict/waste-risk`);

export const getReorderRecommendations = () =>
    aiRequest("get", `/ai-api/recommend/reorder`);

export const getBatchSummary = () =>
    aiRequest("get", `/ai-api/batch/summary`);

export const runBatchPrediction = () =>
    aiRequest("post", `/ai-api/batch/run`);

export const createReorder = async (foodName, quantity) => {
    const response = await api.post("/reorder", {
        food_name: foodName,
        quantity: quantity
    });
    return response.data;
};
