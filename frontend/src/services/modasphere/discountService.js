export const discountService = {
  async getDiscounts() {
    return [];
  },

  async createDiscount(data) {
    return data;
  },

  async updateDiscount(id, data) {
    return { id, ...data };
  },
};