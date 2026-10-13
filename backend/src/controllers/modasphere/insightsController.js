const insightsService = require("../../services/modasphere/insightsService");
const AppError = require("../../utils/AppError");

/**
 * Helper to parse and validate 'from' and 'to' date parameters
 */
const parseDateRange = (fromStr, toStr) => {
  const now = new Date();
  let fromDate;
  let toDate;

  if (fromStr) {
    const d = new Date(fromStr);
    if (isNaN(d.getTime())) {
      throw new AppError("Invalid 'from' date format. Please provide a valid ISO date.", 400);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(fromStr.trim())) {
      fromDate = new Date(`${fromStr.trim()}T00:00:00.000Z`);
    } else {
      fromDate = d;
    }
  } else {
    // Default last 30 days
    fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  if (toStr) {
    const d = new Date(toStr);
    if (isNaN(d.getTime())) {
      throw new AppError("Invalid 'to' date format. Please provide a valid ISO date.", 400);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(toStr.trim())) {
      toDate = new Date(`${toStr.trim()}T23:59:59.999Z`);
    } else {
      toDate = d;
    }
  } else {
    toDate = now;
  }

  if (fromDate > toDate) {
    throw new AppError("'from' date cannot be after 'to' date.", 400);
  }

  const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 366) {
    throw new AppError("Date range cannot exceed 366 days.", 400);
  }

  return { fromDate, toDate };
};

/**
 * @desc    Get seller summary metrics
 * @route   GET /api/modasphere/insights/seller/summary
 * @access  Private (Seller)
 */
const getSellerSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { fromDate, toDate } = parseDateRange(from, to);

    const summary = await insightsService.getSellerSummary(req.user._id, fromDate, toDate);

    res.status(200).json({
      status: "success",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get seller sales trend
 * @route   GET /api/modasphere/insights/seller/trend
 * @access  Private (Seller)
 */
const getSellerSalesTrend = async (req, res, next) => {
  try {
    const { from, to, interval = "day" } = req.query;
    if (!["day", "week", "month"].includes(interval)) {
      return next(new AppError("Interval must be 'day', 'week', or 'month'.", 400));
    }

    const { fromDate, toDate } = parseDateRange(from, to);
    const trend = await insightsService.getSellerSalesTrend(req.user._id, fromDate, toDate, interval);

    res.status(200).json({
      status: "success",
      data: { trend },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get seller top selling products
 * @route   GET /api/modasphere/insights/seller/top-products
 * @access  Private (Seller)
 */
const getSellerTopProducts = async (req, res, next) => {
  try {
    const { from, to, limit = 10 } = req.query;
    let fromDate = null;
    let toDate = null;

    if (from || to) {
      const parsed = parseDateRange(from, to);
      fromDate = parsed.fromDate;
      toDate = parsed.toDate;
    }

    const topProducts = await insightsService.getSellerTopProducts(
      req.user._id,
      parseInt(limit, 10) || 10,
      fromDate,
      toDate
    );

    res.status(200).json({
      status: "success",
      data: topProducts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get seller low stock active products
 * @route   GET /api/modasphere/insights/seller/low-stock
 * @access  Private (Seller)
 */
const getSellerLowStock = async (req, res, next) => {
  try {
    const { threshold = 5 } = req.query;
    const lowStock = await insightsService.getSellerLowStock(
      req.user._id,
      parseInt(threshold, 10) || 5
    );

    res.status(200).json({
      status: "success",
      data: { products: lowStock },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform-wide summary metrics
 * @route   GET /api/modasphere/insights/platform/summary
 * @access  Private (Admin only)
 */
const getPlatformSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { fromDate, toDate } = parseDateRange(from, to);

    const summary = await insightsService.getPlatformSummary(fromDate, toDate);

    res.status(200).json({
      status: "success",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform-wide top categories
 * @route   GET /api/modasphere/insights/platform/top-categories
 * @access  Private (Admin only)
 */
const getPlatformTopCategories = async (req, res, next) => {
  try {
    const { from, to, limit = 10 } = req.query;
    const { fromDate, toDate } = parseDateRange(from, to);

    const categories = await insightsService.getPlatformTopCategories(
      fromDate,
      toDate,
      parseInt(limit, 10) || 10
    );

    res.status(200).json({
      status: "success",
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSellerSummary,
  getSellerSalesTrend,
  getSellerTopProducts,
  getSellerLowStock,
  getPlatformSummary,
  getPlatformTopCategories,
};
