const db = require("./config/db");

async function testProducts() {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM products ORDER BY created_at DESC"
    );

    console.log("Total products:", rows.length);
    console.log("First product:", rows[0]);
  } catch (error) {
    console.error("DATABASE QUERY ERROR:", error);
  } finally {
    await db.end();
  }
}

testProducts();