import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MotoHero.css";

const heroSlides = [
  {
    image:
      "https://images.pexels.com/photos/37454960/pexels-photo-37454960.jpeg?auto=compress&cs=tinysrgb&w=2000",
    route: "HIMALAYAN EXPEDITION",
    location: "Himalayas",
  },
  {
    image:
      "https://images.pexels.com/photos/34765191/pexels-photo-34765191.jpeg?auto=compress&cs=tinysrgb&w=2000",
    route: "LADAKH ADVENTURE",
    location: "Leh, India",
  },
  {
    image:
      "https://images.pexels.com/photos/15804646/pexels-photo-15804646.jpeg?auto=compress&cs=tinysrgb&w=2000",
    route: "MOUNTAIN TRAIL",
    location: "India",
  },
  {
    image:
      "https://images.pexels.com/photos/7715332/pexels-photo-7715332.jpeg?auto=compress&cs=tinysrgb&w=2000",
    route: "FOREST ESCAPE",
    location: "Mountain Roads",
  },
  {
    image:
      "https://images.pexels.com/photos/10249087/pexels-photo-10249087.jpeg?auto=compress&cs=tinysrgb&w=2000",
    route: "SUNSET RIDE",
    location: "Mountain Highway",
  },
  {
    image:
      "https://images.pexels.com/photos/5983284/pexels-photo-5983284.jpeg?auto=compress&cs=tinysrgb&w=2000",
    route: "ADRENALINE RIDE",
    location: "Off-Road Trails",
  },
];

function MotoHero() {
  const navigate = useNavigate();

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const nextSlide = () => {
    setActiveSlide((current) => (current + 1) % heroSlides.length);
  };

  const previousSlide = () => {
    setActiveSlide(
      (current) =>
        (current - 1 + heroSlides.length) % heroSlides.length
    );
  };

  const exploreRides = () => {
    const section = document.getElementById("upcoming-rides");

    if (section) {
      window.scrollTo({
        top: section.getBoundingClientRect().top + window.scrollY - 76,
        behavior: "smooth",
      });
    }
  };

  const planRide = () => {
    const section = document.getElementById("ride-planner");

    if (section) {
      window.scrollTo({
        top: section.getBoundingClientRect().top + window.scrollY - 76,
        behavior: "smooth",
      });
    }
  };

  const currentSlide = heroSlides[activeSlide];

  return (
    <section
      className="moto-hero"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* BACKGROUND IMAGES */}
      <div className="moto-hero-images">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`moto-hero-image ${
              activeSlide === index ? "active" : ""
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
            }}
          />
        ))}
      </div>

      <div className="moto-hero-overlay"></div>
      <div className="moto-hero-left-overlay"></div>
      <div className="moto-hero-bottom-overlay"></div>
      <div className="moto-hero-grid"></div>

      {/* MAIN CONTENT */}
      <div className="moto-hero-container">

        <div className="moto-hero-content">

          <div className="moto-hero-eyebrow">
            <span className="eyebrow-line"></span>
            <span>MOTOTRIBE NETWORK</span>
            <span className="eyebrow-dot"></span>
            <span>EST. 2026</span>
          </div>

          <h1 className="moto-hero-title">
            <span>RIDE</span>
            <span>BEYOND</span>
            <span className="outline-text">THE</span>
            <span className="outline-text">ORDINARY.</span>
          </h1>

          <p className="moto-hero-description">
            A connected motorcycle community built for
            riders who explore farther, ride smarter and
            experience every journey together.
          </p>

          <div className="moto-hero-buttons">
            <button
              type="button"
              className="hero-primary-btn"
              onClick={exploreRides}
            >
              <span>EXPLORE RIDES</span>
              <span>→</span>
            </button>

            <button
              type="button"
              className="hero-secondary-btn"
              onClick={planRide}
            >
              <span>PLAN A RIDE</span>
              <span>+</span>
            </button>
          </div>

          <div className="moto-hero-stats">
            <div className="hero-stat">
              <strong>04</strong>
              <span>ACTIVE ROUTES</span>
            </div>

            <div className="stat-divider"></div>

            <div className="hero-stat">
              <strong>70+</strong>
              <span>RIDERS</span>
            </div>

            <div className="stat-divider"></div>

            <div className="hero-stat">
              <strong>24/7</strong>
              <span>NETWORK</span>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="moto-hero-right">

          <div className="slide-info" key={currentSlide.id}>
            <div className="slide-number">
              {String(currentSlide.id).padStart(2, "0")}
            </div>

            <div className="slide-line"></div>

            <div className="slide-label">
              {currentSlide.label}
            </div>

            <div className="slide-route">
              {currentSlide.route}
            </div>

            <div className="slide-location">
              {currentSlide.location}
            </div>
          </div>

          <div className="tribe-circle">
            <div className="circle circle-one"></div>
            <div className="circle circle-two"></div>
            <div className="circle circle-three"></div>

            <div className="circle-logo">
              <span>MOTO</span>
              <strong>TRIBE</strong>
            </div>
          </div>

          <div className="hero-arrows">
            <button
              type="button"
              className="hero-arrow"
              onClick={previousSlide}
            >
              ←
            </button>

            <button
              type="button"
              className="hero-arrow"
              onClick={nextSlide}
            >
              →
            </button>
          </div>

        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="moto-hero-bottom">

        <div className="slide-indicators">
          {heroSlides.map((slide, index) => (
            <button
              type="button"
              key={slide.id}
              className={
                activeSlide === index
                  ? "indicator active"
                  : "indicator"
              }
              onClick={() => setActiveSlide(index)}
              aria-label={`Slide ${index + 1}`}
            >
              <span></span>
            </button>
          ))}
        </div>

        <div className="current-route">
          <small>CURRENT ROUTE</small>
          <strong>{currentSlide.route}</strong>
        </div>

        <div className="scroll-text">
          <span></span>
          SCROLL TO EXPLORE
          <b>↓</b>
        </div>

        <button
          type="button"
          className="rider-login"
          onClick={() =>
            navigate("/businesses/mototribe/login")
          }
        >
          RIDER LOGIN
          <span>↗</span>
        </button>

      </div>

      <div className="hero-progress">
        <div
          key={activeSlide}
          className={
            isPaused
              ? "progress-fill paused"
              : "progress-fill"
          }
        ></div>
      </div>
    </section>
  );
}

export default MotoHero;