const RouteReport = require("../../models/mototribe/RouteReport");
const { normalizeLocation } = require("../../services/mototribe/routeMatchService");
const AppError = require("../../utils/AppError");

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * @desc    Create a community route report
 * @route   POST /api/mototribe/route-reports
 * @access  Private
 */
const createRouteReport = async (req, res, next) => {
  try {
    const { origin, destination, reportType, content } = req.body;
    const userId = req.user._id;

    const normOrigin = normalizeLocation(origin);
    const normDest = normalizeLocation(destination);

    const report = await RouteReport.create({
      userId,
      origin: normOrigin,
      destination: normDest,
      reportType,
      content,
    });

    res.status(201).json({
      status: "success",
      message: "Route report created successfully.",
      data: {
        report,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reports for a route, sorted by helpfulCount descending then most recent
 * @route   GET /api/mototribe/route-reports?origin=X&destination=Y&reportType=Z
 * @access  Private
 */
const getRouteReports = async (req, res, next) => {
  try {
    const { origin, destination, reportType, page = 1, limit = 20 } = req.query;

    if (!origin || !destination) {
      return next(
        new AppError("Both origin and destination query parameters are required.", 400)
      );
    }

    const normOrigin = normalizeLocation(origin);
    const normDest = normalizeLocation(destination);

    const filterQuery = {
      origin: new RegExp(`^\\s*${escapeRegex(normOrigin)}\\s*$`, "i"),
      destination: new RegExp(`^\\s*${escapeRegex(normDest)}\\s*$`, "i"),
    };

    if (reportType) {
      filterQuery.reportType = reportType;
    }

    const total = await RouteReport.countDocuments(filterQuery);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const reports = await RouteReport.find(filterQuery)
      .populate("userId", "name email")
      .sort({ helpfulCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      status: "success",
      results: reports.length,
      data: {
        reports,
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
 * @desc    Mark a route report as helpful (upvote)
 * @route   POST /api/mototribe/route-reports/:id/helpful
 * @access  Private
 */
const markReportHelpful = async (req, res, next) => {
  try {
    const reportId = req.params.id;
    const userId = req.user._id;

    const report = await RouteReport.findById(reportId);
    if (!report) {
      return next(new AppError("Route report not found.", 404));
    }

    const hasMarked = report.helpfulUserIds.some(
      (id) => id.toString() === userId.toString()
    );

    if (hasMarked) {
      return next(
        new AppError("You have already marked this report as helpful.", 400)
      );
    }

    report.helpfulUserIds.push(userId);
    report.helpfulCount = (report.helpfulCount || 0) + 1;
    await report.save();

    res.status(200).json({
      status: "success",
      message: "Marked report as helpful.",
      data: {
        report,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a route report (Owner only)
 * @route   DELETE /api/mototribe/route-reports/:id
 * @access  Private (Owner)
 */
const deleteRouteReport = async (req, res, next) => {
  try {
    const reportId = req.params.id;
    const userId = req.user._id;

    const report = await RouteReport.findById(reportId);
    if (!report) {
      return next(new AppError("Route report not found.", 404));
    }

    if (report.userId.toString() !== userId.toString()) {
      return next(
        new AppError("You can only delete your own route reports.", 403)
      );
    }

    await RouteReport.deleteOne({ _id: report._id });

    res.status(200).json({
      status: "success",
      message: "Route report deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRouteReport,
  getRouteReports,
  markReportHelpful,
  deleteRouteReport,
};
