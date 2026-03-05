// ============================================
// USER MODEL
// Defines the structure of user data in database
// ============================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_CONFIG } = require("../config/config");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
  },

  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email",
    ],
  },

  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false, // Don't return password by default when querying
  },

  role: {
    type: String,
    enum: ["student", "admin"],
    default: "student",
  },

  // For students only
  class: {
    type: String,
    enum: ["s1", "s2", "s3", "s4", "s5", "s6", null],
    required: function () {
      return this.role === "student";
    },
  },

  level: {
    type: String,
    enum: ["o-level", "a-level", null],
    required: function () {
      return this.role === "student";
    },
  },

  // For A-level students only
  combination: {
    type: String,
    enum: [
      "PCM",
      "PCB",
      "BCG",
      "HEG",
      "HEL",
      "MEG",
      "DEG",
      "MPG",
      "BCM",
      "HGL",
      "AKR",
      null,
    ],
    required: function () {
      return this.role === "student" && this.level === "a-level";
    },
  },

  // Track account status
  isActive: {
    type: Boolean,
    default: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ============================================
// MIDDLEWARE - Runs before saving user
// ============================================

// Hash password before saving to database
userSchema.pre("save", async function (next) {
  // Only hash password if it's new or modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================
// METHODS - Functions we can call on user objects
// ============================================

// Compare entered password with hashed password in database
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token for user
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.EXPIRE,
  });
};

// Get user data without sensitive information
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// ============================================
// STATIC METHODS - Functions we can call on User model
// ============================================

// Find user by email and verify password
userSchema.statics.findByCredentials = async function (email, password) {
  // Find user by email (include password for verification)
  const user = await this.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Check if account is active
  if (!user.isActive) {
    throw new Error("Account is deactivated. Please contact admin.");
  }

  // Compare passwords
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return user;
};

// Create the model from the schema
const User = mongoose.model("User", userSchema);

module.exports = User;
