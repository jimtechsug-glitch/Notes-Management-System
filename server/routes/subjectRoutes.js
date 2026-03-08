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

// Public GET routes for registration/viewing
router.get("/", getAllSubjects);
router.get("/level/:level", getSubjectsByLevel);
router.get("/combinations", getCombinations);

// Protected routes (Admin only for modifications)
router.use(protect);

router.post("/", authorize("admin"), createSubject);
router
  .route("/:id")
  .put(authorize("admin"), updateSubject)
  .delete(authorize("admin"), deleteSubject);

module.exports = router;
