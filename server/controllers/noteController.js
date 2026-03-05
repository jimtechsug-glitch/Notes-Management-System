// ============================================
// NOTE CONTROLLER
// Handles all note operations (CRUD)
// ============================================

const Note = require("../models/Note");
const User = require("../models/User");
const { ErrorResponse } = require("../middleware/errorHandler");
const fs = require("fs").promises;
const path = require("path");
const { Op } = require("sequelize");

// @desc    Get all notes with filters
// @route   GET /api/notes
// @access  Private
exports.getAllNotes = async (req, res, next) => {
  try {
    const {
      level,
      class: classLevel,
      subject,
      search,
      limit = 20,
      page = 1,
    } = req.query;

    // Build Sequelize where clause
    const where = { isActive: true };

    if (level) where.level = level;
    if (classLevel) where.class = classLevel;
    if (subject) where.subject = subject;

    // Text search (basic title/description search)
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;

    const { rows: notes, count: total } = await Note.findAndCountAll({
      where,
      include: [
        { model: User, as: "uploadedBy", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.status(200).json({
      success: true,
      count: notes.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
exports.getNote = async (req, res, next) => {
  try {
    const note = await Note.findByPk(req.params.id, {
      include: [
        { model: User, as: "uploadedBy", attributes: ["id", "name", "email"] },
      ],
    });

    if (!note) {
      return next(new ErrorResponse("Note not found", 404));
    }

    // Increment views
    await note.incrementViews();

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new note
// @route   POST /api/notes
// @access  Private (Admin only)
exports.createNote = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      class: classLevel,
      level,
      combination,
    } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return next(new ErrorResponse("Please upload a file", 400));
    }

    // Create note
    const note = await Note.create({
      title,
      description,
      subject,
      class: classLevel,
      level,
      combination,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedById: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Note uploaded successfully",
      data: note,
    });
  } catch (error) {
    // Delete uploaded file if note creation fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    next(error);
  }
};

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private (Admin only)
exports.updateNote = async (req, res, next) => {
  try {
    let note = await Note.findByPk(req.params.id);

    if (!note) {
      return next(new ErrorResponse("Note not found", 404));
    }

    const {
      title,
      description,
      subject,
      class: classLevel,
      level,
      combination,
    } = req.body;

    // Update fields
    if (title) note.title = title;
    if (description) note.description = description;
    if (subject) note.subject = subject;
    if (classLevel) note.class = classLevel;
    if (level) note.level = level;
    if (combination) note.combination = combination;

    // If new file uploaded, delete old one
    if (req.file) {
      // Delete old file
      await fs.unlink(note.filePath).catch(console.error);

      // Update with new file
      note.fileName = req.file.filename;
      note.originalFileName = req.file.originalname;
      note.filePath = req.file.path;
      note.fileSize = req.file.size;
      note.fileType = req.file.mimetype;
    }

    await note.save();

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: note,
    });
  } catch (error) {
    // Delete uploaded file if update fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    next(error);
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private (Admin only)
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findByPk(req.params.id);

    if (!note) {
      return next(new ErrorResponse("Note not found", 404));
    }

    // Delete file from filesystem
    await fs.unlink(note.filePath).catch(console.error);

    // Delete from database
    await note.destroy();

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download note
// @route   GET /api/notes/:id/download
// @access  Private
exports.downloadNote = async (req, res, next) => {
  try {
    const note = await Note.findByPk(req.params.id);

    if (!note) {
      return next(new ErrorResponse("Note not found", 404));
    }

    // Increment download count
    await note.incrementDownloads();

    // Send file
    res.download(note.filePath, note.originalFileName);
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent notes
// @route   GET /api/notes/recent
// @access  Private
exports.getRecentNotes = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const notes = await Note.getRecentNotes(limit);

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular notes
// @route   GET /api/notes/popular
// @access  Private
exports.getPopularNotes = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const notes = await Note.getPopularNotes(limit);

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};
