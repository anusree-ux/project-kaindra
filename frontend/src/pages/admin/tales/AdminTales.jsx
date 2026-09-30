import { useEffect, useState } from "react";
import {
  BookOpen,
  Eye,
  X,
  Mail,
  CalendarDays,
  Tag,
} from "lucide-react";
import "./AdminTales.css";

function AdminTales() {
  const getAdminToken = () =>
    sessionStorage.getItem("kaindraAdminAccessToken");

  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/modasphere/tales/admin",
          {
            headers: {
              Authorization: `Bearer ${getAdminToken()}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch stories"
          );
        }

        setStories(
          Array.isArray(data.tales)
            ? data.tales
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load ModaTales:",
          error
        );

        setError(
          error.message ||
            "Failed to load story submissions"
        );

        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, []);

  const updateStoryStatus = async (id, status) => {
    try {
      const response = await fetch(
        `/api/modasphere/tales/admin/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAdminToken()}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update story status"
        );
      }

      setStories((currentStories) =>
        currentStories.map((story) =>
          story._id === id
            ? {
                ...story,
                status: data.tale.status,
              }
            : story
        )
      );

      setSelectedStory((currentStory) =>
        currentStory &&
        currentStory._id === id
          ? {
              ...currentStory,
              status: data.tale.status,
            }
          : currentStory
      );
    } catch (error) {
      console.error(
        "Failed to update story status:",
        error
      );

      alert(
        error.message ||
          "Failed to update story status"
      );
    }
  };

  const deleteStory = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this story submission?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/modasphere/tales/admin/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAdminToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete story"
        );
      }

      setStories((currentStories) =>
        currentStories.filter(
          (story) => story._id !== id
        )
      );

      setSelectedStory(null);
    } catch (error) {
      console.error(
        "Failed to delete story:",
        error
      );

      alert(
        error.message ||
          "Failed to delete story"
      );
    }
  };

  return (
    <div className="admin-tales-page">
      <div className="admin-tales-container">

        <div className="admin-tales-header">
          <div>
            <span className="admin-tales-eyebrow">
              KAINDRA ADMIN
            </span>

            <h1>ModaTales Submissions</h1>

            <p>
              View stories submitted through the
              ModaTales platform.
            </p>
          </div>

          <div className="admin-tales-count">
            <span>Total Stories</span>
            <strong>{stories.length}</strong>
          </div>
        </div>

        {loading ? (
          <div className="admin-tales-empty">
            <BookOpen size={40} />

            <h2>Loading submissions...</h2>

            <p>
              Fetching ModaTales story submissions.
            </p>
          </div>
        ) : error ? (
          <div className="admin-tales-empty">
            <BookOpen size={40} />

            <h2>Unable to load submissions</h2>

            <p>{error}</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="admin-tales-empty">
            <BookOpen size={40} />

            <h2>No submissions yet</h2>

            <p>
              ModaTales story submissions will
              appear here.
            </p>
          </div>
        ) : (
          <div className="admin-tales-card">
            <div className="admin-tales-table-wrapper">
              <table className="admin-tales-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Story Type</th>
                    <th>Message</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {stories.map((story) => (
                    <tr key={story._id}>
                      <td>
                        <strong>
                          {story.name || "—"}
                        </strong>
                      </td>

                      <td>
                        <span className="admin-tales-email">
                          <Mail size={14} />
                          {story.email || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="admin-tales-type">
                          <Tag size={13} />
                          {story.storyType || "—"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-tales-message">
                          {story.message || "—"}
                        </div>
                      </td>

                      <td>
                        <span className="admin-tales-date">
                          <CalendarDays size={13} />
                          {story.submittedAt || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="admin-tales-status">
                          {story.status || "New"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-tales-view-button"
                          onClick={async () => {
                            try {
                              const response =
                                await fetch(
                                  `/api/modasphere/tales/admin/${story._id}`,
                                  {
                                    headers: {
                                      Authorization: `Bearer ${getAdminToken()}`,
                                    },
                                  }
                                );

                              const data =
                                await response.json();

                              if (!response.ok) {
                                throw new Error(
                                  data.message ||
                                    "Failed to fetch story details"
                                );
                              }

                              setSelectedStory(
                                data.tale
                              );
                            } catch (error) {
                              console.error(
                                "Failed to load story details:",
                                error
                              );

                              alert(
                                error.message ||
                                  "Failed to load story details"
                              );
                            }
                          }}
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

      {selectedStory && (
        <div
          className="admin-tales-modal-overlay"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="admin-tales-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="admin-tales-modal-header">
              <div>
                <span>STORY DETAILS</span>

                <h2>
                  {selectedStory.name ||
                    "Story"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedStory(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-tales-details">
              <div>
                <span>NAME</span>

                <strong>
                  {selectedStory.name || "—"}
                </strong>
              </div>

              <div>
                <span>EMAIL</span>

                <strong>
                  {selectedStory.email || "—"}
                </strong>
              </div>

              <div>
                <span>STORY TYPE</span>

                <strong>
                  {selectedStory.storyType ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>SUBMITTED DATE</span>

                <strong>
                  {selectedStory.submittedAt ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>STATUS</span>

                <select
                  value={
                    selectedStory.status ||
                    "New"
                  }
                  onChange={(e) =>
                    updateStoryStatus(
                      selectedStory._id,
                      e.target.value
                    )
                  }
                >
                  <option value="New">
                    New
                  </option>

                  <option value="Reviewed">
                    Reviewed
                  </option>

                  <option value="Approved">
                    Approved
                  </option>

                  <option value="Rejected">
                    Rejected
                  </option>
                </select>
              </div>

              <div className="admin-tales-detail-message">
                <span>MESSAGE</span>

                <p>
                  {selectedStory.message ||
                    "—"}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    deleteStory(
                      selectedStory._id
                    )
                  }
                >
                  Delete Story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTales;