const asyncHandler = require("../utils/asyncHandler");
const {
    recommendForUser,
    similarToProduct,
} = require("../services/recommendationService");

/**
 * @route   GET /api/analytics/recommendations
 * @desc    Personalised product recommendations for the logged-in user,
 *          powered by Hugging Face semantic similarity.
 * @access  Private
 *
 * Query: ?limit=5
 */
exports.getRecommendations = asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);

    const { source, recommendations } = await recommendForUser(
        req.user._id,
        limit
    );

    res.json({
        message: "Recommended for you",
        engine: source, // huggingface | category-fallback | popular | none
        count: recommendations.length,
        recommendations,
    });
});

/**
 * @route   GET /api/analytics/recommendations/product/:id
 * @desc    "Similar products" to a given product (content-based).
 * @access  Public
 *
 * Query: ?limit=5
 */
exports.getSimilarProducts = asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);

    const result = await similarToProduct(req.params.id, limit);

    if (!result) {
        return res.status(404).json({ message: "Product not found" });
    }

    res.json({
        message: `Products similar to ${result.base.name}`,
        engine: result.source,
        count: result.recommendations.length,
        recommendations: result.recommendations,
    });
});
