const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
            index: true,
        },

        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },

        quantity: {
            type: Number,
            default: 0,
            min: [0, "Quantity cannot be negative"],
        },

        image: {
            type: String,
            default: "",
        },

        // who created the product (admin)
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

// text index enables full-text $text search on name + description
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
