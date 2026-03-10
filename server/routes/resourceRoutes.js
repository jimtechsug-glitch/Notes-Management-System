const express = require("express");
const router = express.Router();
const {
  getAllResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  downloadResource,
} = require("../controllers/resourceController");
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

router.get("/", protect, getAllResources);
router.get("/:id", protect, getResource);
router.get("/:id/download", protect, downloadResource);
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("file"),
  createResource,
);
router.put("/:id", protect, authorize("admin"), updateResource);
router.delete("/:id", protect, authorize("admin"), deleteResource);

module.exports = router;
