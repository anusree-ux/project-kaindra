import { Sparkles, ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./ModaHero.css";

const videos = [
  "/videos/hero1.mp4",
  "/videos/hero2.mp4",
  "/videos/hero3.mp4",
  "/videos/hero4.mp4",
  "/videos/hero5.mp4",
];

export default function ModaHero() {
  const [currentVideo, setCurrentVideo] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();

      // Increase background video speed
      videoRef.current.playbackRate = 1.3;

      videoRef.current.play().catch(() => {});
    }
  }, [currentVideo]);

  const handleVideoEnd = () => {
    setCurrentVideo((prev) => (prev + 1) % videos.length);
  };

  return (
    <section className="moda-hero" id="top">

      {/* Background Video */}
      <video
        ref={videoRef}
        className="moda-hero-video"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
      >
        <source
          src={videos[currentVideo]}
          type="video/mp4"
        />
      </video>

      {/* Video Overlay */}
      <div className="moda-hero-overlay"></div>

      <div className="moda-hero-container">

        {/* Top Information */}
        <div className="moda-hero-top">
          <span>MODASPHERE</span>
          <span>KAINDRA STRATEGY</span>
        </div>

        {/* Main Hero */}
        <div className="moda-hero-main">

          {/* Hero Content */}
          <div className="moda-hero-content">

            <h1>
              The Universal
              <br />
              <span>Fashion Ecosystem.</span>
            </h1>

            <p>
              Uniting fashion, technology, creators and consumers
              in one connected global platform.
            </p>

            <div className="moda-hero-line">

              <div className="hero-sparkle">
                <Sparkles
                  size={17}
                  strokeWidth={1.5}
                />
              </div>

              <span>
                STYLE. CONNECT. EMPOWER.
              </span>

            </div>

          </div>

          {/* Hero Visual */}
          <div className="moda-hero-visual">

            <div className="hero-orbit orbit-one"></div>

            <div className="hero-orbit orbit-two"></div>

            <div className="hero-center">
              <span>M</span>
            </div>

            <div className="hero-dot hero-dot-one"></div>

            <div className="hero-dot hero-dot-two"></div>

            <div className="hero-dot hero-dot-three"></div>

          </div>

        </div>

        {/* Bottom Information */}
        <div className="moda-hero-bottom">

          <span>FASHION</span>

          <span>TECHNOLOGY</span>

          <span>CREATORS</span>

          <span>COMMUNITY</span>

          <a
            href="#vision"
            className="hero-scroll"
          >
            <span>EXPLORE</span>

            <ArrowDown
              size={15}
              strokeWidth={1.5}
            />
          </a>

        </div>

      </div>

    </section>
  );
}