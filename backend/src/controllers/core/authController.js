const User = require("../../models/core/User");
const OtpVerification = require("../../models/core/OtpVerification");
const { sendOtpToUser, verifyOtpHash } = require("../../services/core/otpService");
const { formatIndianPhoneNumber } = require("../../services/mototribe/smsService");
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
 * @desc    Register a new user & trigger OTP SMS verification
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, password, role } = req.body;
    const formattedPhone = formatIndianPhoneNumber(phoneNumber);

    // 1. Duplicate email check (handles abandoned unverified retries)
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      if (existingEmailUser.isPhoneVerified) {
        return next(
          new AppError("An account with this email address already exists.", 400)
        );
      }
      // If unverified account has expired/abandoned OTP, clean up old record to allow retry
      const otpRecord = await OtpVerification.findOne({ userId: existingEmailUser._id });
      if (!otpRecord || new Date() > otpRecord.expiresAt) {
        await OtpVerification.deleteMany({ userId: existingEmailUser._id });
        await User.findByIdAndDelete(existingEmailUser._id);
      } else {
        return next(
          new AppError("An unverified account with this email exists. Please complete OTP verification.", 400)
        );
      }
    }

    // 2. Duplicate phone number check (handles abandoned unverified retries)
    const existingPhoneUser = await User.findOne({ phoneNumber: formattedPhone });
    if (existingPhoneUser) {
      if (existingPhoneUser.isPhoneVerified) {
        return next(
          new AppError("An account with this phone number already exists.", 400)
        );
      }
      // If unverified account has expired/abandoned OTP, clean up old record to allow retry
      const otpRecord = await OtpVerification.findOne({ userId: existingPhoneUser._id });
      if (!otpRecord || new Date() > otpRecord.expiresAt) {
        await OtpVerification.deleteMany({ userId: existingPhoneUser._id });
        await User.findByIdAndDelete(existingPhoneUser._id);
      } else {
        return next(
          new AppError("An unverified account with this phone number exists. Please complete OTP verification.", 400)
        );
      }
    }

    // Ensure role is valid (user, moderator, admin)
    const assignedRole =
      role && ["user", "moderator", "admin"].includes(role) ? role : "user";

    // Create unverified user
    const newUser = await User.create({
      name,
      email,
      phoneNumber: formattedPhone,
      password,
      role: assignedRole,
      isPhoneVerified: false,
    });

    // Generate & send OTP SMS
    await sendOtpToUser(newUser._id, newUser.phoneNumber);

    res.status(201).json({
      status: "success",
      message: "User registered successfully. OTP sent to your phone number, please verify.",
      data: {
        userId: newUser._id,
        phoneNumber: newUser.phoneNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP code and issue full JWT access + refresh tokens
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { userId, otpCode } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found.", 404));
    }

    if (user.isPhoneVerified) {
      return next(new AppError("Phone number is already verified.", 400));
    }

    const otpRecord = await OtpVerification.findOne({ userId });
    if (!otpRecord) {
      return next(
        new AppError("No OTP request found or OTP has expired. Please request a new OTP.", 400)
      );
    }

    // 1. Expiry check (5 mins)
    if (new Date() > otpRecord.expiresAt) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return next(
        new AppError("OTP code has expired. Please request a new OTP.", 400)
      );
    }

    // 2. Max 5 attempts check
    if (otpRecord.attempts >= 5) {
      return next(
        new AppError("Maximum OTP verification attempts exceeded (5/5). Please request a new OTP.", 400)
      );
    }

    // 3. Verify OTP hash
    const isMatch = await verifyOtpHash(otpCode, otpRecord.otpCode);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remainingAttempts = Math.max(0, 5 - otpRecord.attempts);
      return next(
        new AppError(`Invalid OTP code. ${remainingAttempts} attempts remaining.`, 400)
      );
    }

    // Mark phone verified
    user.isPhoneVerified = true;
    await user.save({ validateBeforeSave: false });

    // Delete used OTP record
    await OtpVerification.deleteOne({ _id: otpRecord._id });

    // Issue JWT access + refresh tokens
    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend OTP code (Rate limited to max 3 resends per 15 minutes)
 * @route   POST /api/v1/auth/resend-otp
 * @access  Public
 */
const resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found.", 404));
    }

    if (user.isPhoneVerified) {
      return next(new AppError("Phone number is already verified.", 400));
    }

    const otpRecord = await OtpVerification.findOne({ userId });
    let currentResendCount = 0;

    if (otpRecord) {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (otpRecord.createdAt >= fifteenMinutesAgo) {
        if (otpRecord.resendCount >= 3) {
          return next(
            new AppError("Maximum 3 OTP resend requests allowed per 15 minutes. Please try again later.", 429)
          );
        }
        currentResendCount = otpRecord.resendCount + 1;
      }
    }

    await sendOtpToUser(user._id, user.phoneNumber, currentResendCount);

    res.status(200).json({
      status: "success",
      message: "A new OTP code has been sent to your registered phone number.",
      data: {
        userId: user._id,
        resendCount: currentResendCount,
      },
    });
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
  verifyOtp,
  resendOtp,
};
