const Seller = require("../../models/modasphere/Seller");
const Manufacturer = require("../../models/modasphere/Manufacturer");
const User = require("../../models/core/User");
const AppError = require("../../utils/AppError");
const { normalizeCategory } = require("../../constants/categories");

/**
 * @desc    Get current user's business profile status across Seller and Manufacturer tables
 * @route   GET /api/modasphere/business/profile-status
 * @access  Private
 */
const getBusinessProfileStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : "";

    const [seller, manufacturer] = await Promise.all([
      Seller.findOne({
        $or: [
          { userId },
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      }),
      Manufacturer.findOne({
        $or: [
          { userId },
          ...(userEmail ? [{ email: userEmail }, { contactEmail: userEmail }] : []),
        ],
      }),
    ]);

    const activeProfile = seller || manufacturer;
    const exists = Boolean(activeProfile);
    const isProfileComplete = Boolean(activeProfile && activeProfile.isProfileComplete);
    const accountType = seller ? "seller" : manufacturer ? "manufacturer" : null;

    res.status(200).json({
      status: "success",
      data: {
        exists,
        isProfileComplete,
        accountType,
        profile: activeProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Setup or complete business profile (Seller or Manufacturer table)
 * @route   POST /api/modasphere/business/setup-profile
 * @access  Private
 */
const setupBusinessProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const email = req.user.email ? req.user.email.toLowerCase().trim() : "";
    const {
      accountType = "seller",
      businessName,
      companyName,
      phone,
      category,
      description,
      location = {},
      capabilities,
      minOrderQuantity,
      leadTimeDays,
    } = req.body;

    const finalName = (businessName || companyName || "").trim();
    if (!finalName) {
      return next(new AppError("Business / Company name is required.", 400));
    }

    if (accountType === "manufacturer") {
      let manufacturer = await Manufacturer.findOne({
        $or: [
          { userId },
          ...(email ? [{ email }, { contactEmail: email }] : []),
        ],
      });

      const parsedCaps = Array.isArray(capabilities)
        ? capabilities
        : typeof capabilities === "string"
        ? capabilities.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean)
        : [];

      if (manufacturer) {
        manufacturer.userId = userId;
        manufacturer.companyName = finalName;
        manufacturer.email = email;
        manufacturer.contactEmail = email;
        if (phone) manufacturer.contactPhone = phone.trim();
        if (description) manufacturer.description = description.trim();
        if (location) {
          manufacturer.location = {
            city: location.city || manufacturer.location?.city || "",
            state: location.state || manufacturer.location?.state || "",
          };
        }
        if (parsedCaps.length) manufacturer.capabilities = parsedCaps;
        if (minOrderQuantity) manufacturer.minOrderQuantity = Number(minOrderQuantity) || 1;
        if (leadTimeDays) manufacturer.leadTimeDays = Number(leadTimeDays) || 7;
        manufacturer.isProfileComplete = true;
        await manufacturer.save();
      } else {
        manufacturer = await Manufacturer.create({
          userId,
          companyName: finalName,
          email,
          contactEmail: email,
          contactPhone: phone ? phone.trim() : "",
          description: description ? description.trim() : "",
          location: {
            city: location.city || "",
            state: location.state || "",
          },
          capabilities: parsedCaps,
          minOrderQuantity: Number(minOrderQuantity) || 1,
          leadTimeDays: Number(leadTimeDays) || 7,
          isProfileComplete: true,
          verificationStatus: "verified",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Manufacturer profile completed successfully.",
        data: {
          accountType: "manufacturer",
          profile: manufacturer,
        },
      });
    }

    // Default: Seller table
    let seller = await Seller.findOne({
      $or: [
        { userId },
        ...(email ? [{ email }] : []),
      ],
    });

    if (seller) {
      seller.userId = userId;
      seller.email = email;
      seller.businessName = finalName;
      if (req.user.name && !seller.ownerName) seller.ownerName = req.user.name;
      if (phone) seller.phone = phone.trim();
      if (category) seller.category = normalizeCategory(category);
      if (description) seller.description = description.trim();
      if (req.body.minOrderQuantity !== undefined) seller.minOrderQuantity = Number(req.body.minOrderQuantity) || 1;
      if (req.body.leadTimeDays !== undefined) seller.leadTimeDays = Number(req.body.leadTimeDays) || 3;
      if (req.body.capacity !== undefined) seller.capacity = String(req.body.capacity).trim();
      if (location) {
        seller.location = {
          city: location.city || seller.location?.city || "",
          state: location.state || seller.location?.state || "",
          country: location.country || seller.location?.country || "India",
        };
      }
      seller.isProfileComplete = true;
      await seller.save();
    } else {
      seller = await Seller.create({
        userId,
        email,
        businessName: finalName,
        ownerName: req.user.name || "",
        phone: phone ? phone.trim() : "",
        category: normalizeCategory(category),
        description: description ? description.trim() : "",
        minOrderQuantity: req.body.minOrderQuantity !== undefined ? Number(req.body.minOrderQuantity) || 1 : 1,
        leadTimeDays: req.body.leadTimeDays !== undefined ? Number(req.body.leadTimeDays) || 3 : 3,
        capacity: req.body.capacity !== undefined ? String(req.body.capacity).trim() : "Active Brand",
        location: {
          city: location.city || "",
          state: location.state || "",
          country: location.country || "India",
        },
        isProfileComplete: true,
        status: "active",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Seller profile completed successfully.",
      data: {
        accountType: "seller",
        profile: seller,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's seller profile from Seller table
 * @route   GET /api/modasphere/sellers/me
 * @access  Private
 */
const getMySellerProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : "";

    const seller = await Seller.findOne({
      $or: [
        { userId },
        ...(userEmail ? [{ email: userEmail }] : []),
      ],
    });

    res.status(200).json({
      status: "success",
      data: {
        seller,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update seller profile in Seller table
 * @route   PUT /api/modasphere/sellers/me
 * @access  Private
 */
const putSellerProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const email = req.user.email ? req.user.email.toLowerCase().trim() : "";
    const {
      businessName,
      ownerName,
      phone,
      category,
      description,
      location,
      gstNumber,
      minOrderQuantity,
      leadTimeDays,
      capacity,
    } = req.body;

    const seller = await Seller.findOneAndUpdate(
      {
        $or: [
          { userId },
          ...(email ? [{ email }] : []),
        ],
      },
      {
        $set: {
          userId,
          email,
          ...(businessName ? { businessName: businessName.trim() } : {}),
          ...(ownerName !== undefined ? { ownerName: ownerName.trim() } : {}),
          ...(phone !== undefined ? { phone: phone.trim() } : {}),
          ...(category !== undefined ? { category: normalizeCategory(category) } : {}),
          ...(description !== undefined ? { description: description.trim() } : {}),
          ...(location ? { location } : {}),
          ...(gstNumber !== undefined ? { gstNumber: gstNumber.trim() } : {}),
          ...(minOrderQuantity !== undefined ? { minOrderQuantity: Number(minOrderQuantity) || 1 } : {}),
          ...(leadTimeDays !== undefined ? { leadTimeDays: Number(leadTimeDays) || 3 } : {}),
          ...(capacity !== undefined ? { capacity: String(capacity).trim() } : {}),
          isProfileComplete: true,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      message: "Seller profile updated successfully.",
      data: {
        seller,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get real sellers and manufacturers from database for public directory
 * @route   GET /api/modasphere/directory/partners
 * @access  Public
 */
const getDirectoryPartners = async (req, res, next) => {
  try {
    const { type = "all", search = "", capability = "all" } = req.query;

    const [sellers, manufacturers] = await Promise.all([
      type === "manufacturer"
        ? []
        : Seller.find({ status: { $ne: "suspended" } })
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .lean(),
      type === "seller"
        ? []
        : Manufacturer.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    const defaultSellerImages = [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=85",
    ];

    const defaultMfgImages = [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85",
    ];

    // Map sellers into unified partner format
    const mappedSellers = sellers.map((s, idx) => {
      const city = s.location?.city || "";
      const state = s.location?.state || "";
      const locationDisplay =
        [city, state].filter(Boolean).join(", ") || "India";
      const cat = s.category || "apparel";
      const capList = [
        cat.charAt(0).toUpperCase() + cat.slice(1),
        "Direct Retail",
        "Brand Partner",
      ];

      return {
        id: s._id,
        _id: s._id,
        userId: s.userId?._id || s.userId,
        name: s.businessName || "Registered Seller",
        partnerType: "seller",
        partnerTypeLabel: "Registered Brand / Seller",
        ownerName: s.ownerName || s.userId?.name || "",
        email: s.email || s.userId?.email || "",
        phone: s.phone || "",
        location: locationDisplay,
        city: city || "Mumbai",
        state: state || "Maharashtra",
        specialty: cat.toUpperCase(),
        category: cat,
        capabilities: capList,
        rating: 4.8,
        orders: 42,
        minimum:
          s.minOrderQuantity !== undefined && s.minOrderQuantity !== null
            ? `${s.minOrderQuantity} ${s.minOrderQuantity === 1 ? "unit" : "units"}`
            : "1 unit",
        leadTime:
          s.leadTimeDays !== undefined && s.leadTimeDays !== null
            ? `${s.leadTimeDays} ${s.leadTimeDays === 1 ? "day" : "days"}`
            : "2–5 days",
        capacity: s.capacity || "Active Brand",
        image: defaultSellerImages[idx % defaultSellerImages.length],
        description:
          s.description ||
          `${s.businessName} is a verified fashion brand and registered seller on ModaSphere.`,
        isVerified: true,
        gstNumber: s.gstNumber || "",
        createdAt: s.createdAt,
      };
    });

    // Map manufacturers into unified partner format
    const mappedManufacturers = manufacturers.map((m, idx) => {
      const city = m.location?.city || "";
      const state = m.location?.state || "";
      const locationDisplay =
        [city, state].filter(Boolean).join(", ") || "India";
      const rawCaps = Array.isArray(m.capabilities) ? m.capabilities : [];
      const capList =
        rawCaps.length > 0
          ? rawCaps.map((c) => c.charAt(0).toUpperCase() + c.slice(1))
          : ["Cut & Sew", "Apparel Production", "Sampling"];
      const primarySpecialty = capList[0] || "Custom Manufacturing";

      return {
        id: m._id,
        _id: m._id,
        userId: m.userId?._id || m.userId,
        name: m.companyName || "Verified Manufacturer",
        partnerType: "manufacturer",
        partnerTypeLabel: "Verified Manufacturer",
        ownerName: m.userId?.name || "",
        email: m.email || m.contactEmail || m.userId?.email || "",
        phone: m.contactPhone || "",
        location: locationDisplay,
        city: city || "Bengaluru",
        state: state || "Karnataka",
        specialty: primarySpecialty,
        category: "manufacturing",
        capabilities: capList,
        rating: 4.9,
        orders: 86,
        minimum: m.minOrderQuantity ? `${m.minOrderQuantity} units` : "50 units",
        leadTime: m.leadTimeDays ? `${m.leadTimeDays} days` : "14–21 days",
        capacity: m.minOrderQuantity > 200 ? "High" : "Medium",
        image:
          m.images?.[0]?.url ||
          defaultMfgImages[idx % defaultMfgImages.length],
        description:
          m.description ||
          `${m.companyName} provides professional garment manufacturing, prototyping, and custom production runs.`,
        isVerified: m.verificationStatus === "verified" || true,
        verificationStatus: m.verificationStatus || "verified",
        createdAt: m.createdAt,
      };
    });

    let allPartners = [...mappedManufacturers, ...mappedSellers];

    // Filter by search
    if (search && search.trim()) {
      const queryStr = search.trim().toLowerCase();
      allPartners = allPartners.filter(
        (p) =>
          p.name.toLowerCase().includes(queryStr) ||
          p.location.toLowerCase().includes(queryStr) ||
          p.specialty.toLowerCase().includes(queryStr) ||
          p.description.toLowerCase().includes(queryStr)
      );
    }

    // Filter by capability
    if (capability && capability.toLowerCase() !== "all") {
      const capStr = capability.trim().toLowerCase();
      allPartners = allPartners.filter((p) =>
        p.capabilities.some((c) => c.toLowerCase().includes(capStr))
      );
    }

    // Extract dynamic unique capabilities across all DB partners
    const uniqueCapabilities = Array.from(
      new Set(
        [...mappedManufacturers, ...mappedSellers].flatMap(
          (p) => p.capabilities
        )
      )
    );

    res.status(200).json({
      status: "success",
      data: {
        total: allPartners.length,
        manufacturerCount: mappedManufacturers.length,
        sellerCount: mappedSellers.length,
        capabilities: ["All", ...uniqueCapabilities],
        partners: allPartners,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBusinessProfileStatus,
  setupBusinessProfile,
  getMySellerProfile,
  putSellerProfile,
  getDirectoryPartners,
};
