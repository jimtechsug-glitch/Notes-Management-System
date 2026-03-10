const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  updatePassword,
  requestPasswordReset,
  getResetRequests,
  resetUserPassword,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");
const { validateRegister, validateLogin } = require("../middleware/validation");

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.put("/password", protect, updatePassword);

// Reset Password Routes
router.post("/request-reset", requestPasswordReset);
router.get("/reset-requests", protect, authorize("admin"), getResetRequests);
router.post("/reset-user/:id", protect, authorize("admin"), resetUserPassword);

module.exports = router;
