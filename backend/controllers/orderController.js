
const db = require("../config/db");
const crypto = require("crypto");

// =====================================================
// CONFIGURATION
// =====================================================

const MAX_ORDER_ITEMS = 50;
const MAX_ITEM_QUANTITY = 99;
const MAX_TOTAL_QUANTITY = 200;

// =====================================================
// HELPERS
// =====================================================

const getProductColumns = async () => {
  const [columns] = await db.execute(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
  `);

  return columns.map((column) => column.COLUMN_NAME);
};

const findColumn = (columns, candidates) =>
  candidates.find((column) => columns.includes(column));

const getImageSelect = (columns, alias = "") => {
  const imageColumn = findColumn(columns, [
    "image",
    "image_url",
    "product_image",
    "productImage",
    "image_path",
    "thumbnail",
    "photo",
  ]);

  if (!imageColumn) {
    return "NULL AS image";
  }

  const prefix = alias ? `${alias}.` : "";

  return `${prefix}\`${imageColumn}\` AS image`;
};

const normalizePaymentMethod = (value) => {
  const method = String(value || "").trim().toLowerCase();

  if (
    method === "cod" ||
    method === "cash on delivery"
  ) {
    return "COD";
  }

  return null;
};

const validateAddress = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const address = value.trim();

  if (address.length < 10 || address.length > 1000) {
    return null;
  }

  return address;
};

const validateOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      error: "Order items are required",
    };
  }

  if (items.length > MAX_ORDER_ITEMS) {
    return {
      error: `You can order up to ${MAX_ORDER_ITEMS} different products at once`,
    };
  }

  const itemMap = new Map();

  let totalQuantity = 0;

  for (const item of items) {
    if (!item || typeof item !== "object") {
      return {
        error: "Invalid order item",
      };
    }

    const rawProductId =
      item.productId ?? item.product_id;

    if (
      rawProductId === undefined ||
      rawProductId === null
    ) {
      return {
        error: "Product ID is required",
      };
    }

    const productId = String(rawProductId).trim();

    const rawQuantity = item.qty ?? item.quantity;

    const qty = Number(rawQuantity);

    if (
      !productId ||
      productId.length > 255 ||
      !Number.isSafeInteger(qty) ||
      qty < 1 ||
      qty > MAX_ITEM_QUANTITY
    ) {
      return {
        error: "Invalid product ID or quantity",
      };
    }

    const combinedQuantity =
      (itemMap.get(productId) || 0) + qty;

    if (combinedQuantity > MAX_ITEM_QUANTITY) {
      return {
        error: `Maximum quantity per product is ${MAX_ITEM_QUANTITY}`,
      };
    }

    itemMap.set(productId, combinedQuantity);

    totalQuantity += qty;

    if (totalQuantity > MAX_TOTAL_QUANTITY) {
      return {
        error: `Maximum total order quantity is ${MAX_TOTAL_QUANTITY}`,
      };
    }
  }

  return {
    items: Array.from(itemMap, ([productId, qty]) => ({
      productId,
      qty,
    })),
  };
};

// =====================================================
// CREATE ORDER
// =====================================================

