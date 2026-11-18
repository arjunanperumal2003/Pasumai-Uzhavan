
const db = require("../config/db");
const bcrypt = require("bcryptjs");

const COOKIE_NAME = "pasumai.sid";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production" ? "none" : "lax",
};

// =====================================================
// REGISTER
// =====================================================

exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      mobile,
      country,
      state,
      district,
      pincode,
      landmark,
      farmSize,
    } = req.body;

    if (!name?.trim() || !email?.trim() || !password || !mobile?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and mobile are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ? OR mobile = ? LIMIT 1",
      [normalizedEmail, mobile.trim()]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "Email or mobile number already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      `INSERT INTO users
      (name, email, password, mobile, country, state,
       district, pincode, landmark, farmSize)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        normalizedEmail,
        hashedPassword,
        mobile.trim(),
        country || "India",
        state || "Tamil Nadu",
        district || null,
        pincode || null,
        landmark || null,
        farmSize ? Number(farmSize) : null,
      ]
    );

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
    };

    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.user = user;

      req.session.save((saveError) => {
        if (saveError) return next(saveError);

        return res.status(201).json({
          success: true,
          message: "Registration successful",
          user,
        });
      });
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email or mobile number already registered",
      });
    }

    next(error);
  }
};

// =====================================================
// LOGIN
// =====================================================

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const [users] = await db.execute(
      "SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1",
      [email.trim().toLowerCase()]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const userRecord = users[0];

    const isMatch = await bcrypt.compare(
      password,
      userRecord.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
    };

    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.user = user;

      req.session.save((saveError) => {
        if (saveError) return next(saveError);

        return res.status(200).json({
          success: true,
          message: "Login successful",
          user,
        });
      });
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET LOGGED-IN USER
// =====================================================

exports.getMe = (req, res) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({
      success: false,
      message: "User not logged in",
      loginRequired: true,
    });
  }

  return res.status(200).json({
    success: true,
    user: req.session.user,
  });
};

// =====================================================
// LOGOUT
// =====================================================

exports.logout = (req, res, next) => {
  if (!req.session) {
    res.clearCookie(COOKIE_NAME, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }

  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie(COOKIE_NAME, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  });
};
