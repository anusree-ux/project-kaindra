import { useEffect, useState } from "react";
import {
  Megaphone,
  Eye,
  X,
  Mail,
  CalendarDays,
  Tag,
  Building2,
  Globe,
  Phone,
} from "lucide-react";
import "./AdminInfluence.css";

function AdminInfluence() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [influencers, setInfluencers] = useState([]);
  const [influencersLoading, setInfluencersLoading] = useState(true);
  const [influencersError, setInfluencersError] = useState("");
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(null);

  const [selectedCampaign, setSelectedCampaign] =
    useState(null);


  const handleDeleteCampaign = async (campaignId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You are not logged in.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this campaign request?"
    );

    if (!confirmed) return;

    const endpoint = `/api/modasphere/influence/campaigns/${campaignId}`;

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete campaign request");
      }

      setCampaigns((currentCampaigns) =>
        currentCampaigns.filter(
          (campaign) => campaign._id !== campaignId
        )
      );

      if (selectedCampaign?._id === campaignId) {
        setSelectedCampaign(null);
      }
    } catch (error) {
      console.error("Delete campaign error:", error);
      alert(error.message || "Failed to delete campaign request");
    }
  };

  const handleInfluencerStatus = async () => {
    if (!selectedInfluencer || updatingStatus) return;

    const nextStatus =
      selectedInfluencer.status === "Inactive" ? "Active" : "Inactive";

    const confirmed = window.confirm(
      nextStatus === "Inactive"
        ? "Place this influencer's ModaInfluence account on hold?"
        : "Reactivate this influencer's ModaInfluence account?"
    );

    if (!confirmed) return;

    try {
      setUpdatingStatus(true);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("You are not logged in.");
      }

      const response = await fetch(
        `/api/modasphere/influence/admin/influencers/${selectedInfluencer._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update account status."
        );
      }

      const updatedInfluencer = {
        ...selectedInfluencer,
        status: nextStatus,
      };

      setInfluencers((current) =>
        current.map((influencer) =>
          influencer._id === updatedInfluencer._id
            ? updatedInfluencer
            : influencer
        )
      );

      setSelectedInfluencer(updatedInfluencer);
    } catch (error) {
      alert(error.message || "Failed to update account status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    const loadCampaigns = async () => {
      const endpoint = "/api/modasphere/influence/campaigns";

      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

          if (!token) {
            throw new Error("You are not logged in.");
          }

          const response = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load campaigns"
          );
        }

        setCampaigns(data.data || []);
      } catch (error) {
        console.error("Load campaigns error:", error);
        setError(
          error.message || "Failed to load campaigns"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
    }, []);

  useEffect(() => {
    const loadInfluencers = async () => {
      try {
        setInfluencersLoading(true);
        setInfluencersError("");

        const token = localStorage.getItem("token");
        if (!token) throw new Error("You are not logged in.");

        const response = await fetch(
          "/api/modasphere/influence/admin/influencers",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load influencers.");
        }

        setInfluencers(result.data || []);
      } catch (error) {
        setInfluencersError(error.message || "Failed to load influencers.");
      } finally {
        setInfluencersLoading(false);
      }
    };

    loadInfluencers();
  }, []);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        setBrandsLoading(true);
        setBrandsError("");

        const token = localStorage.getItem("token");
        if (!token) throw new Error("You are not logged in.");

        const response = await fetch(
          "/api/modasphere/influence/admin/brands",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load registered brands."
          );
        }

        setBrands(result.data || []);
      } catch (error) {
        setBrandsError(
          error.message || "Failed to load registered brands."
        );
      } finally {
        setBrandsLoading(false);
      }
    };

    loadBrands();
  }, []);

  return (
    <div className="admin-influence-page">
      <div className="admin-influence-container">

        <div className="admin-influence-header">
          <div>
            <span className="admin-influence-eyebrow">
              KAINDRA ADMIN
            </span>

            <h1>ModaInfluence Campaigns</h1>

            <p>
              View and manage campaign requests submitted
              through ModaInfluence.
            </p>
          </div>

          <div className="admin-influence-count">
            <span>Total Campaigns</span>
            <strong>{campaigns.length}</strong>
          </div>
        </div>

        {loading ? (
          <div className="admin-influence-empty">
            <h2>Loading campaigns...</h2>
          </div>
        ) : error ? (
          <div className="admin-influence-empty">
            <h2>Unable to load campaigns</h2>
            <p>{error}</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="admin-influence-empty">
            <Megaphone size={40} />

            <h2>No campaigns yet</h2>

            <p>
              Submitted ModaInfluence campaigns will
              appear here.
            </p>
          </div>
        ) : (
          <div className="admin-influence-card">

            <div className="admin-influence-table-wrapper">
              <table className="admin-influence-table">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Email</th>
                    <th>Campaign Type</th>
                    <th>Message</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign._id}>

                      <td>
                        <strong>
                          {campaign.brand || "—"}
                        </strong>
                      </td>

                      <td>
                        <span className="admin-influence-email">
                          <Mail size={14} />
                          {campaign.email || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="admin-influence-type">
                          <Tag size={13} />
                          {campaign.campaignType || "—"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-influence-message">
                          {campaign.message || "—"}
                        </div>
                      </td>

                      <td>
                        <span className="admin-influence-date">
                          <CalendarDays size={13} />
                          {campaign.createdAt
                            ? new Date(campaign.createdAt).toLocaleString()
                            : "—"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-influence-view-button"
                          onClick={() =>
                            setSelectedCampaign(campaign)
                          }
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}


        <section className="admin-influence-card admin-influencers-section">
          <div className="admin-influencers-heading">
            <div>
              <h2>Registered Influencers</h2>
              <p>Manage influencer profiles and account access.</p>
            </div>

            <div className="admin-influence-count">
              <span>Total Influencers</span>
              <strong>{influencers.length}</strong>
            </div>
          </div>

          {influencersLoading ? (
            <p className="admin-influencers-message">
              Loading influencers...
            </p>
          ) : influencersError ? (
            <p className="admin-influencers-message">
              {influencersError}
            </p>
          ) : influencers.length === 0 ? (
            <p className="admin-influencers-message">
              No registered influencers yet.
            </p>
          ) : (
            <div className="admin-influence-table-wrapper">
              <table className="admin-influence-table">
                <thead>
                  <tr>
                    <th>Influencer</th>
                    <th>Category</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {influencers.map((influencer) => (
                    <tr key={influencer._id}>
                      <td>
                        <strong>
                          {influencer.displayName ||
                            influencer.owner?.name ||
                            "—"}
                        </strong>
                      </td>

                      <td>{influencer.category || "—"}</td>

                      <td>
                        {influencer.createdAt
                          ? new Date(
                              influencer.createdAt
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        <span
                          className={`admin-influencer-status ${
                            influencer.status === "Inactive"
                              ? "is-inactive"
                              : "is-active"
                          }`}
                        >
                          {influencer.status === "Inactive"
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-influence-view-button"
                          onClick={() =>
                            setSelectedInfluencer(influencer)
                          }
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-influence-card admin-brands-section">
          <div className="admin-influencers-heading">
            <div>
              <h2>Registered Brands</h2>
              <p>View registered brand profiles and their campaigns.</p>
            </div>

            <div className="admin-influence-count">
              <span>Total Brands</span>
              <strong>{brands.length}</strong>
            </div>
          </div>

          {brandsLoading ? (
            <p className="admin-influencers-message">
              Loading registered brands...
            </p>
          ) : brandsError ? (
            <p className="admin-influencers-message" role="alert">
              {brandsError}
            </p>
          ) : brands.length === 0 ? (
            <div className="admin-influence-empty">
              <Building2 size={36} />
              <h2>No registered brands yet</h2>
              <p>Brand profiles will appear here when created.</p>
            </div>
          ) : (
            <div className="admin-influence-table-wrapper">
              <table className="admin-influence-table">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Contact Email</th>
                    <th>Registered</th>
                    <th>Campaigns</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {brands.map((brand) => (
                    <tr key={brand._id}>
                      <td>
                        <div className="admin-brand-table-identity">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt=""
                              className="admin-brand-table-logo"
                            />
                          ) : (
                            <span className="admin-brand-table-placeholder">
                              {(brand.brandName || "B")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}

                          <strong>{brand.brandName || "—"}</strong>
                        </div>
                      </td>

                      <td>{brand.category || "—"}</td>

                      <td>
                        <span className="admin-influence-email">
                          <Mail size={14} />
                          {brand.contactEmail || brand.owner?.email || "—"}
                        </span>
                      </td>

                      <td>
                        {brand.createdAt
                          ? new Date(brand.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>{brand.campaignCount ?? 0}</td>

                      <td>
                        <button
                          type="button"
                          className="admin-influence-view-button"
                          onClick={() => setSelectedBrand(brand)}
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>

      {/* Details Modal */}
      {selectedCampaign && (
        <div
          className="admin-influence-modal-overlay"
          onClick={() => setSelectedCampaign(null)}
        >
          <div
            className="admin-influence-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-influence-modal-header">
              <div>
                <span>CAMPAIGN DETAILS</span>
                <h2>
                  {selectedCampaign.brand || "Campaign"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedCampaign(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-influence-details">

              <div>
                <span>BRAND / COMPANY</span>
                <strong>
                  {selectedCampaign.brand || "—"}
                </strong>
              </div>

              <div>
                <span>EMAIL</span>
                <strong>
                  {selectedCampaign.email || "—"}
                </strong>
              </div>

              <div>
                <span>CAMPAIGN TYPE</span>
                <strong>
                  {selectedCampaign.campaignType || "—"}
                </strong>
              </div>

              <div>
                <span>SUBMITTED DATE</span>
                <strong>
                  {selectedCampaign.createdAt
                    ? new Date(
                        selectedCampaign.createdAt
                      ).toLocaleString()
                    : "—"}
                </strong>
              </div>

              <div className="admin-influence-detail-message">
                <span>MESSAGE</span>
                <p>
                  {selectedCampaign.message || "—"}
                </p>
              </div>

              <div className="admin-influence-delete-section">
                <button
                  type="button"
                  className="admin-influence-delete-button"
                  onClick={() =>
                    handleDeleteCampaign(selectedCampaign._id)
                  }
                >
                  Delete Campaign
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {selectedInfluencer && (
        <div
          className="admin-influence-modal-overlay"
          onClick={() => setSelectedInfluencer(null)}
        >
          <div
            className="admin-influence-modal admin-influencer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-influence-modal-header">
              <div>
                <span>INFLUENCER DETAILS</span>
                <h2>
                  {selectedInfluencer.displayName ||
                    selectedInfluencer.owner?.name ||
                    "Influencer"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInfluencer(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-influence-details">
              <div>
                <span>EMAIL</span>
                <strong>
                  {selectedInfluencer.contactEmail ||
                    selectedInfluencer.owner?.email ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>CATEGORY</span>
                <strong>{selectedInfluencer.category || "—"}</strong>
              </div>

              <div>
                <span>REGISTERED</span>
                <strong>
                  {selectedInfluencer.createdAt
                    ? new Date(
                        selectedInfluencer.createdAt
                      ).toLocaleString()
                    : "—"}
                </strong>
              </div>

              <div>
                <span>STATUS</span>
                <strong>
                  {selectedInfluencer.status === "Inactive"
                    ? "Inactive — On hold"
                    : "Active"}
                </strong>
              </div>

              <div className="admin-influence-detail-message">
                <span>BIO</span>
                <p>{selectedInfluencer.bio || "No bio provided."}</p>
              </div>

              <div>
                <span>WEBSITE</span>
                {selectedInfluencer.website ? (
                  <a
                    href={selectedInfluencer.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selectedInfluencer.website}
                  </a>
                ) : (
                  <strong>—</strong>
                )}
              </div>

              <div>
                <span>SOCIAL LINKS</span>
                {["instagram", "youtube"].map((platform) => (
                  <p key={platform}>
                    <strong>{platform}: </strong>
                    {selectedInfluencer.socialLinks?.[platform] || "—"}
                  </p>
                ))}
              </div>

              <div className="admin-influence-detail-message">
                <span>
                  CAMPAIGN APPLICATION HISTORY (
                  {selectedInfluencer.applications?.length || 0})
                </span>

                {!selectedInfluencer.applications?.length ? (
                  <p>No applications recorded.</p>
                ) : (
                  selectedInfluencer.applications.map((application) => (
                    <div
                      key={application._id}
                      className="admin-influencer-application"
                    >
                      <strong>
                        {application.campaign?.title ||
                          application.campaign?.brand ||
                          "Campaign unavailable"}
                      </strong>
                      <p>
                        {application.campaign?.brand || "—"} ·{" "}
                        {application.status || "Unknown status"}
                      </p>
                      <p>
                        {application.createdAt
                          ? new Date(
                              application.createdAt
                            ).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-influence-delete-section">
                <button
                  type="button"
                  className="admin-influencer-status-button"
                  disabled={updatingStatus}
                  onClick={handleInfluencerStatus}
                >
                  {updatingStatus
                    ? "Updating..."
                    : selectedInfluencer.status === "Inactive"
                      ? "Reactivate Account"
                      : "Hold Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedBrand && (
        <div
          className="admin-influence-modal-overlay"
          onClick={() => setSelectedBrand(null)}
        >
          <div
            className="admin-influence-modal admin-brand-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-brand-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-influence-modal-header">
              <div>
                <span>REGISTERED BRAND DETAILS</span>
                <h2 id="admin-brand-details-title">
                  {selectedBrand.brandName || "Brand"}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close brand details"
                onClick={() => setSelectedBrand(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-influence-details">
              <div className="admin-brand-details-identity">
                {selectedBrand.logoUrl ? (
                  <img
                    src={selectedBrand.logoUrl}
                    alt={`${selectedBrand.brandName} logo`}
                    className="admin-brand-details-logo"
                  />
                ) : (
                  <div className="admin-brand-details-logo-placeholder">
                    {(selectedBrand.brandName || "B")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <span>BRAND NAME</span>
                <strong>{selectedBrand.brandName || "—"}</strong>
              </div>

              <div>
                <span>CATEGORY</span>
                <strong>{selectedBrand.category || "—"}</strong>
              </div>

              <div>
                <span>CONTACT EMAIL</span>
                {selectedBrand.contactEmail ? (
                  <a href={`mailto:${selectedBrand.contactEmail}`}>
                    {selectedBrand.contactEmail}
                  </a>
                ) : (
                  <strong>{selectedBrand.owner?.email || "—"}</strong>
                )}
              </div>

              <div>
                <span>CONTACT PHONE</span>
                {selectedBrand.contactPhone ? (
                  <a href={`tel:${selectedBrand.contactPhone}`}>
                    <Phone size={14} />
                    {" "}{selectedBrand.contactPhone}
                  </a>
                ) : (
                  <strong>—</strong>
                )}
              </div>

              <div>
                <span>WEBSITE</span>
                {selectedBrand.website ? (
                  <a
                    href={selectedBrand.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe size={14} />
                    {" "}{selectedBrand.website}
                  </a>
                ) : (
                  <strong>—</strong>
                )}
              </div>

              <div>
                <span>REGISTERED</span>
                <strong>
                  {selectedBrand.createdAt
                    ? new Date(selectedBrand.createdAt).toLocaleString()
                    : "—"}
                </strong>
              </div>

              <div>
                <span>CAMPAIGNS CREATED</span>
                <strong>{selectedBrand.campaignCount ?? 0}</strong>
              </div>

              <div className="admin-influence-detail-message">
                <span>BRAND DESCRIPTION</span>
                <p>
                  {selectedBrand.description || "No description provided."}
                </p>
              </div>

              <div className="admin-influence-detail-message">
                <span>SOCIAL LINKS</span>

                {Object.entries(selectedBrand.socialLinks || {}).map(
                  ([platform, url]) =>
                    url ? (
                      <p key={platform}>
                        <strong>
                          {platform.charAt(0).toUpperCase() +
                            platform.slice(1)}:
                        </strong>{" "}
                        <a href={url} target="_blank" rel="noreferrer">
                          {url}
                        </a>
                      </p>
                    ) : null
                )}

                {!Object.values(selectedBrand.socialLinks || {}).some(Boolean) && (
                  <p>No social links provided.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminInfluence;
