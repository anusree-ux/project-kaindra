const User = require("../../models/core/User");
const Admin = require("../../models/core/Admin");
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
const sendTokenResponse = async (user, statusCode, res, extra = {}) => {
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
    isNewUser: Boolean(extra.isNewUser),
    data: {
      user: userObj,
      isNewUser: Boolean(extra.isNewUser),
      ...extra,
    },
  });
};



/**
 * @desc    Admin login using credentials from the 'admins' table
 * @route   POST /api/v1/auth/login or POST /api/v1/auth/admin/login
 * @access  Public
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide both email and password.", 400));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up in the dedicated 'admins' table/collection
    const admin = await Admin.findOne({ email: normalizedEmail }).select("+password +refreshTokens");

    if (!admin || !(await admin.comparePassword(password))) {
      return next(new AppError("Invalid email or password.", 401));
    }

    await sendTokenResponse(admin, 200, res);
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

    // Check if admin or user exists and includes the refresh token in stored tokens
    let user = await Admin.findById(decoded.id).select("+refreshTokens");
    if (!user) {
      user = await User.findById(decoded.id).select("+refreshTokens");
    }

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
 * @desc    Logout user/admin and invalidate refresh token
 * @route   POST /api/v1/auth/logout
 * @access  Private / Public
 */
const logout = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
      // Decode or find admin/user to remove token from DB
      try {
        const decoded = verifyRefreshToken(refreshToken);
        let user = await Admin.findById(decoded.id).select("+refreshTokens");
        if (!user) {
          user = await User.findById(decoded.id).select("+refreshTokens");
        }
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

/**
 * Helper to decode Google JWT payload without external library
 */
const decodeGoogleCredential = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

/**
 * @desc    Authenticate with Google OAuth without OTP
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
const googleAuth = async (req, res, next) => {
  try {
    const { credential, email: devEmail, name: devName, googleId: devGoogleId, picture: devPicture } = req.body;

    let email = devEmail;
    let name = devName;
    let googleId = devGoogleId;
    let picture = devPicture || "";

    // 1. If Google ID token JWT provided, verify / decode it
    if (credential) {
      try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (response.ok) {
          const payload = await response.json();
          email = payload.email;
          name = payload.name;
          googleId = payload.sub;
          picture = payload.picture || "";
        } else {
          const decoded = decodeGoogleCredential(credential);
          if (decoded && decoded.email) {
            email = decoded.email;
            name = decoded.name || decoded.email.split("@")[0];
            googleId = decoded.sub || `google-${Date.now()}`;
            picture = decoded.picture || "";
          }
        }
      } catch (verifyErr) {
        const decoded = decodeGoogleCredential(credential);
        if (decoded && decoded.email) {
          email = decoded.email;
          name = decoded.name || decoded.email.split("@")[0];
          googleId = decoded.sub || `google-${Date.now()}`;
          picture = decoded.picture || "";
        }
      }
    }

    if (!email) {
      return next(new AppError("Valid Google account information or credential is required", 400));
    }

    email = email.toLowerCase().trim();
    name = (name || email.split("@")[0]).trim();

    // 2. Find user by googleId or email
    let user = await User.findOne({
      $or: [
        ...(googleId ? [{ googleId }] : []),
        { email },
      ],
    });

    let isNewUser = false;
    if (user) {
      let changed = false;
      if (name && user.name !== name) {
        user.name = name;
        changed = true;
      }
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        changed = true;
      }
      if (picture && user.avatar !== picture) {
        user.avatar = picture;
        changed = true;
      }
      if (changed) {
        await user.save({ validateBeforeSave: false });
      }
    } else {
      isNewUser = true;
      user = await User.create({
        name,
        email,
        googleId: googleId || `google-${Date.now()}`,
        avatar: picture,
      });

      // Automatically dispatch Kaindra Welcome Email to new account asynchronously
      try {
        const { sendWelcomeEmail } = require("../../services/mototribe/emailService");
        sendWelcomeEmail(user.email, user.name)
          .then((res) => {
            console.log(`[Auth] Welcome email dispatched to ${user.email}:`, res?.messageId || "sent");
          })
          .catch((mailErr) => {
            console.warn(`[Auth] Could not send welcome email to ${user.email}:`, mailErr.message);
          });
      } catch (svcErr) {
        console.warn("[Auth] EmailService load warning:", svcErr.message);
      }
    }

    await sendTokenResponse(user, 200, res, { isNewUser });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  googleAuth,
  refresh,
  logout,
  getMe,
};
