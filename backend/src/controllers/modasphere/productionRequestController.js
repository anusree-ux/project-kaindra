/**
 * Production Request (RFQ) Controller for ModaManufacture
 * 
 * OUT OF SCOPE FOR CURRENT RELEASE:
 * 1. Payment gateway integration for production runs / escrow deposits.
 * 2. Manufacturer capacity & machinery scheduling calendars.
 * 3. Manufacturer peer ratings & review score calculation.
 */

const ProductionRequest = require("../../models/modasphere/ProductionRequest");
const Design = require("../../models/modasphere/Design");
const Manufacturer = require("../../models/modasphere/Manufacturer");
const AppError = require("../../utils/AppError");

/**
 * Helper to sanitize contact details from a populated manufacturer object if user is not authorized
 * @param {Object} manufacturerObj
 * @param {string} requestStatus
 * @param {Object} reqUser
 */
const sanitizeManufacturerContactDetails = (manufacturerObj, requestStatus, reqUser) => {
  if (!manufacturerObj) return manufacturerObj;

  const isAccepted = ["accepted", "in_production", "completed"].includes(requestStatus);
  const isAdmin = reqUser && reqUser.role === "admin";
  const isMfgOwner =
    reqUser &&
    manufacturerObj.userId &&
    (manufacturerObj.userId._id || manufacturerObj.userId).toString() === reqUser._id.toString();

  if (!isAccepted && !isAdmin && !isMfgOwner) {
    if (typeof manufacturerObj.toObject === "function") {
      manufacturerObj = manufacturerObj.toObject();
    }
    delete manufacturerObj.contactEmail;
    delete manufacturerObj.contactPhone;
  }
  return manufacturerObj;
};

/**
 * @desc    Create a new production request (RFQ) for a design
 * @route   POST /api/modasphere/production-requests
 * @access  Private (Design Owner Only)
 */
const createProductionRequest = async (req, res, next) => {
  try {
    const {
      designId,
      manufacturerId,
      quantity,
      targetPricePerUnit,
      targetDeliveryDate,
      notes,
    } = req.body;

    if (!designId || !manufacturerId || !quantity) {
      return next(
        new AppError(
          "designId, manufacturerId, and valid quantity are required.",
          400
        )
      );
    }

    if (isNaN(Number(quantity)) || Number(quantity) < 1) {
      return next(new AppError("Quantity must be at least 1.", 400));
    }

    // 1. Verify Design exists & requester is the design OWNER
    const design = await Design.findById(designId);
    if (!design) {
      return next(new AppError("Design not found.", 404));
    }

    if (design.ownerId.toString() !== req.user._id.toString()) {
      return next(
        new AppError("Only the design owner can submit a production request.", 403)
      );
    }

    // 2. Design status must be ready_for_production
    if (design.status !== "ready_for_production") {
      return next(
        new AppError(
          "Design status must be ready_for_production to initiate a production request.",
          400
        )
      );
    }

    // 3. Verify Manufacturer exists & is verified
    const manufacturer = await Manufacturer.findById(manufacturerId);
    if (!manufacturer) {
      return next(new AppError("Manufacturer not found.", 404));
    }

    if (manufacturer.verificationStatus !== "verified") {
      return next(
        new AppError(
          "Production requests can only be sent to verified manufacturers.",
          400
        )
      );
    }

    // 4. Self-request check
    if (manufacturer.userId.toString() === req.user._id.toString()) {
      return next(
        new AppError("Manufacturer cannot submit a production request to itself.", 400)
      );
    }

    // 5. Reject duplicate active request for same design + manufacturer
    const existingActiveRequest = await ProductionRequest.findOne({
      designId,
      manufacturerId,
      status: { $in: ["requested", "quoted", "accepted", "in_production"] },
    });

    if (existingActiveRequest) {
      return next(
        new AppError(
          "An active production request already exists for this design and manufacturer.",
          400
        )
      );
    }

    const request = await ProductionRequest.create({
      designId,
      requesterId: req.user._id,
      manufacturerId,
      quantity: Number(quantity),
      targetPricePerUnit:
        targetPricePerUnit !== undefined ? Number(targetPricePerUnit) : undefined,
      targetDeliveryDate: targetDeliveryDate ? new Date(targetDeliveryDate) : undefined,
      notes: notes ? notes.trim() : "",
      status: "requested",
      timeline: [
        {
          status: "requested",
          note: "Production request submitted",
          by: req.user._id,
          timestamp: new Date(),
        },
      ],
    });

    const populatedRequest = await ProductionRequest.findById(request._id)
      .populate("designId", "title category status assets")
      .populate("manufacturerId", "companyName location capabilities")
      .populate("requesterId", "name email");

    res.status(201).json({
      status: "success",
      data: { productionRequest: populatedRequest },
    });
  } catch (error) {
    // Handle Mongo partial unique index duplicate key error (code 11000)
    if (error.code === 11000) {
      return next(
        new AppError(
          "An active production request already exists for this design and manufacturer.",
          400
        )
      );
    }
    next(error);
  }
};

