import { useEffect, useState } from "react";
import "./Hero.css";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=2000&q=85",
  },
  {
    image:
      "https://images.unsplash.com/photo-1525160354320-d8e92641c563?auto=format&fit=crop&w=2000&q=85",
  },
  {
    image:
      "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?auto=format&fit=crop&w=2000&q=85",
  },
  {
    image:
      "https://images.unsplash.com/photo-1558980394-0c6f9f5f4b4f?auto=format&fit=crop&w=2000&q=85",
  },

  // Business
  {
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=85",
  },

  // Community / people
  {
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2000&q=85",
  },

  // Business / teamwork
  {
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=2000&q=85",
  },

  // Travel / community
  {
    image:
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=2000&q=85",
  },
];

function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero">

      <div className="hero-slides">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`hero-slide ${
              index === currentSlide ? "active" : ""
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
            }}
          />
        ))}
      </div>

      <div className="hero-overlay"></div>

      <div className="container hero-content">

        <p className="hero-label">
          KAINDRA
        </p>

        <h1>
          Ride beyond
          <br />
          the ordinary.
        </h1>

        <p className="hero-text">
          Discover journeys, businesses and experiences
          built around the freedom to explore.
        </p>

        <div className="hero-buttons">

          <a
            href="#businesses"
            className="hero-primary"
          >
            Explore Businesses
          </a>

          <a
            href="#about"
            className="hero-secondary"
          >
            Discover KAINDRA
          </a>

        </div>

      </div>

      <div className="hero-indicators">

        {slides.map((_, index) => (
          <button
            key={index}
            className={
              index === currentSlide ? "active" : ""
            }
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}

      </div>

    </section>
  );
}

export default Hero;