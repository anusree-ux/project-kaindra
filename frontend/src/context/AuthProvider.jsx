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


  // Google OAuth Login handler (bypasses OTP completely)
  const loginWithGoogle = useCallback(async (googleData) => {
    try {
      const res = await apiClient.post("/api/auth/google", googleData);
      const accessToken = res.data?.accessToken;
      const user = res.data?.data?.user || res.data?.user;
      const isNewUser = Boolean(res.data?.isNewUser || res.data?.data?.isNewUser);

      if (accessToken && user) {
        updateToken(accessToken);
        setUser(user);
        closeAuthModal();

        try {
          const mtUser = {
            id: user._id || user.id,
            name: user.name || "Google User",
            email: user.email || "",
            role: user.role || "user",
            brands: user.brands || [],
          };
          localStorage.setItem("mototribe_user", JSON.stringify(mtUser));
        } catch {
          // Ignore localStorage errors; Google login can still succeed.
        }

        return { success: true, user, isNewUser };
      }

      return {
        success: false,
        message: "Google login failed: Missing token or user profile.",
      };
    } catch (error) {
      const resp = error.response?.data;
      return {
        success: false,
        message: resp?.message || "Google authentication failed. Please try again.",
      };
    }
  }, [closeAuthModal, updateToken]);

  // Login handler - passwordless Google OAuth
  const login = useCallback(async (credentials) => {
    if (
      typeof credentials === "object" &&
      credentials !== null &&
      (credentials.credential || credentials.googleId)
    ) {
      return loginWithGoogle(credentials);
    }

    return {
      success: false,
      message: "Password authentication is disabled. Please sign in with Google.",
    };
  }, [loginWithGoogle]);

  // Signup handler - passwordless Google OAuth
  const signup = useCallback(async (formData) => {
    if (
      typeof formData === "object" &&
      formData !== null &&
      (formData.credential || formData.googleId)
    ) {
      return loginWithGoogle(formData);
    }

    return {
      success: false,
      message: "Password signup is disabled. Please sign up with Google.",
    };
  }, [loginWithGoogle]);

  // Verify OTP handler
  const verifyOtp = useCallback(async (userId, otpCode) => {
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
  }, [closeAuthModal, updateToken]);

  // Resend OTP handler
  const resendOtp = useCallback(async (userId) => {
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
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      // Ignore logout errors
    } finally {
      updateToken(null);
      setUser(null);
      setPendingOtpData(null);
      try {
        localStorage.removeItem("mototribeVehicles");
        localStorage.removeItem("mototribeProfile");
        localStorage.removeItem("mototribe_user");
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [updateToken]);

  // Update current user state in React and localStorage
  const updateUser = useCallback((updatedFieldsOrUser) => {
    setUser((prev) => {
      if (!prev) return updatedFieldsOrUser;
      const merged = { ...prev, ...updatedFieldsOrUser };
      try {
        const stored = localStorage.getItem("mototribe_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem(
            "mototribe_user",
            JSON.stringify({ ...parsed, ...merged })
          );
        }
      } catch {
        // Ignore storage errors
      }
      return merged;
    });
  }, []);

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
      loginWithGoogle,
      signup,
      verifyOtp,
      resendOtp,
      logout,
      setUser,
      updateUser,
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
      login,
      loginWithGoogle,
      signup,
      verifyOtp,
      resendOtp,
      logout,
      updateUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
