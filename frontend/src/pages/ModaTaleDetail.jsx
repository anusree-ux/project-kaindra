import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import "./ModaTaleDetail.css";

function ModaTaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tale, setTale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTale = async () => {
      try {
        const response = await fetch(
          "/api/modasphere/tales/approved"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load story."
          );
        }

        const stories = data.tales || [];
        const selectedTale = stories.find(
          (item) => item._id === id
        );

        if (!selectedTale) {
          setError("Story not found or no longer available.");
          return;
        }

        setTale(selectedTale);
      } catch (err) {
        setError(err.message || "Unable to load this story.");
      } finally {
        setLoading(false);
      }
    };

    fetchTale();
  }, [id]);

  if (loading) {
    return (
      <main className="modatale-detail">
        <p>Loading story...</p>
      </main>
    );
  }

  if (error || !tale) {
    return (
      <main className="modatale-detail">
        <p>{error || "Story not found."}</p>

        <button onClick={() => navigate("/modatales")}>
          <ArrowLeft size={16} />
          Back to ModaTales
        </button>
      </main>
    );
  }

  return (
    <main className="modatale-detail">
      <div className="modatale-detail-container">
        <button
          className="modatale-back-btn"
          onClick={() => navigate("/modatales")}
        >
          <ArrowLeft size={17} />
          Back to ModaTales
        </button>

        <header className="modatale-article-header">
          <span className="modatale-article-category">
            <BookOpen size={15} />
            {tale.storyType}
          </span>

          <h1>{tale.title}</h1>

          <p className="modatale-article-author">
            By {tale.name || "ModaTales Author"}
          </p>
        </header>

        <article className="modatale-article-body">
          {tale.message
            .split(/\n+/)
            .filter((paragraph) => paragraph.trim())
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </article>

        <footer className="modatale-article-footer">
          <p>Stories beyond the runway.</p>

          <button onClick={() => navigate("/businesses/modatales")}>
            Explore More Stories
            <ArrowLeft
              size={16}
              style={{ transform: "rotate(180deg)" }}
            />
          </button>
        </footer>
      </div>
    </main>
  );
}

export default ModaTaleDetail;