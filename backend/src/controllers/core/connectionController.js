const connectionService = require("../../services/core/connectionService");

/**
 * @desc    Send a connection request to another rider
 * @route   POST /api/core/connections/request
 * @access  Private
 */
const sendRequest = async (req, res, next) => {
  try {
    const fromUserId = req.user._id;
    const { toUserId } = req.body;

    const result = await connectionService.sendConnectionRequest(fromUserId, toUserId);

    res.status(201).json({
      status: "success",
      message: result.message,
      data: {
        connectionRequest: result.connectionRequest,
        autoAccepted: result.autoAccepted,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Respond to an incoming connection request (accept or ignore)
 * @route   PATCH /api/core/connections/requests/:id/respond
 * @access  Private
 */
const respond = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const requestId = req.params.id;
    const { action } = req.body;

    const updatedRequest = await connectionService.respondToRequest(requestId, userId, action);

    res.status(200).json({
      status: "success",
      message: `Connection request successfully ${updatedRequest.status}.`,
      data: {
        connectionRequest: updatedRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all accepted connections for the logged-in user
 * @route   GET /api/core/connections
 * @access  Private
 */
const getConnections = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const connections = await connectionService.getConnections(userId);

    res.status(200).json({
      status: "success",
      results: connections.length,
      data: {
        connections,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get incoming pending connection requests
 * @route   GET /api/core/connections/requests/incoming
 * @access  Private
 */
const getIncoming = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const requests = await connectionService.getIncomingRequests(userId);

    res.status(200).json({
      status: "success",
      results: requests.length,
      data: {
        requests,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get outgoing pending connection requests
 * @route   GET /api/core/connections/requests/outgoing
 * @access  Private
 */
const getOutgoing = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const requests = await connectionService.getOutgoingRequests(userId);

    res.status(200).json({
      status: "success",
      results: requests.length,
      data: {
        requests,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendRequest,
  respond,
  getConnections,
  getIncoming,
  getOutgoing,
};
