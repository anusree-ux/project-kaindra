import { useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "./AuthContextObject";
import apiClient, { setAccessToken } from "../services/apiClient";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("login"); // "login" | "signup" | "otp"
  const [pendingOtpData, setPendingOtpData] = useState(null); // { userId, phoneNumber }

  // Update memory token in both context and apiClient
  const updateToken = useCallback((token) => {
    setAccessToken(token);
    setTokenState(token);
  }, []);

  // Open modal helper
  const openAuthModal = useCallback((tab = "login", otpData = null) => {
    setAuthModalTab(tab);
    if (otpData) {
      setPendingOtpData(otpData);
    }
    setAuthModalOpen(true);
  }, []);

  // Close modal helper
  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  // Silent session restore on mount via httpOnly refresh cookie
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.post("/api/auth/refresh");
      const data = res.data?.data || res.data;

      if (data?.accessToken) {
        updateToken(data.accessToken);
        const meRes = await apiClient.get("/api/auth/me");
        const meData = meRes.data?.data || meRes.data;
        if (meData?.user) {
          setUser(meData.user);
        }
      }
    } catch {
      updateToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [updateToken]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await apiClient.post("/api/auth/login", { email, password });
      const accessToken = res.data?.accessToken;
      const user = res.data?.data?.user || res.data?.user;

      if (accessToken && user) {
        updateToken(accessToken);
        setUser(user);
        closeAuthModal();
        return { success: true };
      }
      return {
        success: false,
        message: "Login failed: Missing token or user profile in response.",
      };
    } catch (error) {
      const resp = error.response?.data;

      // Handle unverified phone number case (403 with userId)
      if (error.response?.status === 403 && resp?.userId) {
        openAuthModal("otp", {
          userId: resp.userId,
          phoneNumber: resp.phoneNumber || "your registered phone number",
        });
        return {
          success: false,
          needsOtp: true,
          message: resp.message || "Phone number not verified. Please enter OTP.",
        };
      }

      return {
        success: false,
        message: resp?.message || "Login failed. Please check your credentials.",
      };
    }
  };

  // Signup handler
  const signup = async (formData) => {
    try {
      const res = await apiClient.post("/api/auth/signup", formData);
      const data = res.data?.data || res.data;

      if (data?.userId) {
        const otpData = {
          userId: data.userId,
          phoneNumber: data.phoneNumber || formData.phoneNumber,
        };
        openAuthModal("otp", otpData);
        return { success: true, data: otpData };
      }
      return { success: false, message: "Signup failed. Missing user ID in response." };
    } catch (error) {
      const resp = error.response?.data;
      return {
        success: false,
        message: resp?.message || "Registration failed. Please check your input.",
      };
    }
  };

  // Verify OTP handler
  const verifyOtp = async (userId, otpCode) => {
    try {
      const res = await apiClient.post("/api/auth/verify-otp", { userId, otpCode });
      const accessToken = res.data?.accessToken;
      const user = res.data?.data?.user || res.data?.user;

      if (accessToken && user) {
        updateToken(accessToken);
        setUser(user);
        setPendingOtpData(null);
        closeAuthModal();
        return { success: true };
      }
      return { success: false, message: "OTP verification failed: Missing token in response." };
    } catch (error) {
      const resp = error.response?.data;
      return {
        success: false,
        message: resp?.message || "Invalid or expired OTP code.",
      };
    }
  };

  // Resend OTP handler
  const resendOtp = async (userId) => {
    try {
      const res = await apiClient.post("/api/auth/resend-otp", { userId });
      return {
        success: true,
        message: res.data?.message || "New OTP code sent successfully!",
      };
    } catch (error) {
      const resp = error.response?.data;
      return {
        success: false,
        message: resp?.message || "Failed to resend OTP. Please try again later.",
      };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      // Ignore logout errors
    } finally {
      updateToken(null);
      setUser(null);
      setPendingOtpData(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      loading,
      authModalOpen,
      authModalTab,
      pendingOtpData,
      openAuthModal,
      closeAuthModal,
      login,
      signup,
      verifyOtp,
      resendOtp,
      logout,
    }),
    [
      user,
      accessToken,
      loading,
      authModalOpen,
      authModalTab,
      pendingOtpData,
      openAuthModal,
      closeAuthModal,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
