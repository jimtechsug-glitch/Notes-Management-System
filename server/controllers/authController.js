const User = require("../models/User");
const { ErrorResponse } = require("../middleware/errorHandler");

exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      class: classLevel,
      level,
      combination,
      stream,
      selectedSubjects,
    } = req.body;

    const userRole = "student"; // Force student role for registration
    const requireConfirmation =
      process.env.REQUIRE_EMAIL_CONFIRMATION === "true";
    const isConfirmed = userRole === "admin" || !requireConfirmation;

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      class: classLevel,
      level,
      combination,
      stream,
      selectedSubjects,
      isConfirmed,
    });

    const message = isConfirmed
      ? "Registration successful. You can login immediately."
      : "Registration successful. Your account is pending admin approval.";

    const responseData = {
      success: true,
      message,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          class: user.class,
          level: user.level,
          combination: user.combination,
          isConfirmed: user.isConfirmed,
        },
      },
    };

    if (isConfirmed) {
      responseData.data.token = user.generateAuthToken();
    }

    res.status(201).json(responseData);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByCredentials(email, password);

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid credentials",
    });
  }
};

exports.getMe = async (req, res, next) => {
  try {
    // User is already loaded by protect middleware (req.user is a Sequelize instance)
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(
        new ErrorResponse("Please provide current and new password", 400),
      );
    }

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse("Current password is incorrect", 401));
    }

    user.password = newPassword;
    await user.save();

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset (Public)
// @route   POST /api/auth/request-reset
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorResponse("Please provide an email", 400));
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists for security?
      // Actually, in a LAN school system, it's probably better to be helpful.
      return next(new ErrorResponse("User not found with that email", 404));
    }

    user.resetRequest = true;
    user.resetRequestedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset request sent to admin",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all password reset requests (Admin only)
// @route   GET /api/auth/reset-requests
exports.getResetRequests = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: { resetRequest: true },
      attributes: { exclude: ["password"] },
      order: [["resetRequestedAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset student password by Admin (Admin only)
// @route   POST /api/auth/reset-user/:id
exports.resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return next(new ErrorResponse("Please provide a new password", 400));
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    user.password = newPassword;
    user.resetRequest = false;
    user.resetRequestedAt = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Password for ${user.name} has been reset successfully`,
    });
  } catch (error) {
    next(error);
  }
};
