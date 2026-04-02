const express = require("express");
const { protect } = require("../middleware/auth");
const { query } = require("../controllers/searchroomController");

const router = express.Router();

// @route   POST /api/searchroom/query
// @access  Private (any authenticated user — UI limits to students)
router.post("/query", protect, query);

module.exports = router;
