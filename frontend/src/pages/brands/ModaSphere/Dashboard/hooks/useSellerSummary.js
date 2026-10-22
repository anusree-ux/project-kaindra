import { useMemo } from "react";

const useSellerSummary = ({
  products = [],
  orders = [],
  drops = [],
} = {}) => {
  return useMemo(() => {
    const revenue = orders.reduce(
      (total, order) =>
        total + Number(order.total || 0),
      0
    );

    return {
      products: products.length,
      orders: orders.length,
      drops: drops.length,
      revenue,
    };
  }, [products, orders, drops]);
};

export default useSellerSummary;