import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "../services/apiClient";

const CommunityAuthContext = createContext(null);

export function CommunityAuthProvider({ children }) {
  const [communityUser, setCommunityUser] = useState(() => {
    try {
      const stored = localStorage.getItem("community_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [communityToken, setCommunityToken] = useState(() => {
    try {
      return localStorage.getItem("community_token") || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Check current community session on mount
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("community_token");
    if (!token) {
      setCommunityUser(null);
      setCommunityToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.get("/api/community/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.data?.user) {
        setCommunityUser(res.data.data.user);
        setCommunityToken(token);
        localStorage.setItem("community_user", JSON.stringify(res.data.data.user));
      } else {
        throw new Error("Invalid session");
      }
    } catch (err) {
      console.warn("[CommunityAuth] Session check error:", err?.response?.data?.message || err.message);
      localStorage.removeItem("community_token");
      localStorage.removeItem("community_user");
      setCommunityUser(null);
      setCommunityToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Sign up
  const signup = useCallback(async ({ name, email, password, phone }) => {
    try {
      const res = await apiClient.post("/api/community/auth/signup", {
        name,
        email,
        password,
        phone,
      });

      const { token, data } = res.data;
      if (token && data?.user) {
        setCommunityToken(token);
        setCommunityUser(data.user);
        localStorage.setItem("community_token", token);
        localStorage.setItem("community_user", JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false, message: "Missing token in response." };
    } catch (err) {
      const msg = err.response?.data?.message || "Community sign up failed.";
      return { success: false, message: msg };
    }
  }, []);

  // Login
  const login = useCallback(async ({ email, password }) => {
    try {
      const res = await apiClient.post("/api/community/auth/login", {
        email,
        password,
      });

      const { token, data } = res.data;
      if (token && data?.user) {
        setCommunityToken(token);
        setCommunityUser(data.user);
        localStorage.setItem("community_token", token);
        localStorage.setItem("community_user", JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false, message: "Missing token in response." };
    } catch (err) {
      const msg = err.response?.data?.message || "Community login failed.";
      return { success: false, message: msg };
    }
  }, []);

  // Profile Setup
  const profileSetup = useCallback(async (setupData) => {
    const token = localStorage.getItem("community_token") || communityToken;
    if (!token) return { success: false, message: "Not authenticated" };

    try {
      const res = await apiClient.post("/api/community/auth/profile-setup", setupData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.data?.user) {
        const updated = res.data.data.user;
        setCommunityUser(updated);
        localStorage.setItem("community_user", JSON.stringify(updated));
        return { success: true, user: updated };
      }
      return { success: false, message: "Profile update failed." };
    } catch (err) {
      const msg = err.response?.data?.message || "Profile setup failed.";
      return { success: false, message: msg };
    }
  }, [communityToken]);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem("community_token");
    localStorage.removeItem("community_user");
    setCommunityUser(null);
    setCommunityToken(null);
  }, []);

  const value = useMemo(
    () => ({
      communityUser,
      communityToken,
      isCommunityAuth: Boolean(communityUser && communityToken),
      loading,
      signup,
      login,
      profileSetup,
      logout,
      checkAuth,
    }),
    [communityUser, communityToken, loading, signup, login, profileSetup, logout, checkAuth]
  );

  return <CommunityAuthContext.Provider value={value}>{children}</CommunityAuthContext.Provider>;
}

export function useCommunityAuth() {
  const context = useContext(CommunityAuthContext);
  if (!context) {
    throw new Error("useCommunityAuth must be used within a CommunityAuthProvider");
  }
  return context;
}
