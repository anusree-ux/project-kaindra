export const insightsService = {
  async getOverview() {
    return {
      revenue: 0,
      orders: 0,
      products: 0,
      activeDrops: 0,
      salesTrend: [],
    };
  },
};