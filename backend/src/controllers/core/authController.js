const User = require("../../models/core/User");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../../utils/jwt");
const AppError = require("../../utils/AppError");

/**
 * Cookie options for Refresh Token
 */
const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
});

/**
 * Helper to build and send auth response with access token & httpOnly refresh cookie
 */
const sendTokenResponse = async (user, statusCode, res) => {
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id, role: user.role });

  // Save refresh token to user document
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  // Send httpOnly cookie for refresh token
  res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

  // Exclude password and refreshTokens from user object output
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.refreshTokens;

  res.status(statusCode).json({
    status: "success",
    accessToken,
    data: {
      user: userObj,
    },
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(
        new AppError("An account with this email address already exists.", 400)
      );
    }

    // Ensure role is valid (user, moderator, admin)
    const assignedRole =
      role && ["user", "moderator", "admin"].includes(role) ? role : "user";

    // Create user
    const newUser = await User.create({
      name,
      email,
      password,
      role: assignedRole,
    });

    await sendTokenResponse(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get tokens
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email and select password and refreshTokens fields
    const user = await User.findOne({ email }).select("+password +refreshTokens");

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Invalid email or password.", 401));
    }

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Issue a new access token using a valid refresh token
 * @route   POST /api/v1/auth/refresh
 * @access  Public (requires valid refresh token in cookie or body)
 */
const refresh = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return next(
        new AppError("Refresh token missing. Please log in again.", 401)
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return next(
        new AppError("Invalid or expired refresh token. Please log in again.", 401)
      );
    }

    // Check if user exists and includes the refresh token in stored tokens
    const user = await User.findById(decoded.id).select("+refreshTokens");

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return next(
        new AppError("Invalid refresh token or session revoked.", 401)
      );
    }

    // Generate new short-lived access token (15m)
    const newAccessToken = signAccessToken({ id: user._id, role: user.role });

    res.status(200).json({
      status: "success",
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user and invalidate refresh token
 * @route   POST /api/v1/auth/logout
 * @access  Private / Public
 */
const logout = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
      // Decode or find user to remove token from DB
      try {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.id).select("+refreshTokens");
        if (user) {
          user.refreshTokens = user.refreshTokens.filter(
            (token) => token !== refreshToken
          );
          await user.save({ validateBeforeSave: false });
        }
      } catch (err) {
        // Token verification failed or expired - proceed to clear cookie anyway
      }
    }

    // Clear httpOnly cookie
    res.clearCookie("refreshToken", getRefreshTokenCookieOptions());

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged in user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: "success",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
  getMe,
};
