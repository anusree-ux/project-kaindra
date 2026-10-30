const mongoose = require("mongoose");
const Order = require("../../models/modasphere/Order");
const Product = require("../../models/modasphere/Product");

// Valid sales statuses for revenue & volume accounting (excludes pending_payment and cancelled)
const VALID_SALES_STATUSES = ["paid", "shipped", "delivered"];

/**
 * Get aggregated summary metrics for a specific seller
 * Note: Item-level revenue is gross, before any discount code applied at checkout.
 * 
 * @param {string|mongoose.Types.ObjectId} sellerId
 * @param {Date} fromDate
 * @param {Date} toDate
 * @returns {Promise<Object>}
 */
const getSellerSummary = async (sellerId, fromDate, toDate) => {
  const sellerObjId = new mongoose.Types.ObjectId(sellerId);

  // 1. Compute revenue, units, and distinct orders for valid sales
  const salesStats = await Order.aggregate([
    {
      $match: {
        status: { $in: VALID_SALES_STATUSES },
        createdAt: { $gte: fromDate, $lte: toDate },
      },
    },
    { $unwind: "$items" },
    {
      $match: {
        "items.sellerId": sellerObjId,
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: { $multiply: ["$items.price", "$items.quantity"] },
        },
        totalUnitsSold: { $sum: "$items.quantity" },
        distinctOrders: { $addToSet: "$_id" },
      },
    },
  ]);

  // 2. Compute orders by status containing this seller's items in the date range
  const statusStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: fromDate, $lte: toDate },
        "items.sellerId": sellerObjId,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const ordersByStatus = {
    pending_payment: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  statusStats.forEach((s) => {
    if (ordersByStatus[s._id] !== undefined) {
      ordersByStatus[s._id] = s.count;
    }
  });

  let totalRevenue = 0;
  let totalUnitsSold = 0;
  let distinctOrders = 0;
  let averageOrderValue = 0;

  if (salesStats.length > 0) {
    totalRevenue = Math.round((salesStats[0].totalRevenue + Number.EPSILON) * 100) / 100;
    totalUnitsSold = salesStats[0].totalUnitsSold || 0;
    distinctOrders = salesStats[0].distinctOrders ? salesStats[0].distinctOrders.length : 0;
    if (distinctOrders > 0) {
      averageOrderValue = Math.round((totalRevenue / distinctOrders + Number.EPSILON) * 100) / 100;
    }
  }

  return {
    totalRevenue,
    totalUnitsSold,
    distinctOrders,
    averageOrderValue,
    ordersByStatus,
  };
};

/**
 * Get sales trend over time grouped by day, week, or month
 * Note: Item-level revenue is gross, before any discount code applied at checkout.
 * 
 * @param {string|mongoose.Types.ObjectId} sellerId
 * @param {Date} fromDate
 * @param {Date} toDate
 * @param {"day"|"week"|"month"} interval
 * @returns {Promise<Array>}
 */
