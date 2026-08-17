const salesService = require("../services/salesService");

// ============================================================
// RECORD SALE
// ============================================================

const recordSale = async (req, res) => {

    try {

        const {
            food_id,
            quantity,
            unit_price
        } = req.body;


        const result =
            await salesService.recordSale(
                food_id,
                quantity,
                unit_price,
                req.user.userId
            );


        res.status(201).json({

            success: true,

            message:
                "Sale recorded successfully",

            sale:
            result.sale,

            food:
            result.food

        });

    } catch (error) {

        console.error(
            "Record sale error:",
            error
        );

        res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to record sale"

        });

    }

};


// ============================================================
// GET SALES HISTORY
// ============================================================

const getSalesHistory = async (req, res) => {

    try {

        const sales =
            await salesService.getSalesHistory(
                req.user.userId
            );


        res.status(200).json({

            success: true,

            sales

        });

    } catch (error) {

        console.error(
            "Get sales error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to get sales history"

        });

    }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    recordSale,
    getSalesHistory
};