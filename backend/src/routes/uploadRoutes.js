const express = require("express");
const multer = require("multer");
const uploadController = require("../controllers/uploadController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
    dest: "uploads/"
});

router.post(
    "/csv",
    verifyToken,
    upload.single("file"),
    uploadController.uploadCSV
);

module.exports = router;