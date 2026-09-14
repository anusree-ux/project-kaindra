const ModaProfile = require("../../models/modasphere/ModaProfile");
const AppError = require("../../utils/AppError");

/**
 * @desc    Create ModaSphere profile
 * @route   POST /api/v1/modasphere/profile
 * @access  Private
 */
const createProfile = async (req, res, next) => {
  try {
    // Check if user already has a ModaSphere profile
    const existingProfile = await ModaProfile.findOne({
      userId: req.user._id,
    });

    if (existingProfile) {
      return next(
        new AppError("You already have a ModaSphere profile.", 400)
      );
    }

    const {
      displayName,
      handle,
      bio,
      location,
      participantTypes,
      skills,
      socialLinks,
      visibility,
    } = req.body;

    const profile = await ModaProfile.create({
      userId: req.user._id,
      displayName,
      handle,
      bio,
      location,
      participantTypes,
      skills,
      socialLinks,
      visibility,
    });

    res.status(201).json({
      status: "success",
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in user's ModaSphere profile
 * @route   GET /api/v1/modasphere/profile/me
 * @access  Private
 */
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await ModaProfile.findOne({
      userId: req.user._id,
    });

    if (!profile) {
      return next(
        new AppError("ModaSphere profile not found.", 404)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update logged-in user's ModaSphere profile
 * @route   PATCH /api/v1/modasphere/profile/me
 * @access  Private
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "displayName",
      "handle",
      "bio",
      "location",
      "participantTypes",
      "skills",
      "socialLinks",
      "visibility",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const profile = await ModaProfile.findOneAndUpdate(
      { userId: req.user._id },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!profile) {
      return next(
        new AppError("ModaSphere profile not found.", 404)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public ModaSphere profile by handle
 * @route   GET /api/v1/modasphere/profile/:handle
 * @access  Public
 */
const getProfileByHandle = async (req, res, next) => {
  try {
    const profile = await ModaProfile.findOne({
      handle: req.params.handle.toLowerCase(),
      visibility: "public",
    });

    if (!profile) {
      return next(
        new AppError("ModaSphere profile not found.", 404)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProfile,
  getMyProfile,
  updateMyProfile,
  getProfileByHandle,
};