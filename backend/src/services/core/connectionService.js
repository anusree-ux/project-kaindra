const ConnectionRequest = require("../../models/core/ConnectionRequest");
const User = require("../../models/core/User");
const AppError = require("../../utils/AppError");

/**
 * Send a connection request from one user to another
 * @param {string|ObjectId} fromUserId
 * @param {string|ObjectId} toUserId
 * @returns {Promise<{connectionRequest: Object, autoAccepted: boolean, message: string}>}
 */
const sendConnectionRequest = async (fromUserId, toUserId) => {
  if (fromUserId.toString() === toUserId.toString()) {
    throw new AppError("You cannot send a connection request to yourself.", 400);
  }

  const targetUser = await User.findById(toUserId);
  if (!targetUser) {
    throw new AppError("Target user not found.", 404);
  }

  // Check if an opposite-direction request exists
  const oppositeRequest = await ConnectionRequest.findOne({
    fromUserId: toUserId,
    toUserId: fromUserId,
  });

  if (oppositeRequest && oppositeRequest.status === "pending") {
    // Auto-accept both as connected
    oppositeRequest.status = "accepted";
    oppositeRequest.respondedAt = new Date();
    await oppositeRequest.save();

    return {
      connectionRequest: oppositeRequest,
      autoAccepted: true,
      message: "Mutual request detected. You are now connected!",
    };
  }

  // Check if any request already exists between these two users (pending or accepted)
  const existingRequest = await ConnectionRequest.findOne({
    $or: [
      { fromUserId, toUserId },
      { fromUserId: toUserId, toUserId: fromUserId },
    ],
  });

  if (existingRequest) {
    if (existingRequest.status === "accepted") {
      throw new AppError("You are already connected with this user.", 400);
    }
    if (existingRequest.status === "pending") {
      throw new AppError("A connection request between these users is already pending.", 400);
    }
  }

  // If previous request was ignored, reactivate it to pending
  let request;
  const sameDirIgnored = await ConnectionRequest.findOne({ fromUserId, toUserId, status: "ignored" });
  if (sameDirIgnored) {
    sameDirIgnored.status = "pending";
    sameDirIgnored.respondedAt = undefined;
    await sameDirIgnored.save();
    request = sameDirIgnored;
  } else {
    request = await ConnectionRequest.create({
      fromUserId,
      toUserId,
      status: "pending",
    });
  }

  return {
    connectionRequest: request,
    autoAccepted: false,
    message: "Connection request sent successfully.",
  };
};

/**
 * Respond to an incoming connection request (accept or ignore)
 * @param {string|ObjectId} requestId
 * @param {string|ObjectId} userId
 * @param {"accept"|"ignore"} action
 * @returns {Promise<Object>}
 */
const respondToRequest = async (requestId, userId, action) => {
  if (!["accept", "ignore"].includes(action)) {
    throw new AppError("Action must be either 'accept' or 'ignore'.", 400);
  }

  const request = await ConnectionRequest.findById(requestId);
  if (!request) {
    throw new AppError("Connection request not found.", 404);
  }

  // Only the recipient (toUserId) can respond
  if (request.toUserId.toString() !== userId.toString()) {
    throw new AppError("Only the recipient of this connection request can respond.", 403);
  }

  if (request.status !== "pending") {
    throw new AppError(`Connection request has already been ${request.status}.`, 400);
  }

  const newStatus = action === "accept" ? "accepted" : "ignored";
  request.status = newStatus;
  request.respondedAt = new Date();
  await request.save();

  return request;
};

/**
 * Get all accepted connections for a user
 * @param {string|ObjectId} userId
 * @returns {Promise<Array<Object>>}
 */
const getConnections = async (userId) => {
  const requests = await ConnectionRequest.find({
    status: "accepted",
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  })
    .populate("fromUserId", "name email phoneNumber role")
    .populate("toUserId", "name email phoneNumber role");

  const connections = requests.map((req) => {
    const isFromMe = req.fromUserId._id.toString() === userId.toString();
    const partner = isFromMe ? req.toUserId : req.fromUserId;
    return {
      requestId: req._id,
      connectedAt: req.respondedAt || req.updatedAt,
      user: partner,
    };
  });

  return connections;
};

/**
 * Get incoming pending connection requests for a user
 * @param {string|ObjectId} userId
 * @returns {Promise<Array<Object>>}
 */
const getIncomingRequests = async (userId) => {
  return await ConnectionRequest.find({
    toUserId: userId,
    status: "pending",
  }).populate("fromUserId", "name email phoneNumber role");
};

/**
 * Get outgoing pending connection requests sent by a user
 * @param {string|ObjectId} userId
 * @returns {Promise<Array<Object>>}
 */
const getOutgoingRequests = async (userId) => {
  return await ConnectionRequest.find({
    fromUserId: userId,
    status: "pending",
  }).populate("toUserId", "name email phoneNumber role");
};

module.exports = {
  sendConnectionRequest,
  respondToRequest,
  getConnections,
  getIncomingRequests,
  getOutgoingRequests,
};
