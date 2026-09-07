const AppError = require("../utils/AppError");

/**
 * Role-based access control middleware
 * @param  {...string} allowedRoles - Roles allowed to access the route ("user", "moderator", "admin")
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError("User is not authenticated.", 401)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `User role '${req.user.role}' is not authorized to access this route.`,
          403
        )
      );
    }

    next();
  };
};

module.exports = authorize;
