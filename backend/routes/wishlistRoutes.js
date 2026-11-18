
const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/authMiddleware");
const wishlistController = require("../controllers/wishlistController");

router.use(requireAuth);

router.get("/my", wishlistController.getMyWishlist);
router.post("/", wishlistController.addWishlist);
router.delete("/:id", wishlistController.removeWishlist);

module.exports = router;
