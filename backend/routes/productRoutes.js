
const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");

router.get("/", productController.getProducts);

// SEARCH PRODUCTS
router.get("/search-fertilizers", productController.searchProducts);

// GET PRODUCT BY ID
router.get("/:id", productController.getProductById);

module.exports = router;
