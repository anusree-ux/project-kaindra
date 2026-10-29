import { useEffect, useState } from "react";
import "./ModaMartSlideshow.css";

const slides = [
  "/images/modamart-slides/slide-1.jpg",
  "/images/modamart-slides/slide-2.jpg",
  "/images/modamart-slides/slide-3.jpg",
  "/images/modamart-slides/slide-4.jpg",
  "/images/modamart-slides/slide-5.jpg",
  "/images/modamart-slides/slide-6.jpg",
  "/images/modamart-slides/slide-7.jpg",
  "/images/modamart-slides/slide-8.jpg",
  "/images/modamart-slides/slide-9.jpg",
];

const slideTitles = [
  "New Season",
  "Modern Edit",
  "Everyday Style",
  "The Accessories",
  "Sneaker Edit",
  "Occasion Wear",
  "Boutique Edit",
  "Summer Story",
  "ModaMart Edit",
];

export default function ModaMartSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((current) => (current + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const previousSlide =
    (currentSlide - 1 + slides.length) % slides.length;

  const nextSlide =
    (currentSlide + 1) % slides.length;

  const goToPrevious = () => {
    setCurrentSlide(
      (current) => (current - 1 + slides.length) % slides.length
    );
  };

  const goToNext = () => {
    setCurrentSlide(
      (current) => (current + 1) % slides.length
    );
  };

  return (
    <section className="modamart-lookbook">
      {/* Background decoration */}
      <div className="lookbook-background-text">
        MODAMART
      </div>

      {/* Previous image */}
      <button
        type="button"
        className="lookbook-side-card lookbook-left-card"
        onClick={goToPrevious}
        aria-label="Previous slide"
      >
        <img
          src={slides[previousSlide]}
          alt=""
        />
      </button>

      {/* Main active image */}
      <div className="lookbook-main">
        <div className="lookbook-image-wrapper">
          <img
            key={slides[currentSlide]}
            src={slides[currentSlide]}
            alt={`ModaMart ${slideTitles[currentSlide]}`}
            className="lookbook-main-image"
          />

          <div className="lookbook-number">
            {String(currentSlide + 1).padStart(2, "0")}
          </div>
        </div>

        <div className="lookbook-content">
          <span className="lookbook-label">
            THE MODAMART EDIT
          </span>

          <h2>
            {slideTitles[currentSlide]}
          </h2>

          <p>
            CURATED FASHION&nbsp;&nbsp;•&nbsp;&nbsp;
            NEW LOOKS&nbsp;&nbsp;•&nbsp;&nbsp;
            YOUR STYLE
          </p>
        </div>
      </div>

      {/* Next image */}
      <button
        type="button"
        className="lookbook-side-card lookbook-right-card"
        onClick={goToNext}
        aria-label="Next slide"
      >
        <img
          src={slides[nextSlide]}
          alt=""
        />
      </button>

      {/* Indicators */}
      <div className="lookbook-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            className={
              currentSlide === index
                ? "lookbook-dot active"
                : "lookbook-dot"
            }
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}