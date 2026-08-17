const reorderService = require("../services/reorderService");

// ============================================================
// CREATE REORDER
// ============================================================

const createReorder = async (req, res) => {

    try {

        const {
            food_name,
            quantity
        } = req.body;

        console.log(
            "Create reorder request:",
            req.body
        );

        const reorder =
            await reorderService.createReorder(
                food_name,
                quantity,
                req.user.userId
            );

        res.status(201).json({

            success: true,

            message: reorder.existing
                ? "A pending reorder already exists."
                : "AI reorder request created successfully.",

            reorder

        });

    } catch (error) {

        console.error(
            "Create reorder error:",
            error
        );

        res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to create reorder.",

            reorder: null

        });

    }

};


// ============================================================
// GET ALL REORDERS
// ============================================================

const getAllReorders = async (req, res) => {

    try {

        const reorders =
            await reorderService.getAllReorders();

        res.status(200).json({

            success: true,

            reorders

        });

    } catch (error) {

        console.error(
            "Get reorder requests error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to get reorder requests.",

            reorders: []

        });

    }

};


// ============================================================
// GET REORDER BY ID
// ============================================================

const getReorderById = async (req, res) => {

    try {

        const reorder =
            await reorderService.getReorderById(
                req.params.id
            );

        res.status(200).json({

            success: true,

            reorder

        });

    } catch (error) {

        console.error(
            "Get reorder error:",
            error
        );

        res.status(404).json({

            success: false,

            message:
                error.message ||
                "Reorder request not found.",

            reorder: null

        });

    }

};


// ============================================================
// UPDATE REORDER STATUS
// ============================================================

const updateReorderStatus = async (req, res) => {

    try {

        const {
            status
        } = req.body;

        const reorder =
            await reorderService.updateReorderStatus(
                req.params.id,
                status
            );

        res.status(200).json({

            success: true,

            message:
                "Reorder status updated successfully.",

            reorder

        });

    } catch (error) {

        console.error(
            "Update reorder status error:",
            error
        );

        res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to update reorder status.",

            reorder: null

        });

    }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    createReorder,
    getAllReorders,
    getReorderById,
    updateReorderStatus
};