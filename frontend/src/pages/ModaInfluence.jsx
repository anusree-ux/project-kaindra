import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../services/apiClient";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useInfluenceProfiles } from "../context/InfluenceProfilesContext";
import {
  Users,
  Megaphone,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  X,
} from "lucide-react";
import "./ModaInfluence.css";

const creators = [
  {
    name: "Fashion Creators",
    description:
      "Discover creators across fashion, lifestyle and culture.",
    count: "2,500+",
  },
  {
    name: "Brand Partners",
    description:
      "Connect brands with relevant creator communities.",
    count: "850+",
  },
  {
    name: "Affiliate Network",
    description:
      "Build measurable affiliate and referral campaigns.",
    count: "4,000+",
  },
];

const campaignSectionHeading = /^(campaign goals?|goals?|objectives?|deliverables?|who can apply|eligibility(?: criteria)?|collaboration details|call to action)\s*:?\s*$/i;
const campaignInlineSection = /^(campaign goals?|goals?|objectives?|deliverables?|who can apply|eligibility(?: criteria)?|collaboration details|call to action)\s*:\s*(.+)$/i;

function parseCampaignMessage(message = "") {
  const blocks = [];
  let paragraph = [];
  let list = null;
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join("\n") });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const rawLine of message.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const markdownHeading = line.match(/^#{1,3}\s+(.+)$/);
    const inlineSection = line.match(campaignInlineSection);
    if (markdownHeading || campaignSectionHeading.test(line) || inlineSection) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: markdownHeading?.[1] || inlineSection?.[1] || line.replace(/:$/, "") });
      if (inlineSection?.[2]) paragraph.push(inlineSection[2]);
      continue;
    }
    const bullet = line.match(/^[-*\u2022]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { type: "list", ordered, items: [] };
      }
      list.items.push((bullet || numbered)[1]);
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

function CampaignMessageContent({ message }) {
  const blocks = parseCampaignMessage(message);
  if (!blocks.length) return <p>No campaign description provided.</p>;
  return blocks.map((block, index) => {
    if (block.type === "heading") return <h3 key={index}>{block.text}</h3>;
    if (block.type === "list") {
      const List = block.ordered ? "ol" : "ul";
      return <List key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</List>;
    }
    return <p key={index}>{block.text}</p>;
  });
}

