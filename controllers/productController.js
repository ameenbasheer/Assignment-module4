const Product = require("../models/product");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @route   GET /api/products
 * @desc    List products with search, filter, sort and pagination
 * @access  Public
 *
 * Query params:
 *   search   -> partial match on name/description/category (e.g. ?search=phone)
 *   category -> filter by exact category (e.g. ?category=electronics)
 *   minPrice, maxPrice -> price range filter
 *   sort     -> e.g. ?sort=price (asc) or ?sort=-price (desc), -createdAt etc.
 *   page, limit -> pagination (default page 1, limit 10)
 */
exports.getProducts = asyncHandler(async (req, res) => {
    const { search, category, minPrice, maxPrice, sort } = req.query;

    const filter = {};

    // search by name/description/category (case-insensitive partial match)
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
        ];
    }

    // filter by category (exact, case-insensitive)
    if (category) {
        filter.category = { $regex: `^${category}$`, $options: "i" };
    }

    // filter by price range
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // sorting ("price,-createdAt" -> "price -createdAt")
    const sortBy = sort ? sort.split(",").join(" ") : "-createdAt";

    // pagination
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(filter).sort(sortBy).skip(skip).limit(limit),
        Product.countDocuments(filter),
    ]);

    res.json({
        count: products.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        products,
    });
});

/**
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
});

/**
 * @route   POST /api/products
 * @access  Private/Admin
 */
exports.createProduct = asyncHandler(async (req, res) => {
    const { name, description, category, price, quantity, image } = req.body;

    if (!name || !category || price === undefined) {
        return res
            .status(400)
            .json({ message: "Name, category and price are required" });
    }

    const product = await Product.create({
        name,
        description,
        category,
        price,
        quantity,
        image,
        createdBy: req.user._id,
    });

    res.status(201).json({ message: "Product created", product });
});

/**
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
exports.updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    const fields = ["name", "description", "category", "price", "quantity", "image"];
    fields.forEach((field) => {
        if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    const updated = await product.save();

    res.json({ message: "Product updated", product: updated });
});

/**
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();

    res.json({ message: "Product deleted" });
});
