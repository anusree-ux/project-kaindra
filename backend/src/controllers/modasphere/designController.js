const DesignerProfile = require("../../models/modasphere/DesignerProfile");
const Design = require("../../models/modasphere/Design");
const DesignComment = require("../../models/modasphere/DesignComment");
const User = require("../../models/core/User");
const {
  uploadDesignAsset,
  deleteDesignAsset,
} = require("../../services/modasphere/designUploadService");
const {
  getDesignRole,
  hasActiveProductionRequest,
} = require("../../services/modasphere/designAccessService");
const AppError = require("../../utils/AppError");

/**
 * Helper to parse tags input from comma-separated string or array
 */
const parseTags = (tagsInput) => {
  if (!tagsInput) return [];
  if (Array.isArray(tagsInput)) {
    return tagsInput.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof tagsInput === "string") {
    return tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

// ==========================================
// DESIGNER PROFILE CONTROLLERS
// ==========================================

/**
 * @desc    Create or update logged-in user's designer profile
 * @route   PUT /api/modasphere/designer-profile
 * @access  Private
 */
const putDesignerProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { displayName, bio, specialties, portfolioUrl } = req.body;

    if (!displayName || !displayName.trim()) {
      return next(new AppError("Display name is required.", 400));
    }

    if (bio && bio.length > 500) {
      return next(new AppError("Bio cannot exceed 500 characters.", 400));
    }

    const parsedSpecialties = Array.isArray(specialties)
      ? specialties.map((s) => String(s).trim()).filter(Boolean)
      : typeof specialties === "string"
      ? specialties.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const profile = await DesignerProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          displayName: displayName.trim(),
          bio: bio ? bio.trim() : "",
          specialties: parsedSpecialties,
          portfolioUrl: portfolioUrl ? portfolioUrl.trim() : "",
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in user's designer profile
 * @route   GET /api/modasphere/designer-profile/me
 * @access  Private
 */
const getMyDesignerProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let profile = await DesignerProfile.findOne({ userId });

    if (!profile) {
      profile = null;
    }

    res.status(200).json({
      status: "success",
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get designer profile by user ID
 * @route   GET /api/modasphere/designer-profile/:userId
 * @access  Private
 */
const getDesignerProfileByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const profile = await DesignerProfile.findOne({ userId }).populate(
      "userId",
      "name email"
    );

    if (!profile) {
      return next(new AppError("Designer profile not found.", 404));
    }

    res.status(200).json({
      status: "success",
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DESIGN WORKSPACE CONTROLLERS
// ==========================================

/**
 * @desc    Create a new design (starts as draft)
 * @route   POST /api/modasphere/designs
 * @access  Private
 */
const createDesign = async (req, res, next) => {
  try {
    const { title, description, category, tags } = req.body;

    if (!title || !title.trim()) {
      return next(new AppError("Design title is required.", 400));
    }

    if (description && description.length > 2000) {
      return next(new AppError("Description cannot exceed 2000 characters.", 400));
    }

    const design = await Design.create({
      ownerId: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : "",
      category: category ? category.trim().toLowerCase() : "general",
      tags: parseTags(tags),
      status: "draft",
      visibility: "private",
    });

    const populatedDesign = await Design.findById(design._id).populate(
      "ownerId",
      "name email"
    );

    res.status(201).json({
      status: "success",
      data: {
        design: {
          ...populatedDesign.toObject(),
          myRole: "owner",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get designs owned by or collaborated on by the logged-in user
 * @route   GET /api/modasphere/designs/me
 * @access  Private
 */
const getMyDesigns = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const designs = await Design.find({
      $or: [{ ownerId: userId }, { "collaborators.userId": userId }],
    })
      .populate("ownerId", "name email")
      .populate("collaborators.userId", "name email")
      .sort({ updatedAt: -1 });

    const result = await Promise.all(
      designs.map(async (design) => {
        const designObj = design.toObject();
        const myRole = await getDesignRole(userId, design);
        return {
          ...designObj,
          myRole,
        };
      })
    );

    res.status(200).json({
      status: "success",
      results: result.length,
      data: { designs: result },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public designs (visibility = 'public'), paginated, newest first
 * @route   GET /api/modasphere/designs/public
 * @access  Private
 */
const getPublicDesigns = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, tag, tags } = req.query;

    const query = { visibility: "public" };

    if (category && category.trim()) {
      query.category = new RegExp(`^${category.trim()}$`, "i");
    }

    const tagFilter = tag || tags;
    if (tagFilter) {
      const parsed = parseTags(tagFilter);
      if (parsed.length > 0) {
        query.tags = { $in: parsed };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [designs, total] = await Promise.all([
      Design.find(query)
        .populate("ownerId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Design.countDocuments(query),
    ]);

    const result = await Promise.all(
      designs.map(async (design) => {
        const designObj = design.toObject();
        const myRole = await getDesignRole(req.user._id, design);
        return {
          ...designObj,
          myRole,
        };
      })
    );

    res.status(200).json({
      status: "success",
      data: {
        designs: result,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single design by ID (viewer or above required)
 * @route   GET /api/modasphere/designs/:id
 * @access  Private
 */
const getDesignById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const design = await Design.findById(id)
      .populate("ownerId", "name email")
      .populate("collaborators.userId", "name email")
      .populate("assets.uploadedBy", "name email");

    if (!design) {
      return next(new AppError("Design not found.", 404));
    }

    const role = await getDesignRole(req.user._id, design);
    if (!role) {
      return next(new AppError("Not authorized to view this design.", 403));
    }

    const designObj = design.toObject();

    res.status(200).json({
      status: "success",
      data: {
        design: {
          ...designObj,
          myRole: role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update design details, status, or visibility
 * @route   PATCH /api/modasphere/designs/:id
 * @access  Private
 */
const updateDesign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const design = await Design.findById(id);

    if (!design) {
      return next(new AppError("Design not found.", 404));
    }

    const role = await getDesignRole(req.user._id, design);
    if (!role) {
      return next(new AppError("Not authorized to edit this design.", 403));
    }

    const { title, description, category, tags, status, visibility } = req.body;

    // Active production request check for status changes away from ready_for_production
    if (status !== undefined && status !== "ready_for_production" && design.status === "ready_for_production") {
      const hasActivePR = await hasActiveProductionRequest(id);
      if (hasActivePR) {
        return next(
          new AppError(
            "Cannot change design status away from ready_for_production while an active production request exists.",
            400
          )
        );
      }
    }

    // Check archived rules
    if (design.status === "archived") {
      if (role !== "owner") {
        return next(new AppError("Archived designs are read-only.", 400));
      }
      if (title !== undefined || description !== undefined || category !== undefined || tags !== undefined) {
        if (status === undefined && visibility === undefined) {
          return next(new AppError("Archived designs are read-only except changing status or visibility.", 400));
        }
      }
    } else {
      if (role !== "owner" && role !== "editor") {
        return next(new AppError("Not authorized to edit this design.", 403));
      }
    }

    // Status or visibility change attempt check (owner only)
    if (status !== undefined || visibility !== undefined) {
      if (role !== "owner") {
        return next(
          new AppError("Only the design owner can change status or visibility.", 403)
        );
      }
    }

    // Status rule: moving to ready_for_production requires >= 1 asset
    if (status === "ready_for_production") {
      if (!design.assets || design.assets.length === 0) {
        return next(
          new AppError(
            "At least 1 asset is required to set status to ready_for_production.",
            400
          )
        );
      }
    }

    // Apply metadata changes if not archived
    if (design.status !== "archived") {
      if (title !== undefined) design.title = title.trim();
      if (description !== undefined) design.description = description.trim();
      if (category !== undefined) design.category = category.trim().toLowerCase();
      if (tags !== undefined) design.tags = parseTags(tags);
    }

    // Apply status/visibility if owner
    if (role === "owner") {
      if (status !== undefined) {
        const validStatuses = ["draft", "in_progress", "ready_for_production", "archived"];
        if (!validStatuses.includes(status)) {
          return next(new AppError("Invalid design status.", 400));
        }
        design.status = status;
      }
      if (visibility !== undefined) {
        const validVisibilities = ["private", "collaborators", "public"];
        if (!validVisibilities.includes(visibility)) {
          return next(new AppError("Invalid design visibility.", 400));
        }
        design.visibility = visibility;
      }
    }

    await design.save();

    const updatedDesign = await Design.findById(id)
      .populate("ownerId", "name email")
      .populate("collaborators.userId", "name email");

    res.status(200).json({
      status: "success",
      data: {
        design: {
          ...updatedDesign.toObject(),
          myRole: role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete design and all Cloudinary assets (owner only)
 * @route   DELETE /api/modasphere/designs/:id
 * @access  Private (Owner Only)
 */
const deleteDesign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const design = await Design.findById(id);

    if (!design) {
      return next(new AppError("Design not found.", 404));
    }

    const role = await getDesignRole(req.user._id, design);
    if (role !== "owner") {
      return next(new AppError("Only the design owner can delete this design.", 403));
    }

    const hasActivePR = await hasActiveProductionRequest(id);
    if (hasActivePR) {
      return next(
        new AppError(
          "Cannot delete design while an active production request exists.",
          400
        )
      );
    }

    // Clean up Cloudinary assets
    if (design.assets && design.assets.length > 0) {
      for (const asset of design.assets) {
        if (asset.publicId) {
          await deleteDesignAsset(asset.publicId, asset.resourceType).catch((err) => {
            console.error(`Error deleting design asset ${asset.publicId}:`, err);
          });
        }
      }
    }

    await DesignComment.deleteMany({ designId: id });
    await Design.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Design deleted successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ASSET MANAGEMENT CONTROLLERS
// ==========================================

/**
 * @desc    Upload assets (images/PDFs) to design (owner or editor)
 * @route   POST /api/modasphere/designs/:id/assets
 * @access  Private
 */
const uploadDesignAssets = async (req, res, next) => {
  const uploadedCloudinaryAssets = [];
  try {
    const { id } = req.params;
    const design = await Design.findById(id);

    if (!design) {
      return next(new AppError("Design not found.", 404));
    }

    const role = await getDesignRole(req.user._id, design);
    if (role !== "owner" && role !== "editor") {
      return next(new AppError("Not authorized to upload assets to this design.", 403));
    }

    if (design.status === "archived") {
      return next(new AppError("Archived designs are read-only.", 400));
    }

    if (!req.files || req.files.length === 0) {
      return next(new AppError("No files uploaded.", 400));
    }

    const note = req.body.note || "";

    for (const file of req.files) {
      const uploaded = await uploadDesignAsset(
        file.buffer,
        file.mimetype,
        file.originalname
      );
      uploadedCloudinaryAssets.push(uploaded);

      design.assets.push({
        url: uploaded.url,
        publicId: uploaded.publicId,
        resourceType: uploaded.resourceType,
        fileName: uploaded.fileName,
        note: note ? note.trim() : "",
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
      });
    }

    await design.save();

    const updatedDesign = await Design.findById(id)
      .populate("ownerId", "name email")
      .populate("assets.uploadedBy", "name email");

    res.status(201).json({
      status: "success",
      message: "Assets uploaded successfully.",
      data: {
        design: {
          ...updatedDesign.toObject(),
          myRole: role,
        },
      },
    });
  } catch (error) {
    for (const asset of uploadedCloudinaryAssets) {
      await deleteDesignAsset(asset.publicId, asset.resourceType).catch(() => {});
    }
    next(error);
  }
};

/**
 * @desc    Delete a specific asset from design (owner or uploader)
 * @route   DELETE /api/modasphere/designs/:id/assets/:publicId(*)
 * @access  Private
 */
const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const publicId = req.params[0] || req.params.publicId;

    if (!publicId) {
      return next(new AppError("Asset publicId is required.", 400));
    }

    const design = await Design.findById(id);
    if (!design) {
      return next(new AppError("Design not found.", 404));
    }

    const role = await getDesignRole(req.user._id, design);
    if (!role) {
      return next(new AppError("Not authorized.", 403));
    }

    const hasActivePR = await hasActiveProductionRequest(id);
    if (hasActivePR) {
      return next(
        new AppError(
          "Cannot delete assets while an active production request exists for this design.",
          400
        )
      );
    }

    const assetIndex = design.assets.findIndex(
      (a) => a.publicId === publicId
    );

    if (assetIndex === -1) {
      return next(new AppError("Asset not found in design.", 404));
    }

    const asset = design.assets[assetIndex];

    const isOwner = role === "owner";
    const isUploader =
      asset.uploadedBy &&
      asset.uploadedBy.toString() === req.user._id.toString();

    if (!isOwner && !isUploader) {
      return next(new AppError("Not authorized to delete this asset.", 403));
    }

    if (design.status === "archived" && !isOwner) {
      return next(new AppError("Archived designs are read-only.", 400));
    }

    await deleteDesignAsset(asset.publicId, asset.resourceType);

    design.assets.splice(assetIndex, 1);
    await design.save();

    res.status(200).json({
      status: "success",
      message: "Asset deleted successfully.",
      data: {
        design: {
          ...design.toObject(),
          myRole: role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// COLLABORATOR CONTROLLERS
// ==========================================

/**
 * @desc    Add or update a collaborator role on design (owner only)
 * @route   POST /api/modasphere/designs/:id/collaborators
 * @access  Private (Owner Only)
 */
const addCollaborator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    if (!userId) {
      return next(new AppError("User ID is required.", 400));
    }

    if (!role || !["viewer", "editor"].includes(role)) {
      return next(new AppError("Role must be 'viewer' or 'editor'.", 400));
    }

    const design = await Design.findById(id);
    if (!design) {
      return next(new AppError("Design not found.", 404));
    }

    const currentRole = await getDesignRole(req.user._id, design);
    if (currentRole !== "owner") {
      return next(
        new AppError("Only the design owner can add or update collaborators.", 403)
      );
    }

    if (design.ownerId.toString() === userId.toString()) {
      return next(new AppError("Cannot add owner as a collaborator.", 400));
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return next(new AppError("Collaborator user not found.", 404));
    }

    const existingIndex = design.collaborators.findIndex(
      (c) => c.userId.toString() === userId.toString()
    );

    if (existingIndex !== -1) {
      design.collaborators[existingIndex].role = role;
    } else {
      design.collaborators.push({ userId, role });
    }

    await design.save();

    const updatedDesign = await Design.findById(id)
      .populate("ownerId", "name email")
      .populate("collaborators.userId", "name email");

    res.status(200).json({
      status: "success",
      message: "Collaborator added/updated successfully.",
      data: {
        design: {
          ...updatedDesign.toObject(),
          myRole: "owner",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove collaborator from design (owner or self)
 * @route   DELETE /api/modasphere/designs/:id/collaborators/:userId
 * @access  Private
 */
const removeCollaborator = async (req, res, next) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const design = await Design.findById(id);

    if (!design) {
      return next(new AppError("Design not found.", 404));
    }

    const currentRole = await getDesignRole(req.user._id, design);
    const isOwner = currentRole === "owner";
    const isSelf = req.user._id.toString() === targetUserId.toString();

    if (!isOwner && !isSelf) {
      return next(
        new AppError("Not authorized to remove this collaborator.", 403)
      );
    }

    const existingIndex = design.collaborators.findIndex(
      (c) => c.userId.toString() === targetUserId.toString()
    );

    if (existingIndex === -1) {
      return next(new AppError("Collaborator not found on this design.", 404));
    }

    design.collaborators.splice(existingIndex, 1);
    await design.save();

    res.status(200).json({
      status: "success",
      message: "Collaborator removed successfully.",
      data: {
        design: {
          ...design.toObject(),
          myRole: await getDesignRole(req.user._id, design),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// COMMENT CONTROLLERS
// ==========================================

/**
 * @desc    Get comments for a design (viewer or above)
 * @route   GET /api/modasphere/designs/:id/comments
 * @access  Private
 */
const getDesignComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const design = await Design.findById(id);

    if (!design) {
      return next(new AppError("Design not found.", 404));
    }

    const role = await getDesignRole(req.user._id, design);
    if (!role) {
      return next(new AppError("Not authorized to view comments.", 403));
    }

    const comments = await DesignComment.find({ designId: id })
      .populate("userId", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      status: "success",
      results: comments.length,
      data: { comments },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add comment to a design (viewer or above)
 * @route   POST /api/modasphere/designs/:id/comments
 * @access  Private
 */
const createDesignComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return next(new AppError("Comment message is required.", 400));
    }

    if (message.length > 1000) {
      return next(new AppError("Comment message cannot exceed 1000 characters.", 400));
    }

    const design = await Design.findById(id);
    if (!design) {
      return next(new AppError("Design not found.", 404));
    }

    const role = await getDesignRole(req.user._id, design);
    if (!role) {
      return next(new AppError("Not authorized to comment on this design.", 403));
    }

    if (design.status === "archived") {
      return next(new AppError("Archived designs are read-only.", 400));
    }

    const comment = await DesignComment.create({
      designId: id,
      userId: req.user._id,
      message: message.trim(),
    });

    const populatedComment = await DesignComment.findById(comment._id).populate(
      "userId",
      "name email"
    );

    res.status(201).json({
      status: "success",
      data: { comment: populatedComment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete comment from design (comment author or design owner)
 * @route   DELETE /api/modasphere/designs/:id/comments/:commentId
 * @access  Private
 */
const deleteDesignComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;

    const design = await Design.findById(id);
    if (!design) {
      return next(new AppError("Design not found.", 404));
    }

    const role = await getDesignRole(req.user._id, design);

    const comment = await DesignComment.findById(commentId);
    if (!comment) {
      return next(new AppError("Comment not found.", 404));
    }

    const isAuthor = comment.userId.toString() === req.user._id.toString();
    const isDesignOwner = role === "owner";

    if (!isAuthor && !isDesignOwner) {
      return next(new AppError("Not authorized to delete this comment.", 403));
    }

    await DesignComment.findByIdAndDelete(commentId);

    res.status(200).json({
      status: "success",
      message: "Comment deleted successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  putDesignerProfile,
  getMyDesignerProfile,
  getDesignerProfileByUserId,
  createDesign,
  getMyDesigns,
  getPublicDesigns,
  getDesignById,
  updateDesign,
  deleteDesign,
  uploadDesignAssets,
  deleteAsset,
  addCollaborator,
  removeCollaborator,
  getDesignComments,
  createDesignComment,
  deleteDesignComment,
};
