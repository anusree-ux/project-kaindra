const Manufacturer = require("../../models/modasphere/Manufacturer");
const ProductionRequest = require("../../models/modasphere/ProductionRequest");
const AppError = require("../../utils/AppError");

/**
 * Helper to normalize capabilities array to lowercase trimmed strings
 */
const parseCapabilities = (capabilitiesInput) => {
  if (!capabilitiesInput) return [];
  if (Array.isArray(capabilitiesInput)) {
    return capabilitiesInput
      .map((c) => String(c).trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof capabilitiesInput === "string") {
    return capabilitiesInput
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

/**
 * @desc    Create or update logged-in user's manufacturer profile
 * @route   PUT /api/modasphere/manufacturers/me
 * @access  Private
 */
const putManufacturerProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      companyName,
      description,
      location,
      capabilities,
      minOrderQuantity,
      leadTimeDays,
      certifications,
      images,
      contactEmail,
      contactPhone,
    } = req.body;

    if (!companyName || !companyName.trim()) {
      return next(new AppError("Company name is required.", 400));
    }

    let existing = await Manufacturer.findOne({ userId });

    const newCapabilities = parseCapabilities(capabilities);
    const newCompanyName = companyName.trim();

    let newStatus = existing ? existing.verificationStatus : "pending";
    let newNote = existing ? existing.verificationNote : "";

    // Reset verification status if already verified and companyName or capabilities change
    if (existing && existing.verificationStatus === "verified") {
      const companyChanged = existing.companyName !== newCompanyName;
      const existingCaps = (existing.capabilities || []).slice().sort().join(",");
      const incomingCaps = newCapabilities.slice().sort().join(",");
      const capsChanged = existingCaps !== incomingCaps;

      if (companyChanged || capsChanged) {
        newStatus = "pending";
        newNote =
          "Verification reset to pending due to update in company name or capabilities.";
      }
    }

    const profileData = {
      userId,
      companyName: newCompanyName,
      description: description ? description.trim() : "",
      location: {
        city: location && location.city ? location.city.trim() : "",
        state: location && location.state ? location.state.trim() : "",
      },
      capabilities: newCapabilities,
      minOrderQuantity:
        minOrderQuantity !== undefined && !isNaN(Number(minOrderQuantity))
          ? Math.max(1, parseInt(minOrderQuantity, 10))
          : 1,
      leadTimeDays:
        leadTimeDays !== undefined && !isNaN(Number(leadTimeDays))
          ? Math.max(1, parseInt(leadTimeDays, 10))
          : 7,
      certifications: Array.isArray(certifications)
        ? certifications.map((c) => String(c).trim()).filter(Boolean)
        : [],
      images: Array.isArray(images) ? images : [],
      contactEmail: contactEmail ? contactEmail.trim().toLowerCase() : "",
      contactPhone: contactPhone ? contactPhone.trim() : "",
      verificationStatus: newStatus,
      verificationNote: newNote,
    };

    const manufacturer = await Manufacturer.findOneAndUpdate(
      { userId },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: { manufacturer },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in user's manufacturer profile
 * @route   GET /api/modasphere/manufacturers/me
 * @access  Private
 */
const getMyManufacturerProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const manufacturer = await Manufacturer.findOne({ userId });

    res.status(200).json({
      status: "success",
      data: { manufacturer: manufacturer || null },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Browse verified manufacturers directory (filtered, paginated, no contact details)
 * @route   GET /api/modasphere/manufacturers
 * @access  Private
 */
const getVerifiedManufacturers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      capability,
      state,
      maxMOQ,
      maxLeadTime,
    } = req.query;

    const query = { verificationStatus: "verified" };

    if (capability && capability.trim()) {
      query.capabilities = capability.trim().toLowerCase();
    }

    if (state && state.trim()) {
      query["location.state"] = new RegExp(`^${state.trim()}$`, "i");
    }

    if (maxMOQ && !isNaN(Number(maxMOQ))) {
      query.minOrderQuantity = { $lte: Number(maxMOQ) };
    }

    if (maxLeadTime && !isNaN(Number(maxLeadTime))) {
      query.leadTimeDays = { $lte: Number(maxLeadTime) };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [manufacturers, total] = await Promise.all([
      Manufacturer.find(query)
        .select("-contactEmail -contactPhone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Manufacturer.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        manufacturers,
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
 * @desc    Get single manufacturer by ID (contact details restricted to owner, admin, or active requester)
 * @route   GET /api/modasphere/manufacturers/:id
 * @access  Private
 */
const getManufacturerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const manufacturer = await Manufacturer.findById(id).populate(
      "userId",
      "name email"
    );

    if (!manufacturer) {
      return next(new AppError("Manufacturer not found.", 404));
    }

    const isOwner =
      manufacturer.userId &&
      (manufacturer.userId._id || manufacturer.userId).toString() ===
        req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    // Non-owners/non-admins see verified only
    if (manufacturer.verificationStatus !== "verified" && !isOwner && !isAdmin) {
      return next(new AppError("Manufacturer not found.", 404));
    }

    // Check if user has an accepted, in_production, or completed request with this manufacturer
    let hasContactAccess = isOwner || isAdmin;

    if (!hasContactAccess) {
      const activeRFQ = await ProductionRequest.findOne({
        manufacturerId: manufacturer._id,
        requesterId: req.user._id,
        status: { $in: ["accepted", "in_production", "completed"] },
      });
      if (activeRFQ) {
        hasContactAccess = true;
      }
    }

    const manufacturerObj = manufacturer.toObject();

    if (!hasContactAccess) {
      delete manufacturerObj.contactEmail;
      delete manufacturerObj.contactPhone;
    }

    res.status(200).json({
      status: "success",
      data: { manufacturer: manufacturerObj },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin verification of a manufacturer profile
 * @route   PATCH /api/modasphere/manufacturers/:id/verify
 * @access  Private (Admin Only)
 */
const verifyManufacturer = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next(
        new AppError("Not authorized to verify manufacturers.", 403)
      );
    }

    const { id } = req.params;
    const { verificationStatus, note } = req.body;

    if (!["verified", "rejected"].includes(verificationStatus)) {
      return next(
        new AppError("verificationStatus must be 'verified' or 'rejected'.", 400)
      );
    }

    const manufacturer = await Manufacturer.findById(id);
    if (!manufacturer) {
      return next(new AppError("Manufacturer not found.", 404));
    }

    manufacturer.verificationStatus = verificationStatus;
    if (note !== undefined) {
      manufacturer.verificationNote = note.trim();
    }
    await manufacturer.save();

    res.status(200).json({
      status: "success",
      message: `Manufacturer status updated to ${verificationStatus}.`,
      data: { manufacturer },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  putManufacturerProfile,
  getMyManufacturerProfile,
  getVerifiedManufacturers,
  getManufacturerById,
  verifyManufacturer,
};
