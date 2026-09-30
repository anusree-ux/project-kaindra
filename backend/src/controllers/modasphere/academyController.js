const ModaCourse = require("../../models/modasphere/ModaCourse");

// Create course
const createCourse = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      shortDescription,
      category,
      level,
      coverImage,
      tags,
      modules,
      durationMinutes,
      isFeatured,
      status,
    } = req.body;

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existingCourse = await ModaCourse.findOne({ slug });

    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: "A course with this title already exists",
      });
    }

    const course = await ModaCourse.create({
      title,
      slug,
      subtitle,
      description,
      shortDescription,
      category,
      level: level || "beginner",
      coverImage,
      tags,
      modules,
      durationMinutes: modules
        ? modules.reduce(
            (total, module) => total + (Number(module.durationMinutes) || 0),
            0
          )
        : 0,
      isFeatured: isFeatured || false,
      status: status || "draft",
      instructor: req.user._id,
      createdBy: req.user._id,
      publishedAt: status === "published" ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Create course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
};

// Get published courses for public
const getPublishedCourses = async (req, res) => {
  try {
    const courses = await ModaCourse.find({ status: "published" })
      .select("-createdBy")
      .populate("instructor", "name email")
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Get published courses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch published courses",
    });
  }
};

// Get published course by slug
const getPublishedCourseBySlug = async (req, res) => {
  try {
    const course = await ModaCourse.findOne({
      slug: req.params.slug,
      status: "published",
    })
      .select("-createdBy")
      .populate("instructor", "name email");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Get published course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch course",
    });
  }
};

// Publish course
const publishCourse = async (req, res) => {
  try {
    const course = await ModaCourse.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    course.status = "published";
    course.publishedAt = new Date();

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course published successfully",
      course,
    });
  } catch (error) {
    console.error("Publish course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to publish course",
    });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      shortDescription,
      category,
      level,
      coverImage,
      tags,
      modules,
      isFeatured,
    } = req.body;

    const course = await ModaCourse.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (title && title !== course.title) {
      const newSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const existingCourse = await ModaCourse.findOne({
        slug: newSlug,
        _id: { $ne: course._id },
      });

      if (existingCourse) {
        return res.status(409).json({
          success: false,
          message: "A course with this title already exists",
        });
      }

      course.title = title;
      course.slug = newSlug;
    }

    if (subtitle !== undefined) course.subtitle = subtitle;
    if (description !== undefined) course.description = description;
    if (shortDescription !== undefined)
      course.shortDescription = shortDescription;
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;
    if (coverImage !== undefined) course.coverImage = coverImage;
    if (tags !== undefined) course.tags = tags;
    if (modules !== undefined) {
      course.modules = modules;

      course.durationMinutes = modules.reduce(
        (total, module) => total + (Number(module.durationMinutes) || 0),
        0
      );
    }
    if (isFeatured !== undefined) course.isFeatured = isFeatured;

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("Update course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update course",
    });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const course = await ModaCourse.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete course",
    });
  }
};

module.exports = {
  createCourse,
  getPublishedCourses,
  getPublishedCourseBySlug,
  publishCourse,
  updateCourse,
  deleteCourse
};