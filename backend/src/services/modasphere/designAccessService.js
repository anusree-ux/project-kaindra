const Manufacturer = require("../../models/modasphere/Manufacturer");
const ProductionRequest = require("../../models/modasphere/ProductionRequest");

/**
 * Centralized Design Access Control Service for ModaStudio & ModaManufacture
 */

/**
 * Resolves user's effective role for a design ("owner" | "editor" | "viewer" | null)
 * @param {string|Object} userId
 * @param {Object} design
 * @returns {Promise<"owner"|"editor"|"viewer"|null>}
 */
const getDesignRole = async (userId, design) => {
  if (!userId || !design) {
    return null;
  }

  const normalizedUserId = (
    userId._id ? userId._id : userId
  ).toString();

  const normalizedOwnerId = (
    design.ownerId && design.ownerId._id ? design.ownerId._id : design.ownerId
  )?.toString();

  // 1. Owner check
  if (normalizedOwnerId && normalizedUserId === normalizedOwnerId) {
    return "owner";
  }

  // 2. Collaborator check
  if (Array.isArray(design.collaborators)) {
    const collaborator = design.collaborators.find((c) => {
      const cUserId = (c.userId && c.userId._id ? c.userId._id : c.userId)?.toString();
      return cUserId === normalizedUserId;
    });
    if (collaborator && collaborator.role) {
      return collaborator.role; // "editor" or "viewer"
    }
  }

  // 3. Public visibility check (checked before Manufacturer/RFQ lookups to avoid DB query overhead)
  if (design.visibility === "public") {
    return "viewer";
  }

  // 4. Manufacturer active production request check
  try {
    const manufacturer = await Manufacturer.findOne({ userId: normalizedUserId });
    if (manufacturer) {
      const activeRequest = await ProductionRequest.findOne({
        designId: design._id,
        manufacturerId: manufacturer._id,
        status: {
          $in: ["requested", "quoted", "accepted", "in_production", "completed"],
        },
      });
      if (activeRequest) {
        return "viewer";
      }
    }
  } catch (err) {
    console.error("Error checking manufacturer production request access:", err);
  }

  return null;
};

/**
 * Determines whether a user can view a design
 * @param {string|Object} userId
 * @param {Object} design
 * @returns {Promise<boolean>}
 */
const canViewDesign = async (userId, design) => {
  const role = await getDesignRole(userId, design);
  return role !== null;
};

/**
 * Checks whether a design has an active production request preventing asset deletion or un-readying
 * Active statuses: ["requested", "quoted", "accepted", "in_production"]
 * @param {string|Object} designId
 * @returns {Promise<boolean>}
 */
const hasActiveProductionRequest = async (designId) => {
  const activeRequest = await ProductionRequest.findOne({
    designId,
    status: { $in: ["requested", "quoted", "accepted", "in_production"] },
  });
  return Boolean(activeRequest);
};

module.exports = {
  getDesignRole,
  canViewDesign,
  hasActiveProductionRequest,
};
