const ModaOrganization = require("../../models/modasphere/ModaOrganization");
const ModaOrganizationMember = require("../../models/modasphere/ModaOrganizationMember");

// Create a new organization
const createOrganization = async (req, res) => {
  try {
    const { name, slug, type, description, location, website, logo } = req.body;

    const existingOrganization = await ModaOrganization.findOne({ slug });

    if (existingOrganization) {
      return res.status(400).json({
        success: false,
        message: "Organization slug already exists",
      });
    }

    const organization = await ModaOrganization.create({
      name,
      slug,
      type,
      description,
      location,
      website,
      logo,
      ownerId: req.user._id,
    });

    await ModaOrganizationMember.create({
      organizationId: organization._id,
      userId: req.user._id,
      role: "owner",
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      organization,
    });
  } catch (error) {
    console.error("Create organization error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create organization",
      error: error.message,
    });
  }
};

// Get organizations owned by the logged-in user
const getMyOrganizations = async (req, res) => {
  try {
    const organizations = await ModaOrganization.find({
      ownerId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: organizations.length,
      organizations,
    });
  } catch (error) {
    console.error("Get organizations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch organizations",
      error: error.message,
    });
  }
};

// Get one organization by slug
const getOrganizationBySlug = async (req, res) => {
  try {
    const organization = await ModaOrganization.findOne({
      slug: req.params.slug.toLowerCase(),
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    res.status(200).json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Get organization error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch organization",
      error: error.message,
    });
  }
};

// Update an organization owned by the logged-in user
const updateOrganization = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "slug",
      "type",
      "description",
      "location",
      "website",
      "logo",
      "status",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.slug) {
      const existingOrganization = await ModaOrganization.findOne({
        slug: updates.slug.toLowerCase(),
        _id: { $ne: req.params.id },
      });

      if (existingOrganization) {
        return res.status(400).json({
          success: false,
          message: "Organization slug already exists",
        });
      }

      updates.slug = updates.slug.toLowerCase();
    }

    const organization = await ModaOrganization.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerId: req.user._id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found or you are not the owner",
      });
    }

    res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      organization,
    });
  } catch (error) {
    console.error("Update organization error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update organization",
      error: error.message,
    });
  }
};

module.exports = {
  createOrganization,
  getMyOrganizations,
  getOrganizationBySlug,
  updateOrganization,
};