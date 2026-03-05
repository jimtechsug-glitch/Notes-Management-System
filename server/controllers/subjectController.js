const Subject = require("../models/Subject");
const { ALEVEL_COMBINATIONS } = require("../config/config");
const { ErrorResponse } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

// @desc    Get all subjects (with optional filters)
// @route   GET /api/subjects
// @access  Private
exports.getAllSubjects = async (req, res, next) => {
  try {
    const { level, class: classLevel, search } = req.query;

    const where = {};
    if (level) where.level = level;
    if (classLevel) where.class = classLevel;
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const subjects = await Subject.findAll({
      where,
      order: [
        ["level", "ASC"],
        ["class", "ASC"],
        ["name", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subjects by level
// @route   GET /api/subjects/level/:level
// @access  Private
exports.getSubjectsByLevel = async (req, res, next) => {
  try {
    const { level } = req.params;

    const subjects = await Subject.findAll({
      where: { level },
      order: [
        ["class", "ASC"],
        ["name", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private (Admin only)
exports.createSubject = async (req, res, next) => {
  try {
    const {
      name,
      code,
      level,
      class: classLevel,
      isCompulsory,
      stream,
    } = req.body;

    const subject = await Subject.create({
      name,
      code,
      level,
      class: classLevel,
      isCompulsory,
      stream: stream || null,
    });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Admin only)
exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return next(new ErrorResponse("Subject not found", 404));
    }

    const {
      name,
      code,
      level,
      class: classLevel,
      isCompulsory,
      stream,
    } = req.body;

    if (name) subject.name = name;
    if (typeof code !== "undefined") subject.code = code;
    if (level) subject.level = level;
    if (classLevel) subject.class = classLevel;
    if (typeof isCompulsory !== "undefined")
      subject.isCompulsory = isCompulsory;
    subject.stream = stream || null;

    await subject.save();

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin only)
exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return next(new ErrorResponse("Subject not found", 404));
    }

    await subject.destroy();

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get A-Level combinations (static config)
// @route   GET /api/subjects/combinations
// @access  Private
exports.getCombinations = async (req, res, next) => {
  try {
    const combinations = Object.entries(ALEVEL_COMBINATIONS).map(
      ([code, data]) => ({
        code,
        name: data.name,
        subjects: data.subjects,
      }),
    );

    res.status(200).json({
      success: true,
      count: combinations.length,
      data: combinations,
    });
  } catch (error) {
    next(error);
  }
};
