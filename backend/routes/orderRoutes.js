
const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/authMiddleware");

const {
  createOrder,
  getUserOrders,
  cancelOrder,
} = require("../controllers/orderController");

// All order routes require login
router.use(requireAuth);

// Create order
router.post("/", createOrder);

// Get logged-in user's orders
router.get("/user/:userId", getUserOrders);

// Cancel an order
router.patch("/:orderId/cancel", cancelOrder);

module.exports = router;
