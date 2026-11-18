
const requireAuth = (req, res, next) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Please login to continue",
      loginRequired: true,
    });
  }

  next();
};

module.exports = requireAuth;
