import { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiClient from "../services/apiClient";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unavailableItemsRemoved, setUnavailableItemsRemoved] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart([]);
      setUnavailableItemsRemoved(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/api/modasphere/cart");
      const cartData = res.data?.data?.cart;
      const removedFlag = res.data?.data?.unavailableItemsRemoved || false;

      setCart(cartData?.items || []);
      setUnavailableItemsRemoved(removedFlag);
    } catch (err) {
      console.error("[CartContext] Failed to fetch cart:", err);
      setError(err.response?.data?.message || "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) return false;

    try {
      const res = await apiClient.post("/api/modasphere/cart/items", {
        productId,
        quantity,
      });
      const updatedCart = res.data?.data?.cart;
      setCart(updatedCart?.items || []);
      setUnavailableItemsRemoved(false);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to add item to cart.";
      return { success: false, message };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!isAuthenticated) return false;

    try {
      const res = await apiClient.patch(`/api/modasphere/cart/items/${productId}`, {
        quantity,
      });
      const updatedCart = res.data?.data?.cart;
      setCart(updatedCart?.items || []);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update item quantity.";
      return { success: false, message };
    }
  };

  const removeFromCart = async (productId) => {
    if (!isAuthenticated) return false;

    try {
      const res = await apiClient.delete(`/api/modasphere/cart/items/${productId}`);
      const updatedCart = res.data?.data?.cart;
      setCart(updatedCart?.items || []);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to remove item.";
      return { success: false, message };
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return false;

    try {
      await apiClient.delete("/api/modasphere/cart");
      setCart([]);
      setUnavailableItemsRemoved(false);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to clear cart.";
      return { success: false, message };
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const subtotal = cart.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * (item.quantity || 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,
        loading,
        error,
        unavailableItemsRemoved,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
