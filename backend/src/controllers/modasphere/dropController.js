const Drop = require("../../models/modasphere/Drop");
const DropWaitlist = require("../../models/modasphere/DropWaitlist");
const Product = require("../../models/modasphere/Product");
const { getUserPurchaseCountInDrop } = require("../../services/modasphere/dropService");
const AppError = require("../../utils/AppError");

/**
 * @desc    Create a new ModaDrop
 * @route   POST /api/modasphere/drops
 * @access  Private (Seller/Brand/Admin)
 */
const createDrop = async (req, res, next) => {
  try {
    const { title, description, coverImage, productIds, startTime, endTime, maxPerUser } = req.body;

    if (!title || !startTime || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return next(new AppError("Title, startTime, and at least one productId are required.", 400));
    }

    const parsedStartTime = new Date(startTime);
    if (isNaN(parsedStartTime.getTime())) {
      return next(new AppError("Invalid startTime date format.", 400));
    }

    let parsedEndTime = null;
    if (endTime) {
      parsedEndTime = new Date(endTime);
      if (isNaN(parsedEndTime.getTime()) || parsedEndTime <= parsedStartTime) {
        return next(new AppError("endTime must be a valid date occurring after startTime.", 400));
      }
    }

    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      return next(new AppError("One or more specified products do not exist.", 404));
    }

    const notOwned = products.some(
      (p) => p.sellerId.toString() !== req.user._id.toString() && req.user.role !== "admin"
    );
    if (notOwned) {
      return next(new AppError("You can only include products that you own in a drop.", 403));
    }

    const now = new Date();
    let initialStatus = "upcoming";
    if (parsedStartTime <= now) {
      if (parsedEndTime && parsedEndTime <= now) {
        initialStatus = "ended";
      } else {
        initialStatus = "live";
      }
    }

    const drop = await Drop.create({
      title,
      description: description || "",
      coverImage: coverImage || { url: "", publicId: "" },
      createdBy: req.user._id,
      productIds,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      maxPerUser: maxPerUser !== undefined ? Number(maxPerUser) : 2,
      status: initialStatus,
    });

    res.status(201).json({
      status: "success",
      message: "ModaDrop created successfully.",
      data: { drop },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all ModaDrops (filterable by status)
 * @route   GET /api/modasphere/drops
 * @access  Public
 */
const getDrops = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && ["upcoming", "live", "ended"].includes(status)) {
      filter.status = status;
    }

    const drops = await Drop.find(filter)
      .populate("productIds")
      .populate("createdBy", "name")
      .sort({ startTime: 1 });

    res.status(200).json({
      status: "success",
      data: { drops },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single ModaDrop by ID
 * @route   GET /api/modasphere/drops/:id
 * @access  Public
 */
const getDropById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const drop = await Drop.findById(id)
      .populate("productIds")
      .populate("createdBy", "name");

    if (!drop) {
      return next(new AppError("ModaDrop not found.", 404));
    }

    res.status(200).json({
      status: "success",
      data: { drop },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Join waitlist for an upcoming drop
 * @route   POST /api/modasphere/drops/:id/waitlist
 * @access  Private
 */
const joinWaitlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const drop = await Drop.findById(id);

    if (!drop) {
      return next(new AppError("ModaDrop not found.", 404));
    }

    if (drop.status !== "upcoming") {
      return next(
        new AppError(
          `Waitlist is only available for upcoming drops. This drop is currently "${drop.status}".`,
          400
        )
      );
    }

    let waitlistEntry;
    try {
      waitlistEntry = await DropWaitlist.create({
        dropId: drop._id,
        userId: req.user._id,
      });
    } catch (err) {
      if (err.code === 11000) {
        return next(new AppError("You are already on the waitlist for this drop.", 400));
      }
      throw err;
    }

    res.status(201).json({
      status: "success",
      message: "Successfully joined the drop waitlist.",
      data: { waitlistEntry },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Leave waitlist for a drop
 * @route   DELETE /api/modasphere/drops/:id/waitlist
 * @access  Private
 */
const leaveWaitlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await DropWaitlist.findOneAndDelete({
      dropId: id,
      userId: req.user._id,
    });

    if (!result) {
      return next(new AppError("You are not on the waitlist for this drop.", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Successfully removed from the drop waitlist.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's purchase count and remaining quota for a drop
 * @route   GET /api/modasphere/drops/:id/purchase-limit
 * @access  Private
 */
const getUserPurchaseLimit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const drop = await Drop.findById(id);

    if (!drop) {
      return next(new AppError("ModaDrop not found.", 404));
    }

    const purchasedCount = await getUserPurchaseCountInDrop(req.user._id, drop._id);
    const maxPerUser = drop.maxPerUser || 2;
    const remainingLimit = Math.max(0, maxPerUser - purchasedCount);

    res.status(200).json({
      status: "success",
      data: {
        dropId: drop._id,
        maxPerUser,
        purchasedCount,
        remainingLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDrop,
  getDrops,
  getDropById,
  joinWaitlist,
  leaveWaitlist,
  getUserPurchaseLimit,
};
