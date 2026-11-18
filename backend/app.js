
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
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// =====================================================
// TRUST PROXY
// =====================================================

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// =====================================================
// CORS CONFIGURATION
// =====================================================

const allowedOrigins = [
  "https://pasumai-uzhavan-app-seven.vercel.app",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .flatMap((origin) => origin.split(","))
  .map((origin) => origin.trim().replace(/\/+$/, ""));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("CORS BLOCKED ORIGIN:", origin);

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
  ],
};

app.use(cors(corsOptions));

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
