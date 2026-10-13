const DiscountCode = require("../../models/modasphere/DiscountCode");
const Order = require("../../models/modasphere/Order");
const AppError = require("../../utils/AppError");

/**
 * @desc    Create a discount code
 * @route   POST /api/modasphere/discount-codes
 * @access  Private (Admin)
 */
const createDiscountCode = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxUsesPerUser,
      maxTotalUses,
      expiryDate,
      minOrderAmount,
      isActive,
    } = req.body;

    if (!code || !code.trim()) {
      return next(new AppError("Discount code is required.", 400));
    }

    if (!["percentage", "flat"].includes(discountType)) {
      return next(
        new AppError("Discount type must be either percentage or flat.", 400)
      );
    }

    const value = Number(discountValue);

    if (!Number.isFinite(value) || value <= 0) {
      return next(
        new AppError("Discount value must be greater than 0.", 400)
      );
    }

    if (discountType === "percentage" && value > 100) {
      return next(
        new AppError("Percentage discount cannot exceed 100.", 400)
      );
    }

    if (
      maxUsesPerUser !== undefined &&
      maxUsesPerUser !== null &&
      (!Number.isInteger(Number(maxUsesPerUser)) || Number(maxUsesPerUser) < 1)
    ) {
      return next(
        new AppError("Max uses per user must be a positive integer.", 400)
      );
    }

    if (
      maxTotalUses !== undefined &&
      maxTotalUses !== null &&
      (!Number.isInteger(Number(maxTotalUses)) || Number(maxTotalUses) < 1)
    ) {
      return next(
        new AppError("Max total uses must be a positive integer.", 400)
      );
    }

    if (
      minOrderAmount !== undefined &&
      minOrderAmount !== null &&
      (!Number.isFinite(Number(minOrderAmount)) || Number(minOrderAmount) < 0)
    ) {
      return next(
        new AppError("Minimum order amount cannot be negative.", 400)
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    const existingCode = await DiscountCode.findOne({
      code: normalizedCode,
    });

    if (existingCode) {
      return next(
        new AppError("A discount code with this code already exists.", 409)
      );
    }

    const discountCode = await DiscountCode.create({
      code: normalizedCode,
      discountType,
      discountValue: value,
      maxUsesPerUser:
        maxUsesPerUser !== undefined && maxUsesPerUser !== null
          ? Number(maxUsesPerUser)
          : null,
      maxTotalUses:
        maxTotalUses !== undefined && maxTotalUses !== null
          ? Number(maxTotalUses)
          : null,
      expiryDate: expiryDate || null,
      minOrderAmount:
        minOrderAmount !== undefined && minOrderAmount !== null
          ? Number(minOrderAmount)
          : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      status: "success",
      message: "Discount code created successfully.",
      data: { discountCode },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all discount codes
 * @route   GET /api/modasphere/discount-codes
 * @access  Private (Admin)
 */
const getDiscountCodes = async (req, res, next) => {
  try {
    const discountCodes = await DiscountCode.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: { discountCodes },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single discount code
 * @route   GET /api/modasphere/discount-codes/:id
 * @access  Private (Admin)
 */
const getDiscountCodeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discountCode = await DiscountCode.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!discountCode) {
      return next(new AppError("Discount code not found.", 404));
    }

    res.status(200).json({
      status: "success",
      data: { discountCode },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a discount code
 * @route   PATCH /api/modasphere/discount-codes/:id
 * @access  Private (Admin)
 */
const updateDiscountCode = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discountCode = await DiscountCode.findById(id);

    if (!discountCode) {
      return next(new AppError("Discount code not found.", 404));
    }

    const {
      code,
      discountType,
      discountValue,
      maxUsesPerUser,
      maxTotalUses,
      expiryDate,
      minOrderAmount,
      isActive,
    } = req.body;

    if (code !== undefined) {
      if (!code.trim()) {
        return next(new AppError("Discount code cannot be empty.", 400));
      }

      const normalizedCode = code.trim().toUpperCase();

      const existingCode = await DiscountCode.findOne({
        code: normalizedCode,
        _id: { $ne: id },
      });

      if (existingCode) {
        return next(
          new AppError("A discount code with this code already exists.", 409)
        );
      }

      discountCode.code = normalizedCode;
    }

    if (discountType !== undefined) {
      if (!["percentage", "flat"].includes(discountType)) {
        return next(
          new AppError(
            "Discount type must be either percentage or flat.",
            400
          )
        );
      }

      discountCode.discountType = discountType;
    }

    if (discountValue !== undefined) {
      const value = Number(discountValue);

      if (!Number.isFinite(value) || value <= 0) {
        return next(
          new AppError("Discount value must be greater than 0.", 400)
        );
      }

      if (
        discountCode.discountType === "percentage" &&
        value > 100
      ) {
        return next(
          new AppError("Percentage discount cannot exceed 100.", 400)
        );
      }

      discountCode.discountValue = value;
    }

    if (maxUsesPerUser !== undefined) {
      if (
        maxUsesPerUser !== null &&
        (!Number.isInteger(Number(maxUsesPerUser)) ||
          Number(maxUsesPerUser) < 1)
      ) {
        return next(
          new AppError("Max uses per user must be a positive integer.", 400)
        );
      }

      discountCode.maxUsesPerUser =
        maxUsesPerUser === null ? null : Number(maxUsesPerUser);
    }

    if (maxTotalUses !== undefined) {
      if (
        maxTotalUses !== null &&
        (!Number.isInteger(Number(maxTotalUses)) ||
          Number(maxTotalUses) < 1)
      ) {
        return next(
          new AppError("Max total uses must be a positive integer.", 400)
        );
      }

      discountCode.maxTotalUses =
        maxTotalUses === null ? null : Number(maxTotalUses);
    }

    if (expiryDate !== undefined) {
      discountCode.expiryDate = expiryDate || null;
    }

    if (minOrderAmount !== undefined) {
      const amount = Number(minOrderAmount);

      if (!Number.isFinite(amount) || amount < 0) {
        return next(
          new AppError("Minimum order amount cannot be negative.", 400)
        );
      }

      discountCode.minOrderAmount = amount;
    }

    if (isActive !== undefined) {
      discountCode.isActive = Boolean(isActive);
    }

    await discountCode.save();

    res.status(200).json({
      status: "success",
      message: "Discount code updated successfully.",
      data: { discountCode },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a discount code
 * @route   DELETE /api/modasphere/discount-codes/:id
 * @access  Private (Admin)
 */
const deleteDiscountCode = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discountCode = await DiscountCode.findById(id);

    if (!discountCode) {
      return next(new AppError("Discount code not found.", 404));
    }

    await DiscountCode.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Discount code deleted successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Activate/deactivate a discount code
 * @route   PATCH /api/modasphere/discount-codes/:id/status
 * @access  Private (Admin)
 */
const updateDiscountCodeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return next(
        new AppError("isActive must be a boolean value.", 400)
      );
    }

    const discountCode = await DiscountCode.findById(id);

    if (!discountCode) {
      return next(new AppError("Discount code not found.", 404));
    }

    discountCode.isActive = isActive;
    await discountCode.save();

    res.status(200).json({
      status: "success",
      message: `Discount code ${
        isActive ? "activated" : "deactivated"
      } successfully.`,
      data: { discountCode },
    });
  } catch (error) {
    next(error);
  }
};

const validateDiscountCode = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || !code.trim()) {
      return next(new AppError("Discount code is required.", 400));
    }

    const subtotal = Number(orderAmount);

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return next(new AppError("A valid order amount is required.", 400));
    }

    const normalizedCode = code.trim().toUpperCase();

    const discountCode = await DiscountCode.findOne({
      code: normalizedCode,
    });

    if (!discountCode) {
      return next(new AppError("Invalid discount code.", 400));
    }

    if (!discountCode.isActive) {
      return next(new AppError("This discount code is inactive.", 400));
    }

    if (
      discountCode.expiryDate &&
      new Date() > discountCode.expiryDate
    ) {
      return next(new AppError("This discount code has expired.", 400));
    }

    if (subtotal < discountCode.minOrderAmount) {
      return next(
        new AppError(
          `Minimum order amount for this discount is ${discountCode.minOrderAmount}.`,
          400
        )
      );
    }

    // Check total usage limit
    if (discountCode.maxTotalUses !== null) {
    const totalUsed = await Order.countDocuments({
        discountCode: discountCode.code,
        status: { $in: ["paid", "shipped", "delivered"] },
    });

    if (totalUsed >= discountCode.maxTotalUses) {
        return next(
        new AppError(
            "This discount code has reached its maximum usage limit.",
            400
        )
        );
    }
    }

    // Check per-user usage limit
    if (discountCode.maxUsesPerUser !== null) {
    const userUsed = await Order.countDocuments({
        buyerId: req.user._id,
        discountCode: discountCode.code,
        status: { $in: ["paid", "shipped", "delivered"] },
    });

    if (userUsed >= discountCode.maxUsesPerUser) {
        return next(
        new AppError(
            "You have already reached the usage limit for this discount code.",
            400
        )
        );
    }
    }

    let discountAmount = 0;

    if (discountCode.discountType === "percentage") {
      discountAmount =
        (subtotal * discountCode.discountValue) / 100;
    } else {
      discountAmount = discountCode.discountValue;
    }

    // Discount cannot exceed the order subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    const discountedTotal = Math.max(
      subtotal - discountAmount,
      0
    );

    res.status(200).json({
      status: "success",
      data: {
        valid: true,
        code: discountCode.code,
        discountType: discountCode.discountType,
        discountValue: discountCode.discountValue,
        discountAmount,
        subtotal,
        discountedTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDiscountCode,
  getDiscountCodes,
  getDiscountCodeById,
  updateDiscountCode,
  deleteDiscountCode,
  updateDiscountCodeStatus,
  validateDiscountCode,
};