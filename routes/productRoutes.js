const express = require("express");
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} = require("../controllers/productController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public: anyone can browse / search / filter products
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin only: manage the catalog
router.post("/", protect, authorize("admin"), createProduct);
router.put("/:id", protect, authorize("admin"), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

module.exports = router;
