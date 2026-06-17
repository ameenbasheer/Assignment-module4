const express = require("express");
const {
    getMyProfile,
    updateMyProfile,
    deleteMyProfile,
    getUsers,
    getUserById,
    updateUserRole,
    deleteUser,
} = require("../controllers/userProfile");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

// Authenticated users manage their own profile
router.get("/profile", protect, getMyProfile);
router.put("/profile", protect, updateMyProfile);
router.delete("/profile", protect, deleteMyProfile);

// Admin-only user management
router.get("/", protect, authorize("admin"), getUsers);
router.get("/:id", protect, authorize("admin"), getUserById);
router.put("/:id/role", protect, authorize("admin"), updateUserRole);
router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;
