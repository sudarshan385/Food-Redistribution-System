const express = require("express");

const {
    recordSale,
    getSalesHistory
} = require("../controllers/salesController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();


// ============================================================
// RECORD SALE
// ============================================================

router.post(
    "/",
    authMiddleware,
    recordSale
);


// ============================================================
// GET SALES HISTORY
// ============================================================

router.get(
    "/",
    authMiddleware,
    getSalesHistory
);


module.exports = router;