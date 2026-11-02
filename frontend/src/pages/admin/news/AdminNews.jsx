import { useCallback, useEffect, useState } from "react";
import { Newspaper, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import "./AdminNews.css";

const API_BASE = "/api/news/admin";
const emptyForm = {
  title: "",
  description: "",
  content: "",
  imageUrl: "",
};

const getAdminToken = () =>
  sessionStorage.getItem("kaindraAdminAccessToken") ||
  localStorage.getItem("token");

const requestAdminApi = async (url, options = {}) => {
  const token = getAdminToken();
  if (!token) {
    throw new Error("Your admin session has expired. Please sign in again.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const result = await response.json();

  if (!response.ok || result.status !== "success") {
    throw new Error(result.message || "The news request failed.");
  }

  return result;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

function AdminNews() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await requestAdminApi(API_BASE);
      setPosts(Array.isArray(result.data?.posts) ? result.data.posts : []);
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load news posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const openCreateForm = () => {
    setEditingPost(null);
    setFormData(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || "",
      description: post.description || "",
      content: post.content || "",
      imageUrl: post.imageUrl || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPost(null);
    setFormData(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const isEditing = Boolean(editingPost);
      const result = await requestAdminApi(
        isEditing ? `${API_BASE}/${editingPost._id}` : API_BASE,
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim(),
            content: formData.content.trim(),
            imageUrl: formData.imageUrl.trim(),
          }),
        }
      );

      setPosts((current) =>
        isEditing
          ? current.map((post) =>
              post._id === editingPost._id ? result.data.post : post
            )
          : [result.data.post, ...current]
      );
      closeForm();
    } catch (saveError) {
      setFormError(saveError.message || "Failed to save the news post.");
    } finally {
      setSaving(false);
    }
  };

  const changePostStatus = async (post) => {
    const status = post.status === "published" ? "draft" : "published";

    try {
      setError("");
      const result = await requestAdminApi(`${API_BASE}/${post._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setPosts((current) =>
        current.map((item) =>
          item._id === post._id ? result.data.post : item
        )
      );
    } catch (statusError) {
      setError(statusError.message || "Failed to update post status.");
    }
  };

  const deletePost = async (post) => {
    if (!window.confirm(`Permanently delete "${post.title}"?`)) return;

    try {
      setError("");
      await requestAdminApi(`${API_BASE}/${post._id}`, { method: "DELETE" });
      setPosts((current) => current.filter((item) => item._id !== post._id));
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete the post.");
    }
  };

  const updateFormField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  return (
    <main className="admin-news-page">
      <div className="admin-news-container">
        <header className="admin-news-header">
          <div>
            <span className="admin-news-eyebrow">KAINDRA ADMIN</span>
            <h1>News &amp; Blogs</h1>
            <p>Create, edit, publish, and manage KAINDRA articles.</p>
          </div>
          <button
            className="admin-news-primary-button"
            type="button"
            onClick={openCreateForm}
          >
            <Plus size={18} />
            New post
          </button>
        </header>

        {error && <p className="admin-news-error" role="alert">{error}</p>}

        {showForm && (
          <section className="admin-news-form-card">
            <div className="admin-news-form-heading">
              <div>
                <span className="admin-news-eyebrow">
                  {editingPost ? "EDIT POST" : "NEW DRAFT"}
                </span>
                <h2>{editingPost ? "Edit post" : "Create a post"}</h2>
              </div>
              <button
                className="admin-news-icon-button"
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close post form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Title
                <input
                  name="title"
                  value={formData.title}
                  onChange={updateFormField}
                  maxLength={150}
                  required
                />
              </label>
              <label>
                Short description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={updateFormField}
                  maxLength={300}
                  rows={3}
                  required
                />
              </label>
              <label>
                Article content
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={updateFormField}
                  maxLength={50000}
                  rows={12}
                  required
                />
              </label>
              <label>
                Cover image URL (optional)
                <input
                  name="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={updateFormField}
                  placeholder="https://example.com/image.jpg"
                />
              </label>

              {formError && (
                <p className="admin-news-error" role="alert">{formError}</p>
              )}

              <div className="admin-news-form-actions">
                <button
                  className="admin-news-secondary-button"
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="admin-news-primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingPost ? "Save changes" : "Save draft"}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <p className="admin-news-empty" role="status">Loading posts...</p>
        ) : posts.length === 0 ? (
          <div className="admin-news-empty">
            <Newspaper size={38} />
            <h2>No posts yet</h2>
            <p>Create a draft, then publish it when it is ready.</p>
          </div>
        ) : (
          <div className="admin-news-table-wrap">
            <table className="admin-news-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Status</th>
                  <th>Publication date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post._id}>
                    <td>
                      <strong>{post.title}</strong>
                      <span>{post.description}</span>
                    </td>
                    <td>
                      <span className={`admin-news-status ${post.status}`}>
                        {post.status}
                      </span>
                    </td>
                    <td>{formatDate(post.publishedAt)}</td>
                    <td>
                      <div className="admin-news-row-actions">
                        <button
                          className="admin-news-secondary-button"
                          type="button"
                          onClick={() => openEditForm(post)}
                        >
                          <Pencil size={15} />
                          Edit
                        </button>
                        <button
                          className="admin-news-secondary-button"
                          type="button"
                          onClick={() => changePostStatus(post)}
                        >
                          <Send size={15} />
                          {post.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          className="admin-news-delete-button"
                          type="button"
                          onClick={() => deletePost(post)}
                          aria-label={`Delete ${post.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminNews;