exports.createOrder = async (req, res, next) => {
  let connection;
  let transactionStarted = false;

  try {
    const user = req.session?.user;

    // Always use the logged-in session user.
    if (!user?.id) {
      return res.status(401).json({
        success: false,
        message: "Please login to place an order",
        loginRequired: true,
      });
    }

    const { address, paymentMethod, items } = req.body;

    // Validate address.
    const validAddress = validateAddress(address);

    if (!validAddress) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid delivery address",
      });
    }

    // Only COD is currently supported.
    const validPaymentMethod =
      normalizePaymentMethod(paymentMethod);

    if (!validPaymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Currently, only Cash on Delivery is available",
      });
    }

    // Validate products and quantities.
    const validation = validateOrderItems(items);

    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const finalItems = validation.items;

    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    // Get product image column dynamically.
    const productColumns = await getProductColumns();

    if (
      !productColumns.includes("id") ||
      !productColumns.includes("name") ||
      !productColumns.includes("selling_price") ||
      !productColumns.includes("stock")
    ) {
      throw new Error(
        "Required product columns are missing from the products table"
      );
    }

    const imageSelect = getImageSelect(productColumns);

    const productIds = finalItems.map(
      (item) => item.productId
    );

    const placeholders = productIds
      .map(() => "?")
      .join(",");

    // Lock products to prevent simultaneous orders
    // from overselling available stock.
    const [products] = await connection.execute(
      `SELECT
        id,
        name,
        selling_price,
        stock,
        ${imageSelect}
       FROM products
       WHERE id IN (${placeholders})
       FOR UPDATE`,
      productIds
    );

    const productMap = new Map(
      products.map((product) => [
        String(product.id),
        product,
      ])
    );

    if (products.length !== finalItems.length) {
      throw new Error(
        "One or more products were not found"
      );
    }

    // Calculate total using database prices.
    // Never trust the price or total sent by the frontend.
    let totalInPaise = 0;

    for (const item of finalItems) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error("Product not found");
      }

      const price = Number(product.selling_price);
      const stock = Number(product.stock);

      if (
        !Number.isFinite(price) ||
        price <= 0
      ) {
        throw new Error(
          `Invalid price for ${product.name}`
        );
      }

      if (
        !Number.isSafeInteger(stock) ||
        stock < item.qty
      ) {
        throw new Error(
          `Insufficient stock for ${product.name}`
        );
      }

      const priceInPaise = Math.round(price * 100);

      if (
        !Number.isSafeInteger(priceInPaise) ||
        priceInPaise <= 0
      ) {
        throw new Error(
          `Invalid price for ${product.name}`
        );
      }

      totalInPaise += priceInPaise * item.qty;

      if (!Number.isSafeInteger(totalInPaise)) {
        throw new Error("Order total is too large");
      }
    }

    const totalAmount = totalInPaise / 100;

    const orderId = crypto.randomUUID();

    // Insert order.
    await connection.execute(
      `INSERT INTO orders
       (
         id,
         user_id,
         total_amount,
         payment_method,
         address,
         status
       )
       VALUES (?, ?, ?, ?, ?, 'Placed')`,
      [
        orderId,
        String(user.id),
        totalAmount,
        validPaymentMethod,
        validAddress,
      ]
    );

    const responseItems = [];

    // Insert order items and reduce stock.
    for (const item of finalItems) {
      const product = productMap.get(item.productId);

      await connection.execute(
        `INSERT INTO order_items
         (
           order_id,
           product_id,
           name,
           qty
         )
         VALUES (?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          product.name,
          item.qty,
        ]
      );

      const [stockResult] = await connection.execute(
        `UPDATE products
         SET stock = stock - ?
         WHERE id = ?
           AND stock >= ?`,
        [
          item.qty,
          item.productId,
          item.qty,
        ]
      );

      if (stockResult.affectedRows !== 1) {
        throw new Error(
          `Unable to update stock for ${product.name}`
        );
      }

      responseItems.push({
        productId: item.productId,
        name: product.name,
        qty: item.qty,
        sellingPrice: Number(product.selling_price),
        image: product.image || "",
      });
    }

    // Commit only after every insert and stock update succeeds.
    await connection.commit();
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: {
        id: orderId,
        userId: String(user.id),
        totalAmount,
        paymentMethod: validPaymentMethod,
        address: validAddress,
        status: "Placed",
        items: responseItems,
      },
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "ORDER ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    console.error("CREATE ORDER ERROR:", error);

    if (
      error.message === "One or more products were not found" ||
      error.message === "Product not found"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message?.startsWith("Insufficient stock") ||
      error.message?.startsWith("Invalid price")
    ) {
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
// GET USER ORDERS
// =====================================================

exports.getUserOrders = async (req, res, next) => {
  try {
    const user = req.session?.user;

    if (!user?.id) {
      return res.status(401).json({
        success: false,
        message: "Please login to view orders",
        loginRequired: true,
      });
    }

    // Prevent users from accessing another user's orders.
    if (
      String(req.params.userId) !== String(user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const productColumns = await getProductColumns();

    const imageSelect = getImageSelect(
      productColumns,
      "p"
    );

    const [orders] = await db.execute(
      `SELECT
        id,
        user_id,
        total_amount,
        payment_method,
        address,
        status,
        cancel_reason,
        created_at,
        cancelled_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [String(user.id)]
    );

    if (orders.length === 0) {
      return res.json({
        success: true,
        total: 0,
        orders: [],
      });
    }

    const orderIds = orders.map(
      (order) => order.id
    );

    const placeholders = orderIds
      .map(() => "?")
      .join(",");

    // Existing schema has no price/image snapshot columns.
    // Product price and image below are current product data.
    const [items] = await db.execute(
      `SELECT
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.name,
        oi.qty,
        p.selling_price,
        ${imageSelect}
       FROM order_items oi
       LEFT JOIN products p
         ON p.id = oi.product_id
       WHERE oi.order_id IN (${placeholders})`,
      orderIds
    );

    const groupedItems = {};

    for (const item of items) {
      const orderId = String(item.order_id);

      if (!groupedItems[orderId]) {
        groupedItems[orderId] = [];
      }

      groupedItems[orderId].push({
        id: item.id,
        productId: String(item.product_id),
        name: item.name,
        qty: Number(item.qty),
        sellingPrice:
          item.selling_price === null
            ? null
            : Number(item.selling_price),
        image: item.image || "",
      });
    }

    const formattedOrders = orders.map((order) => ({
      id: String(order.id),
      userId: String(order.user_id),
      totalAmount: Number(order.total_amount),
      paymentMethod: order.payment_method,
      address: order.address,
      status: order.status,
      cancelReason: order.cancel_reason || "",
      createdAt: order.created_at,
      cancelledAt: order.cancelled_at,
      items: groupedItems[String(order.id)] || [],
    }));

    return res.json({
      success: true,
      total: formattedOrders.length,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("GET USER ORDERS ERROR:", error);
    return next(error);
  }
};

// =====================================================
// CANCEL ORDER
// =====================================================

exports.cancelOrder = async (req, res, next) => {
  let connection;
  let transactionStarted = false;

  try {
    const user = req.session?.user;

    if (!user?.id) {
      return res.status(401).json({
        success: false,
        message: "Please login to cancel order",
        loginRequired: true,
      });
    }

    const orderId = String(
      req.params.orderId || ""
    ).trim();

    if (!orderId || orderId.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const reason = String(
      req.body?.reason || "Cancelled by customer"
    )
      .trim()
      .slice(0, 255);

    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    // Lock order and verify ownership.
    const [orders] = await connection.execute(
      `SELECT id, status
       FROM orders
       WHERE id = ?
         AND user_id = ?
       FOR UPDATE`,
      [
        orderId,
        String(user.id),
      ]
    );

    if (orders.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const currentStatus = String(
      orders[0].status
    );

    if (currentStatus === "Cancelled") {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "Order already cancelled",
      });
    }

    if (
      !["Placed", "Processing"].includes(
        currentStatus
      )
    ) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "This order cannot be cancelled",
      });
    }

    // Read items belonging to this order.
    const [items] = await connection.execute(
      `SELECT product_id, qty
       FROM order_items
       WHERE order_id = ?`,
      [orderId]
    );

    if (items.length === 0) {
      throw new Error(
        "Cannot cancel an order with no order items"
      );
    }

    // Restore stock.
    for (const item of items) {
      const qty = Number(item.qty);

      if (
        !Number.isSafeInteger(qty) ||
        qty < 1
      ) {
        throw new Error(
          "Invalid order item quantity"
        );
      }

      await connection.execute(
        `UPDATE products
         SET stock = stock + ?
         WHERE id = ?`,
        [
          qty,
          item.product_id,
        ]
      );
    }

    // Update order status in the same transaction.
    const [updateResult] = await connection.execute(
      `UPDATE orders
       SET status = 'Cancelled',
           cancel_reason = ?,
           cancelled_at = NOW()
       WHERE id = ?
         AND user_id = ?
         AND status IN ('Placed', 'Processing')`,
      [
        reason || "Cancelled by customer",
        orderId,
        String(user.id),
      ]
    );

    if (updateResult.affectedRows !== 1) {
      throw new Error(
        "Unable to cancel this order"
      );
    }

    await connection.commit();
    transactionStarted = false;

    return res.json({
      success: true,
      message: "Order cancelled successfully",
      status: "Cancelled",
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "CANCEL ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    console.error("CANCEL ORDER ERROR:", error);

    return next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
