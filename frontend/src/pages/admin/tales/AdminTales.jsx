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
  const [stories, setStories] = useState(() => {
    try {
      const savedStories = JSON.parse(
        localStorage.getItem("modaTalesSubmissions") || "[]"
      );

      return Array.isArray(savedStories) ? savedStories : [];
    } catch {
      return [];
    }
  });

  const [selectedStory, setSelectedStory] = useState(null);

  useEffect(() => {
    const loadStories = () => {
      try {
        const savedStories = JSON.parse(
          localStorage.getItem("modaTalesSubmissions") || "[]"
        );

        setStories(
          Array.isArray(savedStories) ? savedStories : []
        );
      } catch {
        setStories([]);
      }
    };

    window.addEventListener(
      "modaTalesSubmissionsUpdated",
      loadStories
    );

    window.addEventListener("storage", loadStories);

    return () => {
      window.removeEventListener(
        "modaTalesSubmissionsUpdated",
        loadStories
      );

      window.removeEventListener("storage", loadStories);
    };
  }, []);

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

        {stories.length === 0 ? (
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
                    <tr key={story.id}>
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
                          onClick={() =>
                            setSelectedStory(story)
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

      {selectedStory && (
        <div
          className="admin-tales-modal-overlay"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="admin-tales-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-tales-modal-header">
              <div>
                <span>STORY DETAILS</span>

                <h2>
                  {selectedStory.name || "Story"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStory(null)}
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
                  {selectedStory.storyType || "—"}
                </strong>
              </div>

              <div>
                <span>SUBMITTED DATE</span>
                <strong>
                  {selectedStory.submittedAt || "—"}
                </strong>
              </div>

              <div>
                <span>STATUS</span>
                <strong>
                  {selectedStory.status || "New"}
                </strong>
              </div>

              <div className="admin-tales-detail-message">
                <span>MESSAGE</span>

                <p>
                  {selectedStory.message || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTales;