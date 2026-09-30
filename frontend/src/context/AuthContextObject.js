import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

const defaultAuthContext = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  authModalOpen: false,
  authModalTab: "login",
  pendingOtpData: null,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  resendOtp: async () => ({ success: false }),
  logout: () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
}
