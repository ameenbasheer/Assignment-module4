const Order = require("../models/order");
const Product = require("../models/product");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @route   POST /api/orders
 * @desc    Place a new order
 * @access  Private (user/admin)
 *
 * Body: { items: [{ product: <id>, quantity: <n> }, ...] }
 * Prices and stock are validated server-side (never trust the client).
 */
exports.createOrder = asyncHandler(async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res
            .status(400)
            .json({ message: "Order must contain at least one item" });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
        if (!item.product || !item.quantity || item.quantity < 1) {
            return res.status(400).json({
                message: "Each item needs a valid product and quantity >= 1",
            });
        }

        const product = await Product.findById(item.product);
        if (!product) {
            return res
                .status(404)
                .json({ message: `Product not found: ${item.product}` });
        }

        if (product.quantity < item.quantity) {
            return res.status(400).json({
                message: `Insufficient stock for ${product.name}`,
            });
        }

        // decrement stock and record price at purchase time
        product.quantity -= item.quantity;
        await product.save();

        totalAmount += product.price * item.quantity;
        orderItems.push({
            product: product._id,
            quantity: item.quantity,
            price: product.price,
        });
    }

    const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        totalAmount,
    });

    res.status(201).json({ message: "Order placed", order });
});

/**
 * @route   GET /api/orders
 * @desc    Admins see all orders; users see only their own
 * @access  Private
 */
exports.getOrders = asyncHandler(async (req, res) => {
    const filter = req.user.role === "admin" ? {} : { user: req.user._id };

    const orders = await Order.find(filter)
        .populate("items.product", "name price category")
        .populate("user", "name email")
        .sort("-createdAt");

    res.json({ count: orders.length, orders });
});

/**
 * @route   GET /api/orders/:id
 * @access  Private (owner or admin)
 */
exports.getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate("items.product", "name price category")
        .populate("user", "name email");

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    // owner or admin only
    if (
        req.user.role !== "admin" &&
        order.user._id.toString() !== req.user._id.toString()
    ) {
        return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
});

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private/Admin
 */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const allowed = ["pending", "paid", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
        return res
            .status(400)
            .json({ message: `Status must be one of: ${allowed.join(", ")}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Order status updated", order });
});

/**
 * @route   DELETE /api/orders/:id
 * @desc    Cancel/delete an order (owner or admin)
 * @access  Private
 */
exports.deleteOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    if (
        req.user.role !== "admin" &&
        order.user.toString() !== req.user._id.toString()
    ) {
        return res.status(403).json({ message: "Access denied" });
    }

    await order.deleteOne();

    res.json({ message: "Order deleted" });
});
