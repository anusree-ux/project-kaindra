const Career = require("../../models/core/Career");
const { seedInitialCareers } = require("../../scripts/seedCareers");

// @desc    Get all open career positions (auto-seeds default initial roles if DB empty)
// @route   GET /api/careers or /api/v1/careers
// @access  Public
exports.getCareers = async (req, res, next) => {
  try {
    let count = await Career.countDocuments();
    if (count === 0) {
      await seedInitialCareers();
    }

    const careers = await Career.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: careers.length,
      data: {
        careers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new career opening
// @route   POST /api/careers or /api/v1/careers
// @access  Admin
exports.createCareer = async (req, res, next) => {
  try {
    const { title, department, location, type, experience, description } = req.body;

    if (!title || !experience) {
      return res.status(400).json({
        status: "fail",
        message: "Job title and experience are required fields.",
      });
    }

    const career = await Career.create({
      title,
      department: department || "General",
      location: location || "India",
      type: type || "Full Time",
      experience,
      description: description || "",
    });

    res.status(201).json({
      status: "success",
      data: {
        career,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing career position
// @route   PUT /api/careers/:id or /api/v1/careers/:id
// @access  Admin
exports.updateCareer = async (req, res, next) => {
  try {
    const career = await Career.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!career) {
      return res.status(404).json({
        status: "fail",
        message: "Career position not found.",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        career,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a career position
// @route   DELETE /api/careers/:id or /api/v1/careers/:id
// @access  Admin
exports.deleteCareer = async (req, res, next) => {
  try {
    const career = await Career.findByIdAndDelete(req.params.id);

    if (!career) {
      return res.status(404).json({
        status: "fail",
        message: "Career position not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Career position deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
