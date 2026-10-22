export const productionRequestService = {
  async getRequests() {
    return [];
  },

  async getRequest() {
    return null;
  },

  async submitQuote(id, quote) {
    return {
      id,
      quote,
    };
  },
};