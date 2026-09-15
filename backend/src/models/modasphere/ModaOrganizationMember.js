const mongoose = require("mongoose");

const modaOrganizationMemberSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModaOrganization",
      required: [true, "Organization ID is required"],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    role: {
      type: String,
      required: [true, "Member role is required"],
      enum: [
        "owner",
        "admin",
        "manager",
        "editor",
        "analyst",
        "member",
      ],
      default: "member",
    },

    status: {
      type: String,
      enum: ["active", "invited", "inactive"],
      default: "active",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// A user can only have one membership in the same organization
modaOrganizationMemberSchema.index(
  { organizationId: 1, userId: 1 },
  { unique: true }
);

const ModaOrganizationMember = mongoose.model(
  "ModaOrganizationMember",
  modaOrganizationMemberSchema
);

module.exports = ModaOrganizationMember;