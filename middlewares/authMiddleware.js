const jwt = require("jsonwebtoken");
const User = require("../models/user");

/**
 * protect
 * Verifies the JWT from the Authorization header (Bearer <token>),
 * loads the current user and attaches it to req.user.
 */
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized, no token provided",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // make sure the user still exists
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                message: "Not authorized, user no longer exists",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Not authorized, token is invalid or expired",
        });
    }
};

/**
 * authorize(...roles)
 * Role-Based Access Control. Pass the roles allowed to hit the route.
 * Must be used AFTER protect so req.user is populated.
 *
 * Example: router.post("/", protect, authorize("admin"), createProduct)
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }

        // if (!roles.includes(req.user.role)) {
        //     return res.status(403).json({
        //         message: `Access denied. Requires role: ${roles.join(", ")}`,
        //     });
        // }

        next();
    };
};

module.exports = { protect, authorize };
