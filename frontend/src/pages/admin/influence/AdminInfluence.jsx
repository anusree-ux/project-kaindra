import { useEffect, useState } from "react";
import {
  Megaphone,
  Eye,
  X,
  Mail,
  CalendarDays,
  Tag,
} from "lucide-react";
import "./AdminInfluence.css";

function AdminInfluence() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCampaign, setSelectedCampaign] =
    useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

    const apiBase =
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:5000/api/";

    const endpoint = apiBase.endsWith("/")
      ? `${apiBase}modasphere/influence/campaigns/${campaignId}`
      : `${apiBase}/modasphere/influence/campaigns/${campaignId}`;

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete campaign request"
        );
      }

      setCampaigns((currentCampaigns) =>
        currentCampaigns.filter(
          (campaign) => campaign._id !== campaignId
        )
      );

      if (
        selectedCampaign &&
        selectedCampaign._id === campaignId
      ) {
        setSelectedCampaign(null);
      }
    } catch (error) {
      console.error(
        "Delete campaign error:",
        error
      );

      alert(
        error.message ||
          "Failed to delete campaign request"
      );
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedCampaign) return;

    const token = localStorage.getItem("token");

    if (!token) {
      alert("You are not logged in.");
      return;
    }

    const apiBase =
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:5000/api/";

    const endpoint = apiBase.endsWith("/")
      ? `${apiBase}modasphere/influence/campaigns/${selectedCampaign._id}/status`
      : `${apiBase}/modasphere/influence/campaigns/${selectedCampaign._id}/status`;

    try {
      setUpdatingStatus(true);

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update campaign status"
        );
      }

      const updatedCampaign = data.data;

      setCampaigns((currentCampaigns) =>
        currentCampaigns.map((campaign) =>
          campaign._id === updatedCampaign._id
            ? updatedCampaign
            : campaign
        )
      );

      setSelectedCampaign(updatedCampaign);
    } catch (error) {
      console.error(
        "Update campaign status error:",
        error
      );

      alert(
        error.message ||
          "Failed to update campaign status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    const loadCampaigns = async () => {
      const apiBase =
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:5000/api/";

      const endpoint = apiBase.endsWith("/")
        ? `${apiBase}modasphere/influence/campaigns`
        : `${apiBase}/modasphere/influence/campaigns`;

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
                    <th>Status</th>
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
                        <span
                          className={`admin-influence-status ${String(
                            campaign.status || "New"
                          ).toLowerCase()}`}
                        >
                          {campaign.status || "New"}
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

              <div>
                <span>STATUS</span>
                <select
                  value={selectedCampaign.status || "New"}
                  onChange={(e) =>
                    handleStatusChange(e.target.value)
                  }
                  disabled={updatingStatus}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>

                {updatingStatus && (
                  <small>Updating...</small>
                )}
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
    </div>
  );
}

export default AdminInfluence;