import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./News.css";

const formatDate = (dateValue) => {
  if (!dateValue) return "Date unavailable";

  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
};

function News({ limit, isPage = false }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/news");
        const result = await response.json();

        if (!response.ok || result.status !== "success") {
          throw new Error(result.message || "Failed to load news posts.");
        }

        if (active) {
          setPosts(Array.isArray(result.data?.posts) ? result.data.posts : []);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError.message || "Unable to load news posts.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPosts();

    return () => {
      active = false;
    };
  }, []);

  const visiblePosts = Number.isInteger(limit) ? posts.slice(0, limit) : posts;

  return (
    <section className={`news-section${isPage ? " news-page-section" : ""}`}>
      <div className="container">
        <div className="news-top">
          <div>
            <p className="section-label">NEWS / BLOGS</p>
            {isPage ? (
              <h1 className="section-title">Stories from KAINDRA</h1>
            ) : (
              <h2 className="section-title">Latest from KAINDRA</h2>
            )}
          </div>
          {!isPage && <Link to="/news">View all →</Link>}
        </div>

        {loading ? (
          <p className="news-message" role="status">Loading news...</p>
        ) : error ? (
          <p className="news-message news-error" role="alert">{error}</p>
        ) : visiblePosts.length === 0 ? (
          <p className="news-message">There are no published posts yet.</p>
        ) : (
          <div className="news-list">
            {visiblePosts.map((post) => (
              <Link
                className="news-item"
                key={post._id}
                to={`/news/${post._id}`}
              >
                <div className="news-item-copy">
                  <time dateTime={post.publishedAt || post.createdAt}>
                    {formatDate(post.publishedAt || post.createdAt)}
                  </time>
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                  {post.imageUrl && (
                    <img
                      className="news-item-image"
                      src={post.imageUrl}
                      alt=""
                      loading="lazy"
                    />
                  )}
                </div>
                <span className="news-read-link">Read article →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default News;
