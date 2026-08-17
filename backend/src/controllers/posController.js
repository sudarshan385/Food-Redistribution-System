const posService = require("../services/posService");

// Get POS Products
exports.getProducts = async (req, res) => {

    try {

        const products = await posService.getProducts(
            req.user.userId,
            req.user.role
        );

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// Import Product from POS
exports.addProduct = async (req, res) => {

    try {

        const product = await posService.addProduct(
            req.body,
            req.user.userId
        );

        res.status(201).json({
            success: true,
            message: "Product Imported Successfully",
            product
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};