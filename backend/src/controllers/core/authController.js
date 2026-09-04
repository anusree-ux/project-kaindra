const User = require("../../models/core/User");
const { signToken } = require("../../utils/jwt");
const {
  validateSignupInput,
  validateLoginInput,
} = require("../../validators/authValidator");

/**
 * Helper to build standardized JSON auth response
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken({ id: user._id, role: user.role });

  // Exclude password from output
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;

  res.status(statusCode).json({
    status: "success",
    token,
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
const signup = async (req, res) => {
  try {
    const { errors, isValid } = validateSignupInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        status: "fail",
        message: "Validation failed",
        errors,
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "An account with this email address already exists.",
      });
    }

    // Create user
    const newUser = await User.create({
      name,
      email,
      password,
      role: role && ["user", "admin"].includes(role) ? role : "user",
    });

    sendTokenResponse(newUser, 201, res);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error during registration.",
      error: error.message,
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { errors, isValid } = validateLoginInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        status: "fail",
        message: "Validation failed",
        errors,
      });
    }

    const { email, password } = req.body;

    // Find user by email and select password field
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid email or password.",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error during login.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get logged in user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      status: "success",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error fetching user profile.",
      error: error.message,
    });
  }
};

module.exports = {
  signup,
  login,
  getMe,
};
