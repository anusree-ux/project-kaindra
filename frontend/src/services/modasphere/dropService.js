export const dropService = {
  async getDrops() {
    return [];
  },

  async createDrop(data) {
    return data;
  },

  async updateDrop(id, data) {
    return { id, ...data };
  },
};