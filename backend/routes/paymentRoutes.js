
const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/authMiddleware");
const paymentController = require("../controllers/paymentController");

router.post("/", requireAuth, paymentController.createPayment);

module.exports = router;
