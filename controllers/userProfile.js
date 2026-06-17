const User = require("../models/user");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");

const sanitize = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

/**
 * @route   GET /api/users/profile
 * @desc    Get the currently logged-in user's profile
 * @access  Private
 */
exports.getMyProfile = asyncHandler(async (req, res) => {
    // req.user is already loaded (without password) by protect middleware
    res.json(sanitize(req.user));
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update own profile (name, email, password)
 * @access  Private
 */
exports.updateMyProfile = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;

    if (email && email !== user.email) {
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "Email already in use" });
        }
        user.email = email;
    }

    if (password) {
        if (password.length < 6) {
            return res
                .status(400)
                .json({ message: "Password must be at least 6 characters" });
        }
        user.password = await bcrypt.hash(password, 10);
    }

    const updated = await user.save();

    res.json({ message: "Profile updated", user: sanitize(updated) });
});

/**
 * @route   DELETE /api/users/profile
 * @desc    Delete own account
 * @access  Private
 */
exports.deleteMyProfile = asyncHandler(async (req, res) => {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted" });
});

/* ---------------------- Admin-only user management ---------------------- */

/**
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().sort("-createdAt");
    res.json({ count: users.length, users: users.map(sanitize) });
});

/**
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.json(sanitize(user));
});

/**
 * @route   PUT /api/users/:id/role
 * @desc    Change a user's role (RBAC management)
 * @access  Private/Admin
 */
exports.updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    if (!["admin", "user", "guest"].includes(role)) {
        return res
            .status(400)
            .json({ message: "Role must be admin, user or guest" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({ message: "User role updated", user: sanitize(user) });
});

/**
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    await user.deleteOne();
    res.json({ message: "User deleted" });
});
