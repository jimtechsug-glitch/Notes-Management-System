// ============================================
// RESOURCE CONTROLLER
// Admin adds links (YouTube, etc); students view and click
// ============================================

const Resource = require("../models/Resource");
const User = require("../models/User");
const { ErrorResponse } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

// @desc    Get all resources with filters
// @route   GET /api/resources
// @access  Private
exports.getAllResources = async (req, res, next) => {
  try {
    const {
      level,
      class: classLevel,
      subject,
      combination,
      classStream,
      stream,
      search,
      limit = 50,
      page = 1,
    } = req.query;

    const where = { isActive: true };
    if (level) where.level = level;
    if (classLevel) where.class = classLevel;
    if (subject) where.subject = subject;
    if (stream) where.stream = stream;
    const andConditions = [];
    if (classStream) {
      andConditions.push({
        [Op.or]: [{ classStream: null }, { classStream }],
      });
    }
    if (combination) {
      andConditions.push({
        [Op.or]: [{ combination: null }, { combination }],
      });
    }
    if (search) {
      andConditions.push({
        [Op.or]: [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }
    if (andConditions.length) where[Op.and] = andConditions;

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;

    const { rows: resources, count: total } = await Resource.findAndCountAll({
      where,
      include: [
        { model: User, as: "addedBy", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.status(200).json({
      success: true,
      count: resources.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: resources,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
exports.getResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id, {
      include: [
        { model: User, as: "addedBy", attributes: ["id", "name", "email"] },
      ],
    });
    if (!resource) {
      return next(new ErrorResponse("Resource not found", 404));
    }
    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
};

// @desc    Create resource
// @route   POST /api/resources
// @access  Private (Admin only)
exports.createResource = async (req, res, next) => {
  try {
    const {
      title,
      description,
      url,
      subject,
      class: classLevel,
      level,
      classStream,
      stream,
      combination,
      resourceType,
    } = req.body;

    if (!title || !classLevel || !level) {
      return next(
        new ErrorResponse("Title, class, and level are required", 400),
      );
    }

    let resourceData = {
      title,
      description,
      subject: subject || null,
      class: classLevel,
      level,
      combination: combination || null,
      classStream: classStream || null,
      stream: stream || null,
      addedById: req.user.id,
    };

    // Handle URL-based resources
    if (resourceType === "url" || !resourceType) {
      if (!url) {
        return next(
          new ErrorResponse("URL is required for URL-based resources", 400),
        );
      }
      resourceData.url = url;
      resourceData.resourceType = "url";
    }
    // Handle file-based resources
    else if (resourceType === "file") {
      if (!req.file) {
        return next(new ErrorResponse("Please upload a file", 400));
      }
      resourceData.url = null; // No URL for file-based resources
      resourceData.resourceType = "file";
      resourceData.fileName = req.file.filename;
      resourceData.originalFileName = req.file.originalname;
      resourceData.filePath = req.file.path;
      resourceData.fileSize = req.file.size;
      resourceData.fileType = req.file.mimetype;
    } else {
      return next(
        new ErrorResponse(
          "Invalid resource type. Must be 'url' or 'file'",
          400,
        ),
      );
    }

    const resource = await Resource.create(resourceData);
    res.status(201).json({
      success: true,
      message: "Resource added successfully",
      data: resource,
    });
  } catch (error) {
    // Delete uploaded file if resource creation fails
    if (req.file) {
      const fs = require("fs").promises;
      await fs.unlink(req.file.path).catch(console.error);
    }
    next(error);
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (Admin only)
exports.updateResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return next(new ErrorResponse("Resource not found", 404));
    const {
      title,
      description,
      url,
      subject,
      class: classLevel,
      level,
      combination,
      classStream,
      stream,
    } = req.body;
    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (url) resource.url = url;
    if (subject !== undefined) resource.subject = subject;
    if (classLevel) resource.class = classLevel;
    if (level) resource.level = level;
    if (combination !== undefined) resource.combination = combination;
    if (classStream !== undefined) resource.classStream = classStream;
    if (stream !== undefined) resource.stream = stream;
    await resource.save();
    res
      .status(200)
      .json({ success: true, message: "Resource updated", data: resource });
  } catch (error) {
    next(error);
  }
};

// @desc    Download resource file
// @route   GET /api/resources/:id/download
// @access  Private
exports.downloadResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);

    if (!resource) {
      return next(new ErrorResponse("Resource not found", 404));
    }

    // Only allow downloading file-based resources
    if (resource.resourceType !== "file" || !resource.filePath) {
      return next(
        new ErrorResponse("This resource is not available for download", 400),
      );
    }

    // Check if file exists
    const fs = require("fs");
    if (!fs.existsSync(resource.filePath)) {
      return next(new ErrorResponse("File not found", 404));
    }

    // Send file
    res.download(resource.filePath, resource.originalFileName);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Admin only)
exports.deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return next(new ErrorResponse("Resource not found", 404));

    // Delete associated file if it exists
    if (resource.resourceType === "file" && resource.filePath) {
      const fs = require("fs").promises;
      await fs.unlink(resource.filePath).catch(console.error);
    }

    await resource.destroy();
    res.status(200).json({ success: true, message: "Resource deleted" });
  } catch (error) {
    next(error);
  }
};
