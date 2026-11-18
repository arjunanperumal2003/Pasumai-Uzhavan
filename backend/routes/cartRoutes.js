
const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/authMiddleware");
const cartController = require("../controllers/cartController");

router.use(requireAuth);

// Get user's cart
router.get("/my", cartController.getMyCart);

// Add product
router.post("/", cartController.addToCart);

// Update quantity
router.put("/:id", cartController.updateCart);

// Clear entire cart
router.delete("/my", cartController.clearMyCart);

// Delete individual item
router.delete("/:id", cartController.removeCart);

module.exports = router;
