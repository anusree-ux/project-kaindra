import { useEffect, useState } from "react";
import "./ModaHero.css";

const videos = [
  "/videos/riding1.mp4",
  "/videos/riding2.mp4",
  "/videos/riding3.mp4",
  "/videos/riding4.mp4",
];

export default function ModaHero() {
  const [currentVideo, setCurrentVideo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % videos.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="moda-hero">

      <video
        key={videos[currentVideo]}
        className="moda-hero-video"
        autoPlay
        muted
        playsInline
      >
        <source src={videos[currentVideo]} type="video/mp4" />
      </video>

      <div className="moda-hero-overlay"></div>

      <div className="moda-hero-content">
        <p className="moda-label">THE FUTURE OF FASHION</p>

        <h1>
          One Connected
          <br />
          <span>Fashion Ecosystem.</span>
        </h1>

        <p className="moda-hero-description">
          ModaSphere connects designers, manufacturers, brands, retailers,
          influencers and consumers through one intelligent fashion ecosystem.
        </p>

        <div className="moda-hero-actions">
          <a href="#vision">Explore ModaSphere</a>
          <a href="#ecosystem">Discover Ecosystem ↓</a>
        </div>
      </div>

    </section>
  );
}