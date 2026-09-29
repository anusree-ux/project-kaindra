const Drop = require("../../models/modasphere/Drop");
const Order = require("../../models/modasphere/Order");

/**
 * Recalculates and transitions drop statuses based on current time.
 * @returns {Promise<{ updatedToLive: number, updatedToEnded: number }>}
 */
const updateDropStatuses = async () => {
  const now = new Date();

  // 1. Upcoming -> Ended (if endTime passed)
  const endedFromUpcoming = await Drop.updateMany(
    {
      status: "upcoming",
      endTime: { $ne: null, $lte: now },
    },
    { $set: { status: "ended" } }
  );

  // 2. Upcoming -> Live
  const toLive = await Drop.updateMany(
    {
      status: "upcoming",
      startTime: { $lte: now },
      $or: [{ endTime: null }, { endTime: { $gt: now } }],
    },
    { $set: { status: "live" } }
  );

  // 3. Live -> Ended
  const toEnded = await Drop.updateMany(
    {
      status: "live",
      endTime: { $ne: null, $lte: now },
    },
    { $set: { status: "ended" } }
  );

  return {
    updatedToLive: toLive.modifiedCount || 0,
    updatedToEnded: (endedFromUpcoming.modifiedCount || 0) + (toEnded.modifiedCount || 0),
  };
};

/**
 * Counts how many units of this drop's products the user has already ordered (paid/shipped/delivered orders)
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} dropId
 * @returns {Promise<number>}
 */
const getUserPurchaseCountInDrop = async (userId, dropId) => {
  const drop = await Drop.findById(dropId);
  if (!drop || !drop.productIds || drop.productIds.length === 0) {
    return 0;
  }

  const dropProductIds = drop.productIds.map((id) => id.toString());

  const orders = await Order.find({
    buyerId: userId,
    status: { $in: ["paid", "shipped", "delivered"] },
    "items.productId": { $in: drop.productIds },
  });

  let purchasedCount = 0;
  for (const order of orders) {
    for (const item of order.items) {
      if (dropProductIds.includes(item.productId.toString())) {
        purchasedCount += item.quantity;
      }
    }
  }

  return purchasedCount;
};

module.exports = {
  updateDropStatuses,
  getUserPurchaseCountInDrop,
};
