import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import apiClient from "../services/apiClient";
import { useAuth } from "./AuthContext";

const InfluenceProfilesContext = createContext(null);

export function InfluenceProfilesProvider({ children }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [brandProfile, setBrandProfile] = useState(null);
  const [influencerProfile, setInfluencerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brandError, setBrandError] = useState("");
  const [influencerError, setInfluencerError] = useState("");
  const [loadedForUserId, setLoadedForUserId] = useState(null);
  const requestId = useRef(0);
  const inFlightRequest = useRef(null);

  const refreshProfiles = useCallback(async () => {
    const currentUserId = user?._id || user?.id || null;
    if (!isAuthenticated) {
      requestId.current += 1;
      inFlightRequest.current = null;
      setBrandProfile(null);
      setInfluencerProfile(null);
      setError("");
      setBrandError("");
      setInfluencerError("");
      setLoadedForUserId(null);
      setLoading(false);
      return { brandProfile: null, influencerProfile: null };
    }

    if (inFlightRequest.current?.userId === currentUserId) {
      return inFlightRequest.current.promise;
    }

    const currentRequestId = ++requestId.current;
    setLoading(true);
    const request = (async () => {
      const [brandResult, influencerResult] = await Promise.allSettled([
        apiClient.get("/api/modasphere/influence/brand-profile"),
        apiClient.get("/api/modasphere/influence/influencer-profile"),
      ]);

      if (currentRequestId !== requestId.current) return null;

      const nextBrandProfile = brandResult.status === "fulfilled"
        ? brandResult.value.data?.data ?? null
        : undefined;
      const nextInfluencerProfile = influencerResult.status === "fulfilled"
        ? influencerResult.value.data?.data ?? null
        : undefined;

      if (nextBrandProfile !== undefined) setBrandProfile(nextBrandProfile);
      if (nextInfluencerProfile !== undefined) setInfluencerProfile(nextInfluencerProfile);

      const nextBrandError = brandResult.status === "rejected"
        ? brandResult.reason?.response?.data?.message || "Unable to load your brand profile."
        : "";
      const nextInfluencerError = influencerResult.status === "rejected"
        ? influencerResult.reason?.response?.data?.message || "Unable to load your influencer profile."
        : "";
      setBrandError(nextBrandError);
      setInfluencerError(nextInfluencerError);
      const failures = [nextBrandError, nextInfluencerError].filter(Boolean);
      setError(failures.join(" "));
      setLoadedForUserId(user?._id || user?.id || null);
      setLoading(false);

      return {
        brandProfile: nextBrandProfile ?? null,
        influencerProfile: nextInfluencerProfile ?? null,
      };
    })();
    const pendingRequest = { userId: currentUserId, promise: request };
    inFlightRequest.current = pendingRequest;

    try {
      return await request;
    } finally {
      if (inFlightRequest.current === pendingRequest) inFlightRequest.current = null;
    }
  }, [isAuthenticated, user?._id, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      requestId.current += 1;
      inFlightRequest.current = null;
      setBrandProfile(null);
      setInfluencerProfile(null);
      setError("");
      setBrandError("");
      setInfluencerError("");
      setLoadedForUserId(null);
      setLoading(false);
      return;
    }

    refreshProfiles();
  }, [authLoading, isAuthenticated, refreshProfiles]);

  const value = useMemo(
    () => ({
      brandProfile,
      influencerProfile,
      hasBrandProfile: Boolean(brandProfile),
      hasInfluencerProfile: Boolean(influencerProfile),
      loading:
        authLoading ||
        loading ||
        (isAuthenticated && loadedForUserId !== (user?._id || user?.id || null)),
      error,
      brandError,
      influencerError,
      refreshProfiles,
    }),
    [
      brandProfile,
      influencerProfile,
      authLoading,
      loading,
      isAuthenticated,
      loadedForUserId,
      user?._id,
      user?.id,
      error,
      brandError,
      influencerError,
      refreshProfiles,
    ]
  );

  return (
    <InfluenceProfilesContext.Provider value={value}>
      {children}
    </InfluenceProfilesContext.Provider>
  );
}

export function useInfluenceProfiles() {
  const context = useContext(InfluenceProfilesContext);
  if (!context) {
    throw new Error(
      "useInfluenceProfiles must be used within InfluenceProfilesProvider"
    );
  }
  return context;
}
