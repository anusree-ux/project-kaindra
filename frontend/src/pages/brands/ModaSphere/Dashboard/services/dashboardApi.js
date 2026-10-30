import apiClient from "../../../../../services/apiClient";

/* =========================================================================
   MODASPHERE SELLER DASHBOARD API SERVICE
   Connects the frontend seller dashboard to the backend REST endpoints.
========================================================================= */

// --- Overview & Performance Insights ---
export const getSellerSummary = async (params = {}) => {
  const res = await apiClient.get("/api/modasphere/insights/seller/summary", { params });
  return res.data?.data || res.data || {};
};

export const getSellerSalesTrend = async (params = {}) => {
  const res = await apiClient.get("/api/modasphere/insights/seller/trend", { params });
  return res.data?.data?.trend || res.data?.trend || [];
};

export const getSellerLowStock = async () => {
  const res = await apiClient.get("/api/modasphere/insights/seller/low-stock");
  return res.data?.data?.products || res.data?.products || [];
};

export const getSellerTopProducts = async (params = {}) => {
  const res = await apiClient.get("/api/modasphere/insights/seller/top-products", { params });
  return res.data?.data?.products || res.data?.products || [];
};

// --- Products ---
export const getSellerProducts = async (params = {}) => {
  try {
    const res = await apiClient.get("/api/modasphere/products/seller/me", { params });
    const list = res.data?.data?.products || res.data?.products;
    if (Array.isArray(list)) return list;
    return [];
  } catch (err) {
    // If seller has no products yet or fallback needed
    console.warn("[DashboardApi] getSellerProducts notice:", err.message);
    const fallbackRes = await apiClient.get("/api/modasphere/products", { params }).catch(() => null);
    return fallbackRes?.data?.data?.products || fallbackRes?.data?.products || [];
  }
};

export const getProductById = async (id) => {
  const res = await apiClient.get(`/api/modasphere/products/${id}`);
  return res.data?.data?.product || res.data?.product || res.data;
};

export const createProduct = async (productData) => {
  const isForm = productData instanceof FormData;
  const config = isForm
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : {};
  const res = await apiClient.post("/api/modasphere/products", productData, config);
  return res.data?.data?.product || res.data?.product || res.data;
};

export const updateProduct = async (id, productData) => {
  const isForm = productData instanceof FormData;
  const config = isForm
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : {};
  const res = await apiClient.patch(`/api/modasphere/products/${id}`, productData, config);
  return res.data?.data?.product || res.data?.product || res.data;
};

export const publishProduct = async (id) => {
  const res = await apiClient.patch(`/api/modasphere/products/${id}/publish`);
  return res.data?.data?.product || res.data?.product || res.data;
};

export const deleteProduct = async (id) => {
  const res = await apiClient.delete(`/api/modasphere/products/${id}`);
  return res.data;
};

// --- Orders ---
export const getSellerOrders = async (params = {}) => {
  try {
    const res = await apiClient.get("/api/modasphere/orders/seller/me", { params });
    return res.data?.data?.orders || res.data?.orders || [];
  } catch (err) {
    console.warn("[DashboardApi] getSellerOrders notice:", err.message);
    const myOrdersRes = await apiClient.get("/api/modasphere/orders/me", { params }).catch(() => null);
    return myOrdersRes?.data?.data?.orders || myOrdersRes?.data?.orders || [];
  }
};

export const getOrderById = async (id) => {
  const res = await apiClient.get(`/api/modasphere/orders/${id}`);
  const order = res.data?.data?.order || res.data?.order || res.data;
  const shipment = res.data?.data?.shipment || res.data?.shipment;
  if (order && shipment && !order.shipment) {
    order.shipment = shipment;
  }
  return order;
};

export const shipOrder = async (id, data = {}) => {
  const res = await apiClient.patch(`/api/modasphere/orders/${id}/ship`, data);
  const order = res.data?.data?.order || res.data?.order || res.data;
  const shipment = res.data?.data?.shipment || res.data?.shipment;
  if (order && shipment && !order.shipment) {
    order.shipment = shipment;
  }
  return order;
};

export const deliverOrder = async (id) => {
  const res = await apiClient.patch(`/api/modasphere/orders/${id}/deliver`);
  return res.data?.data?.order || res.data?.order || res.data;
};

export const cancelOrder = async (id, reason = "") => {
  const res = await apiClient.patch(`/api/modasphere/orders/${id}/cancel`, { reason });
  return res.data?.data?.order || res.data?.order || res.data;
};

// --- Drops ---
export const getSellerDrops = async (params = {}) => {
  const res = await apiClient.get("/api/modasphere/drops", { params });
  return res.data?.data?.drops || res.data?.drops || [];
};

export const getDropById = async (id) => {
  const res = await apiClient.get(`/api/modasphere/drops/${id}`);
  return res.data?.data?.drop || res.data?.drop || res.data;
};

export const createDrop = async (dropData) => {
  const res = await apiClient.post("/api/modasphere/drops", dropData);
  return res.data?.data?.drop || res.data?.drop || res.data;
};

// --- Discounts ---
export const getDiscountCodes = async () => {
  try {
    const res = await apiClient.get("/api/modasphere/discount-codes");
    return res.data?.data?.discountCodes || res.data?.discountCodes || [];
  } catch (err) {
    console.warn("[DashboardApi] getDiscountCodes notice:", err.message);
    return [];
  }
};

export const createDiscountCode = async (data) => {
  const res = await apiClient.post("/api/modasphere/discount-codes", data);
  return res.data?.data?.discountCode || res.data?.discountCode || res.data;
};

export const updateDiscountCode = async (id, data) => {
  const res = await apiClient.patch(`/api/modasphere/discount-codes/${id}`, data);
  return res.data?.data?.discountCode || res.data?.discountCode || res.data;
};

export const deleteDiscountCode = async (id) => {
  const res = await apiClient.delete(`/api/modasphere/discount-codes/${id}`);
  return res.data;
};

// --- Production Requests ---
export const getProductionRequestsSent = async () => {
  try {
    const res = await apiClient.get("/api/modasphere/production-requests/sent");
    return res.data?.data?.requests || res.data?.requests || [];
  } catch (err) {
    console.warn("[DashboardApi] getProductionRequests notice:", err.message);
    return [];
  }
};

export const getProductionRequestById = async (id) => {
  const res = await apiClient.get(`/api/modasphere/production-requests/${id}`);
  return res.data?.data?.request || res.data?.request || res.data;
};

// --- Business Profile & Status ---
export const getBusinessProfileStatus = async () => {
  const res = await apiClient.get("/api/modasphere/business/profile-status");
  return res.data?.data || res.data;
};

export const setupBusinessProfile = async (profileData) => {
  const res = await apiClient.post("/api/modasphere/business/setup-profile", profileData);
  return res.data?.data || res.data;
};

export const getMySellerProfile = async () => {
  const res = await apiClient.get("/api/modasphere/sellers/me");
  return res.data?.data?.seller || res.data?.seller;
};

export const updateSellerProfile = async (data) => {
  const res = await apiClient.put("/api/modasphere/sellers/me", data);
  return res.data?.data?.seller || res.data?.seller;
};

export const getMyManufacturerProfile = async () => {
  const res = await apiClient.get("/api/modasphere/manufacturers/me");
  return res.data?.data?.manufacturer || res.data?.manufacturer;
};

export const updateManufacturerProfile = async (data) => {
  const res = await apiClient.put("/api/modasphere/manufacturers/me", data);
  return res.data?.data?.manufacturer || res.data?.manufacturer;
};

