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
  const [campaigns, setCampaigns] = useState(() => {
    try {
      const savedCampaigns = JSON.parse(
        localStorage.getItem("modaInfluenceCampaigns") || "[]"
      );

      return Array.isArray(savedCampaigns)
        ? savedCampaigns
        : [];
    } catch {
      return [];
    }
  });

  const [selectedCampaign, setSelectedCampaign] =
    useState(null);

  useEffect(() => {
    const loadCampaigns = () => {
      try {
        const savedCampaigns = JSON.parse(
          localStorage.getItem("modaInfluenceCampaigns") || "[]"
        );

        setCampaigns(
          Array.isArray(savedCampaigns)
            ? savedCampaigns
            : []
        );
      } catch {
        setCampaigns([]);
      }
    };

    window.addEventListener(
      "modaInfluenceCampaignsUpdated",
      loadCampaigns
    );

    window.addEventListener("storage", loadCampaigns);

    return () => {
      window.removeEventListener(
        "modaInfluenceCampaignsUpdated",
        loadCampaigns
      );

      window.removeEventListener(
        "storage",
        loadCampaigns
      );
    };
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

        {campaigns.length === 0 ? (
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
                    <tr key={campaign.id}>

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
                          {campaign.submittedAt || "—"}
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
                  {selectedCampaign.submittedAt || "—"}
                </strong>
              </div>

              <div>
                <span>STATUS</span>
                <strong>
                  {selectedCampaign.status || "New"}
                </strong>
              </div>

              <div className="admin-influence-detail-message">
                <span>MESSAGE</span>
                <p>
                  {selectedCampaign.message || "—"}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInfluence;