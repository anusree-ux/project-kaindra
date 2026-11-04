const mongoose = require("mongoose");
const Drop = require("../../models/modasphere/Drop");
const DropWaitlist = require("../../models/modasphere/DropWaitlist");
const ProductDropWaitlist = require("../../models/modasphere/ProductDropWaitlist");
const Product = require("../../models/modasphere/Product");
const Order = require("../../models/modasphere/Order");
const {
  getDropStatusAt,
  getUserPurchaseCountInDrop,
  updateDropStatuses,
} = require("../../services/modasphere/dropService");
const AppError = require("../../utils/AppError");
const {
  toCustomerDrop,
  toCustomerProduct,
} = require("../../services/modasphere/productInventory");

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

    if (!productIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return next(new AppError("Every productId must be a valid product ID.", 400));
    }

    const normalizedProductIds = productIds.map((id) => id.toString());
    if (new Set(normalizedProductIds).size !== normalizedProductIds.length) {
      return next(new AppError("A product can only be included once in a drop.", 400));
    }

    let parsedEndTime = null;
    if (endTime) {
      parsedEndTime = new Date(endTime);
      if (isNaN(parsedEndTime.getTime()) || parsedEndTime <= parsedStartTime) {
        return next(new AppError("endTime must be a valid date occurring after startTime.", 400));
      }
    }

    const parsedMaxPerUser = maxPerUser === undefined ? 2 : Number(maxPerUser);
    if (!Number.isInteger(parsedMaxPerUser) || parsedMaxPerUser < 1) {
      return next(new AppError("maxPerUser must be a positive integer.", 400));
    }

    const products = await Product.find({ _id: { $in: normalizedProductIds } });
    if (products.length !== productIds.length) {
      return next(new AppError("One or more specified products do not exist.", 404));
    }

    const notOwned = products.some(
      (p) => p.sellerId.toString() !== req.user._id.toString() && req.user.role !== "admin"
    );
    if (notOwned) {
      return next(new AppError("You can only include products that you own in a drop.", 403));
    }

    const ineligibleProduct = products.some(
      (product) =>
        product.status !== "active" ||
        !product.isDrop ||
        !Number.isFinite(product.dropStock) ||
        product.dropStock < 0
    );
    if (ineligibleProduct) {
      return next(
        new AppError(
          "Every product in a drop must be an active ModaDrop product with valid drop inventory.",
          400
        )
      );
    }

    const eventEndForOverlap = parsedEndTime || new Date(8640000000000000);
    const overlappingDrop = await Drop.findOne({
      productIds: { $in: normalizedProductIds },
      startTime: { $lt: eventEndForOverlap },
      $or: [{ endTime: null }, { endTime: { $gt: parsedStartTime } }],
    });
    if (overlappingDrop) {
      return next(
        new AppError(
          "A product cannot be assigned to overlapping ModaDrop events.",
          400
        )
      );
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
      productIds: normalizedProductIds,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      maxPerUser: parsedMaxPerUser,
      status: initialStatus,
    });

    // Ensure all products in the drop are active and marked as drops so they appear in ModaMart
    await Product.updateMany(
      { _id: { $in: normalizedProductIds } },
      { $set: { isDrop: true, status: "active" } }
    );

    res.status(201).json({
      status: "success",
      message: "ModaDrop created successfully.",
      data: { drop },
    });
  } catch (error) {
    next(error);
  }
};

const getSellerManagedDrop = async (dropId, userId, next) => {
  if (!mongoose.isValidObjectId(dropId)) {
    next(new AppError("Invalid ModaDrop ID.", 400));
    return null;
  }

  await updateDropStatuses();
  const drop = await Drop.findById(dropId);
  if (!drop) {
    next(new AppError("ModaDrop not found.", 404));
    return null;
  }
  if (drop.createdBy.toString() !== userId.toString()) {
    next(new AppError("You can only manage drops that you created.", 403));
    return null;
  }
  if (getDropStatusAt(drop) !== "upcoming") {
    next(new AppError("Only scheduled drops can be edited or deleted.", 400));
    return null;
  }

  const [hasOrders, hasWaitlistEntries] = await Promise.all([
    Order.exists({ "items.dropId": drop._id }),
    DropWaitlist.exists({ dropId: drop._id }),
  ]);
  if (hasOrders || hasWaitlistEntries) {
    next(
      new AppError(
        "This drop cannot be changed after orders or waitlist activity has started.",
        409,
      ),
    );
    return null;
  }

  return drop;
};

const updateDrop = async (req, res, next) => {
  try {
    const drop = await getSellerManagedDrop(
      req.params.id,
      req.user._id,
      next,
    );
    if (!drop) return;

    const {
      title,
      description,
      coverImage,
      productIds,
      startTime,
      endTime,
      maxPerUser,
      dropStock,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !Array.isArray(productIds) ||
      productIds.length === 0 ||
      !productIds.every((id) => mongoose.isValidObjectId(id))
    ) {
      return next(
        new AppError(
          "Title, startTime, and at least one valid productId are required.",
          400,
        ),
      );
    }

    const normalizedProductIds = productIds.map((id) => id.toString());
    if (new Set(normalizedProductIds).size !== normalizedProductIds.length) {
      return next(new AppError("A product can only be included once in a drop.", 400));
    }

    const parsedStartTime = new Date(startTime);
    if (!startTime || Number.isNaN(parsedStartTime.getTime())) {
      return next(new AppError("Invalid startTime date format.", 400));
    }
    if (parsedStartTime <= new Date()) {
      return next(new AppError("A scheduled drop must start in the future.", 400));
    }

    let parsedEndTime = null;
    if (endTime) {
      parsedEndTime = new Date(endTime);
      if (
        Number.isNaN(parsedEndTime.getTime()) ||
        parsedEndTime <= parsedStartTime
      ) {
        return next(
          new AppError(
            "endTime must be a valid date occurring after startTime.",
            400,
          ),
        );
      }
    }

    const parsedMaxPerUser =
      maxPerUser === undefined ? drop.maxPerUser : Number(maxPerUser);
    if (!Number.isInteger(parsedMaxPerUser) || parsedMaxPerUser < 1) {
      return next(new AppError("maxPerUser must be a positive integer.", 400));
    }

    const products = await Product.find({ _id: { $in: normalizedProductIds } });
    if (products.length !== normalizedProductIds.length) {
      return next(new AppError("One or more specified products do not exist.", 404));
    }

    const invalidProduct = products.some(
      (product) =>
        product.sellerId.toString() !== req.user._id.toString() ||
        product.status !== "active" ||
        !product.isDrop ||
        !Number.isFinite(product.dropStock) ||
        product.dropStock < 0,
    );
    if (invalidProduct) {
      return next(
        new AppError(
          "Every product must be an active ModaDrop product owned by you with valid drop inventory.",
          400,
        ),
      );
    }

    const eventEndForOverlap =
      parsedEndTime || new Date(8640000000000000);
    const overlappingDrop = await Drop.findOne({
      _id: { $ne: drop._id },
      productIds: { $in: normalizedProductIds },
      startTime: { $lt: eventEndForOverlap },
      $or: [{ endTime: null }, { endTime: { $gt: parsedStartTime } }],
    });
    if (overlappingDrop) {
      return next(
        new AppError(
          "A product cannot be assigned to overlapping ModaDrop events.",
          400,
        ),
      );
    }

    let parsedDropStock;
    if (dropStock !== undefined) {
      parsedDropStock = Number(dropStock);
      if (
        normalizedProductIds.length !== 1 ||
        !Number.isInteger(parsedDropStock) ||
        parsedDropStock < 0
      ) {
        return next(
          new AppError(
            "Drop stock must be a non-negative integer for a single-product drop.",
            400,
          ),
        );
      }
    }

    const now = new Date();
    drop.title = title.trim();
    drop.description =
      typeof description === "string" ? description.trim() : drop.description;
    if (coverImage !== undefined) drop.coverImage = coverImage;
    drop.productIds = normalizedProductIds;
    drop.startTime = parsedStartTime;
    drop.endTime = parsedEndTime;
    drop.maxPerUser = parsedMaxPerUser;
    drop.status =
      parsedEndTime && parsedEndTime <= now
        ? "ended"
        : parsedStartTime <= now
          ? "live"
          : "upcoming";

    await drop.save();
    if (parsedDropStock !== undefined) {
      await Product.updateOne(
        { _id: normalizedProductIds[0], sellerId: req.user._id },
        { $set: { dropStock: parsedDropStock } },
      );
    }

    const updatedDrop = await Drop.findById(drop._id)
      .populate("productIds")
      .populate("createdBy", "name");
    return res.status(200).json({
      status: "success",
      message: "ModaDrop updated successfully.",
      data: { drop: updatedDrop },
    });
  } catch (error) {
    next(error);
  }
};

