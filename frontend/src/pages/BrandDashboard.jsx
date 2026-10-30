
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useInfluenceProfiles } from "../context/InfluenceProfilesContext";
import apiClient from "../services/apiClient";
import "./BrandDashboard.css";

const emptyProfile = {
  brandName: "",
  logoUrl: "",
  description: "",
  website: "",
  category: "",
  contactEmail: "",
  contactPhone: "",
  instagram: "",
  facebook: "",
  youtube: "",
};

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

    const bullet = line.match(/^[-*•]\s+(.+)$/);
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

function BrandDashboard() {
  const { isAuthenticated, loading: authLoading, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfiles } = useInfluenceProfiles();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyProfile);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState("");
  const [campaignBeingEdited, setCampaignBeingEdited] = useState(null);
  const [campaignEditForm, setCampaignEditForm] = useState({
    title: "",
    brand: "",
    email: "",
    campaignType: "",
    message: "",
  });
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [campaignDeletingId, setCampaignDeletingId] = useState(null);
  const [visibilityUpdatingId, setVisibilityUpdatingId] = useState(null);
  const [campaignNotice, setCampaignNotice] = useState("");
  const [campaignNoticeType, setCampaignNoticeType] = useState("success");
  const [campaignDetails, setCampaignDetails] = useState(null);
  const [applicationCampaign, setApplicationCampaign] = useState(null);
  const [campaignApplications, setCampaignApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState("");
  const [applicationBusyId, setApplicationBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const detailsDialogRef = useRef(null);
  const detailsCloseButtonRef = useRef(null);
  const campaignTriggerRef = useRef(null);
  const campaignDescriptionRef = useRef(null);

  useEffect(() => {
    if (!campaignDetails) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    detailsCloseButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setCampaignDetails(null);
      } else if (event.key === "Tab") {
        const focusable = detailsDialogRef.current?.querySelectorAll(
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
      campaignTriggerRef.current?.focus();
    };
  }, [campaignDetails]);

  useEffect(() => {
    if (!campaignNotice) return undefined;
    const timeout = window.setTimeout(() => setCampaignNotice(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [campaignNotice]);

  const fetchBrandCampaigns = async () => {
    setCampaignsLoading(true);
    setCampaignsError("");

    try {
        const response = await apiClient.get(
        "/api/modasphere/influence/brand-profile/campaigns"
        );

        setCampaigns(response.data?.data ?? []);
    } catch (err) {
        setCampaignsError(
        err.response?.data?.message ||
            "Unable to load campaigns."
        );
    } finally {
        setCampaignsLoading(false);
    }
    };

  const openCampaignEditor = (campaign) => {
    setCampaignsError("");
    setCampaignBeingEdited(campaign);
    setCampaignEditForm({
      title: campaign.title || campaign.campaignType || "",
      brand: campaign.brand || "",
      email: campaign.email || "",
      campaignType: campaign.campaignType || "",
      message: campaign.message || "",
    });
  };

  const insertCampaignFormatting = (type) => {
    const textarea = campaignDescriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = campaignEditForm.message;
    const selected = value.slice(start, end);
    let before = value.slice(0, start);
    let after = value.slice(end);
    let insertion = selected;

    if (type === "bold") {
      insertion = `**${selected || "bold text"}**`;
    } else if (type === "italic") {
      insertion = `*${selected || "italic text"}*`;
    } else if (type === "heading") {
      before += before && !before.endsWith("\n") ? "\n" : "";
      insertion = `### ${selected || "Section heading"}`;
    } else if (type === "bullet") {
      insertion = selected
        ? selected.split("\n").map((line) => `- ${line}`).join("\n")
        : "- List item";
    } else if (type === "numbered") {
      insertion = selected
        ? selected.split("\n").map((line, index) => `${index + 1}. ${line}`).join("\n")
        : "1. List item";
    }

    const updated = before + insertion + after;

    setCampaignEditForm((current) => ({
      ...current,
      message: updated,
    }));

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = before.length + insertion.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleCampaignEdit = async (event) => {
    event.preventDefault();
    if (!campaignBeingEdited) return;

    setCampaignSaving(true);
    setCampaignsError("");

    try {
      const response = await apiClient.patch(
        `/api/modasphere/influence/brand-profile/campaigns/${campaignBeingEdited._id}`,
        campaignEditForm
      );
      const updatedCampaign = response.data?.data;

      setCampaigns((current) =>
        current.map((campaign) =>
          campaign._id === updatedCampaign._id ? updatedCampaign : campaign
        )
      );
      setCampaignBeingEdited(null);
    } catch (err) {
      setCampaignsError(
        err.response?.data?.message || "Unable to update this campaign."
      );
    } finally {
      setCampaignSaving(false);
    }
  };

  const handleCampaignDelete = async (campaign) => {
    const shouldDelete = window.confirm(
      `Delete the campaign "${campaign.campaignType}"? This cannot be undone.`
    );
    if (!shouldDelete) return;

    setCampaignDeletingId(campaign._id);
    setCampaignsError("");

    try {
      await apiClient.delete(
        `/api/modasphere/influence/brand-profile/campaigns/${campaign._id}`
      );
      setCampaigns((current) =>
        current.filter((item) => item._id !== campaign._id)
      );
      if (campaignDetails?._id === campaign._id) setCampaignDetails(null);
      if (campaignBeingEdited?._id === campaign._id) {
        setCampaignBeingEdited(null);
      }
    } catch (err) {
      setCampaignsError(
        err.response?.data?.message || "Unable to delete this campaign."
      );
    } finally {
      setCampaignDeletingId(null);
    }
  };

  const handleCampaignVisibility = async (campaign) => {
    const nextIsPublic = !campaign.isPublic;
    setVisibilityUpdatingId(campaign._id);
    setCampaignsError("");
    setCampaignNotice("");
    try {
      const response = await apiClient.patch(
        `/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/visibility`,
        { isPublic: nextIsPublic }
      );
      setCampaigns((current) => current.map((item) => item._id === campaign._id
        ? { ...item, isPublic: response.data.data.isPublic }
        : item));
      setCampaignDetails((current) => current?._id === campaign._id
        ? { ...current, isPublic: response.data.data.isPublic }
        : current);
      setCampaignNoticeType("success");
      setCampaignNotice(response.data.message || "Campaign visibility updated.");
    } catch (err) {
      setCampaignNoticeType("error");
      setCampaignNotice(err.response?.data?.message || "Unable to update campaign visibility.");
    } finally {
      setVisibilityUpdatingId(null);
    }
  };

  const openCampaignApplications = async (campaign) => {
    setCampaignDetails(null);
    setApplicationCampaign(campaign);
    setCampaignApplications([]);
    setApplicationsLoading(true);
    setApplicationsError("");
    try {
      const response = await apiClient.get(
        `/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications`
      );
      setCampaignApplications(response.data?.data || []);
    } catch (err) {
      setApplicationsError(err.response?.data?.message || "Unable to load applications.");
    } finally {
      setApplicationsLoading(false);
    }
  };

  const updateApplicationStatus = async (application, status) => {
    if (!applicationCampaign) return;
    setApplicationBusyId(application._id);
    setApplicationsError("");
    try {
      const response = await apiClient.patch(
        `/api/modasphere/influence/brand-profile/campaigns/${applicationCampaign._id}/applications/${application._id}/status`,
        { status }
      );
      setCampaignApplications((current) => current.map((item) => item._id === application._id
        ? { ...item, status: response.data.data.status }
        : item));
    } catch (err) {
      setApplicationsError(err.response?.data?.message || "Unable to update application status.");
    } finally {
      setApplicationBusyId(null);
    }
  };

  const deleteApplication = async (application) => {
    if (!applicationCampaign) return;
    if (!window.confirm(`Permanently delete ${application.influencer?.displayName || "this"} application?`)) return;
    setApplicationBusyId(application._id);
    setApplicationsError("");
    try {
      await apiClient.delete(
        `/api/modasphere/influence/brand-profile/campaigns/${applicationCampaign._id}/applications/${application._id}`
      );
      setCampaignApplications((current) => current.filter((item) => item._id !== application._id));
    } catch (err) {
      setApplicationsError(err.response?.data?.message || "Unable to delete application.");
    } finally {
      setApplicationBusyId(null);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setLoading(false);
      openAuthModal("login");
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      try {
        setError("");

        const response = await apiClient.get(
          "/api/modasphere/influence/brand-profile"
        );

        const data = response.data?.data ?? null;

        if (cancelled) return;

        setProfile(data);

        if (data) {
            await fetchBrandCampaigns();
        } else {
            setCampaigns([]);
        }

        if (data) {
          setForm({
            brandName: data.brandName || "",
            logoUrl: data.logoUrl || "",
            description: data.description || "",
            website: data.website || "",
            category: data.category || "",
            contactEmail: data.contactEmail || "",
            contactPhone: data.contactPhone || "",
            instagram: data.socialLinks?.instagram || "",
            facebook: data.socialLinks?.facebook || "",
            youtube: data.socialLinks?.youtube || "",
          });
        } else {
          setForm(emptyProfile);
          setEditing(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load your brand profile. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, openAuthModal]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      brandName: form.brandName.trim(),
      logoUrl: form.logoUrl.trim(),
      description: form.description.trim(),
      website: form.website.trim(),
      category: form.category,
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      socialLinks: {
        instagram: form.instagram.trim(),
        facebook: form.facebook.trim(),
        youtube: form.youtube.trim(),
      },
    };

    try {
      const response = profile
        ? await apiClient.patch(
            "/api/modasphere/influence/brand-profile",
            payload
          )
        : await apiClient.post(
            "/api/modasphere/influence/brand-profile",
            payload
          );

      const savedProfile = response.data?.data;
      const createdProfile = !profile;

      setProfile(savedProfile);
      setForm({
        ...emptyProfile,
        ...savedProfile,
        instagram: savedProfile?.socialLinks?.instagram || "",
        facebook: savedProfile?.socialLinks?.facebook || "",
        youtube: savedProfile?.socialLinks?.youtube || "",
      });
      setEditing(false);
      setSuccess(response.data?.message || "Brand profile saved successfully.");
      await refreshProfiles();
      if (createdProfile && location.state?.continueToCampaign) {
        navigate("/businesses/modainfluence", {
          replace: true,
          state: { openCampaign: true },
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save your brand profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="brand-dashboard">
        <p>Loading your brand dashboard...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="brand-dashboard">
        <h1>Brand Dashboard</h1>
        <p>Please sign in to continue.</p>
        <button onClick={() => openAuthModal("login")}>Sign in</button>
      </main>
    );
  }

  if (error && !editing && !profile) {
    return (
      <main className="brand-dashboard">
        <h1>Brand Dashboard</h1>
        <p role="alert">{error}</p>
        <button onClick={() => window.location.reload()}>Try again</button>
      </main>
    );
  }

  return (
    <main className="brand-dashboard">
      <header className="brand-dashboard-header">
        <div>
          <p className="brand-dashboard-eyebrow">MODAINFLUENCE</p>
          <h1>{profile ? profile.brandName : "Set up your brand"}</h1>
          <p>
            {profile
              ? "Manage your brand profile and creator partnerships."
              : "Create your brand profile to get started."}
          </p>
        </div>

        {profile && !editing && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setEditing(true);
            }}
          >
            Edit profile
          </button>
        )}
      </header>

      {error && <p className="brand-dashboard-error" role="alert">{error}</p>}
      {success && <p className="brand-dashboard-success" role="status">{success}</p>}

      {editing ? (
        <section className="brand-dashboard-card">
          <h2>{profile ? "Edit brand profile" : "Create brand profile"}</h2>

          <form className="brand-profile-form" onSubmit={handleSubmit}>
            <label>
              Brand name *
              <input
                name="brandName"
                value={form.brandName}
                onChange={handleChange}
                required
                maxLength={120}
              />
            </label>

            <label>
              Category *
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                placeholder="e.g. Fashion, Beauty, Lifestyle"
              />
            </label>

            <label>
              Contact email *
              <input
                type="email"
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Contact phone
              <input
                type="tel"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
              />
            </label>

            <label>
              Website
              <input
                type="url"
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </label>

            <label>
              Logo URL
              <input
                type="url"
                name="logoUrl"
                value={form.logoUrl}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
              />
            </label>

            <label className="brand-profile-full-width">
              Brand description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </label>

            <h3 className="brand-profile-full-width">Social links</h3>

            {["instagram", "facebook", "youtube"].map((platform) => (
              <label key={platform}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
                <input
                  type="url"
                  name={platform}
                  value={form[platform]}
                  onChange={handleChange}
                  placeholder={`https://${platform}.com/...`}
                />
              </label>
            ))}

            <div className="brand-profile-actions brand-profile-full-width">
              {profile && (
                <button
                  type="button"
                  className="brand-profile-secondary"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                    setSuccess("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}

              <button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : profile
                    ? "Save changes"
                    : "Create profile"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        profile && (
          <>

            <section className="brand-dashboard-card brand-details-card">
              <h2>Brand Details</h2>

              <div className="brand-details-header">
                <div className="brand-details-logo">
                  {profile.logoUrl ? (
                    <img
                      src={profile.logoUrl}
                      alt={`${profile.brandName} logo`}
                    />
                  ) : (
                    <span>
                      {(profile.brandName || "B").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="brand-details-identity">
                  <h3>{profile.brandName}</h3>
                  {profile.category && (
                    <p className="brand-details-category">{profile.category}</p>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noreferrer">
                      {profile.website}
                    </a>
                  )}
                </div>
              </div>

              {profile.description && (
                <div className="brand-details-description">
                  <h4>About the brand</h4>
                  <p>{profile.description}</p>
                </div>
              )}

              <div className="brand-details-contact">
                <h4>Contact Information</h4>

                <div className="brand-details-contact-grid">
                  {profile.contactEmail && (
                    <div className="brand-details-contact-item">
                      <span>Email</span>
                      <a href={`mailto:${profile.contactEmail}`}>
                        {profile.contactEmail}
                      </a>
                    </div>
                  )}

                  {profile.contactPhone && (
                    <div className="brand-details-contact-item">
                      <span>Phone</span>
                      <a href={`tel:${profile.contactPhone}`}>
                        {profile.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {profile.socialLinks &&
                Object.entries(profile.socialLinks).some(([, url]) => url) && (
                  <div className="brand-details-socials">
                    <h4>Social Media</h4>
                    {Object.entries(profile.socialLinks).map(([platform, url]) =>
                      url ? (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </a>
                      ) : null
                    )}
                  </div>
                )}
            </section>


            <section className="brand-dashboard-card">
              <div className="brand-campaign-heading">
                <h2>Campaigns</h2>
                <button
                  type="button"
                  onClick={() =>
                    navigate("/businesses/modainfluence", {
                      state: { openCampaign: true },
                    })
                  }
                >
                  Create a Campaign
                </button>
              </div>

              {campaignsError && (
                <p className="brand-dashboard-error" role="alert">
                  {campaignsError}
                </p>
              )}
              {campaignNotice && !campaignDetails && (
                <p
                  className={`brand-dashboard-${campaignNoticeType}`}
                  role={campaignNoticeType === "error" ? "alert" : "status"}
                >
                  {campaignNotice}
                </p>
              )}

              {campaignsLoading ? (
                <p>Loading campaigns...</p>
              ) : campaigns.length === 0 ? (
                <div className="brand-campaign-empty">
                  <p>No campaigns are linked to this brand yet.</p>
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/businesses/modainfluence", {
                        state: { openCampaign: true },
                      })
                    }
                  >
                    Create a Campaign
                  </button>
                </div>
              ) : (
                <div className="brand-campaign-list">
                  {campaigns.map((campaign) => (
                    <article className="brand-campaign-item" key={campaign._id}>
                      <div className="brand-campaign-card-topline">
                        <span className="brand-campaign-visibility-label">
                          {campaign.isPublic ? "Visible" : "Hidden"}
                        </span>
                        <button
                          type="button"
                          className="brand-campaign-visibility-icon"
                          aria-label={campaign.isPublic ? "Hide campaign" : "Make campaign visible"}
                          title={campaign.isPublic ? "Hide campaign" : "Make campaign visible"}
                          aria-pressed={Boolean(campaign.isPublic)}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCampaignVisibility(campaign);
                          }}
                          disabled={visibilityUpdatingId === campaign._id || campaignDeletingId === campaign._id}
                        >
                          {campaign.isPublic ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        className="brand-campaign-card-open"
                        aria-label={`View ${campaign.title || campaign.campaignType} campaign details`}
                        onClick={(event) => {
                          campaignTriggerRef.current = event.currentTarget;
                          setCampaignDetails(campaign);
                        }}
                      >
                        <h3>{campaign.title || campaign.campaignType}</h3>
                        <p className="brand-campaign-card-type">{campaign.campaignType}</p>
                        <p className="brand-campaign-description-preview">{campaign.message}</p>
                        <span className="brand-campaign-submitted-date">
                          Submitted {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </button>
                    </article>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate("/businesses/modainfluence")}
              >
                Explore ModaInfluence
            </button>
            </section>
          </>
        )
      )}

      {campaignDetails && (
        <div
          className="brand-campaign-modal-backdrop brand-campaign-details-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCampaignDetails(null);
          }}
        >
          <section
            ref={detailsDialogRef}
            className="brand-campaign-modal brand-campaign-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-details-title"
            aria-describedby="campaign-details-description"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="brand-campaign-details-header">
              <div>
                <p className="brand-dashboard-eyebrow">CAMPAIGN DETAILS</p>
                <h2 id="campaign-details-title">{campaignDetails.title || campaignDetails.campaignType}</h2>
                <p className="brand-campaign-details-type">{campaignDetails.campaignType}</p>
                <p className="brand-campaign-details-brand">{campaignDetails.brand}</p>
              </div>
              <button
                ref={detailsCloseButtonRef}
                type="button"
                className="brand-campaign-modal-close"
                aria-label="Close campaign details"
                onClick={() => setCampaignDetails(null)}
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className="brand-campaign-details-body" id="campaign-details-description">
              <section className="brand-campaign-detail-section">
                <h3>Campaign description and details</h3>
                <CampaignMessageContent message={campaignDetails.message} />
              </section>
              <div className="brand-campaign-detail-meta">
                <p><strong>Submitted:</strong> {new Date(campaignDetails.createdAt).toLocaleDateString()}</p>
              </div>
              {campaignNotice && (
                <p
                  className={`brand-dashboard-${campaignNoticeType}`}
                  role={campaignNoticeType === "error" ? "alert" : "status"}
                >
                  {campaignNotice}
                </p>
              )}
            </div>

            <footer className="brand-campaign-details-actions">
              <button
                type="button"
                className="brand-profile-secondary brand-campaign-modal-visibility"
                onClick={() => handleCampaignVisibility(campaignDetails)}
                disabled={visibilityUpdatingId === campaignDetails._id || campaignDeletingId === campaignDetails._id}
              >
                {campaignDetails.isPublic ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                {campaignDetails.isPublic ? "Visible" : "Hidden"}
              </button>
              <div className="brand-campaign-actions">
                <button
                  type="button"
                  className="brand-profile-secondary"
                  onClick={() => {
                    const selected = campaignDetails;
                    setCampaignDetails(null);
                    openCampaignEditor(selected);
                  }}
                  disabled={campaignDeletingId === campaignDetails._id}
                >
                  Edit Campaign
                </button>
                <button
                  type="button"
                  className="brand-profile-secondary"
                  onClick={() => openCampaignApplications(campaignDetails)}
                  disabled={campaignDeletingId === campaignDetails._id}
                >
                  View Applications
                </button>
                <button
                  type="button"
                  className="brand-campaign-delete"
                  onClick={() => handleCampaignDelete(campaignDetails)}
                  disabled={campaignDeletingId === campaignDetails._id}
                >
                  {campaignDeletingId === campaignDetails._id ? "Deleting..." : "Delete Campaign"}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}

      {campaignBeingEdited && (
        <div
          className="brand-campaign-modal-backdrop"
          onClick={() => !campaignSaving && setCampaignBeingEdited(null)}
        >
          <section
            className="brand-campaign-modal brand-campaign-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-edit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="campaign-edit-title">Edit campaign</h2>
            {campaignsError && (
              <p className="brand-dashboard-error" role="alert">
                {campaignsError}
              </p>
            )}
            <form onSubmit={handleCampaignEdit}>
              <label>
                Campaign title
                <input
                  required
                  maxLength={150}
                  value={campaignEditForm.title || campaignBeingEdited.title || campaignBeingEdited.campaignType || ""}
                  onChange={(event) =>
                    setCampaignEditForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Brand / company
                <input
                  required
                  maxLength={150}
                  value={campaignEditForm.brand}
                  onChange={(event) =>
                    setCampaignEditForm((current) => ({
                      ...current,
                      brand: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Contact email
                <input
                  type="email"
                  required
                  maxLength={254}
                  value={campaignEditForm.email}
                  onChange={(event) =>
                    setCampaignEditForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Campaign type
                <input
                  required
                  maxLength={100}
                  value={campaignEditForm.campaignType}
                  onChange={(event) =>
                    setCampaignEditForm((current) => ({
                      ...current,
                      campaignType: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="campaign-description-field">
                Campaign description

                <div className="campaign-formatting-toolbar">
                  <button type="button" onClick={() => insertCampaignFormatting("bold")}>
                    <strong>B</strong>
                  </button>
                  <button type="button" onClick={() => insertCampaignFormatting("italic")}>
                    <em>I</em>
                  </button>
                  <button type="button" onClick={() => insertCampaignFormatting("heading")}>
                    Heading
                  </button>
                  <button type="button" onClick={() => insertCampaignFormatting("bullet")}>
                    • Bullets
                  </button>
                  <button type="button" onClick={() => insertCampaignFormatting("numbered")}>
                    1. Numbered
                  </button>
                </div>

                <textarea
                  ref={campaignDescriptionRef}
                  required
                  maxLength={3000}
                  rows={10}
                  value={campaignEditForm.message}
                  onChange={(event) =>
                    setCampaignEditForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  placeholder={
                    "Describe your campaign...\n\nCampaign Goals:\n- First goal\n- Second goal\n\nDeliverables:\n1. First deliverable"
                  }
                />

                <span className="campaign-description-hint">
                  Select text before applying bold or italic. Use headings and lists to organize campaign details.
                </span>
              </label>        
              <div className="brand-campaign-actions">
                <button
                  type="button"
                  className="brand-profile-secondary"
                  onClick={() => setCampaignBeingEdited(null)}
                  disabled={campaignSaving}
                >
                  Cancel
                </button>
                <button type="submit" disabled={campaignSaving}>
                  {campaignSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {applicationCampaign && (
        <div className="brand-campaign-modal-backdrop" onClick={() => setApplicationCampaign(null)}>
          <section
            className="brand-campaign-modal brand-applications-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-applications-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="campaign-applications-title">Applications: {applicationCampaign.campaignType}</h2>
            {applicationsError && <p className="brand-dashboard-error" role="alert">{applicationsError}</p>}
            {applicationsLoading ? <p>Loading applications...</p> : campaignApplications.length === 0 ? (
              <p>No applications for this campaign yet.</p>
            ) : (
              <div className="brand-application-list">
                {campaignApplications.map((application) => (
                  <article className="brand-application-item" key={application._id}>
                    <div className="brand-application-title-row">
                      <h3>{application.influencer?.displayName || "Influencer"}</h3>
                      <span className={`brand-application-status ${application.status.toLowerCase()}`}>{application.status}</span>
                    </div>
                    <p><strong>Applied:</strong> {new Date(application.createdAt).toLocaleDateString()}</p>
                    {application.influencer?.category && <p><strong>Category:</strong> {application.influencer.category}</p>}
                    {application.influencer?.bio && <p>{application.influencer.bio}</p>}
                    {application.influencer?.website && <p><a href={application.influencer.website} target="_blank" rel="noreferrer">Website</a></p>}
                    {application.influencer?.socialLinks && Object.entries(application.influencer.socialLinks).map(([network, url]) => url && (
                      <p key={network}><a href={url} target="_blank" rel="noreferrer">{network}</a></p>
                    ))}
                    {application.status === "Withdrawn" && (
                      <p className="brand-application-withdrawn-note">The influencer withdrew this application.</p>
                    )}
                    <div className="brand-campaign-actions">
                      <button type="button" onClick={() => updateApplicationStatus(application, "Accepted")} disabled={applicationBusyId === application._id || application.status === "Accepted" || application.status === "Withdrawn"}>Accept</button>
                      <button type="button" className="brand-profile-secondary" onClick={() => updateApplicationStatus(application, "Rejected")} disabled={applicationBusyId === application._id || application.status === "Rejected" || application.status === "Withdrawn"}>Reject</button>
                      <button type="button" className="brand-campaign-delete" onClick={() => deleteApplication(application)} disabled={applicationBusyId === application._id}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="brand-campaign-actions">
              <button type="button" className="brand-profile-secondary" onClick={() => setApplicationCampaign(null)}>Close</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default BrandDashboard;
