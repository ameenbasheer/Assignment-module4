/**
 * Recommendation engine.
 *
 * Strategy:
 *   1. Build a profile of what the user likes from their past orders.
 *   2. Ask Hugging Face to score every candidate product by how semantically
 *      similar it is to that profile (AI-powered, content-based filtering).
 *   3. Return the top-N most relevant products the user hasn't bought yet.
 *
 * Graceful degradation:
 *   - No order history  -> recommend newest / most relevant popular products.
 *   - HF key missing or API fails -> fall back to a category-overlap heuristic
 *     so the endpoint always returns something useful.
 */

const Order = require("../models/order");
const Product = require("../models/product");
const hf = require("./huggingfaceService");

// turn a product document into a single descriptive sentence
const productToText = (p) =>
    `${p.name}. Category: ${p.category}. ${p.description || ""}`.trim();

/**
 * Content-based fallback when AI scoring is unavailable:
 * rank candidates by how many of the user's preferred categories they match.
 */
const categoryFallback = (candidates, likedCategories, limit) => {
    const liked = new Set(likedCategories.map((c) => c.toLowerCase()));

    return [...candidates]
        .map((p) => ({
            product: p,
            score: liked.has((p.category || "").toLowerCase()) ? 1 : 0,
        }))
        .sort((a, b) => b.score - a.score || b.product.createdAt - a.product.createdAt)
        .slice(0, limit)
        .map((x) => ({ product: x.product, score: x.score }));
};

/**
 * @param {string} userId
 * @param {number} limit  number of recommendations to return
 * @returns {Promise<{ source: string, recommendations: object[] }>}
 */
const recommendForUser = async (userId, limit = 5) => {
    // 1. gather the user's purchase history
    const orders = await Order.find({ user: userId }).populate(
        "items.product"
    );

    const purchasedProducts = [];
    const purchasedIds = new Set();
    const likedCategories = [];

    for (const order of orders) {
        for (const item of order.items) {
            if (item.product) {
                purchasedProducts.push(item.product);
                purchasedIds.add(item.product._id.toString());
                likedCategories.push(item.product.category);
            }
        }
    }

    // 2. candidate pool = products the user has NOT bought yet
    const candidates = await Product.find({
        _id: { $nin: Array.from(purchasedIds) },
    });

    if (candidates.length === 0) {
        return { source: "none", recommendations: [] };
    }

    // 3a. cold start (no history) -> newest products
    if (purchasedProducts.length === 0) {
        const newest = [...candidates]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
        return {
            source: "popular",
            recommendations: newest.map((p) => ({ product: p, score: null })),
        };
    }

    // 3b. build the user-preference sentence from purchase history
    const sourceSentence = purchasedProducts.map(productToText).join(" ");
    const candidateTexts = candidates.map(productToText);

    // 4. try AI scoring via Hugging Face
    if (hf.isConfigured()) {
        try {
            const scores = await hf.getSimilarityScores(
                sourceSentence,
                candidateTexts
            );

            const ranked = candidates
                .map((p, i) => ({ product: p, score: scores[i] ?? 0 }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            return { source: "huggingface", recommendations: ranked };
        } catch (err) {
            // log and fall through to heuristic
            console.error("Hugging Face recommendation failed:", err.message);
        }
    }

    // 5. fallback: category overlap heuristic
    const ranked = categoryFallback(candidates, likedCategories, limit);
    return { source: "category-fallback", recommendations: ranked };
};

/**
 * "Customers who liked this also like..." — similar products to a given one.
 * Uses Hugging Face semantic similarity, falls back to same-category.
 */
const similarToProduct = async (productId, limit = 5) => {
    const base = await Product.findById(productId);
    if (!base) return null;

    const candidates = await Product.find({ _id: { $ne: productId } });
    if (candidates.length === 0) {
        return { source: "none", base, recommendations: [] };
    }

    if (hf.isConfigured()) {
        try {
            const scores = await hf.getSimilarityScores(
                productToText(base),
                candidates.map(productToText)
            );
            const ranked = candidates
                .map((p, i) => ({ product: p, score: scores[i] ?? 0 }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            return { source: "huggingface", base, recommendations: ranked };
        } catch (err) {
            console.error("Hugging Face similarity failed:", err.message);
        }
    }

    const ranked = categoryFallback(candidates, [base.category], limit);
    return { source: "category-fallback", base, recommendations: ranked };
};

module.exports = { recommendForUser, similarToProduct };
