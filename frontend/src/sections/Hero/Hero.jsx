import { useEffect, useState } from "react";
import "./Hero.css";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2200&q=90",
    category: "HAUTE COUTURE",
  },

  {
    image:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=2200&q=90",
    category: "STREETWEAR & URBAN",
  },

  {
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=2200&q=90",
    category: "ETHNIC & CULTURAL",
  },

  {
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=2200&q=90",
    category: "FAST FASHION",
  },

  {
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=2200&q=90",
    category: "SUSTAINABLE & ETHICAL",
  },

  {
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2200&q=90",
    category: "LUXURY & DESIGNER",
  },

  {
    image:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=2200&q=90",
    category: "TECH-INTEGRATED FASHION",
  },

  {
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=2200&q=90",
    category: "ACTIVEWEAR & ATHLEISURE",
  },

  {
    image:
      "https://images.unsplash.com/photo-1537832816519-689ad163238b?auto=format&fit=crop&w=2200&q=90",
    category: "AVANT-GARDE",
  },

  {
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2200&q=90",
    category: "GLOBAL FASHION ECOSYSTEM",
  },
];

function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const sliderTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(sliderTimer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const previousSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
  };

  return (
    <section className="hero">

      {/* BACKGROUND SLIDER */}
      <div className="hero-background">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`hero-slide ${
              index === currentSlide ? "active" : ""
            }`}
          >
            <img
              src={slide.image}
              alt={`${slide.category} fashion`}
            />
          </div>
        ))}

        <div className="hero-overlay"></div>
        <div className="hero-gradient"></div>
      </div>

      {/* HERO CONTENT */}
      <div className="container hero-content">
        <p className="hero-label">KAINDRA PRESENTS</p>

        <h1>
          The Future of
          <br />
          <span>Fashion.</span>
        </h1>

        <p className="hero-text">
          ModaSphere brings fashion, culture, technology,
          sustainability, and innovation together in one
          connected global ecosystem.
        </p>

        <div className="hero-buttons">
          <a href="#modasphere" className="hero-primary">
            Explore ModaSphere
          </a>

          <a href="#about" className="hero-secondary">
            Discover Kaindra
          </a>
        </div>
      </div>

      {/* SLIDER CONTROLS */}
      <div className="hero-slider">
        <button
          type="button"
          className="hero-arrow"
          onClick={previousSlide}
          aria-label="Previous slide"
        >
          ←
        </button>

        <div className="hero-dots">
          {slides.map((slide, index) => (
            <button
              key={index}
              type="button"
              className={`hero-dot ${
                index === currentSlide ? "active" : ""
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to ${slide.category} slide`}
            />
          ))}
        </div>

        <button
          type="button"
          className="hero-arrow"
          onClick={nextSlide}
          aria-label="Next slide"
        >
          →
        </button>
      </div>

      {/* CURRENT SLIDE CATEGORY */}
      <div className="hero-slide-info">
        <span>
          {String(currentSlide + 1).padStart(2, "0")}
        </span>

        <i></i>

        <p>{slides[currentSlide].category}</p>
      </div>

      {/* SCROLL */}
      <div className="hero-scroll">
        <span></span>
        <p>Scroll to explore</p>
      </div>
    </section>
  );
}

export default Hero;