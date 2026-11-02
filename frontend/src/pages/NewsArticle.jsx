import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../components/Footer/Footer";
import "./NewsArticle.css";

const formatDate = (dateValue) => {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
};

function NewsArticle() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/news/${encodeURIComponent(id)}`);
        const result = await response.json();

        if (!response.ok || result.status !== "success") {
          throw new Error(result.message || "News article not found.");
        }

        if (active) setPost(result.data?.post || null);
      } catch (fetchError) {
        if (active) {
          setError(fetchError.message || "Unable to load this article.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPost();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <section className="news-article-page">
        <div className="news-article-container">
          <Link className="news-article-back" to="/news">
            ← All news
          </Link>

          {loading ? (
            <p role="status">Loading article...</p>
          ) : error || !post ? (
            <div className="news-article-message" role="alert">
              <h1>Article unavailable</h1>
              <p>{error || "This article could not be found."}</p>
            </div>
          ) : (
            <article>
              {post.imageUrl && (
                <img
                  className="news-article-image"
                  src={post.imageUrl}
                  alt=""
                />
              )}
              <header className="news-article-header">
                <p className="section-label">KAINDRA NEWS / BLOGS</p>
                <time dateTime={post.publishedAt}>
                  {formatDate(post.publishedAt)}
                </time>
                <h1>{post.title}</h1>
                <p className="news-article-description">{post.description}</p>
              </header>
              <div className="news-article-content">
                {post.content.split(/\n{2,}/).map((paragraph, index) =>
                  paragraph.trim() ? <p key={index}>{paragraph}</p> : null
                )}
              </div>
            </article>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

export default NewsArticle;
