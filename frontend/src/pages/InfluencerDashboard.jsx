import { useEffect, useRef, useState } from "react";
import { Trash2, ExternalLink, Pencil, UserRound, BriefcaseBusiness } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useInfluenceProfiles } from "../context/InfluenceProfilesContext";
import apiClient from "../services/apiClient";
import "./BrandDashboard.css";

const emptyProfile = {
  displayName: "",
  contactEmail: "",
  category: "",
  bio: "",
  website: "",
  instagram: "",
  tiktok: "",
  youtube: "",
};

const getStatusClass = (status) =>
  (status || "pending").toLowerCase().replace(/\s+/g, "-");

function InfluencerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const { isAuthenticated, loading: authLoading, openAuthModal } = useAuth();

  const {
    influencerProfile: profile,
    loading: profilesLoading,
    influencerError: profilesError,
    refreshProfiles,
  } = useInfluenceProfiles();

  const [form, setForm] = useState(emptyProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [applications, setApplications] = useState([]);
  const [applicationsError, setApplicationsError] = useState("");
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [withdrawalApplication, setWithdrawalApplication] = useState(null);
  const [deletionApplication, setDeletionApplication] = useState(null);
  const [withdrawingApplicationId, setWithdrawingApplicationId] = useState(null);
  const [deletingApplicationId, setDeletingApplicationId] = useState(null);
  const [applicationsNotice, setApplicationsNotice] = useState("");

  const withdrawalInProgress = useRef(false);
  const deletionInProgress = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !profile) {
      setApplications([]);
      setApplicationsLoading(false);
      return undefined;
    }

    let active = true;

    setApplicationsLoading(true);
    setApplicationsError("");

    apiClient
      .get("/api/modasphere/influence/influencer-profile/applications")
      .then(({ data }) => {
        if (active) setApplications(data?.data || []);
      })
      .catch((err) => {
        if (active) {
          setApplicationsError(
            err.response?.data?.message ||
              "Unable to load your applications."
          );
        }
      })
      .finally(() => {
        if (active) setApplicationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, profile]);

  useEffect(() => {
    if (!withdrawalApplication && !deletionApplication) return undefined;

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !withdrawalInProgress.current &&
        !deletionInProgress.current
      ) {
        setWithdrawalApplication(null);
        setDeletionApplication(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [withdrawalApplication, deletionApplication]);

  useEffect(() => {
    if (!profile) {
      setForm(emptyProfile);
      setEditing(true);
      return;
    }

    setForm({
      displayName: profile.displayName || "",
      contactEmail: profile.contactEmail || "",
      category: profile.category || "",
      bio: profile.bio || "",
      website: profile.website || "",
      instagram: profile.socialLinks?.instagram || "",
      tiktok: profile.socialLinks?.tiktok || "",
      youtube: profile.socialLinks?.youtube || "",
    });
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openAuthModal("login");
    }
  }, [authLoading, isAuthenticated, openAuthModal]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      displayName: form.displayName.trim(),
      contactEmail: form.contactEmail.trim(),
      category: form.category.trim(),
      bio: form.bio.trim(),
      website: form.website.trim(),
      socialLinks: {
        instagram: form.instagram.trim(),
        tiktok: form.tiktok.trim(),
        youtube: form.youtube.trim(),
      },
    };

    try {
      const response = profile
        ? await apiClient.patch(
            "/api/modasphere/influence/influencer-profile",
            payload
          )
        : await apiClient.post(
            "/api/modasphere/influence/influencer-profile",
            payload
          );

      await refreshProfiles();
      setEditing(false);

      if (location.state?.continueToApplication) {
        navigate("/businesses/modainfluence", {
          replace: true,
          state: {
            applyToCampaign: location.state.continueToApplication,
          },
        });
        return;
      }

      setSuccess(response.data?.message || "Influencer profile saved.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save your influencer profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmWithdrawal = async () => {
    if (!withdrawalApplication || withdrawalInProgress.current) return;

    withdrawalInProgress.current = true;
    setWithdrawingApplicationId(withdrawalApplication._id);
    setApplicationsError("");
    setApplicationsNotice("");

    try {
      const response = await apiClient.patch(
        `/api/modasphere/influence/influencer-profile/applications/${withdrawalApplication._id}/withdraw`
      );

      setApplications((current) =>
        current.map((application) =>
          application._id === withdrawalApplication._id
            ? {
                ...application,
                status: response.data?.data?.status || "Withdrawn",
              }
            : application
        )
      );

      setApplicationsNotice(
        response.data?.message || "Application withdrawn successfully."
      );
      setWithdrawalApplication(null);
    } catch (err) {
      setApplicationsError(
        err.response?.data?.message ||
          "Unable to withdraw this application."
      );

      try {
        const { data } = await apiClient.get(
          "/api/modasphere/influence/influencer-profile/applications"
        );
        setApplications(data?.data || []);
      } catch {
        // Preserve the current list and display the original error.
      }
    } finally {
      withdrawalInProgress.current = false;
      setWithdrawingApplicationId(null);
    }
  };

  const confirmRejectedApplicationDeletion = async () => {
    if (!deletionApplication || deletionInProgress.current) return;

    deletionInProgress.current = true;
    setDeletingApplicationId(deletionApplication._id);
    setApplicationsError("");
    setApplicationsNotice("");

    try {
      const response = await apiClient.delete(
        `/api/modasphere/influence/influencer-profile/applications/${deletionApplication._id}`
      );

      setApplications((current) =>
        current.filter(
          (application) => application._id !== deletionApplication._id
        )
      );

      setApplicationsNotice(
        response.data?.message || "Rejected application deleted."
      );
      setDeletionApplication(null);
    } catch (err) {
      setApplicationsError(
        err.response?.data?.message ||
          "Unable to delete this application."
      );
    } finally {
      deletionInProgress.current = false;
      setDeletingApplicationId(null);
    }
  };

  if (authLoading || profilesLoading) {
    return (
      <main className="brand-dashboard influencer-dashboard">
        <div className="influencer-loading">
          <span className="influencer-loading-spinner" aria-hidden="true" />
          <p>Loading your influencer dashboard...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="brand-dashboard influencer-dashboard">
        <section className="brand-dashboard-card influencer-empty-state">
          <UserRound size={40} aria-hidden="true" />
          <h1>Welcome to ModaInfluence</h1>
          <p>Please sign in to manage your influencer profile and applications.</p>
          <button type="button" onClick={() => openAuthModal("login")}>
            Sign in
          </button>
        </section>
      </main>
    );
  }

  if (profilesError) {
    return (
      <main className="brand-dashboard influencer-dashboard">
        <header className="brand-dashboard-header">
          <div>
            <p className="brand-dashboard-eyebrow">MODAINFLUENCE</p>
            <h1>Influencer Dashboard</h1>
          </div>
          <Link to="/businesses/modainfluence">Explore ModaInfluence</Link>
        </header>

        <section className="brand-dashboard-card">
          <p className="brand-dashboard-error" role="alert">
            {profilesError}
          </p>
          <button type="button" onClick={refreshProfiles}>
            Retry
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="brand-dashboard influencer-dashboard">
      <header className="brand-dashboard-header influencer-dashboard-header">
        <div>
          <p className="brand-dashboard-eyebrow">MODAINFLUENCE / CREATOR SPACE</p>
          <h1>{profile?.displayName || "Influencer Dashboard"}</h1>
          <p>
            {profile
              ? "Manage your creator profile and keep track of your campaign applications."
              : "Create your profile to start connecting with brands and campaigns."}
          </p>
        </div>

        <Link
          className="influencer-explore-link"
          to="/businesses/modainfluence"
        >
          Explore campaigns
          <ExternalLink size={16} aria-hidden="true" />
        </Link>
      </header>

      {(error || success) && (
        <div
          className={`influencer-feedback ${
            error ? "influencer-feedback-error" : "influencer-feedback-success"
          }`}
          role={error ? "alert" : "status"}
        >
          {error || success}
        </div>
      )}

      {editing ? (
        <section className="brand-dashboard-card influencer-profile-editor">
          <div className="influencer-section-heading">
            <div className="influencer-section-icon">
              <UserRound size={21} aria-hidden="true" />
            </div>
            <div>
              <h2>{profile ? "Edit your profile" : "Create your creator profile"}</h2>
              <p>
                Share a little about yourself so brands can get to know you.
              </p>
            </div>
          </div>

          <form className="brand-profile-form influencer-profile-form" onSubmit={handleSubmit}>
            <label>
              Name <span className="influencer-required">*</span>
              <input
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Your public creator name"
              />
            </label>

            <label>
              Contact email <span className="influencer-required">*</span>
              <input
                type="email"
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
                required
                maxLength={254}
                placeholder="you@example.com"
              />
            </label>

            <label>
              Category
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                maxLength={100}
                placeholder="Fashion, beauty, lifestyle..."
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

            <label className="brand-profile-full-width">
              About you
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                maxLength={2000}
                placeholder="Tell brands about your content, audience, and interests..."
              />
              <span className="influencer-field-hint">
                {form.bio.length}/2000 characters
              </span>
            </label>

            <div className="influencer-social-heading brand-profile-full-width">
              <h3>Social media</h3>
              <p>Add the links to your creator profiles.</p>
            </div>

            {[
              ["instagram", "Instagram"],
              ["tiktok", "TikTok"],
              ["youtube", "YouTube"],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  maxLength={500}
                  placeholder={`${label} profile URL`}
                />
              </label>
            ))}

            <div className="brand-profile-actions brand-profile-full-width influencer-form-actions">
              {profile && (
                <button
                  type="button"
                  className="brand-profile-secondary"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}

              <button type="submit" disabled={saving}>
                {saving
                  ? "Saving profile..."
                  : profile
                    ? "Save changes"
                    : "Create profile"}
              </button>
            </div>
          </form>
        </section>
      ) : profile ? (
        <>
          <section className="brand-dashboard-card influencer-profile-overview">
            <div className="influencer-card-topline">
              <div className="influencer-section-heading">
                <div className="influencer-section-icon">
                  <UserRound size={21} aria-hidden="true" />
                </div>
                <div>
                  <h2>Your profile</h2>
                  <p>This is your creator information.</p>
                </div>
              </div>

              <button
                type="button"
                className="influencer-edit-button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setEditing(true);
                }}
              >
                <Pencil size={15} aria-hidden="true" />
                Edit profile
              </button>
            </div>

            <div className="influencer-profile-identity">
              <div className="influencer-avatar" aria-hidden="true">
                {(profile.displayName || "I").trim().charAt(0).toUpperCase()}
              </div>
              <div>
                <h3>{profile.displayName}</h3>
                <p>{profile.category || "Creator"}</p>
              </div>
            </div>

            <div className="influencer-profile-details">
              <div className="influencer-detail-item">
                <span>Contact email</span>
                <p>{profile.contactEmail}</p>
              </div>

              <div className="influencer-detail-item">
                <span>Category</span>
                <p>{profile.category || "Not specified"}</p>
              </div>

              {profile.website && (
                <div className="influencer-detail-item">
                  <span>Website</span>
                  <p>
                    <a href={profile.website} target="_blank" rel="noreferrer">
                      {profile.website}
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </p>
                </div>
              )}
            </div>

            {profile.bio && (
              <div className="influencer-profile-bio">
                <h3>About</h3>
                <p>{profile.bio}</p>
              </div>
            )}

            {(profile.socialLinks?.instagram ||
              profile.socialLinks?.tiktok ||
              profile.socialLinks?.youtube) && (
              <div className="influencer-social-links">
                <h3>Social profiles</h3>
                <div className="influencer-social-list">
                  {[
                    ["instagram", "Instagram"],
                    ["tiktok", "TikTok"],
                    ["youtube", "YouTube"],
                  ].map(([name, label]) =>
                    profile.socialLinks?.[name] ? (
                      <a
                        key={name}
                        href={profile.socialLinks[name]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {label}
                        <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="brand-dashboard-card influencer-applications">
            <div className="influencer-applications-header">
              <div className="influencer-section-heading">
                <div className="influencer-section-icon">
                  <BriefcaseBusiness size={21} aria-hidden="true" />
                </div>
                <div>
                  <h2>My applications</h2>
                  <p>Track your progress with brands and campaigns.</p>
                </div>
              </div>

              <span className="influencer-application-count">
                {applications.length}{" "}
                {applications.length === 1 ? "application" : "applications"}
              </span>
            </div>

            {applicationsError && (
              <p className="brand-dashboard-error" role="alert">
                {applicationsError}
              </p>
            )}

            {applicationsNotice && (
              <p className="brand-dashboard-success" role="status">
                {applicationsNotice}
              </p>
            )}

            {applicationsLoading ? (
              <div className="influencer-loading">
                <span className="influencer-loading-spinner" aria-hidden="true" />
                <p>Loading your applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="influencer-empty-state">
                <div className="influencer-empty-icon">
                  <BriefcaseBusiness size={28} aria-hidden="true" />
                </div>
                <h3>No applications yet</h3>
                <p>
                  When you apply to a campaign, you’ll be able to track its
                  status here.
                </p>
                <Link to="/businesses/modainfluence">
                  Explore campaigns
                  <ExternalLink size={15} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="influencer-application-list">
                {applications.map((application) => (
                  <article
                    className="influencer-application-item"
                    key={application._id}
                  >
                    <div className="influencer-application-card-heading">
                      <div>
                        <h3>
                          {application.campaign?.title ||
                            application.campaign?.campaignType ||
                            "Campaign"}
                        </h3>
                        <p className="influencer-application-brand">
                          {application.campaign?.brand || "Brand unavailable"}
                        </p>
                      </div>

                      <div className="influencer-application-heading-actions">
                        <span
                          className={`influencer-application-status ${getStatusClass(
                            application.status
                          )}`}
                        >
                          {application.status || "Pending"}
                        </span>

                        {application.status === "Rejected" && (
                          <button
                            type="button"
                            className="influencer-application-delete"
                            aria-label="Delete rejected application"
                            title="Delete rejected application"
                            onClick={() => setDeletionApplication(application)}
                            disabled={deletingApplicationId === application._id}
                          >
                            <Trash2 aria-hidden="true" size={17} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="influencer-application-meta">
                      <p>
                        <span>Applied on</span>
                        <strong>
                          {application.createdAt
                            ? new Date(application.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "Unavailable"}
                        </strong>
                      </p>
                    </div>

                    {application.status === "Pending" && (
                      <div className="influencer-application-actions">
                        <button
                          type="button"
                          className="brand-profile-secondary influencer-withdraw-button"
                          onClick={() => setWithdrawalApplication(application)}
                          disabled={withdrawingApplicationId === application._id}
                        >
                          {withdrawingApplicationId === application._id
                            ? "Withdrawing..."
                            : "Withdraw application"}
                        </button>
                      </div>
                    )}

                    {application.status === "Accepted" && (
                      <p className="influencer-withdraw-explanation">
                        Your application has been accepted. Contact the brand
                        to discuss the next steps.
                      </p>
                    )}

                    {application.campaign?.publiclyAvailable && (
                      <Link
                        className="influencer-view-campaign"
                        to={`/businesses/modainfluence#campaign-${application.campaign.publicId}`}
                      >
                        View campaign
                        <ExternalLink size={14} aria-hidden="true" />
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}

      {withdrawalApplication && (
        <div
          className="brand-campaign-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !withdrawalInProgress.current
            ) {
              setWithdrawalApplication(null);
            }
          }}
        >
          <section
            className="brand-campaign-modal influencer-withdraw-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="withdraw-application-title"
            aria-describedby="withdraw-application-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="withdraw-application-title">Withdraw application?</h2>
            <p id="withdraw-application-description">
              Are you sure you want to withdraw your application for this
              campaign?
            </p>

            <div className="brand-campaign-actions">
              <button
                type="button"
                className="brand-profile-secondary"
                onClick={() => setWithdrawalApplication(null)}
                disabled={withdrawingApplicationId === withdrawalApplication._id}
              >
                Cancel
              </button>

              <button
                type="button"
                className="brand-campaign-delete"
                onClick={confirmWithdrawal}
                disabled={withdrawingApplicationId === withdrawalApplication._id}
              >
                {withdrawingApplicationId === withdrawalApplication._id
                  ? "Withdrawing..."
                  : "Withdraw application"}
              </button>
            </div>
          </section>
        </div>
      )}

      {deletionApplication && (
        <div
          className="brand-campaign-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deletionInProgress.current
            ) {
              setDeletionApplication(null);
            }
          }}
        >
          <section
            className="brand-campaign-modal influencer-withdraw-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-application-title"
            aria-describedby="delete-application-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="delete-application-title">Delete rejected application?</h2>
            <p id="delete-application-description">
              Are you sure you want to delete this rejected application? This
              action cannot be undone.
            </p>

            <div className="brand-campaign-actions">
              <button
                type="button"
                className="brand-profile-secondary"
                onClick={() => setDeletionApplication(null)}
                disabled={deletingApplicationId === deletionApplication._id}
              >
                Cancel
              </button>

              <button
                type="button"
                className="brand-campaign-delete"
                onClick={confirmRejectedApplicationDeletion}
                disabled={deletingApplicationId === deletionApplication._id}
              >
                {deletingApplicationId === deletionApplication._id
                  ? "Deleting..."
                  : "Delete application"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default InfluencerDashboard;