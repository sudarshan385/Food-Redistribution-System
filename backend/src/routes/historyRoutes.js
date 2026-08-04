const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const historyController = require("../controllers/historyController");

router.get(
    "/",
    verifyToken,
    historyController.getHistory
);

module.exports = router;