const multer = require("multer");
const JobApplication = require("../../models/core/JobApplication");
const {
  uploadResumeToCloudinary,
  deleteResumeFromCloudinary,
} = require("../../services/core/resumeUploadService");
const AppError = require("../../utils/AppError");

// Multer memory storage config for uploaded resume files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDFs, DOCX, DOC, Images
    if (
      file.mimetype.includes("pdf") ||
      file.mimetype.includes("word") ||
      file.mimetype.includes("officedocument") ||
      file.mimetype.includes("image/") ||
      file.mimetype.includes("octet-stream")
    ) {
      cb(null, true);
    } else {
      cb(new AppError("Only document files (PDF, DOC, DOCX, PNG, JPG) are allowed!", 400), false);
    }
  },
});

exports.uploadResumeMiddleware = upload.single("resume");

// @desc    Submit candidate job application (uploads resume to Cloudinary & saves to DB)
// @route   POST /api/applications or /api/v1/applications
// @access  Public
exports.submitApplication = async (req, res, next) => {
  try {
    const {
      jobId,
      jobTitle,
      jobLocation,
      jobType,
      jobExperience,
      name,
      email,
      phone,
      location,
      qualification,
      experience,
      linkedin,
      coverLetter,
    } = req.body;

    if (!name || !email || !phone || !jobTitle) {
      return res.status(400).json({
        status: "fail",
        message: "Missing required fields: name, email, phone, and job title are required.",
      });
    }

    let resumeUrl = "";
    let resumePublicId = "";
    let resumeOriginalName = "";

    if (req.file) {
      resumeOriginalName = req.file.originalname || "resume.pdf";
      const uploadResult = await uploadResumeToCloudinary(
        req.file.buffer,
        resumeOriginalName
      );
      resumeUrl = uploadResult.url;
      resumePublicId = uploadResult.publicId;
    } else if (req.body.resumeUrl) {
      resumeUrl = req.body.resumeUrl;
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Resume file is required.",
      });
    }

    const application = await JobApplication.create({
      jobId: jobId || null,
      jobTitle,
      jobLocation: jobLocation || "India",
      jobType: jobType || "Full Time",
      jobExperience: jobExperience || "",
      name,
      email,
      phone,
      location: location || "",
      qualification: qualification || "",
      experience: experience || "",
      linkedin: linkedin || "",
      resumeUrl,
      resumePublicId,
      resumeOriginalName,
      coverLetter: coverLetter || "",
      submittedAt: new Date(),
    });

    res.status(201).json({
      status: "success",
      message: "Job application submitted successfully.",
      data: {
        application,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all candidate job applications
// @route   GET /api/applications or /api/v1/applications
// @access  Admin
exports.getApplications = async (req, res, next) => {
  try {
    const applications = await JobApplication.find().sort({ submittedAt: -1 });

    res.status(200).json({
      status: "success",
      results: applications.length,
      data: {
        applications,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a candidate job application
// @route   DELETE /api/applications/:id or /api/v1/applications/:id
// @access  Admin
exports.deleteApplication = async (req, res, next) => {
  try {
    const application = await JobApplication.findByIdAndDelete(req.params.id);

    if (!application) {
      return res.status(404).json({
        status: "fail",
        message: "Application not found.",
      });
    }

    if (application.resumePublicId) {
      await deleteResumeFromCloudinary(application.resumePublicId);
    }

    res.status(200).json({
      status: "success",
      message: "Application deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
