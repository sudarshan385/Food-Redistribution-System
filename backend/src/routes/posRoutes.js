const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const posController = require("../controllers/posController");

// Get POS Products
router.get(
    "/products",
    verifyToken,
    posController.getProducts
);

// Import Product from POS
router.post(
    "/products",
    verifyToken,
    posController.addProduct
);

module.exports = router;