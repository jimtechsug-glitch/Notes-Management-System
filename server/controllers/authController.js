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
    } = req.body;

    const userRole = role || "student";
    const isConfirmed = userRole === "admin";

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      class: classLevel,
      level,
      combination,
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
