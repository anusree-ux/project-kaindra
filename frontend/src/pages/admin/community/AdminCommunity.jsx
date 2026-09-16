import { useState } from "react";
import "./AdminCommunity.css";

function AdminCommunity() {
  const [members, setMembers] = useState(() => {
    const storedMembers = localStorage.getItem(
      "kaindraCommunityMembers"
    );

    return storedMembers ? JSON.parse(storedMembers) : [];
  });

  const handleDelete = (id) => {
    const updatedMembers = members.filter(
      (member) => member.id !== id
    );

    setMembers(updatedMembers);

    localStorage.setItem(
      "kaindraCommunityMembers",
      JSON.stringify(updatedMembers)
    );
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
              View and manage people who have joined the
              Kaindra community.
            </p>
          </div>

          <div className="community-member-count">
            <strong>{members.length}</strong>
            <span>Members</span>
          </div>
        </div>

        {/* NO MEMBERS */}
        {members.length === 0 ? (
          <div className="admin-community-empty">
            <h2>No community members yet</h2>

            <p>
              Community registrations will appear here when
              users join the Kaindra community.
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
                {members.map((member, index) => (
                  <tr key={member.id}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>{member.name}</strong>
                    </td>

                    <td>{member.email}</td>

                    <td>{member.phone}</td>

                    <td>
                      {member.joinedAt
                        ? new Date(
                            member.joinedAt
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-community-delete"
                        onClick={() =>
                          handleDelete(member.id)
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCommunity;