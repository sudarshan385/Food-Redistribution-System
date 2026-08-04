const uploadService = require("../services/uploadService");

// Upload CSV
exports.uploadCSV = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a CSV file."
            });
        }

        const donorId = req.user.userId;

        const result = await uploadService.uploadCSV(
            req.file.path,
            donorId
        );

        res.status(200).json({
            success: true,
            message: "CSV Uploaded Successfully",
            imported: result
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};