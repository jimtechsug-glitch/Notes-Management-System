const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// Subject represents a single curriculum subject for a given level/class.
// Admin can create/update/delete to match curriculum changes.
const Subject = sequelize.define(
  "Subject",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Please provide a subject name" },
      },
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // o-level or a-level
    level: {
      type: DataTypes.ENUM("o-level", "a-level"),
      allowNull: false,
    },
    // Class this subject applies to (s1–s6)
    class: {
      type: DataTypes.ENUM("s1", "s2", "s3", "s4", "s5", "s6"),
      allowNull: false,
    },
    // For S3/S4: compulsory vs optional
    isCompulsory: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // A-Level stream this subject belongs to (arts, science or both)
    stream: {
      type: DataTypes.ENUM("arts", "science", "both"),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "subjects",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["name", "level", "class"],
      },
    ],
  },
);

module.exports = Subject;
