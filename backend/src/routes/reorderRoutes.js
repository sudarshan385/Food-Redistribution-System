const express = require("express");

const router = express.Router();

const {
    createReorder,
    getAllReorders,
    getReorderById,
    updateReorderStatus
} = require("../controllers/reorderController");

const verifyToken =
    require("../middleware/authMiddleware");


// Create reorder
router.post(
    "/",
    verifyToken,
    createReorder
);


// Get all reorder requests
router.get(
    "/",
    verifyToken,
    getAllReorders
);


// Get one reorder
router.get(
    "/:id",
    verifyToken,
    getReorderById
);


// Update status
router.put(
    "/:id/status",
    verifyToken,
    updateReorderStatus
);


module.exports = router;