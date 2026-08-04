const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const alertController = require("../controllers/alertController");

router.get("/", verifyToken, alertController.getAlerts);

module.exports = router;