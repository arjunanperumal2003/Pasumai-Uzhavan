
require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Middleware
const sessionMiddleware = require("./config/session");
const errorMiddleware = require("./middleware/errorMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes"); // NEW

const app = express();

// =====================================================
// TRUST PROXY
// =====================================================

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// =====================================================
// REQUEST LOGGER
// =====================================================

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// =====================================================
// SESSION
// =====================================================

app.use(sessionMiddleware);

// =====================================================
// ROOT ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pasumai Uzhavan API is running",
  });
});

// =====================================================
// TEST API
// =====================================================

app.get("/test-api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend API working successfully",
  });
});

// =====================================================
// AUTH ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

// =====================================================
// PRODUCT ROUTES
// =====================================================

app.use("/api/products", productRoutes);

// =====================================================
// CART ROUTES
// =====================================================

app.use("/api/cart", cartRoutes);

// =====================================================
// WISHLIST ROUTES
// =====================================================

app.use("/api/wishlist", wishlistRoutes);

// =====================================================
// PAYMENT ROUTES
// =====================================================

app.use("/api/payment", paymentRoutes);

// =====================================================
// ORDER ROUTES
// =====================================================

app.use("/api/orders", orderRoutes);

// =====================================================
// 404 ROUTE
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(errorMiddleware);

// =====================================================
// EXPORT APP
// =====================================================

module.exports = app;
