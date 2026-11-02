import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCommunityAuth } from "../context/CommunityAuthContext";
import { ArrowLeft, MessageSquare, PlusCircle, Sparkles, Users, Award, ShieldCheck, Send, Settings, UserCheck } from "lucide-react";
import "./CommunityMemberHub.css";

const INITIAL_DISCUSSIONS = [
  {
    id: 1,
    author: "Aarav Sharma",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Aarav",
    role: "Founding Member",
    title: "The Shift to Circular Fashion: What indie designers need to know",
    content: "We're exploring zero-waste pattern cutting techniques at ModaSphere studios. How are other creators approaching bio-based dyes in 2026?",
    category: "Sustainable Fashion",
    timeAgo: "2 hours ago",
    likes: 18,
    commentsCount: 7,
  },
  {
    id: 2,
    author: "Elena Rostova",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Elena",
    role: "Creator",
    title: "MotoTribe x ModaSphere: Riding gear that doesn't compromise runway style",
    content: "Previewing new Kevlar-infused streetwear capsules for urban riders. Feedback on breathable inner liners appreciated!",
    category: "Design Innovation",
    timeAgo: "Yesterday",
    likes: 34,
    commentsCount: 12,
  },
  {
    id: 3,
    author: "Kaindra Editorial",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Editorial",
    role: "Community Staff",
    title: "Exclusive Member Showcase: Spring/Summer 2026 Drop Previews",
    content: "Community members get 24-hour priority access to the upcoming ModaDrop release. Check your notifications for invite keys.",
    category: "Announcements",
    timeAgo: "2 days ago",
    likes: 56,
    commentsCount: 19,
  },
];

