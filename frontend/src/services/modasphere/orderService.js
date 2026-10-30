export const orderService = {
  async getOrders() {
    return [];
  },

  async getOrder() {
    return null;
  },

  async updateStatus(id, status) {
    return { id, status };
  },
};