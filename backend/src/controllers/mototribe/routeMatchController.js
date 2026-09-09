const AppError = require("../../utils/AppError");
const {
  getRouteStats,
  getRouteMatches,
} = require("../../services/mototribe/routeMatchService");

/**
 * @desc    Get route statistics (currently riding, planning, looking for partners, unique riders)
 * @route   GET /api/mototribe/rides/route-stats
 * @access  Private
 */
const getRouteStatsController = async (req, res, next) => {
  try {
    const { origin, destination } = req.query;

    if (
      !origin ||
      !destination ||
      !String(origin).trim() ||
      !String(destination).trim()
    ) {
      return next(
        new AppError(
          "Both origin and destination query parameters are required.",
          400
        )
      );
    }

    const stats = await getRouteStats(origin, destination);

    res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get matching rides for a route, optionally filtered & paginated
 * @route   GET /api/mototribe/rides/route-matches
 * @access  Private
 */
const getRouteMatchesController = async (req, res, next) => {
  try {
    const { origin, destination, filter, page, limit } = req.query;

    if (
      !origin ||
      !destination ||
      !String(origin).trim() ||
      !String(destination).trim()
    ) {
      return next(
        new AppError(
          "Both origin and destination query parameters are required.",
          400
        )
      );
    }

    const result = await getRouteMatches(
      origin,
      destination,
      filter,
      page,
      limit
    );

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRouteStatsController,
  getRouteMatchesController,
};
