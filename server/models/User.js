const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sequelize } = require("../config/db");
const { JWT_CONFIG } = require("../config/config");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Please provide a name" },
        len: { args: [1, 50], msg: "Name cannot be more than 50 characters" },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "Please provide a valid email" },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: { args: [6, 100], msg: "Password must be at least 6 characters" },
      },
    },
    role: {
      type: DataTypes.ENUM("student", "admin"),
      defaultValue: "student",
    },
    class: {
      type: DataTypes.ENUM("s1", "s2", "s3", "s4", "s5", "s6"),
      allowNull: true,
    },
    level: {
      type: DataTypes.ENUM("o-level", "a-level"),
      allowNull: true,
    },
    // O-Level: e.g. "S1 A", "S1 B"
    classStream: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // A-Level: "arts" or "science"
    stream: {
      type: DataTypes.ENUM("arts", "science"),
      allowNull: true,
    },
    // A-Level: Auto-generated from selectedSubjects (e.g. "PHY-ECO-MAT")
    combination: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // A-Level: Array of subject codes chosen by student
    selectedSubjects: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isConfirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    resetRequest: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    resetRequestedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
        // Removed insecure auto-confirmation for admins
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeSave: async (user) => {
        // Handle combination generation if A-Level subjects are selected
        if (user.selectedSubjects && user.changed("selectedSubjects")) {
          const Subject = sequelize.models.Subject;
          const subjects = await Subject.findAll({
            where: { id: user.selectedSubjects },
          });

          if (subjects.length > 0) {
            // Sort by name or code to keep combinations consistent
            const combination = subjects
              .map((s) => s.code || s.name)
              .sort()
              .join("-");
            user.combination = combination.toUpperCase();
          }
        }
      },
    },
  },
);

User.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

User.prototype.generateAuthToken = function () {
  return jwt.sign({ id: this.id, role: this.role }, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.EXPIRE,
  });
};

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

User.findByCredentials = async function (email, password) {
  const user = await this.findOne({ where: { email } });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Account is deactivated. Please contact admin.");
  }

  if (!user.isConfirmed) {
    throw new Error("Account pending approval. Please contact admin.");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return user;
};

module.exports = User;
