import { useState } from "react";
import {
  Play,
  BookOpen,
  Camera,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import "./ModaTales.css";

const stories = [
  {
    title: "Fashion & Culture",
    text: "Stories exploring heritage, identity and fashion across cultures.",
    icon: BookOpen,
  },
  {
    title: "Behind the Craft",
    text: "Discover designers, artisans, techniques and creative processes.",
    icon: Camera,
  },
  {
    title: "Fashion Films",
    text: "Visual stories bringing fashion, people and ideas to life.",
    icon: Play,
  },
];

function ModaTales() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const story = {
      id: `MT-${Date.now()}`,
      name: formData.get("name"),
      email: formData.get("email"),
      storyType: formData.get("storyType"),
      message: formData.get("message"),
      submittedAt: new Date().toLocaleString(),
      status: "New",
    };

    const existingStories = JSON.parse(
      localStorage.getItem("modaTalesSubmissions") || "[]"
    );

    localStorage.setItem(
      "modaTalesSubmissions",
      JSON.stringify([...existingStories, story])
    );

    window.dispatchEvent(
      new Event("modaTalesSubmissionsUpdated")
    );

    setSubmitted(true);
  };

  return (
    <div className="modatales-page">

      <section className="modatales-hero">
        <div className="modatales-container">
          <span>CONTENT & MEDIA NETWORK</span>

          <h1>
            Every fashion
            <br />
            <strong>has a story.</strong>
          </h1>

          <p>
            ModaTales brings fashion, culture, craftsmanship
            and creativity together through stories, films,
            interviews and visual experiences.
          </p>

          <button
            className="modatales-primary-btn"
            onClick={() => setShowForm(true)}
          >
            Share Your Story
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      <section className="modatales-section">
        <div className="modatales-container">

          <div className="modatales-heading">
            <span>EXPLORE MODATALES</span>
            <h2>Stories beyond the runway.</h2>
            <p>
              Discover the people, cultures and creative
              journeys shaping the future of fashion.
            </p>
          </div>

          <div className="modatales-grid">
            {stories.map((story) => {
              const Icon = story.icon;

              return (
                <article
                  className="modatales-card"
                  key={story.title}
                >
                  <div className="modatales-card-icon">
                    <Icon size={23} />
                  </div>

                  <h3>{story.title}</h3>

                  <p>{story.text}</p>

                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                  >
                    Explore
                    <ArrowRight size={15} />
                  </button>
                </article>
              );
            })}
          </div>

        </div>
      </section>

      <section className="modatales-feature">
        <div className="modatales-container">
          <div>
            <span>THE MODATALES JOURNEY</span>

            <h2>
              From heritage
              <br />
              to tomorrow.
            </h2>
          </div>

          <p>
            We document the evolution of fashion through
            designers, artisans, communities, technology
            and new creative movements.
          </p>
        </div>
      </section>

      <section className="modatales-cta">
        <div className="modatales-container">
          <span>CREATE WITH US</span>

          <h2>
            Have a story
            <br />
            worth telling?
          </h2>

          <button
            className="modatales-primary-btn"
            onClick={() => setShowForm(true)}
          >
            Submit Your Story
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {showForm && (
        <div
          className="modatales-modal"
          onClick={() => setShowForm(false)}
        >
          <div
            className="modatales-form"
            onClick={(e) => e.stopPropagation()}
          >
            {!submitted ? (
              <>
                <button
                  className="modatales-close"
                  onClick={() => setShowForm(false)}
                >
                  ×
                </button>

                <span>SUBMIT YOUR STORY</span>

                <h2>Tell us your story</h2>

                <form onSubmit={handleSubmit}>
                  <input
                    name="name"
                    type="text"
                    placeholder="Your name"
                    required
                  />

                  <input
                    name="email"
                    type="email"
                    placeholder="Email address"
                    required
                  />

                  <input
                    name="storyType"
                    type="text"
                    placeholder="Story type"
                    required
                  />

                  <textarea
                    name="message"
                    rows="5"
                    placeholder="Tell us about your story"
                    required
                  />

                  <button type="submit">
                    Submit Story
                    <ArrowRight size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div className="modatales-success">
                <CheckCircle2 size={42} />

                <h2>Story submitted</h2>

                <p>
                  Thank you. Your story has been received
                  by the ModaTales team.
                </p>

                <button
                  onClick={() => {
                    setSubmitted(false);
                    setShowForm(false);
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default ModaTales;