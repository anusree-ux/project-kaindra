const toCustomerProduct = (product) => {
  if (!product) return product;

  const productObject =
    typeof product.toObject === "function" ? product.toObject() : { ...product };
  const availableStock = productObject.isDrop
    ? productObject.dropStock
    : productObject.stock;

  productObject.inStock = Number(availableStock) > 0;
  delete productObject.stock;
  delete productObject.dropStock;

  return productObject;
};

const toCustomerDrop = (drop) => {
  const dropObject =
    typeof drop.toObject === "function" ? drop.toObject() : { ...drop };

  dropObject.productIds = (dropObject.productIds || []).map(toCustomerProduct);
  return dropObject;
};

module.exports = {
  toCustomerProduct,
  toCustomerDrop,
};
