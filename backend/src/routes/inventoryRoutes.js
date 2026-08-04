const express = require("express");

const router = express.Router();

const inventoryController = require("../controllers/inventoryController");
const verifyToken = require("../middleware/authMiddleware");

// Add Food
router.post("/", verifyToken, inventoryController.addFood);

// Get All Food
router.get("/", verifyToken, inventoryController.getAllFood);

// Get Food By Barcode
router.get(
    "/barcode/:barcode",
    verifyToken,
    inventoryController.getFoodByBarcode
);

// Get Food By ID
router.get("/:id", verifyToken, inventoryController.getFoodById);

// Update Food
router.put("/:id", verifyToken, inventoryController.updateFood);

// Delete Food
router.delete("/:id", verifyToken, inventoryController.deleteFood);

module.exports = router;