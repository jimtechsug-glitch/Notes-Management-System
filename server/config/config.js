// ============================================
// APP CONFIGURATION
// Central place for security-related constants
// ============================================

require("dotenv").config();

// JWT configuration
const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || "change-this-secret-in-env",
  EXPIRE: process.env.JWT_EXPIRE || "7d", // e.g. '1d', '7d'
};

// Valid classes for O-Level and A-Level
const CLASSES = {
  OLEVEL: ["s1", "s2", "s3", "s4"],
  ALEVEL: ["s5", "s6"],
};

// O-Level subject list (used by subject controller)
const OLEVEL_SUBJECTS = [
  "Mathematics",
  "English",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "CRE",
  "Agriculture",
  "Commerce",
];

// Supported A-Level subject combinations
// Shape matches what subjectController expects: { CODE: { name, subjects[] } }
const ALEVEL_COMBINATIONS = {
  PCM: {
    name: "Physics, Chemistry, Mathematics",
    subjects: ["Physics", "Chemistry", "Mathematics"],
  },
  PCB: {
    name: "Physics, Chemistry, Biology",
    subjects: ["Physics", "Chemistry", "Biology"],
  },
  BCG: {
    name: "Biology, Chemistry, Geography",
    subjects: ["Biology", "Chemistry", "Geography"],
  },
  HEG: {
    name: "History, Economics, Geography",
    subjects: ["History", "Economics", "Geography"],
  },
  HEL: {
    name: "History, Economics, Literature",
    subjects: ["History", "Economics", "Literature"],
  },
  MEG: {
    name: "Mathematics, Economics, Geography",
    subjects: ["Mathematics", "Economics", "Geography"],
  },
  DEG: {
    name: "Divinity, Economics, Geography",
    subjects: ["Divinity", "Economics", "Geography"],
  },
  MPG: {
    name: "Mathematics, Physics, Geography",
    subjects: ["Mathematics", "Physics", "Geography"],
  },
  BCM: {
    name: "Biology, Chemistry, Mathematics",
    subjects: ["Biology", "Chemistry", "Mathematics"],
  },
  HGL: {
    name: "History, Geography, Literature",
    subjects: ["History", "Geography", "Literature"],
  },
  AKR: {
    name: "Arabic, Kiswahili, Religious Education",
    subjects: ["Arabic", "Kiswahili", "Religious Education"],
  },
};

module.exports = {
  JWT_CONFIG,
  CLASSES,
  OLEVEL_SUBJECTS,
  ALEVEL_COMBINATIONS,
};