const deleteDrop = async (req, res, next) => {
  try {
    const drop = await getSellerManagedDrop(
      req.params.id,
      req.user._id,
      next,
    );
    if (!drop) return;

    await drop.deleteOne();
    return res.status(200).json({
      status: "success",
      message: "ModaDrop deleted successfully.",
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

    if (status && !["upcoming", "live", "ended"].includes(status)) {
      return next(new AppError("Invalid ModaDrop status filter.", 400));
    }
    if (status) {
      filter.status = status;
    }

    await updateDropStatuses();
    const drops = await Drop.find(filter)
      .populate("productIds")
      .populate("createdBy", "name")
      .sort({ startTime: 1 });

    res.status(200).json({
      status: "success",
      data: { drops: drops.map(toCustomerDrop) },
    });
  } catch (error) {
    next(error);
  }
};

const getSellerDrops = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { createdBy: req.user._id };

    if (status && !["upcoming", "live", "ended"].includes(status)) {
      return next(new AppError("Invalid ModaDrop status filter.", 400));
    }
    if (status) {
      filter.status = status;
    }

    await updateDropStatuses();
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
    await updateDropStatuses();
    const drop = await Drop.findById(id)
      .populate("productIds")
      .populate("createdBy", "name");

    if (!drop) {
      return next(new AppError("ModaDrop not found.", 404));
    }

    res.status(200).json({
      status: "success",
      data: { drop: toCustomerDrop(drop) },
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

    const currentStatus = getDropStatusAt(drop);
    if (currentStatus !== "upcoming") {
      return next(
        new AppError(
          `Waitlist is only available for upcoming drops. This drop is currently "${currentStatus}".`,
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

/**
 * @desc    Get upcoming product drops
 * @route   GET /api/modasphere/drops/products/upcoming
 * @access  Public
 */
const getUpcomingProductDrops = async (req, res, next) => {
  try {
    const now = new Date();

    const drops = await Drop.find({ startTime: { $gt: now } })
      .populate("productIds")
      .sort({ startTime: 1 });
    const products = [
      ...new Map(
        drops
          .flatMap((drop) => drop.productIds)
          .filter((product) => product && product.isDrop && product.status === "active")
          .map((product) => [product._id.toString(), product])
      ).values(),
    ];

    res.status(200).json({
      status: "success",
      data: { products: products.map(toCustomerProduct) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get live product drops
 * @route   GET /api/modasphere/drops/products/live
 * @access  Public
 */
const getLiveProductDrops = async (req, res, next) => {
  try {
    const now = new Date();

    const drops = await Drop.find({
      startTime: { $lte: now },
      $or: [{ endTime: null }, { endTime: { $gt: now } }],
    })
      .populate("productIds")
      .sort({ startTime: 1 });
    const products = [
      ...new Map(
        drops
          .flatMap((drop) => drop.productIds)
          .filter((product) => product && product.isDrop && product.status === "active")
          .map((product) => [product._id.toString(), product])
      ).values(),
    ];

    res.status(200).json({
      status: "success",
      data: { products: products.map(toCustomerProduct) },
    });
  } catch (error) {
    next(error);
  }
};

const joinProductDropWaitlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return next(new AppError("Product not found.", 404));
    }

    if (!product.isDrop) {
      return next(
        new AppError("This product is not a ModaDrop product.", 400)
      );
    }

    if (product.status !== "active") {
      return next(
        new AppError("This drop is not currently available.", 400)
      );
    }

    // A user should join the waitlist only when the drop is sold out.
    if (product.dropStock > 0) {
      return next(
        new AppError(
          "This drop still has stock available. You can purchase it instead.",
          400
        )
      );
    }

    const existingEntry = await ProductDropWaitlist.findOne({
      productId: product._id,
      userId: req.user._id,
    });

    if (existingEntry) {
      return next(
        new AppError("You are already on the waitlist for this drop.", 400)
      );
    }

    const waitlistEntry = await ProductDropWaitlist.create({
      productId: product._id,
      userId: req.user._id,
    });

    res.status(201).json({
      status: "success",
      message: "Successfully joined the drop waitlist.",
      data: {
        waitlistEntry,
      },
    });
  } catch (error) {
    // Handle unique index race condition
    if (error.code === 11000) {
      return next(
        new AppError("You are already on the waitlist for this drop.", 400)
      );
    }

    next(error);
  }
};

const getProductDropWaitlistPosition = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return next(new AppError("Product not found.", 404));
    }

    if (!product.isDrop) {
      return next(
        new AppError("This product is not a ModaDrop product.", 400)
      );
    }

    const waitlistEntry = await ProductDropWaitlist.findOne({
      productId: product._id,
      userId: req.user._id,
    });

    if (!waitlistEntry) {
      return next(
        new AppError("You are not on the waitlist for this drop.", 404)
      );
    }

    const position = await ProductDropWaitlist.countDocuments({
      productId: product._id,
      $or: [
        { joinedAt: { $lt: waitlistEntry.joinedAt } },
        {
          joinedAt: waitlistEntry.joinedAt,
          _id: { $lte: waitlistEntry._id },
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: {
        productId: product._id,
        position,
        joinedAt: waitlistEntry.joinedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDrop,
  updateDrop,
  deleteDrop,
  getDrops,
  getSellerDrops,
  getDropById,
  joinWaitlist,
  leaveWaitlist,
  getUserPurchaseLimit,

  getUpcomingProductDrops,
  getLiveProductDrops,
  joinProductDropWaitlist,
  getProductDropWaitlistPosition,
};
