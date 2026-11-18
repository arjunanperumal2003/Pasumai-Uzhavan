
require("dotenv").config();

const app = require("./app");
const db = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify MySQL connection
    await db.query("SELECT 1");

    console.log("Railway MySQL connected successfully");

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Express server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      console.error("SERVER ERROR:", error);
    });

  } catch (error) {
    console.error("DATABASE CONNECTION ERROR:", error);
    process.exit(1);
  }
}

startServer();
