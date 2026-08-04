const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register User
const registerUser = async (userData) => {

    const {
        role_id,
        name,
        email,
        password,
        phone,
        address
    } = userData;

    const existingUser = await pool.query(
        "SELECT user_id FROM users WHERE email = $1",
        [email]
    );

    if (existingUser.rows.length > 0) {
        throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO users
             (role_id, name, email, password, phone, address)
         VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING user_id, role_id, name, email, phone, address`,
        [
            role_id,
            name,
            email,
            hashedPassword,
            phone,
            address
        ]
    );

    return result.rows[0];

};

// Login User
const loginUser = async (email, password) => {

    const result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    if (result.rows.length === 0) {
        throw new Error("Invalid Email");
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(
        password,
        user.password
    );

    if (!validPassword) {
        throw new Error("Invalid Password");
    }

    const token = jwt.sign(
        {
            userId: user.user_id,
            role: user.role_id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    return {
        token,
        user
    };

};

module.exports = {
    registerUser,
    loginUser
};