const getSellerSalesTrend = async (sellerId, fromDate, toDate, interval = "day") => {
  const sellerObjId = new mongoose.Types.ObjectId(sellerId);

  let dateFormat = "%Y-%m-%d";
  if (interval === "week") {
    dateFormat = "%G-W%V";
  } else if (interval === "month") {
    dateFormat = "%Y-%m";
  }

  const trend = await Order.aggregate([
    {
      $match: {
        status: { $in: VALID_SALES_STATUSES },
        createdAt: { $gte: fromDate, $lte: toDate },
      },
    },
    { $unwind: "$items" },
    {
      $match: {
        "items.sellerId": sellerObjId,
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          orderId: "$_id",
        },
        itemRevenue: {
          $sum: { $multiply: ["$items.price", "$items.quantity"] },
        },
        itemUnits: { $sum: "$items.quantity" },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        revenue: { $sum: "$itemRevenue" },
        units: { $sum: "$itemUnits" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return trend.map((item) => ({
    date: item._id,
    revenue: Math.round((item.revenue + Number.EPSILON) * 100) / 100,
    units: item.units,
    orders: item.orders,
  }));
};

/**
 * Get top selling products for a seller by units and revenue
 * Note: Item-level revenue is gross, before any discount code applied at checkout.
 * 
 * @param {string|mongoose.Types.ObjectId} sellerId
 * @param {number} limit
 * @param {Date} [fromDate]
 * @param {Date} [toDate]
 * @returns {Promise<Object>}
 */
const getSellerTopProducts = async (sellerId, limit = 10, fromDate, toDate) => {
  const sellerObjId = new mongoose.Types.ObjectId(sellerId);

  const matchStage = {
    status: { $in: VALID_SALES_STATUSES },
  };

  if (fromDate && toDate) {
    matchStage.createdAt = { $gte: fromDate, $lte: toDate };
  }

  const results = await Order.aggregate([
    { $match: matchStage },
    { $unwind: "$items" },
    {
      $match: {
        "items.sellerId": sellerObjId,
      },
    },
    {
      $group: {
        _id: "$items.productId",
        unitsSold: { $sum: "$items.quantity" },
        revenue: {
          $sum: { $multiply: ["$items.price", "$items.quantity"] },
        },
      },
    },
    {
      $lookup: {
        from: Product.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        name: "$product.name",
        unitsSold: "$unitsSold",
        revenue: { $round: ["$revenue", 2] },
        averageRating: { $ifNull: ["$product.averageRating", 0] },
        reviewCount: { $ifNull: ["$product.reviewCount", 0] },
      },
    },
  ]);

  const byUnits = [...results]
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, Number(limit));

  const byRevenue = [...results]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, Number(limit));

  return {
    byUnits,
    byRevenue,
  };
};

/**
 * Get low stock active products for a seller
 * 
 * @param {string|mongoose.Types.ObjectId} sellerId
 * @param {number} threshold
 * @returns {Promise<Array>}
 */
const getSellerLowStock = async (sellerId, threshold = 5) => {
  const sellerObjId = new mongoose.Types.ObjectId(sellerId);

  const lowStockProducts = await Product.find({
    sellerId: sellerObjId,
    status: "active",
    stock: { $lte: Number(threshold) },
  })
    .select("name price stock category averageRating reviewCount createdAt")
    .sort({ stock: 1 });

  return lowStockProducts;
};

/**
 * Get platform-wide summary metrics for administrators
 * Note: Gross revenue reflects valid completed/shipped/paid order totals.
 * 
 * @param {Date} fromDate
 * @param {Date} toDate
 * @returns {Promise<Object>}
 */
const getPlatformSummary = async (fromDate, toDate) => {
  // 1. Sales & buyer/seller stats
  const salesStats = await Order.aggregate([
    {
      $match: {
        status: { $in: VALID_SALES_STATUSES },
        createdAt: { $gte: fromDate, $lte: toDate },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        grossRevenue: { $sum: "$totalAmount" },
        buyers: { $addToSet: "$buyerId" },
        items: { $push: "$items" },
      },
    },
  ]);

  // 2. Processed refund stats (matching refundStatus: "processed")
  const refundStats = await Order.aggregate([
    {
      $match: {
        refundStatus: "processed",
        createdAt: { $gte: fromDate, $lte: toDate },
      },
    },
    {
      $group: {
        _id: null,
        refundCount: { $sum: 1 },
        totalRefundedAmount: { $sum: { $ifNull: ["$refundAmount", 0] } },
      },
    },
  ]);

  let totalOrders = 0;
  let grossRevenue = 0;
  let activeSellers = 0;
  let totalBuyers = 0;
  let refundCount = 0;
  let totalRefundedAmount = 0;

  if (salesStats.length > 0) {
    totalOrders = salesStats[0].totalOrders || 0;
    grossRevenue = Math.round((salesStats[0].grossRevenue + Number.EPSILON) * 100) / 100;
    totalBuyers = salesStats[0].buyers ? salesStats[0].buyers.length : 0;

    const sellerSet = new Set();
    if (Array.isArray(salesStats[0].items)) {
      salesStats[0].items.forEach((itemList) => {
        if (Array.isArray(itemList)) {
          itemList.forEach((it) => {
            if (it.sellerId) sellerSet.add(it.sellerId.toString());
          });
        }
      });
    }
    activeSellers = sellerSet.size;
  }

  if (refundStats.length > 0) {
    refundCount = refundStats[0].refundCount || 0;
    totalRefundedAmount = Math.round((refundStats[0].totalRefundedAmount + Number.EPSILON) * 100) / 100;
  }

  return {
    totalOrders,
    grossRevenue,
    activeSellers,
    totalBuyers,
    refundCount,
    totalRefundedAmount,
  };
};

/**
 * Get platform-wide top categories by revenue and units
 * 
 * @param {Date} fromDate
 * @param {Date} toDate
 * @param {number} limit
 * @returns {Promise<Array>}
 */
const getPlatformTopCategories = async (fromDate, toDate, limit = 10) => {
  const categories = await Order.aggregate([
    {
      $match: {
        status: { $in: VALID_SALES_STATUSES },
        createdAt: { $gte: fromDate, $lte: toDate },
      },
    },
    { $unwind: "$items" },
    {
      $lookup: {
        from: Product.collection.name,
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $group: {
        _id: "$product.category",
        revenue: {
          $sum: { $multiply: ["$items.price", "$items.quantity"] },
        },
        unitsSold: { $sum: "$items.quantity" },
        distinctOrders: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        revenue: { $round: ["$revenue", 2] },
        unitsSold: 1,
        orderCount: { $size: "$distinctOrders" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: Number(limit) },
  ]);

  return categories;
};

module.exports = {
  getSellerSummary,
  getSellerSalesTrend,
  getSellerTopProducts,
  getSellerLowStock,
  getPlatformSummary,
  getPlatformTopCategories,
};
