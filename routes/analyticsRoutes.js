const express = require("express");
const {
    getRecommendations,
    getSimilarProducts,
} = require("../controllers/analyticsController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Personalised recommendations (requires login to know the user's history)
router.get("/recommendations", protect, getRecommendations);

// Similar products for a given product (public)
router.get("/recommendations/product/:id", getSimilarProducts);

module.exports = router;
