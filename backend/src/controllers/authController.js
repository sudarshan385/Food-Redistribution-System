const authService = require("../services/authService");

exports.register = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);

        const { password, ...userWithoutPassword } = user;

        res.status(201).json({
            success: true,
            message: "User Registered Successfully",
            user: userWithoutPassword
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const result = await authService.loginUser(email, password);

        const { password: pwd, ...userWithoutPassword } = result.user;

        res.status(200).json({

            success: true,

            message: "Login Successful",

            token: result.token,

            user: userWithoutPassword

        });

    } catch (error) {

        res.status(401).json({

            success: false,

            message: error.message

        });

    }

};