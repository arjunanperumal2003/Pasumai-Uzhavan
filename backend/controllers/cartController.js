
const db = require("../config/db");

const MAX_QUANTITY = 5;

// =====================================================
// GET LOGGED-IN USER'S CART
// =====================================================

exports.getMyCart = async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to view your cart",
        loginRequired: true,
      });
    }

    const [cart] = await db.execute(
      `SELECT
        c.id,
        c.product_id AS productId,
        COALESCE(p.name, c.name) AS name,
        COALESCE(p.brand, c.brand) AS brand,
        COALESCE(p.selling_price, c.selling_price) AS sellingPrice,
        c.qty,
        COALESCE(p.image, c.image) AS image,
        p.stock
       FROM cart_items c
       LEFT JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      items: cart.map((item) => ({
        ...item,
        productId: String(item.productId),
        qty: Number(item.qty),
        sellingPrice: Number(item.sellingPrice || 0),
        stock:
          item.stock === null
            ? 0
            : Number(item.stock),
        available:
          item.stock !== null &&
          Number(item.stock) > 0,
      })),
    });
  } catch (error) {
    console.error("GET CART ERROR:", error);
    return next(error);
  }
};

// =====================================================
// ADD PRODUCT TO CART
// =====================================================

exports.addToCart = async (req, res, next) => {
  let connection;
  let transactionStarted = false;

  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to add products to cart",
        loginRequired: true,
      });
    }

    const productId =
      req.body?.productId === undefined ||
      req.body?.productId === null
        ? ""
        : String(req.body.productId).trim();

    const quantity = Number(req.body?.qty ?? 1);

    if (!productId || productId.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      return res.status(400).json({
        success: false,
        message: `Quantity must be between 1 and ${MAX_QUANTITY}`,
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    // Lock product row to prevent concurrent cart updates
    // from exceeding the quantity/stock limits.
    const [products] = await connection.execute(
      `SELECT
        id,
        name,
        brand,
        selling_price,
        image,
        stock
       FROM products
       WHERE id = ?
       FOR UPDATE`,
      [productId]
    );

    if (!products.length) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = products[0];

    const stock = Number(product.stock);
    const price = Number(product.selling_price);

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      throw new Error("Invalid product price");
    }

    if (
      !Number.isSafeInteger(stock) ||
      stock < 1
    ) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "This product is currently out of stock",
      });
    }

    // Check existing cart item for this user.
    const [existingItems] = await connection.execute(
      `SELECT id, qty
       FROM cart_items
       WHERE user_id = ?
         AND product_id = ?
       LIMIT 1
       FOR UPDATE`,
      [userId, productId]
    );

    const existingQty = existingItems.length
      ? Number(existingItems[0].qty)
      : 0;

    const newQuantity = existingQty + quantity;

    if (newQuantity > MAX_QUANTITY) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_QUANTITY} units allowed per product`,
      });
    }

    if (newQuantity > stock) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: `Only ${stock} units available`,
      });
    }

    if (existingItems.length) {
      await connection.execute(
        `UPDATE cart_items
         SET qty = ?,
             name = ?,
             brand = ?,
             selling_price = ?,
             image = ?
         WHERE id = ?
           AND user_id = ?`,
        [
          newQuantity,
          product.name,
          product.brand || null,
          price,
          product.image || null,
          existingItems[0].id,
          userId,
        ]
      );
    } else {
      await connection.execute(
        `INSERT INTO cart_items
         (
           user_id,
           product_id,
           name,
           brand,
           selling_price,
           qty,
           image
         )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          productId,
          product.name,
          product.brand || null,
          price,
          quantity,
          product.image || null,
        ]
      );
    }

    await connection.commit();
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Product added to cart",
      qty: newQuantity,
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("CART ROLLBACK ERROR:", rollbackError);
      }
    }

    console.error("ADD TO CART ERROR:", error);

    if (error.message === "Invalid product price") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// =====================================================
// UPDATE CART ITEM QUANTITY
// =====================================================

exports.updateCart = async (req, res, next) => {
  let connection;
  let transactionStarted = false;

  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to update your cart",
        loginRequired: true,
      });
    }

    const cartId = Number(req.params.id);
    const quantity = Number(req.body?.qty);

    if (
      !Number.isSafeInteger(cartId) ||
      cartId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID",
      });
    }

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      return res.status(400).json({
        success: false,
        message: `Quantity must be between 1 and ${MAX_QUANTITY}`,
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    // Verify ownership and lock the associated product.
    const [items] = await connection.execute(
      `SELECT
        c.id,
        c.product_id,
        p.stock,
        p.name,
        p.brand,
        p.selling_price,
        p.image
       FROM cart_items c
       INNER JOIN products p ON p.id = c.product_id
       WHERE c.id = ?
         AND c.user_id = ?
       LIMIT 1
       FOR UPDATE`,
      [cartId, userId]
    );

    if (!items.length) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "Cart item or product not found",
      });
    }

    const item = items[0];

    const stock = Number(item.stock);
    const price = Number(item.selling_price);

    if (
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      throw new Error("Invalid product stock");
    }

    if (quantity > stock) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: `Only ${stock} units available`,
      });
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Invalid product price");
    }

    await connection.execute(
      `UPDATE cart_items
       SET qty = ?,
           name = ?,
           brand = ?,
           selling_price = ?,
           image = ?
       WHERE id = ?
         AND user_id = ?`,
      [
        quantity,
        item.name,
        item.brand || null,
        price,
        item.image || null,
        cartId,
        userId,
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return res.status(200).json({
      success: true,
      id: cartId,
      qty: quantity,
      message: "Quantity updated",
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("CART ROLLBACK ERROR:", rollbackError);
      }
    }

    console.error("UPDATE CART ERROR:", error);
    return next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// =====================================================
// DELETE INDIVIDUAL CART ITEM
// =====================================================

exports.removeCart = async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to remove cart items",
        loginRequired: true,
      });
    }

    const cartId = Number(req.params.id);

    if (
      !Number.isSafeInteger(cartId) ||
      cartId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID",
      });
    }

    const [result] = await db.execute(
      `DELETE FROM cart_items
       WHERE id = ?
         AND user_id = ?`,
      [cartId, userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
    });
  } catch (error) {
    console.error("REMOVE CART ERROR:", error);
    return next(error);
  }
};

// =====================================================
// CLEAR ENTIRE USER CART
// =====================================================

exports.clearMyCart = async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to clear your cart",
        loginRequired: true,
      });
    }

    const [result] = await db.execute(
      `DELETE FROM cart_items
       WHERE user_id = ?`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      deletedItems: result.affectedRows,
    });
  } catch (error) {
    console.error("CLEAR CART ERROR:", error);
    return next(error);
  }
};
