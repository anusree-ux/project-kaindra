
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  tiktok: "",
};

function BrandDashboard() {
  const { isAuthenticated, loading: authLoading, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
            tiktok: data.socialLinks?.tiktok || "",
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
        tiktok: form.tiktok.trim(),
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

      setProfile(savedProfile);
      setForm({
        ...emptyProfile,
        ...savedProfile,
        instagram: savedProfile?.socialLinks?.instagram || "",
        facebook: savedProfile?.socialLinks?.facebook || "",
        youtube: savedProfile?.socialLinks?.youtube || "",
        tiktok: savedProfile?.socialLinks?.tiktok || "",
      });
      setEditing(false);
      setSuccess(response.data?.message || "Brand profile saved successfully.");
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

            {["instagram", "facebook", "youtube", "tiktok"].map((platform) => (
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
            <section className="brand-dashboard-card">
              <h2>Brand profile</h2>

              {profile.logoUrl && (
                <img
                  className="brand-dashboard-logo"
                  src={profile.logoUrl}
                  alt={`${profile.brandName} logo`}
                />
              )}

              <p><strong>Category:</strong> {profile.category}</p>
              <p><strong>Email:</strong> {profile.contactEmail}</p>

              {profile.contactPhone && (
                <p><strong>Phone:</strong> {profile.contactPhone}</p>
              )}

              {profile.website && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a href={profile.website} target="_blank" rel="noreferrer">
                    {profile.website}
                  </a>
                </p>
              )}

              {profile.description && <p>{profile.description}</p>}

              {profile.socialLinks &&
                Object.entries(profile.socialLinks).map(([platform, url]) =>
                  url ? (
                    <p key={platform}>
                      <strong>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}:
                      </strong>{" "}
                      <a href={url} target="_blank" rel="noreferrer">{url}</a>
                    </p>
                  ) : null
                )}
            </section>

            <section className="brand-dashboard-card">
              <h2>Campaigns</h2>
              <p>
                Your campaign management area will appear here as we connect
                the next features.
              </p>
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
    </main>
  );
}

export default BrandDashboard;