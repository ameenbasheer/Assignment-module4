const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authenticationRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userProfileRoutes = require("./routes/userProfileRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

// --- global middleware ---
app.use(express.json()); // parse JSON bodies (also acts as basic input sanitization point)
app.use(cors());
app.use(morgan("dev"));

// --- health check ---
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "E-commerce API is running" });
});

// --- API routes ---
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userProfileRoutes);
app.use("/api/analytics", analyticsRoutes);

// --- error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