function ModaInfluence() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    loading: authLoading,
    authModalOpen,
    openAuthModal,
  } = useAuth();
  const {
    brandProfile,
    hasBrandProfile,
    hasInfluencerProfile,
    influencerError,
    loading: profilesLoading,
    error: profilesError,
    refreshProfiles,
  } = useInfluenceProfiles();

  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInProgress = useRef(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    brand: "",
    email: "",
  });
  const [publicCampaigns, setPublicCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState("");
  const [campaignsRetry, setCampaignsRetry] = useState(0);
  const [pendingApplicationId, setPendingApplicationId] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState(null);
  const [appliedCampaignIds, setAppliedCampaignIds] = useState(() => new Set());
  const [applicationHistoryLoading, setApplicationHistoryLoading] = useState(false);
  const [applicationHistoryLoaded, setApplicationHistoryLoaded] = useState(false);
  const [applicationHistoryError, setApplicationHistoryError] = useState("");
  const [applicationHistoryRetry, setApplicationHistoryRetry] = useState(0);
  const [applicationSubmittingId, setApplicationSubmittingId] = useState(null);
  const [applicationNotice, setApplicationNotice] = useState(null);
  const campaignDetailsDialogRef = useRef(null);
  const campaignDetailsCloseRef = useRef(null);
  const campaignDetailsTriggerRef = useRef(null);
  const appliedCampaignIdsRef = useRef(appliedCampaignIds);
  const applicationSubmittingIdRef = useRef(null);
  appliedCampaignIdsRef.current = appliedCampaignIds;

  useEffect(() => {
    let active = true;
    setCampaignsLoading(true);
    setCampaignsError("");
    apiClient.get("/api/modasphere/influence/public-campaigns")
      .then(({ data }) => {
        if (!data?.success || !Array.isArray(data.data)) {
          throw new Error(data?.message || "Unexpected campaign response.");
        }
        if (active) setPublicCampaigns(data.data);
      })
      .catch((error) => {
        console.error("Unable to load public campaigns:", error);
        if (active) {
          setPublicCampaigns([]);
          setCampaignsError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load campaigns right now."
          );
        }
      })
      .finally(() => { if (active) setCampaignsLoading(false); });
    return () => { active = false; };
  }, [campaignsRetry]);

  useEffect(() => {
    let active = true;
    if (authLoading || profilesLoading) {
      setApplicationHistoryLoading(false);
      setApplicationHistoryLoaded(false);
      return () => { active = false; };
    }
    if (!isAuthenticated) {
      setAppliedCampaignIds(new Set());
      setApplicationHistoryError("");
      setApplicationHistoryLoading(false);
      setApplicationHistoryLoaded(true);
      return () => { active = false; };
    }
    if (!hasInfluencerProfile) {
      setAppliedCampaignIds(new Set());
      setApplicationHistoryError("");
      setApplicationHistoryLoading(false);
      setApplicationHistoryLoaded(true);
      return () => { active = false; };
    }

    setApplicationHistoryLoading(true);
    setApplicationHistoryLoaded(false);
    setApplicationHistoryError("");
    apiClient.get("/api/modasphere/influence/influencer-profile/applications")
      .then(({ data }) => {
        if (!data?.success || !Array.isArray(data.data)) {
          throw new Error(data?.message || "Unexpected application history response.");
        }
        if (active) {
          setAppliedCampaignIds(new Set(
            data.data.map((application) => application.campaign?.publicId).filter(Boolean)
          ));
        }
      })
      .catch((error) => {
        if (active) {
          setApplicationHistoryError(
            error.response?.data?.message || error.message || "Unable to check your applications."
          );
        }
      })
      .finally(() => {
        if (active) {
          setApplicationHistoryLoading(false);
          setApplicationHistoryLoaded(true);
        }
      });
    return () => { active = false; };
  }, [authLoading, isAuthenticated, profilesLoading, hasInfluencerProfile, applicationHistoryRetry]);

  useEffect(() => {
    if (!campaignDetails) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    campaignDetailsCloseRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setCampaignDetails(null);
      } else if (event.key === "Tab") {
        const focusable = campaignDetailsDialogRef.current?.querySelectorAll(
          'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      campaignDetailsTriggerRef.current?.focus();
    };
  }, [campaignDetails]);

  useEffect(() => {
    if (!applicationNotice) return undefined;
    const timeout = window.setTimeout(() => setApplicationNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [applicationNotice]);

  const handleLoginRequiredAction = (action) => {
    setShowForm(false);
    setSubmitted(false);
    setCampaignForm({ brand: "", email: "" });
    setPendingAction(action);
    openAuthModal("login");
  };

  const openCampaignForm = () => {
    if (!isAuthenticated) {
      handleLoginRequiredAction("campaign");
      return;
    }

    if (profilesLoading) return;
    if (!hasBrandProfile) {
      navigate("/businesses/modainfluence/dashboard", {
        state: { continueToCampaign: true },
      });
      return;
    }

    setCampaignForm({
      brand: brandProfile?.brandName || "",
      email: brandProfile?.contactEmail || "",
    });
    setSubmitted(false);
    setShowForm(true);
  };

  const handleCampaignAction = () => {
    if (!isAuthenticated) {
      handleLoginRequiredAction("campaign");
      return;
    }

    openCampaignForm();
  };

  const handleInfluencerJoin = () => {
    if (!isAuthenticated) {
      handleLoginRequiredAction("influencerSetup");
      return;
    }

    navigate("/businesses/modainfluence/influencer/dashboard");
  };

  const openCampaignDetails = (campaign, trigger) => {
    campaignDetailsTriggerRef.current = trigger;
    setCampaignDetails(campaign);
  };

  const submitApplication = useCallback(async (campaign) => {
    if (!campaign?.publicId || applicationSubmittingIdRef.current === campaign.publicId) return;
    if (appliedCampaignIdsRef.current.has(campaign.publicId)) {
      setApplicationNotice({
        campaignId: campaign.publicId,
        type: "error",
        message: "You have already applied to this campaign.",
      });
      return;
    }

    applicationSubmittingIdRef.current = campaign.publicId;
    setApplicationSubmittingId(campaign.publicId);
    setApplicationNotice(null);
    try {
      const { data } = await apiClient.post(
        `/api/modasphere/influence/campaigns/${campaign.publicId}/applications`,
        {}
      );
      setAppliedCampaignIds((current) => {
        const updated = new Set([...current, campaign.publicId]);
        appliedCampaignIdsRef.current = updated;
        return updated;
      });
      setApplicationNotice({
        campaignId: campaign.publicId,
        type: "success",
        message: data?.message || "Your application was submitted.",
      });
    } catch (error) {
      let duplicateConfirmed = false;
      if (error.response?.status === 409) {
        try {
          const { data } = await apiClient.get("/api/modasphere/influence/influencer-profile/applications");
          duplicateConfirmed = data.data?.some((application) => application.campaign?.publicId === campaign.publicId) || false;
          if (duplicateConfirmed) {
            setAppliedCampaignIds((current) => {
              const updated = new Set([...current, campaign.publicId]);
              appliedCampaignIdsRef.current = updated;
              return updated;
            });
          }
        } catch {
          duplicateConfirmed = false;
        }
      }
      setApplicationNotice({
        campaignId: campaign.publicId,
        type: "error",
        message: duplicateConfirmed
          ? "You have already applied to this campaign."
          : error.response?.data?.message || "Unable to submit your application. Please try again.",
      });
    } finally {
      applicationSubmittingIdRef.current = null;
      setApplicationSubmittingId(null);
    }
  }, []);

  const handleApply = async (campaign) => {
    if (appliedCampaignIdsRef.current.has(campaign.publicId)) {
      setApplicationNotice({
        campaignId: campaign.publicId,
        type: "error",
        message: "You have already applied to this campaign.",
      });
      return;
    }
    if (!isAuthenticated) {
      setPendingApplicationId(campaign.publicId);
      setShowForm(false);
      setCampaignDetails(null);
      openAuthModal("login");
      return;
    }
    if (profilesLoading) return;
    if (influencerError) {
      setApplicationNotice({ campaignId: campaign.publicId, type: "error", message: influencerError });
      return;
    }
    if (!hasInfluencerProfile) {
      setPendingApplicationId(null);
      setCampaignDetails(null);
      navigate("/businesses/modainfluence/influencer/dashboard", {
        state: { continueToApplication: campaign.publicId },
      });
      return;
    }
    if (applicationHistoryLoading) return;
    await submitApplication(campaign);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      if (pendingApplicationId && !authModalOpen) setPendingApplicationId(null);
      return;
    }
    if (profilesLoading || influencerError) return;

    const campaignId = pendingApplicationId || location.state?.applyToCampaign;
    if (!campaignId) return;
    if (!hasInfluencerProfile) {
      setPendingApplicationId(null);
      navigate("/businesses/modainfluence/influencer/dashboard", {
        state: { continueToApplication: campaignId },
      });
      return;
    }
    if (!applicationHistoryLoaded || applicationHistoryLoading) return;

    let active = true;
    const cameFromLocationState = Boolean(location.state?.applyToCampaign);
    apiClient.get(`/api/modasphere/influence/public-campaigns/${campaignId}`)
      .then(async ({ data }) => {
        if (active) {
          setCampaignDetails(data.data);
          if (appliedCampaignIdsRef.current.has(campaignId)) {
            setApplicationNotice({ campaignId, type: "error", message: "You have already applied to this campaign." });
          } else {
            await submitApplication(data.data);
          }
        }
      })
      .catch((error) => {
        if (active) setApplicationNotice({
          campaignId,
          type: "error",
          message: error.response?.data?.message || "This campaign is no longer accepting applications.",
        });
      })
      .finally(() => {
        if (active) {
          setPendingApplicationId(null);
          if (cameFromLocationState) {
            navigate(location.pathname, { replace: true, state: null });
          }
        }
      });
    return () => { active = false; };
  }, [
    authLoading,
    isAuthenticated,
    authModalOpen,
    pendingApplicationId,
    profilesLoading,
    influencerError,
    hasInfluencerProfile,
    applicationHistoryLoaded,
    applicationHistoryLoading,
    location.state,
    location.pathname,
    navigate,
    submitApplication,
  ]);

  useEffect(() => {
    if (authLoading || isAuthenticated || !pendingAction) return;
    if (authModalOpen) return;
    setPendingAction(null);
  }, [authLoading, isAuthenticated, authModalOpen, pendingAction]);

  useEffect(() => {
    if (!isAuthenticated || profilesLoading || profilesError || !pendingAction) return;

    const action = pendingAction;
    setPendingAction(null);
    if (action === "influencerSetup") {
      navigate("/businesses/modainfluence/influencer/dashboard");
    } else if (action === "brandDashboard") {
      navigate("/businesses/modainfluence/dashboard");
    } else if (action === "campaign") {
      if (hasBrandProfile) {
        setCampaignForm({
          brand: brandProfile?.brandName || "",
          email: brandProfile?.contactEmail || "",
        });
        setShowForm(true);
      } else {
        navigate("/businesses/modainfluence/dashboard", {
          state: { continueToCampaign: true },
        });
      }
    }
  }, [
    isAuthenticated,
    profilesLoading,
    pendingAction,
    profilesError,
    hasBrandProfile,
    brandProfile,
    navigate,
  ]);

  useEffect(() => {
    if (profilesLoading || !location.state?.openCampaign || !hasBrandProfile) return;
    setCampaignForm({
      brand: brandProfile?.brandName || "",
      email: brandProfile?.contactEmail || "",
    });
    setSubmitted(false);
    setShowForm(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [
    profilesLoading,
    location.state,
    location.pathname,
    hasBrandProfile,
    brandProfile,
    navigate,
  ]);

  const handlePublicCampaignAction = () => {
    handleCampaignAction();
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submissionInProgress.current) return;
    if (isAuthenticated && !brandProfile) {
      setShowForm(false);
      navigate("/businesses/modainfluence/dashboard", {
        state: { continueToCampaign: true },
      });
      return;
    }

    const formData = new FormData(e.currentTarget);

    const endpoint =
      isAuthenticated && brandProfile
        ? "/api/modasphere/influence/brand-profile/campaigns"
        : "/api/modasphere/influence/campaigns";

    submissionInProgress.current = true;
    setIsSubmitting(true);
    try {
      await apiClient.post(endpoint, {
        brand: formData.get("brand"),
        email: formData.get("email"),
        title: formData.get("title")?.trim(),
        campaignType: formData.get("campaignType"),
        message: formData.get("message"),
      });

      setSubmitted(true);
    } catch (error) {
      console.error(
        "Campaign submission error:",
        error.response?.data || error
      );

      if (error.response?.status === 401) {
        alert("Your session has expired. Please sign in again.");
      } else {
        alert(
          error.response?.data?.message ||
            error.message ||
            "Failed to submit campaign request. Please try again."
        );
      }
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modainfluence-page">

      {/* Hero */}
      <section className="modainfluence-hero">
        <div className="modainfluence-container">
          <span className="modainfluence-eyebrow">
            CREATOR ECONOMY
          </span>

          <h1>
            Influence that
            <br />
            <span>moves fashion.</span>
          </h1>

          <p>
            ModaInfluence connects fashion brands, creators and
            influencers through meaningful campaigns, partnerships
            and affiliate opportunities.
          </p>

          <div className="modainfluence-actions">
            {authLoading || profilesLoading ? (
              <p role="status">Loading your ModaInfluence profiles...</p>
            ) : !isAuthenticated ? (
              <>
                <button
                  className="modainfluence-primary-btn"
                  onClick={handleInfluencerJoin}
                >
                  Join as Influencer
                  <ArrowRight size={17} />
                </button>
                <button
                  className="modainfluence-secondary-btn"
                  onClick={handleCampaignAction}
                >
                  Create a Campaign
                  <ArrowRight size={17} />
                </button>
                <button
                  className="modainfluence-secondary-btn"
                  onClick={() => handleLoginRequiredAction("brandDashboard")}
                >
                  Brand Dashboard
                  <ArrowRight size={17} />
                </button>
              </>
            ) : profilesError ? (
              <div role="alert" className="modainfluence-profile-error">
                <p>{profilesError}</p>
                <button className="modainfluence-secondary-btn" onClick={refreshProfiles}>
                  Retry
                </button>
              </div>
            ) : (
              <>
                {hasInfluencerProfile && (
                  <button
                    className="modainfluence-primary-btn"
                    onClick={() => navigate("/businesses/modainfluence/influencer/dashboard")}
                  >
                    Influencer Dashboard
                    <ArrowRight size={17} />
                  </button>
                )}
                {hasBrandProfile && (
                  <button
                    className={hasInfluencerProfile ? "modainfluence-secondary-btn" : "modainfluence-primary-btn"}
                    onClick={() => navigate("/businesses/modainfluence/dashboard")}
                  >
                    Brand Dashboard
                    <ArrowRight size={17} />
                  </button>
                )}
                {!hasInfluencerProfile && (
                  <button
                    className={hasBrandProfile ? "modainfluence-secondary-btn" : "modainfluence-primary-btn"}
                    onClick={handleInfluencerJoin}
                  >
                    Set Up Your Influencer Profile
                    <ArrowRight size={17} />
                  </button>
                )}
                <button
                  className="modainfluence-secondary-btn"
                  onClick={handleCampaignAction}
                >
                  Create a Campaign
                  <ArrowRight size={17} />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="modainfluence-section">
        <div className="modainfluence-container">

          <div className="modainfluence-heading">
            <span>THE NETWORK</span>
            <h2>One platform. Multiple possibilities.</h2>
            <p>
              Build relationships between brands, creators and
              audiences across the fashion ecosystem.
            </p>
          </div>

          <div className="modainfluence-grid">
            {creators.map((item, index) => {
              const icons = [Users, Megaphone, TrendingUp];
              const Icon = icons[index];

              return (
                <div
                  className="modainfluence-card"
                  key={item.name}
                >
                  <div className="modainfluence-card-icon">
                    <Icon size={22} />
                  </div>

                  <strong>{item.count}</strong>

                  <h3>{item.name}</h3>

                  <p>{item.description}</p>

                  <span className="modainfluence-card-line" />
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* How it works */}
      <section className="modainfluence-process">
        <div className="modainfluence-container">

          <div className="modainfluence-heading">
            <span>HOW IT WORKS</span>
            <h2>From idea to influence.</h2>
          </div>

          <div className="modainfluence-steps">

            <div>
              <span>01</span>
              <h3>Create</h3>
              <p>
                Define your campaign, audience and objectives.
              </p>
            </div>

            <div>
              <span>02</span>
              <h3>Connect</h3>
              <p>
                Discover creators and partners that fit your brand.
              </p>
            </div>

            <div>
              <span>03</span>
              <h3>Launch</h3>
              <p>
                Collaborate, publish and reach your target audience.
              </p>
            </div>

            <div>
              <span>04</span>
              <h3>Measure</h3>
              <p>
                Track campaign performance and conversions.
              </p>
            </div>

          </div>
        </div>
      </section>

      <section className="modainfluence-public-campaigns" id="explore-campaigns">
        <div className="modainfluence-container">
          <div className="modainfluence-heading">
            <span>PUBLIC OPPORTUNITIES</span>
            <h2>Explore Campaigns</h2>
            <p>Discover campaigns from fashion brands and companies, explore their goals, and find opportunities that match your interests.</p>
          </div>
          {applicationHistoryError && isAuthenticated && hasInfluencerProfile && (
            <div className="modainfluence-campaign-error" role="alert">
              <p>{applicationHistoryError}</p>
              <button type="button" onClick={() => setApplicationHistoryRetry((count) => count + 1)}>
                Retry application status
              </button>
            </div>
          )}
          {campaignsLoading ? (
            <p role="status">Loading campaigns...</p>
          ) : campaignsError ? (
            <div className="modainfluence-campaign-error" role="alert">
              <p>Unable to load campaigns right now.</p>
              <button type="button" onClick={() => setCampaignsRetry((count) => count + 1)}>
                Try again
              </button>
            </div>
          ) : publicCampaigns.length === 0 ? (
            <p className="modainfluence-empty-campaigns">No campaigns available just yet.</p>
          ) : (
            <div className="modainfluence-public-campaign-grid">
              {publicCampaigns.map((campaign, index) => {
                const isApplied = appliedCampaignIds.has(campaign.publicId);
                const isApplying = applicationSubmittingId === campaign.publicId;
                const notice = applicationNotice?.campaignId === campaign.publicId ? applicationNotice : null;
                return (
                  <article className="modainfluence-public-campaign-card" id={`campaign-${campaign.publicId}`} key={campaign.publicId || `${campaign.createdAt}-${index}`}>
                    <button
                      type="button"
                      className="modainfluence-public-campaign-open"
                      aria-label={`View ${campaign.title || campaign.campaignType} campaign details`}
                      onClick={(event) => openCampaignDetails(campaign, event.currentTarget)}
                    >
                      {campaign.createdAt && <span className="modainfluence-public-campaign-date">{new Date(campaign.createdAt).toLocaleDateString()}</span>}
                      <h3>{campaign.title || campaign.campaignType}</h3>
                      <p className="modainfluence-public-campaign-type">{campaign.campaignType}</p>
                      <p className="modainfluence-public-campaign-brand">{campaign.brand}</p>
                      <p className="modainfluence-public-campaign-preview">{campaign.message}</p>
                    </button>
                    <div className="modainfluence-public-campaign-actions">
                      <button
                        type="button"
                        className="modainfluence-public-campaign-details"
                        onClick={(event) => openCampaignDetails(campaign, event.currentTarget)}
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        className="modainfluence-public-campaign-apply"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleApply(campaign);
                        }}
                        disabled={isApplied || isApplying || (isAuthenticated && (applicationHistoryLoading || profilesLoading))}
                      >
                        {isApplied ? "Applied" : isApplying ? "Applying..." : "Apply"}
                      </button>
                    </div>
                    {isApplied && <p className="modainfluence-public-campaign-applied" role="status">You have already applied to this campaign.</p>}
                    {notice && <p className={`modainfluence-application-notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.message}</p>}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {campaignDetails && (() => {
        const isApplied = appliedCampaignIds.has(campaignDetails.publicId);
        const isApplying = applicationSubmittingId === campaignDetails.publicId;
        const notice = applicationNotice?.campaignId === campaignDetails.publicId ? applicationNotice : null;
        return (
          <div
            className="modainfluence-modal modainfluence-campaign-details-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setCampaignDetails(null);
            }}
          >
            <section
              ref={campaignDetailsDialogRef}
              className="modainfluence-campaign-details-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="public-campaign-details-title"
              aria-describedby="public-campaign-details-content"
              tabIndex={-1}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header className="modainfluence-campaign-details-header">
                <div>
                  <span>CAMPAIGN DETAILS</span>
                  <h2 id="public-campaign-details-title">{campaignDetails.title || campaignDetails.campaignType}</h2>
                  <p className="modainfluence-public-campaign-type">{campaignDetails.campaignType}</p>
                  <p>{campaignDetails.brand}</p>
                </div>
                <button
                  ref={campaignDetailsCloseRef}
                  className="modainfluence-campaign-details-close"
                  type="button"
                  aria-label="Close campaign details"
                  onClick={() => setCampaignDetails(null)}
                >
                  <X aria-hidden="true" />
                </button>
              </header>
              <div className="modainfluence-campaign-details-content" id="public-campaign-details-content">
                <CampaignMessageContent message={campaignDetails.message} />
                {campaignDetails.createdAt && <p className="modainfluence-campaign-details-date"><strong>Campaign date:</strong> {new Date(campaignDetails.createdAt).toLocaleDateString()}</p>}
                {notice && <p className={`modainfluence-application-notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.message}</p>}
              </div>
              <footer className="modainfluence-campaign-details-footer">
                <button
                  type="button"
                  className="modainfluence-public-campaign-apply"
                  onClick={() => handleApply(campaignDetails)}
                  disabled={isApplied || isApplying || (isAuthenticated && (applicationHistoryLoading || profilesLoading))}
                >
                  {isApplied ? "Applied" : isApplying ? "Applying..." : "Apply"}
                </button>
                {isApplied && <span role="status">You have already applied to this campaign.</span>}
              </footer>
            </section>
          </div>
        );
      })()}

      {/* CTA */}
      <section className="modainfluence-cta">
        <div className="modainfluence-container">
          <span>MODAINFLUENCE</span>

          <h2>
            Turn creativity
            <br />
            into impact.
          </h2>

          <button
            className="modainfluence-primary-btn"
            onClick={handlePublicCampaignAction}
          >
            Work With Us
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* Campaign Form */}
      {showForm && (
        <div
          className="modainfluence-modal"
          onClick={() => setShowForm(false)}
        >
          <div
            className="modainfluence-form"
            onClick={(e) => e.stopPropagation()}
          >
            {!submitted ? (
              <>
                <button
                  className="modainfluence-close"
                  onClick={() => setShowForm(false)}
                >
                  ×
                </button>

                <span>START A CAMPAIGN</span>
                <h2>Tell us about your campaign</h2>

                <form onSubmit={handleSubmit}>
                  {profilesLoading && isAuthenticated && (
                    <p>Loading your brand profile...</p>
                  )}

                  {profilesError && (
                    <p className="form-error">{profilesError}</p>
                  )}
                  <input
                    type="text"
                    name="brand"
                    placeholder="Brand / Company"
                    value={campaignForm.brand}
                    onChange={(e) =>
                      setCampaignForm({ ...campaignForm, brand: e.target.value })
                    }
                    required
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={campaignForm.email}
                    onChange={(e) =>
                      setCampaignForm({ ...campaignForm, email: e.target.value })
                    }
                    required
                  />

                  <label className="modainfluence-campaign-title-label">
                    Campaign Title
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g., Denim Reimagined — Style It Your Way"
                      maxLength={150}
                      required
                    />
                  </label>

                  <input
                    type="text"
                    name="campaignType"
                    placeholder="Campaign type"
                    required
                  />

                  <textarea
                    name="message"
                    placeholder="Tell us about your campaign"
                    rows="4"
                    required
                  />

                  {!profilesLoading && isAuthenticated && !brandProfile && (
                    <div className="brand-profile-notice">
                      <p>You haven't created a brand profile yet.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          navigate("/businesses/modainfluence/dashboard", {
                            state: { continueToCampaign: true },
                          });
                        }}
                      >
                        Create Brand Profile
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      profilesLoading ||
                      (isAuthenticated && (!brandProfile || Boolean(profilesError)))
                    }
                  >
                    {isSubmitting ? "Submitting..." : "Submit Campaign"}
                    <ArrowRight size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div className="modainfluence-success">
                <CheckCircle2 size={42} />

                <h2>Campaign request received</h2>

                <p>
                  Thank you. Our team will review your campaign
                  and get back to you.
                </p>

                <button
                  onClick={() => {
                    setSubmitted(false);
                    setShowForm(false);
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModaInfluence;
