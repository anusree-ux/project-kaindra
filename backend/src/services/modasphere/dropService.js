const Drop = require("../../models/modasphere/Drop");
const Order = require("../../models/modasphere/Order");
const ProductDropWaitlist = require("../../models/modasphere/ProductDropWaitlist");
const Product = require("../../models/modasphere/Product");
const { sendEmail } = require("../mototribe/emailService");

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

/**
 * Notifies the next user in the waitlist when stock becomes available.
 * @param {string|ObjectId} productId
 * @returns {Promise<Object>}
 */
const notifyNextProductDropWaitlistUser = async (productId) => {
  try {
    const product = await Product.findById(productId);

    if (!product || !product.isDrop) {
      return {
        success: false,
        notified: false,
        error: "Drop product not found.",
      };
    }

    const waitlistEntry = await ProductDropWaitlist.findOne({
      productId: product._id,
    })
      .sort({ joinedAt: 1 })
      .populate("userId", "name email");

    if (!waitlistEntry || !waitlistEntry.userId) {
      return {
        success: true,
        notified: false,
        message: "No users are waiting for this drop.",
      };
    }

    const user = waitlistEntry.userId;

    if (!user.email) {
      return {
        success: false,
        notified: false,
        error: "Waitlisted user does not have an email address.",
      };
    }

    const subject = `${product.name} is back in stock`;

    const htmlBody = `
      <h2>Good news! Your ModaDrop is available.</h2>

      <p>Hi ${user.name || "there"},</p>

      <p>
        <strong>${product.name}</strong> is now available again.
      </p>

      <p>
        Stock is limited, so we recommend purchasing it as soon as possible.
      </p>

      <p>
        Please visit ModaSphere to complete your purchase.
      </p>

      <p>Thank you for shopping with ModaSphere.</p>
    `;

    const emailResult = await sendEmail(
      user.email,
      subject,
      htmlBody
    );

    if (!emailResult.success) {
      console.error(
        `[ModaDrop Waitlist] Failed to notify ${user.email}:`,
        emailResult.error
      );

      return {
        success: false,
        notified: false,
        error: emailResult.error,
      };
    }

    await ProductDropWaitlist.deleteOne({
      _id: waitlistEntry._id,
    });

    console.log(
      `[ModaDrop Waitlist] Notified ${user.email} for product ${product.name}.`
    );

    return {
      success: true,
      notified: true,
      userId: user._id,
      email: user.email,
      productId: product._id,
      messageId: emailResult.messageId,
    };
  } catch (error) {
    console.error(
      "[ModaDrop Waitlist] Notification error:",
      error.message || error
    );

    return {
      success: false,
      notified: false,
      error: error.message || "Failed to notify waitlisted user.",
    };
  }
};

module.exports = {
  updateDropStatuses,
  getUserPurchaseCountInDrop,
  notifyNextProductDropWaitlistUser,
};
