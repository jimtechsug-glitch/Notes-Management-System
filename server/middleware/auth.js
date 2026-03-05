const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_CONFIG } = require("../config/config");

// Protect routes - ensure user is authenticated
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Use the same JWT secret/config used when generating tokens
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET);

    // Sequelize uses findByPk (primary key) instead of findById
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Attach full user instance (without password due to toJSON override)
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};

// ✅ ROLE-BASED AUTHORIZATION
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized`,
      });
    }
    next();
  };
};
