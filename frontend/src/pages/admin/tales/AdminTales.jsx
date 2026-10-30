
import { useEffect, useState } from "react";
import {
  BookOpen,
  Eye,
  X,
  Mail,
  CalendarDays,
  Tag,
  Trash2,
} from "lucide-react";
import "./AdminTales.css";

function AdminTales() {
  const getAdminToken = () =>
    sessionStorage.getItem("kaindraAdminAccessToken");

  const formatDate = (dateString) => {
    if (!dateString) return "—";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removalReason, setRemovalReason] = useState("");
  const [removing, setRemoving] = useState(false);

  const isRemoved = (story) =>
    story?.status === "Removed" || Boolean(story?.removedAt);

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
            ? data.tales.filter(
                (story) =>
                  story.status !== "Removed" && !story.removedAt
              )
            : []
        );
      } catch (error) {
        console.error("Failed to load ModaTales:", error);

        setError(
          error.message || "Failed to load story submissions"
        );

        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, []);


  const removeStory = async () => {
    if (!selectedStory || removing || !removalReason.trim()) return;

    if (!window.confirm("Remove this story from public visibility?")) {
      return;
    }

    try {
      setRemoving(true);

      const response = await fetch(
        `/api/modasphere/tales/admin/${selectedStory._id}/remove`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getAdminToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            removalReason: removalReason.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove story");
      }

      const updatedStory = data.tale;

      setStories((currentStories) =>
        currentStories.filter(
         (story) => story._id !== selectedStory._id
        )
      );

      setSelectedStory(updatedStory);
      setRemovalReason("");

      alert("Story removed successfully.");
    } catch (error) {
      console.error("Failed to remove story:", error);
      alert(error.message || "Failed to remove story");
    } finally {
      setRemoving(false);
    }
  };

  const openStoryDetails = async (story) => {
    try {
      setRemovalReason("");

      const response = await fetch(
        `/api/modasphere/tales/admin/${story._id}`,
        {
          headers: {
            Authorization: `Bearer ${getAdminToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch story details"
        );
      }

      setSelectedStory(data.tale);
    } catch (error) {
      console.error("Failed to load story details:", error);

      alert(error.message || "Failed to load story details");
    }
  };

  const closeModal = () => {
    if (removing) return;

    setSelectedStory(null);
    setRemovalReason("");
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
              Review submitted stories and manage their public visibility.
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
            <p>Fetching ModaTales story submissions.</p>
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
            <p>ModaTales story submissions will appear here.</p>
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
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {stories.map((story) => (
                    <tr key={story._id}>
                      <td>
                        <strong>{story.name || "—"}</strong>
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
                          {(story.message || "—").length > 120
                            ? `${story.message.slice(0, 120).trim()}...`
                            : story.message || "—"}
                        </div>
                      </td>

                      <td>
                        <span className="admin-tales-date">
                          <CalendarDays size={13} />
                          {formatDate(story.submittedAt)}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-tales-view-button"
                          onClick={() => openStoryDetails(story)}
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
          onClick={closeModal}
        >
          <div
            className="admin-tales-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-tales-modal-header">
              <div>
                <span>STORY DETAILS</span>
                <h2>{selectedStory.name || "Story"}</h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={removing}
                aria-label="Close story details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-tales-details">
              <div>
                <span>NAME</span>
                <strong>{selectedStory.name || "—"}</strong>
              </div>

              <div>
                <span>EMAIL</span>
                <strong>{selectedStory.email || "—"}</strong>
              </div>

              <div>
                <span>STORY TYPE</span>
                <strong>{selectedStory.storyType || "—"}</strong>
              </div>

              <div>
                <span>SUBMITTED DATE</span>
                <strong>{formatDate(selectedStory.submittedAt)}</strong>
              </div>

              <div>
                <span>STATUS</span>
                <strong>
                  {isRemoved(selectedStory)
                    ? "Removed by admin"
                    : selectedStory.status === "Approved"
                      ? "Published"
                      : selectedStory.status || "New"}
                </strong>
              </div>
   
              {!isRemoved(selectedStory) && (
                <div className="admin-tales-detail-message">
                  <span>MESSAGE</span>
                  <p>{selectedStory.message || "—"}</p>
                </div>
              )}

              {isRemoved(selectedStory) ? (
                <div className="admin-tales-detail-message">
                  <span>REMOVAL DETAILS</span>

                  <p>
                    <strong>Removed on:</strong>{" "}
                    {formatDate(selectedStory.removedAt)}
                  </p>

                  <p>
                    <strong>Reason:</strong>{" "}
                    {selectedStory.removalReason || "No reason recorded"}
                  </p>

                  <p>
                    This story is no longer visible to the public.
                  </p>
                </div>
              ) : (
                <div className="admin-tales-detail-message">
                  <label htmlFor="tale-removal-reason">
                    Removal reason
                  </label>

                  <textarea
                    id="tale-removal-reason"
                    value={removalReason}
                    onChange={(event) =>
                      setRemovalReason(event.target.value.slice(0, 500))
                    }
                    placeholder="Explain why this story should be removed..."
                    rows={4}
                    maxLength={500}
                    disabled={removing}
                  />

                  <small>
                    {removalReason.length}/500 characters. A reason is required.
                  </small>

                  <button
                    type="button"
                    onClick={removeStory}
                    disabled={removing || !removalReason.trim()}
                  >
                    <Trash2 size={15} />
                    {removing ? "Removing..." : "Remove Story"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTales;