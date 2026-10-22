export const productService = {
  async getProducts() {
    return [];
  },

  async getProduct() {
    return null;
  },

  async createProduct(product) {
    return product;
  },

  async updateProduct(id, product) {
    return { id, ...product };
  },

  async deleteProduct(id) {
    return { id };
  },
};