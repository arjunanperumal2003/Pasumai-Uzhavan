
const db = require("../config/db");

// GET ALL PRODUCTS
exports.getProducts = async (req, res, next) => {
  try {
    const [products] = await db.execute(
      "SELECT * FROM products ORDER BY created_at DESC"
    );

    return res.status(200).json({
      success: true,
      total: products.length,
      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return next(error);
  }
};

// SEARCH PRODUCTS
exports.searchProducts = async (req, res, next) => {
  try {
    const search = req.query.q?.trim();

    if (!search) {
      return res.status(200).json({
        success: true,
        total: 0,
        products: [],
      });
    }

    const searchTerm = `%${search}%`;

    const [products] = await db.execute(
      `SELECT * FROM products
       WHERE name LIKE ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [searchTerm]
    );

    return res.status(200).json({
      success: true,
      total: products.length,
      products,
    });
  } catch (error) {
    console.error("SEARCH PRODUCTS ERROR:", error);
    return next(error);
  }
};

// GET PRODUCT BY ID
exports.getProductById = async (req, res, next) => {
  try {
    const [products] = await db.execute(
      "SELECT * FROM products WHERE id = ? LIMIT 1",
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product: products[0],
    });
  } catch (error) {
    console.error("GET PRODUCT BY ID ERROR:", error);
    return next(error);
  }
};
