/**
 * Wraps an async route handler so any rejected promise is forwarded
 * to the centralized error handler via next(err) — no repetitive try/catch.
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
