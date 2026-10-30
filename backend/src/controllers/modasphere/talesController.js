const ModaTales = require("../../models/modasphere/ModaTales");

// Create a new tale submission
const createTale = async (req, res) => {
  try {
    const { title, storyType, message } = req.body;

    const tale = await ModaTales.create({
      user: req.user._id,
      title,
      name: req.user.name,
      email: req.user.email,
      storyType,
      message,
      status: "Approved",
      publicationStatus: "Published",
    });

    res.status(201).json({
      success: true,
      message: "Story submitted successfully",
      tale,
    });
  } catch (error) {
    console.error("Create tale error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit story",
    });
  }
};

// Get approved tales for public display
const getApprovedTales = async (req, res) => {
  try {
    const tales = await ModaTales.find({
      status: "Approved",
      removedAt: null,
      $or: [
        { publicationStatus: "Published" },
        { publicationStatus: { $exists: false } },
      ],
    })
      .sort({ submittedAt: -1 })
      .select("title name storyType message submittedAt");

    return res.status(200).json({
      success: true,
      count: tales.length,
      tales,
    });
  } catch (error) {
    console.error("Get approved tales error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved tales",
    });
  }
};

// Get stories submitted by the logged-in user
const getMyTales = async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const tales = await ModaTales.find({
      user: req.user._id,
      $or: [
        {
          status: { $ne: "Removed" },
          removedAt: null,
        },
        {
          removedAt: { $gte: cutoff },
        },
      ],
    }).sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      count: tales.length,
      tales,
    });
  } catch (error) {
    console.error("Get my tales error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your stories",
    });
  }
};

// Get all tale submissions for admin
const getAdminTales = async (req, res) => {
  try {
    const tales = await ModaTales.find().sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: tales.length,
      tales,
    });
  } catch (error) {
    console.error("Get admin tales error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tale submissions",
    });
  }
};

// Get a single tale submission for admin
const getAdminTaleById = async (req, res) => {
  try {
    const tale = await ModaTales.findById(req.params.id);

    if (!tale) {
      return res.status(404).json({
        success: false,
        message: "Tale submission not found",
      });
    }

    res.status(200).json({
      success: true,
      tale,
    });
  } catch (error) {
    console.error("Get admin tale error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tale submission",
    });
  }
};

// Update tale status
const updateTaleStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "New",
      "Reviewed",
      "Approved",
      "Rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tale status",
      });
    }

    const tale = await ModaTales.findById(req.params.id);

    if (!tale) {
      return res.status(404).json({
        success: false,
        message: "Tale submission not found",
      });
    }

    if (tale.status === "Removed" || tale.removedAt) {
      return res.status(409).json({
        success: false,
        message: "Removed stories cannot be updated",
      });
    }

    tale.status = status;
    await tale.save();

    return res.status(200).json({
      success: true,
      message: "Tale status updated successfully",
      tale,
    });
  } catch (error) {
    console.error("Update tale status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update tale status",
    });
  }
};


const removeTaleByAdmin = async (req, res) => {
  try {
    const { removalReason } = req.body;

    if (
      typeof removalReason !== "string" ||
      !removalReason.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A removal reason is required",
      });
    }

    if (removalReason.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Removal reason cannot exceed 500 characters",
      });
    }

    const existingTale = await ModaTales.findById(req.params.id);

    if (!existingTale) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    if (existingTale.status === "Removed" || existingTale.removedAt) {
      return res.status(409).json({
        success: false,
        message: "This story has already been removed",
      });
    }

    const tale = await ModaTales.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "Removed",
          removedAt: new Date(),
          removedBy: req.user._id,
          removalReason: removalReason.trim(),
        },
      },
      {
        new: true,
        runValidators: false,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Story removed from public view",
      tale,
    });
  } catch (error) {
    console.error("Admin story removal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove story",
    });
  }
};

const updateMyTale = async (req, res) => {
  try {
    const { title, storyType, message } = req.body;

    const tale = await ModaTales.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!tale) {
      return res.status(404).json({
        success: false,
        message: "Story not found or you do not have permission to edit it",
      });
    }

    if (tale.status === "Removed" || tale.removedAt) {
      return res.status(409).json({
        success: false,
        message: "Admin-removed stories cannot be edited",
      });
    }

    tale.title = title;
    tale.storyType = storyType;
    tale.message = message;

    // Preserve the current moderation and publication states.
    await tale.save();

    return res.status(200).json({
      success: true,
      message: "Story updated successfully",
      tale,
    });
  } catch (error) {
    console.error("Update user story error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update story",
    });
  }
};

const updateMyTalePublication = async (req, res) => {
  try {
    const { publicationStatus } = req.body;

    if (!["Draft", "Published"].includes(publicationStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid publication status",
      });
    }

    const tale = await ModaTales.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!tale) {
      return res.status(404).json({
        success: false,
        message: "Story not found or you do not have permission to update it",
      });
    }

    if (tale.status === "Removed" || tale.removedAt) {
      return res.status(409).json({
        success: false,
        message: "Admin-removed stories cannot be published or changed",
      });
    }

    if (tale.status !== "Approved") {
      return res.status(409).json({
        success: false,
        message: "This story cannot be published in its current status",
      });
    }

    tale.publicationStatus = publicationStatus;
    await tale.save();

    return res.status(200).json({
      success: true,
      message: `Story ${publicationStatus === "Draft" ? "moved to drafts" : "published"} successfully`,
      tale,
    });
  } catch (error) {
    console.error("Update story publication error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update publication status",
    });
  }
};

const deleteMyTale = async (req, res) => {
  try {
    const tale = await ModaTales.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!tale) {
      return res.status(404).json({
        success: false,
        message: "Story not found or you do not have permission to delete it",
      });
    }

    if (tale.status === "Removed" || tale.removedAt) {
      return res.status(409).json({
        success: false,
        message: "Admin-removed stories cannot be deleted",
      });
    }

    await tale.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Your story has been permanently deleted",
    });
  } catch (error) {
    console.error("User story deletion error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete your story",
    });
  }
};

const deleteTaleByAdmin = async (req, res) => {
  try {
    const tale = await ModaTales.findByIdAndDelete(req.params.id);

    if (!tale) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Story permanently deleted",
    });
  } catch (error) {
    console.error("Admin permanent story deletion error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to permanently delete story",
    });
  }
};

module.exports = {
  createTale,
  getApprovedTales,
  getMyTales,
  updateMyTale,
  updateMyTalePublication,
  deleteMyTale,
  removeTaleByAdmin,
  getAdminTales,
  getAdminTaleById,
  updateTaleStatus,
  deleteTaleByAdmin,
};