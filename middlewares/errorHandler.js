/**
 * Centralized error-handling middleware.
 * Any error thrown in an async handler (wrapped with asyncHandler)
 * or passed to next(err) ends up here, producing a consistent JSON shape.
 */

// 404 handler for unmatched routes
const notFound = (req, res, next) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let statusCode =
        err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    let message = err.message || "Internal Server Error";

    // Mongoose: bad ObjectId
    if (err.name === "CastError" && err.kind === "ObjectId") {
        statusCode = 400;
        message = "Invalid resource id";
    }

    // Mongoose: schema validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((e) => e.message)
            .join(", ");
    }

    // Mongoose: duplicate key (e.g. email already taken)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0] || "field";
        message = `Duplicate value for ${field}`;
    }

    res.status(statusCode).json({
        message,
        ...(process.env.NODE_ENV === "production" ? {} : { stack: err.stack }),
    });
};

module.exports = { notFound, errorHandler };
