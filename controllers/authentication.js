const User = require("../models/user");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

// strip sensitive fields before sending a user back to the client
const sanitize = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
});

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res
            .status(400)
            .json({ message: "Name, email and password are required" });
    }

    const userExist = await User.findOne({ email });
    if (userExist) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Security: never allow self-registration as admin via the public route.
    // Admin accounts are seeded/promoted by an existing admin.
    const safeRole = role === "guest" ? "guest" : "user";

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: safeRole,
    });

    const token = generateToken(user);

    res.status(201).json({
        message: "Registration successful",
        token,
        user: sanitize(user),
    });
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return a JWT
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res
            .status(400)
            .json({ message: "Email and password are required" });
    }

    // password has select:false in the schema -> explicitly include it
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({
        message: "Login successful",
        token,
        user: sanitize(user),
    });
});