export default function CommunityMemberHub() {
  const { user } = useAuth();
  const { communityUser, logout: communityLogout } = useCommunityAuth();

  const activeUser = communityUser || user;
  const isDedicatedCommunityUser = Boolean(communityUser);

  const [discussions, setDiscussions] = useState(INITIAL_DISCUSSIONS);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Discussion");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPost = {
      id: Date.now(),
      author: communityUser?.handle || activeUser?.name || "Kaindra Member",
      avatar: activeUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(activeUser?.email || "Member")}`,
      role: communityUser?.role ? communityUser.role.toUpperCase() : activeUser?.role === "admin" ? "Administrator" : "Verified Member",
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      timeAgo: "Just now",
      likes: 1,
      commentsCount: 0,
    };

    setDiscussions([newPost, ...discussions]);
    setNewTitle("");
    setNewContent("");
    setShowCreateModal(false);
    setSubmittedMessage("Your post has been published to the community hub!");
    setTimeout(() => setSubmittedMessage(""), 4000);
  };

  return (
    <div className="member-hub-page">
      <div className="member-hub-container">
        {/* Navigation & Header */}
        <div className="member-hub-top-nav">
          <Link to="/communities" className="member-hub-back-link">
            <ArrowLeft size={16} />
            <span>Back to Communities Preview</span>
          </Link>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link to="/communities/profile-setup" className="member-status-pill" style={{ textDecoration: "none", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.3)" }}>
              <Settings size={14} />
              <span>Edit Profile Setup</span>
            </Link>
            <div className="member-status-pill">
              <ShieldCheck size={16} />
              <span>Active Member Access</span>
            </div>
          </div>
        </div>

        {/* Hero Welcome Card */}
        <section className="member-hub-hero-card">
          <div className="member-hub-hero-content">
            <span className="member-hub-badge">MEMBER-ONLY PORTAL</span>
            <h1>Welcome, {activeUser?.name || "Kaindra Creator"}</h1>
            <p>
              Connect with fellow designers, makers, and innovators across the Kaindra ecosystem.
              Share your insights, participate in member discussions, and access upcoming collaborative drops.
            </p>
            <div className="member-hub-hero-actions">
              <button
                type="button"
                className="member-hub-btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusCircle size={18} />
                <span>Create New Post</span>
              </button>
              <a href="#feed" className="member-hub-btn-outline">
                <MessageSquare size={18} />
                <span>Explore Discussions</span>
              </a>
            </div>
          </div>

          <div className="member-profile-summary-box">
            <div className="member-avatar-wrapper">
              <img
                src={activeUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(activeUser?.email || "User")}`}
                alt={activeUser?.name || "Member avatar"}
                className="member-profile-avatar"
              />
              <span className="member-online-indicator" />
            </div>
            <h3>{activeUser?.name || "Community Member"}</h3>
            <p className="member-email" style={{ color: "#d6a84f", fontWeight: "600" }}>
              {communityUser?.handle || `@${activeUser?.email?.split("@")[0] || "member"}`}
            </p>
            <div className="member-tier-tag">
              <Award size={14} />
              <span style={{ textTransform: "capitalize" }}>
                {communityUser?.role || (activeUser?.role === "admin" ? "Admin Member" : "Verified Creator")}
              </span>
            </div>
          </div>
        </section>

        {submittedMessage && (
          <div className="member-hub-toast" role="alert">
            <Sparkles size={18} />
            <span>{submittedMessage}</span>
          </div>
        )}

        {/* Member Hub Grid */}
        <div className="member-hub-grid">
          {/* Main Feed Section */}
          <main className="member-feed-section" id="feed">
            <div className="member-feed-header">
              <div>
                <h2>Community Discussions</h2>
                <p>Private conversations and design notes shared by verified members.</p>
              </div>
              <button
                type="button"
                className="member-create-btn-sm"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusCircle size={16} />
                <span>Post</span>
              </button>
            </div>

            <div className="member-discussion-list">
              {discussions.map((item) => (
                <article key={item.id} className="member-discussion-card">
                  <div className="discussion-meta">
                    <img src={item.avatar} alt={item.author} className="discussion-avatar" />
                    <div>
                      <div className="discussion-author-row">
                        <strong>{item.author}</strong>
                        <span className="discussion-author-role">{item.role}</span>
                      </div>
                      <span className="discussion-time">{item.timeAgo}</span>
                    </div>
                    <span className="discussion-category-pill">{item.category}</span>
                  </div>

                  <h3 className="discussion-title">{item.title}</h3>
                  <p className="discussion-content">{item.content}</p>

                  <div className="discussion-footer">
                    <span className="discussion-stat">❤️ {item.likes} Likes</span>
                    <span className="discussion-stat">💬 {item.commentsCount} Comments</span>
                  </div>
                </article>
              ))}
            </div>
          </main>

          {/* Sidebar Section */}
          <aside className="member-sidebar">
            <div className="member-sidebar-widget">
              <h3>
                <Sparkles size={18} />
                Member Perks & Access
              </h3>
              <ul className="member-perks-list">
                <li>✨ <strong>ModaDrop Early Window:</strong> 24h advance reservation.</li>
                <li>🛠️ <strong>ModaStudio Tools:</strong> Direct CAD & tech pack sharing.</li>
                <li>🏍️ <strong>MotoTribe Route Sync:</strong> Group convoy coordination.</li>
                <li>🎟️ <strong>Quarterly Creative Meetups:</strong> Live in Mumbai & Bengaluru.</li>
              </ul>
            </div>

            <div className="member-sidebar-widget">
              <h3>
                <Users size={18} />
                Community Guidelines
              </h3>
              <p className="guidelines-text">
                Kaindra is built on radical craftsmanship, supportive collaboration, and creative integrity.
                Be constructive and protect each other&apos;s intellectual property.
              </p>
            </div>
          </aside>
        </div>

        {/* Create Post Modal */}
        {showCreateModal && (
          <div className="member-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="member-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="member-modal-header">
                <h2>Share a Discussion or Update</h2>
                <button
                  type="button"
                  className="member-modal-close"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="member-modal-form">
                <div className="member-form-field">
                  <label htmlFor="post-category">Category</label>
                  <select
                    id="post-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Discussion">Discussion</option>
                    <option value="Sustainable Fashion">Sustainable Fashion</option>
                    <option value="Design Innovation">Design Innovation</option>
                    <option value="Collaboration">Collaboration</option>
                    <option value="Feedback Request">Feedback Request</option>
                  </select>
                </div>

                <div className="member-form-field">
                  <label htmlFor="post-title">Topic Title</label>
                  <input
                    id="post-title"
                    type="text"
                    placeholder="e.g., Working on new zero-waste prototypes..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="member-form-field">
                  <label htmlFor="post-content">Details</label>
                  <textarea
                    id="post-content"
                    rows={4}
                    placeholder="Describe your ideas, questions, or project notes..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                  />
                </div>

                <div className="member-modal-actions">
                  <button
                    type="button"
                    className="member-btn-cancel"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="member-btn-submit">
                    <Send size={16} />
                    <span>Publish Post</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
