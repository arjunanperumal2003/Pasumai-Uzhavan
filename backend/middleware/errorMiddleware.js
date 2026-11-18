
const errorMiddleware = (err, req, res, next) => {
  console.error("========== EXPRESS ERROR ==========");
  console.error("URL:", req.originalUrl);
  console.error("Error:", err);
  console.error("===================================");

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
    code: err.code || null,
  });
};

module.exports = errorMiddleware;
