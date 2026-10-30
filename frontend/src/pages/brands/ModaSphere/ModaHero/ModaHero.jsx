import { Sparkles, ArrowDown, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import "./ModaHero.css";

// Online fashion images: no local image folder needed.
const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85",
    label: "FASHION × TECHNOLOGY",
    title: "Where fashion meets innovation.",
  },
  {
    src: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85",
    label: "FASHION × EDUCATION",
    title: "Learning shapes the future.",
  },
  {
    src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85",
    label: "CREATORS × CULTURE",
    title: "Ideas become visual stories.",
  },
  {
    src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85",
    label: "DESIGN × DIGITAL",
    title: "Creativity enters a new era.",
  },
  {
    src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85",
    label: "FASHION × SUSTAINABILITY",
    title: "Materials with a purpose.",
  },
];

export default function ModaHero() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const activeImage = heroImages[currentImage];

  return (
    <section className="moda-hero" id="top">
      <div className="moda-hero-container">
        {/* TOP */}
        <div className="moda-hero-top">
          <div className="moda-hero-brand">
            <span className="moda-hero-brand-dot" />
            <span>MODASPHERE</span>
          </div>
          <span>KAINDRA STRATEGY</span>
        </div>

        {/* MAIN */}
        <div className="moda-hero-main">
          {/* LEFT CONTENT */}
          <div className="moda-hero-content">
            <div className="moda-hero-kicker">
              <span>01</span>
              <div />
              <span>THE FUTURE OF FASHION</span>
            </div>
            <h1>
              The Universal
              <br />
              <span>Fashion Ecosystem.</span>
            </h1>
            <p className="moda-hero-description">
              Uniting fashion, technology, creators and consumers
              in one connected global platform.
            </p>
            <div className="moda-hero-line">
              <div className="hero-sparkle">
                <Sparkles size={16} strokeWidth={1.5} />
              </div>
              <span>STYLE. CONNECT. EMPOWER.</span>
            </div>
            <div className="moda-hero-meta">
              <div><span>01</span><p>FASHION</p></div>
              <div><span>02</span><p>TECHNOLOGY</p></div>
              <div><span>03</span><p>COMMUNITY</p></div>
            </div>
          </div>

          {/* RIGHT IMAGE GALLERY */}
          <div className="moda-hero-gallery">
            <div className="moda-featured-image">
              <img
                key={activeImage.src}
                src={activeImage.src}
                alt={activeImage.label}
                onError={(e) => {
                  // Backup online image if the primary image is unavailable.
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://picsum.photos/seed/modasphere-${currentImage + 1}/1200/1400`;
                }}
              />
              <div className="moda-image-overlay" />
              <div className="moda-image-counter">
                <strong>{String(currentImage + 1).padStart(2, "0")}</strong>
                <span>/ 05</span>
              </div>
              <div className="moda-image-content">
                <span>{activeImage.label}</span>
                <h2>{activeImage.title}</h2>
              </div>
              <div className="moda-image-arrow">
                <ArrowUpRight size={19} strokeWidth={1.5} />
              </div>
            </div>

            {/* IMAGE NAVIGATION */}
            <div className="moda-image-navigation">
              {heroImages.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  className={currentImage === index ? "moda-image-nav active" : "moda-image-nav"}
                  onClick={() => setCurrentImage(index)}
                  aria-label={`Show ${image.label}`}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div className="moda-nav-line" />
                </button>
              ))}
            </div>
            <div className="moda-gallery-footer">
              <span>FASHION</span>
              <span>EDUCATION</span>
              <span>TECHNOLOGY</span>
              <span>SUSTAINABILITY</span>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="moda-hero-bottom">
          <div className="moda-hero-categories">
            <span>FASHION</span>
            <span>TECHNOLOGY</span>
            <span>CREATORS</span>
            <span>COMMUNITY</span>
          </div>
          <a href="#vision" className="hero-scroll">
            <span>EXPLORE</span>
            <div className="hero-scroll-icon">
              <ArrowDown size={15} strokeWidth={1.5} />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
