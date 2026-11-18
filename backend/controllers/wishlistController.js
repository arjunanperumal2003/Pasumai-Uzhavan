
const db = require("../config/db");

exports.getMyWishlist = async (req, res, next) => {
  try {
    const [items] = await db.execute(
      `SELECT
        id,
        product_id AS productId,
        name,
        selling_price AS sellingPrice,
        image
       FROM wishlist_items
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.session.user.id]
    );

    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

exports.addWishlist = async (req, res, next) => {
  try {
    const { productId, name, sellingPrice, image } = req.body;

    if (!productId || !name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product ID and name are required",
      });
    }

    await db.execute(
      `INSERT INTO wishlist_items
       (user_id, product_id, name, selling_price, image)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       selling_price = VALUES(selling_price),
       image = VALUES(image)`,
      [
        req.session.user.id,
        String(productId),
        name.trim(),
        Number(sellingPrice || 0),
        image || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Added to wishlist",
    });
  } catch (error) {
    next(error);
  }
};

exports.removeWishlist = async (req, res, next) => {
  try {
    const [result] = await db.execute(
      `DELETE FROM wishlist_items
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.session.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Wishlist item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Removed from wishlist",
    });
  } catch (error) {
    next(error);
  }
};