/**
 * @desc    Get sent production requests (created by logged-in user)
 * @route   GET /api/modasphere/production-requests/sent
 * @access  Private
 */
const getSentProductionRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { requesterId: req.user._id };

    if (status && status.trim()) {
      query.status = status.trim().toLowerCase();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      ProductionRequest.find(query)
        .populate("designId", "title category status assets")
        .populate("manufacturerId", "companyName location capabilities contactEmail contactPhone userId")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ProductionRequest.countDocuments(query),
    ]);

    const sanitizedRequests = requests.map((reqDoc) => {
      const reqObj = reqDoc.toObject();
      if (reqObj.manufacturerId) {
        reqObj.manufacturerId = sanitizeManufacturerContactDetails(
          reqObj.manufacturerId,
          reqObj.status,
          req.user
        );
      }
      return reqObj;
    });

    res.status(200).json({
      status: "success",
      data: {
        productionRequests: sanitizedRequests,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get received production requests (sent to logged-in user's manufacturer)
 * @route   GET /api/modasphere/production-requests/received
 * @access  Private
 */
const getReceivedProductionRequests = async (req, res, next) => {
  try {
    const manufacturer = await Manufacturer.findOne({ userId: req.user._id });
    if (!manufacturer) {
      return res.status(200).json({
        status: "success",
        data: {
          productionRequests: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
        },
      });
    }

    const { page = 1, limit = 20, status } = req.query;
    const query = { manufacturerId: manufacturer._id };

    if (status && status.trim()) {
      query.status = status.trim().toLowerCase();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      ProductionRequest.find(query)
        .populate("designId", "title category status assets")
        .populate("requesterId", "name email")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ProductionRequest.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        productionRequests: requests,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single production request details by ID
 * @route   GET /api/modasphere/production-requests/:id
 * @access  Private (Requester, Manufacturer Owner, or Admin)
 */
const getProductionRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await ProductionRequest.findById(id)
      .populate("designId", "title category status assets ownerId")
      .populate("manufacturerId", "companyName location capabilities userId contactEmail contactPhone")
      .populate("requesterId", "name email");

    if (!request) {
      return next(new AppError("Production request not found.", 404));
    }

    const isRequester = request.requesterId._id.toString() === req.user._id.toString();
    const isManufacturerOwner =
      request.manufacturerId &&
      request.manufacturerId.userId &&
      request.manufacturerId.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isRequester && !isManufacturerOwner && !isAdmin) {
      return next(
        new AppError("Not authorized to view this production request.", 403)
      );
    }

    const requestObj = request.toObject();
    if (requestObj.manufacturerId) {
      requestObj.manufacturerId = sanitizeManufacturerContactDetails(
        requestObj.manufacturerId,
        requestObj.status,
        req.user
      );
    }

    res.status(200).json({
      status: "success",
      data: { productionRequest: requestObj },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manufacturer submits price quote for requested RFQ
 * @route   PATCH /api/modasphere/production-requests/:id/quote
 * @access  Private (Manufacturer Only)
 */
const submitQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pricePerUnit, leadTimeDays, validUntil, note } = req.body;

    if (pricePerUnit === undefined || isNaN(Number(pricePerUnit)) || Number(pricePerUnit) < 0) {
      return next(new AppError("Valid pricePerUnit is required.", 400));
    }

    if (leadTimeDays === undefined || isNaN(Number(leadTimeDays)) || Number(leadTimeDays) < 1) {
      return next(new AppError("Valid leadTimeDays (>= 1) is required.", 400));
    }

    // Reject quote if validUntil is provided and in the past
    if (validUntil) {
      const validUntilDate = new Date(validUntil);
      if (isNaN(validUntilDate.getTime()) || validUntilDate <= new Date()) {
        return next(
          new AppError("validUntil must be a valid date in the future.", 400)
        );
      }
    }

    const request = await ProductionRequest.findById(id).populate("manufacturerId");
    if (!request) {
      return next(new AppError("Production request not found.", 404));
    }

    const isManufacturerOwner =
      request.manufacturerId &&
      request.manufacturerId.userId.toString() === req.user._id.toString();

    if (!isManufacturerOwner) {
      return next(
        new AppError("Only the assigned manufacturer can submit a quote.", 403)
      );
    }

    if (request.status !== "requested") {
      return next(
        new AppError(
          `Cannot submit quote for production request in '${request.status}' status. Required status: 'requested'.`,
          400
        )
      );
    }

    request.quote = {
      pricePerUnit: Number(pricePerUnit),
      leadTimeDays: Number(leadTimeDays),
      validUntil: validUntil ? new Date(validUntil) : undefined,
      note: note ? note.trim() : "",
      quotedAt: new Date(),
    };

    request.status = "quoted";
    request.timeline.push({
      status: "quoted",
      note: note ? note.trim() : "Quote submitted by manufacturer",
      by: req.user._id,
      timestamp: new Date(),
    });

    await request.save();

    res.status(200).json({
      status: "success",
      message: "Quote submitted successfully.",
      data: { productionRequest: request },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Requester responds to quote (accept or reject)
 * @route   PATCH /api/modasphere/production-requests/:id/respond
 * @access  Private (Requester Only)
 */
const respondToQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!["accept", "reject"].includes(action)) {
      return next(new AppError("Action must be 'accept' or 'reject'.", 400));
    }

    const request = await ProductionRequest.findById(id);
    if (!request) {
      return next(new AppError("Production request not found.", 404));
    }

    if (request.requesterId.toString() !== req.user._id.toString()) {
      return next(
        new AppError("Only the requester can respond to the quote.", 403)
      );
    }

    if (request.status !== "quoted") {
      return next(
        new AppError(
          `Cannot respond to quote for request in '${request.status}' status. Required status: 'quoted'.`,
          400
        )
      );
    }

    // Expiry check for accept action
    if (action === "accept" && request.quote && request.quote.validUntil) {
      if (new Date() > new Date(request.quote.validUntil)) {
        return next(
          new AppError("Quote has expired and cannot be accepted.", 400)
        );
      }
    }

    const targetStatus = action === "accept" ? "accepted" : "rejected";
    request.status = targetStatus;
    request.timeline.push({
      status: targetStatus,
      note: `Quote ${action}ed by requester`,
      by: req.user._id,
      timestamp: new Date(),
    });

    await request.save();

    res.status(200).json({
      status: "success",
      message: `Quote ${action}ed successfully.`,
      data: { productionRequest: request },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manufacturer starts production for accepted RFQ
 * @route   PATCH /api/modasphere/production-requests/:id/start
 * @access  Private (Manufacturer Only)
 */
const startProduction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await ProductionRequest.findById(id).populate("manufacturerId");

    if (!request) {
      return next(new AppError("Production request not found.", 404));
    }

    const isManufacturerOwner =
      request.manufacturerId &&
      request.manufacturerId.userId.toString() === req.user._id.toString();

    if (!isManufacturerOwner) {
      return next(
        new AppError("Only the assigned manufacturer can start production.", 403)
      );
    }

    if (request.status !== "accepted") {
      return next(
        new AppError(
          `Cannot start production for request in '${request.status}' status. Required status: 'accepted'.`,
          400
        )
      );
    }

    request.status = "in_production";
    request.timeline.push({
      status: "in_production",
      note: "Production started by manufacturer",
      by: req.user._id,
      timestamp: new Date(),
    });

    await request.save();

    res.status(200).json({
      status: "success",
      message: "Production run started successfully.",
      data: { productionRequest: request },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manufacturer completes production run
 * @route   PATCH /api/modasphere/production-requests/:id/complete
 * @access  Private (Manufacturer Only)
 */
const completeProduction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await ProductionRequest.findById(id).populate("manufacturerId");

    if (!request) {
      return next(new AppError("Production request not found.", 404));
    }

    const isManufacturerOwner =
      request.manufacturerId &&
      request.manufacturerId.userId.toString() === req.user._id.toString();

    if (!isManufacturerOwner) {
      return next(
        new AppError("Only the assigned manufacturer can complete production.", 403)
      );
    }

    if (request.status !== "in_production") {
      return next(
        new AppError(
          `Cannot complete production for request in '${request.status}' status. Required status: 'in_production'.`,
          400
        )
      );
    }

    request.status = "completed";
    request.timeline.push({
      status: "completed",
      note: "Production completed by manufacturer",
      by: req.user._id,
      timestamp: new Date(),
    });

    await request.save();

    res.status(200).json({
      status: "success",
      message: "Production completed successfully.",
      data: { productionRequest: request },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Requester cancels production request (allowed from requested, quoted, or accepted)
 * @route   PATCH /api/modasphere/production-requests/:id/cancel
 * @access  Private (Requester Only)
 */
const cancelProductionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await ProductionRequest.findById(id);

    if (!request) {
      return next(new AppError("Production request not found.", 404));
    }

    if (request.requesterId.toString() !== req.user._id.toString()) {
      return next(
        new AppError("Only the requester can cancel the production request.", 403)
      );
    }

    const cancelableStatuses = ["requested", "quoted", "accepted"];
    if (!cancelableStatuses.includes(request.status)) {
      return next(
        new AppError(
          `Cannot cancel production request in '${request.status}' status. Required status: 'requested', 'quoted', or 'accepted'.`,
          400
        )
      );
    }

    request.status = "cancelled";
    request.timeline.push({
      status: "cancelled",
      note: "Production request cancelled by requester",
      by: req.user._id,
      timestamp: new Date(),
    });

    await request.save();

    res.status(200).json({
      status: "success",
      message: "Production request cancelled successfully.",
      data: { productionRequest: request },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProductionRequest,
  getSentProductionRequests,
  getReceivedProductionRequests,
  getProductionRequestById,
  submitQuote,
  respondToQuote,
  startProduction,
  completeProduction,
  cancelProductionRequest,
};
