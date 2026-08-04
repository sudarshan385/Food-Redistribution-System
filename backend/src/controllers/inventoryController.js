const inventoryService = require("../services/inventoryService");

// Add Food
exports.addFood = async (req, res) => {

    try {

        const food = await inventoryService.addFood(
            req.body,
            req.user.userId
        );

        res.status(201).json({
            success: true,
            message: "Food Added Successfully",
            food
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};

// Get All Food
exports.getAllFood = async (req, res) => {

    try {

        let food;

        // Donor
        if (req.user.role === 2) {

            food = await inventoryService.getAllFood(
                req.user.userId
            );

        }

        // NGO
        else if (req.user.role === 3) {

            food = await inventoryService.getAvailableFood();

        }

        // Admin & Volunteer
        else {

            food = await inventoryService.getAvailableFood();

        }

        res.status(200).json({
            success: true,
            food
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// Get Food By ID
exports.getFoodById = async (req, res) => {

    try {

        const food = await inventoryService.getFoodById(
            req.params.id,
            req.user.userId
        );

        res.status(200).json({
            success: true,
            food
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }

};

// Get Food By Barcode
exports.getFoodByBarcode = async (req, res) => {

    console.log("Received Barcode:", req.params.barcode);

    try {

        const food = await inventoryService.getFoodByBarcode(
            req.params.barcode
        );

        res.json({
            success: true,
            food
        });

    } catch (error) {

        console.log(error);

        res.status(404).json({
            success: false,
            message: error.message
        });

    }

};

// Update Food
exports.updateFood = async (req, res) => {

    try {

        const food = await inventoryService.updateFood(
            req.params.id,
            req.body,
            req.user.userId
        );

        res.status(200).json({
            success: true,
            message: "Food Updated Successfully",
            food
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }

};

// Delete Food
exports.deleteFood = async (req, res) => {

    try {

        await inventoryService.deleteFood(
            req.params.id,
            req.user.userId
        );

        res.status(200).json({
            success: true,
            message: "Food Removed Successfully"
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }

};