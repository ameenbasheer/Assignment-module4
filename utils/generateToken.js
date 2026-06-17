const jwt = require("jsonwebtoken");

/**
 * Signs a JWT containing the user id and role.
 * Expiry is configurable via JWT_EXPIRES_IN (defaults to 1 day).
 */
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
};

module.exports = generateToken;
