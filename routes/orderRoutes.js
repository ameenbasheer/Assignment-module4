const express = require("express");
const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
} = require("../controllers/orderController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

// All order routes require authentication
router.use(protect);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);

// Only admins can change order status
router.put("/:id/status", authorize("admin"), updateOrderStatus);

router.delete("/:id", deleteOrder);

module.exports = router;
