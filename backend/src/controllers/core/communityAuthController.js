const CommunityUser = require("../../models/core/CommunityUser");
const { signAccessToken, verifyAccessToken } = require("../../utils/jwt");

// Helper: generate a clean unique handle
const generateHandle = async (name) => {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || "creator";
  let handle = `@${base}`;
  let exists = await CommunityUser.findOne({ handle });
  let count = 1;
  while (exists) {
    handle = `@${base}${count}`;
    exists = await CommunityUser.findOne({ handle });
    count++;
  }
  return handle;
};

// Middleware: Authenticate Community User
exports.protectCommunity = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "Authentication required for community access.",
      });
    }

    const decoded = verifyAccessToken(token);
    const user = await CommunityUser.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Community account no longer exists.",
      });
    }

    req.communityUser = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid or expired community session token.",
    });
  }
};

// @desc    Register a new community member
// @route   POST /api/community/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        status: "fail",
        message: "Name, email, password, and phone number are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: "fail",
        message: "Password must be at least 6 characters long.",
      });
    }

    const existing = await CommunityUser.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        status: "fail",
        message: "An account with this email already exists in the Community.",
      });
    }

    const handle = await generateHandle(name);

    const user = await CommunityUser.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      handle,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      isProfileComplete: false,
    });

    const token = signAccessToken({ id: user._id, email: user.email, community: true });

    // Sanitize user output
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      status: "success",
      message: "Community account created successfully!",
      token,
      data: {
        user: userObj,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to create community account.",
    });
  }
};

// @desc    Community member login
// @route   POST /api/community/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Email and password are required.",
      });
    }

    const user = await CommunityUser.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid email or password for this community account.",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid email or password for this community account.",
      });
    }

    const token = signAccessToken({ id: user._id, email: user.email, community: true });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      status: "success",
      message: "Logged in successfully to Community!",
      token,
      data: {
        user: userObj,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Community login failed.",
    });
  }
};

// @desc    Get current community user profile
// @route   GET /api/community/auth/me
// @access  Private (Community Token)
exports.getMe = async (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.communityUser,
    },
  });
};

// @desc    Complete Community Profile Setup
// @route   POST /api/community/auth/profile-setup
// @access  Private (Community Token)
exports.profileSetup = async (req, res) => {
  try {
    const { handle, role, bio, interests, city, portfolioLink } = req.body;
    const user = req.communityUser;

    if (handle && handle !== user.handle) {
      const formattedHandle = handle.startsWith("@") ? handle.toLowerCase() : `@${handle.toLowerCase()}`;
      const conflict = await CommunityUser.findOne({ handle: formattedHandle, _id: { $ne: user._id } });
      if (conflict) {
        return res.status(400).json({
          status: "fail",
          message: `The handle ${formattedHandle} is already taken. Please choose another.`,
        });
      }
      user.handle = formattedHandle;
    }

    if (role) user.role = role;
    if (bio !== undefined) user.bio = bio.trim();
    if (Array.isArray(interests)) user.interests = interests;
    if (city !== undefined) user.city = city.trim();
    if (portfolioLink !== undefined) user.portfolioLink = portfolioLink.trim();

    user.isProfileComplete = true;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Community profile setup completed successfully!",
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to complete community profile setup.",
    });
  }
};
