
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from backend/.env");
}

const isProduction = process.env.NODE_ENV === "production";

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const sessionMiddleware = session({
  name: "pasumai.sid",
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
});

module.exports = sessionMiddleware;
