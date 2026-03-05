const express = require("express");
const router = express.Router();
const {
  getAllSubjects,
  getSubjectsByLevel,
  getCombinations,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

// List & filter subjects, or create new (admin only)
router.route("/").get(getAllSubjects).post(authorize("admin"), createSubject);

// Level-based listing
router.get("/level/:level", getSubjectsByLevel);

// A-Level combinations metadata
router.get("/combinations", getCombinations);

// Update/delete specific subject (admin only)
router
  .route("/:id")
  .put(authorize("admin"), updateSubject)
  .delete(authorize("admin"), deleteSubject);

module.exports = router;
