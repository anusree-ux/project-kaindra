import { useState, useEffect } from "react";
import "./AdminCommunity.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

function AdminCommunity() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/community`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && Array.isArray(data.data?.members)) {
          setMembers(data.data.members);
        }
      })
      .catch((err) => {
        console.error("Error fetching community members:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this community member?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/community/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => (m._id || m.id) !== id));
      } else {
        alert("Failed to delete member.");
      }
    } catch (err) {
      console.error("Error deleting member:", err);
    }
  };

  return (
    <div className="admin-community-page">
      <div className="admin-community-container">

        {/* HEADER */}
        <div className="admin-community-header">
          <div>
            <span>KAINDRA ADMIN</span>

            <h1>Community Members</h1>

            <p>
              View and manage people who have joined the Kaindra community.
            </p>
          </div>

          <div className="community-member-count">
            <strong>{members.length}</strong>
            <span>Members</span>
          </div>
        </div>

        {/* NO MEMBERS */}
        {members.length === 0 && !loading ? (
          <div className="admin-community-empty">
            <h2>No community members yet</h2>

            <p>
              Community registrations will appear here when users join the Kaindra community.
            </p>
          </div>
        ) : (
          <div className="admin-community-table-wrapper">
            <table className="admin-community-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Joined Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {members.map((member, index) => {
                  const memberId = member._id || member.id;
                  return (
                    <tr key={memberId}>
                      <td>{index + 1}</td>

                      <td>
                        <strong>{member.name}</strong>
                      </td>

                      <td>{member.email}</td>

                      <td>{member.phone}</td>

                      <td>
                        {member.joinedAt
                          ? new Date(member.joinedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-community-delete"
                          onClick={() => handleDelete(memberId)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCommunity;