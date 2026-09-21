import { useEffect, useState, useCallback } from "react";
import apiClient from "../../../../services/apiClient";
import "./MotoHero.css";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1700117397822-48c81f877ada?auto=format&fit=crop&w=2200&q=85",
    eyebrow: "RIDE • EXPLORE • CONNECT",
    title: "MORE THAN RIDES.",
    highlight: "IT'S A TRIBE.",
    description:
      "Connect with riders, discover real journeys and experience smarter adventures built around the road.",
    location: "LADAKH • INDIA",
  },
  {
    image:
      "https://images.unsplash.com/photo-1784480674917-69ccda6fa937?auto=format&fit=crop&w=2200&q=85",
    eyebrow: "RIDE • DISCOVER • EXPERIENCE",
    title: "THE ROAD",
    highlight: "IS YOURS.",
    description:
      "Discover winding roads, mountain routes and real rider experiences from across the Tribe.",
    location: "BANDIPUR • INDIA",
  },
  {
    image:
      "https://images.unsplash.com/photo-1684997827975-21b5a6e434e9?auto=format&fit=crop&w=2200&q=85",
    eyebrow: "PLAN • RIDE • REMEMBER",
    title: "YOUR JOURNEY.",
    highlight: "YOUR STORY.",
    description:
      "Plan intelligent routes, ride with confidence and record every moment of your adventure.",
    location: "SCENIC ROUTES",
  },
  {
    image:
      "https://images.unsplash.com/photo-1736450700606-a68bf142451f?auto=format&fit=crop&w=2200&q=85",
    eyebrow: "ONE TRIBE • MANY JOURNEYS",
    title: "RIDE TOGETHER.",
    highlight: "GO FURTHER.",
    description:
      "Find riders, build trusted connections and turn every road into a shared experience.",
    location: "ADVENTURE NETWORK",
  },
  {
    image:
      "https://images.unsplash.com/photo-1587506974713-573949146846?auto=format&fit=crop&w=2200&q=85",
    eyebrow: "MOTORCYCLE • ADVENTURE • FREEDOM",
    title: "CHOOSE THE ROAD.",
    highlight: "LIVE THE RIDE.",
    description:
      "From mountain passes to open highways, MotoTribe helps you make every kilometre count.",
    location: "MOUNTAIN RIDE",
  },
];

function MotoHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeRide, setActiveRide] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  const fetchWeatherForCoords = useCallback(async (lat, lng) => {
    try {
      const wRes = await apiClient.get(`/api/mototribe/weather?lat=${lat}&lng=${lng}`);
      const data = wRes.data?.data?.weather || null;
      if (data) {
        setWeatherData(data);
      }
    } catch (err) {
      console.error("Error fetching location weather:", err);
    }
  }, []);

  const fetchActiveRide = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/mototribe/rides");
      const fetchedRides = res.data?.data?.rides || [];

      const ongoing = fetchedRides.find((r) => r.status === "ongoing");
      const planning = fetchedRides.find((r) => r.status === "planning");
      const selected = ongoing || planning || null;

      setActiveRide(selected);

      if (selected?._id) {
        try {
          const wRes = await apiClient.get(`/api/mototribe/rides/${selected._id}/weather`);
          const wData = wRes.data?.data?.weather;
          if (wData) {
            setWeatherData(wData);
            return;
          }
        } catch {
          // Fallback to location weather
        }
      }

      // If no active ride weather, query geolocation or default coords (Bangalore)
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetchWeatherForCoords(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            fetchWeatherForCoords(12.9716, 77.5946);
          },
          { timeout: 5000 }
        );
      } else {
        fetchWeatherForCoords(12.9716, 77.5946);
      }
    } catch {
      setActiveRide(null);
      fetchWeatherForCoords(12.9716, 77.5946);
    }
  }, [fetchWeatherForCoords]);

  useEffect(() => {
    fetchActiveRide();

    const handleRideCreated = () => {
      fetchActiveRide();
    };

    window.addEventListener("mototribe:ride-created", handleRideCreated);
    return () => {
      window.removeEventListener("mototribe:ride-created", handleRideCreated);
    };
  }, [fetchActiveRide]);


  const current = slides[currentSlide];

  // =====================================================
  // AUTOMATIC SLIDESHOW
  // Changes every 5 seconds
  // =====================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // =====================================================
  // NEXT SLIDE
  // =====================================================

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // =====================================================
  // PREVIOUS SLIDE
  // =====================================================

  const previousSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
  };

  // =====================================================
  // SCROLL TO JOURNEY INTELLIGENCE
  // =====================================================

  const scrollToJourney = () => {
    const section = document.getElementById(
      "journey-intelligence"
    );

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // =====================================================
  // SCROLL TO RIDE PLANNER
  // =====================================================

  const scrollToPlanner = () => {
    const section = document.getElementById("ride-planner");

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // =====================================================
  // SCROLL TO LIVE RIDERS
  // =====================================================

  const scrollToLiveRiders = () => {
    const section = document.getElementById("live-riders");

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section className="moto-hero-wrapper">

      {/* =================================================
          HERO
      ================================================= */}

      <div className="moto-hero">

        {/* =================================================
            BACKGROUND SLIDES
        ================================================= */}

        <div className="moto-hero-background">
          {slides.map((slide, index) => (
            <div
              key={slide.image}
              className={`moto-hero-slide ${
                index === currentSlide ? "active" : ""
              }`}
              style={{
                backgroundImage: `url("${slide.image}")`,
              }}
            />
          ))}
        </div>

        {/* =================================================
            DARK OVERLAY
        ================================================= */}

        <div className="moto-hero-overlay" />

        {/* =================================================
            VIGNETTE
        ================================================= */}

        <div className="moto-hero-vignette" />

        {/* =================================================
            HERO CONTENT
        ================================================= */}

        <div className="moto-hero-container">

          <div className="moto-hero-content">

            {/* =================================================
                LEFT CONTENT
            ================================================= */}

            <div className="moto-hero-copy">

              {/* EYEBROW */}

              <div className="moto-hero-eyebrow">
                <span className="eyebrow-line" />
                {current.eyebrow}
              </div>

              {/* TITLE */}

              <h1 className="moto-hero-title">
                {current.title}

                <span>
                  {current.highlight}
                </span>
              </h1>

              {/* DESCRIPTION */}

              <p className="moto-hero-description">
                {current.description}
              </p>

              {/* LOCATION */}

              <div className="moto-hero-location">
                <span className="location-dot">
                  ●
                </span>

                {current.location}
              </div>

              {/* =================================================
                  ACTION BUTTONS
              ================================================= */}

              <div className="moto-hero-actions">

                <button
                  type="button"
                  className="moto-btn moto-btn-primary"
                  onClick={scrollToPlanner}
                >
                  PLAN YOUR RIDE

                  <span>
                    ↗
                  </span>
                </button>

                <button
                  type="button"
                  className="moto-btn moto-btn-secondary"
                  onClick={scrollToLiveRiders}
                >
                  EXPLORE THE TRIBE

                  <span>
                    →
                  </span>
                </button>

              </div>

            </div>

            {/* =================================================
                MOTO AI CARD
            ================================================= */}

            <div className="moto-ai-card">

              {/* AI HEADER */}

              <div className="moto-ai-header">

                <div>
                  <span className="ai-label">
                    MOTO AI
                  </span>

                  <h3>
                    JOURNEY
                    <br />
                    INTELLIGENCE
                  </h3>
                </div>

                <div className="ai-status">
                  <span />
                  {activeRide ? "LIVE" : "ONLINE"}
                </div>

              </div>

              {/* AI ROUTE */}

              <div className="ai-route">

                <div className="route-icon">
                  ↗
                </div>

                <div>
                  <small>
                    NEXT JOURNEY
                  </small>

                  <strong>
                    {activeRide ? (activeRide.title || "PLANNED RIDE").toUpperCase() : "NO UPCOMING RIDE"}
                  </strong>
                </div>

              </div>

              {/* AI DATA */}

                {(() => {
                  const currentTemp =
                    weatherData?.current?.tempCelsius ??
                    weatherData?.tempCelsius ??
                    weatherData?.temp;

                  const currentCondition =
                    weatherData?.current?.condition ??
                    weatherData?.condition ??
                    weatherData?.main ??
                    "CLEAR";

                  const isRain =
                    typeof currentCondition === "string" &&
                    currentCondition.toLowerCase().includes("rain");

                  return (
                    <div className="ai-data-grid">
                      <div className="ai-data">
                        <span>WEATHER</span>
                        <strong>
                          {currentTemp !== undefined && currentTemp !== null
                            ? `${Math.round(currentTemp)}°C`
                            : "28°C"}
                        </strong>
                        <small>{currentCondition.toUpperCase()}</small>
                      </div>

                      <div className="ai-data">
                        <span>TRAFFIC</span>
                        <strong>{activeRide ? "LOW" : "NORMAL"}</strong>
                        <small>{activeRide ? "+12 MIN" : "NO DELAY"}</small>
                      </div>

                      <div className="ai-data">
                        <span>DISTANCE / FUEL</span>
                        <strong>
                          {activeRide?.distanceKm
                            ? `${activeRide.distanceKm} KM`
                            : "250 KM"}
                        </strong>
                        <small>
                          {activeRide ? activeRide.status.toUpperCase() : "READY"}
                        </small>
                      </div>

                      <div className="ai-data">
                        <span>ROAD</span>
                        <strong>SAFE</strong>
                        <small>{isRain ? "WET" : "DRY"}</small>
                      </div>
                    </div>
                  );
                })()}


              {/* AI BUTTON */}

              <button
                type="button"
                className="ai-card-button"
                onClick={activeRide ? scrollToJourney : scrollToPlanner}
              >
                {activeRide ? "VIEW JOURNEY INTELLIGENCE" : "PLAN A RIDE"}

                <span>
                  →
                </span>
              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            SLIDER CONTROLS
        ================================================= */}

        <div className="moto-slider-controls">

          {/* PREVIOUS */}

          <button
            type="button"
            className="slider-arrow"
            onClick={previousSlide}
            aria-label="Previous slide"
          >
            ←
          </button>

          {/* DOTS */}

          <div className="moto-slider-dots">

            {slides.map((slide, index) => (
              <button
                type="button"
                key={slide.image}
                className={`slider-dot ${
                  index === currentSlide
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setCurrentSlide(index)
                }
                aria-label={`Go to slide ${
                  index + 1
                }`}
              />
            ))}

          </div>

          {/* NEXT */}

          <button
            type="button"
            className="slider-arrow"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            →
          </button>

        </div>

        {/* =================================================
            SCROLL TO EXPLORE
        ================================================= */}

        <button
          type="button"
          className="moto-scroll-indicator"
          onClick={scrollToJourney}
        >
          <span>
            SCROLL TO EXPLORE
          </span>

          <span className="scroll-arrow">
            ↓
          </span>
        </button>

        {/* =================================================
            SLIDE PROGRESS
        ================================================= */}

        <div className="moto-hero-progress">
          <div
            className="moto-hero-progress-bar"
            key={currentSlide}
          />
        </div>

      </div>

      {/* =====================================================
          IMPACT STATISTICS

          IMPORTANT:
          These statistics are OUTSIDE the image.
      ===================================================== */}

      <div className="moto-impact-strip">

        {/* RIDERS */}

        <div className="moto-impact-item">
          <strong>
            250K+
          </strong>

          <span>
            RIDERS
          </span>
        </div>

        {/* COMMUNITIES */}

        <div className="moto-impact-item">
          <strong>
            10K+
          </strong>

          <span>
            COMMUNITIES
          </span>
        </div>

        {/* ROUTES */}

        <div className="moto-impact-item">
          <strong>
            50K+
          </strong>

          <span>
            ROUTES SHARED
          </span>
        </div>

        {/* RIDES */}

        <div className="moto-impact-item">
          <strong>
            1M+
          </strong>

          <span>
            RIDES RECORDED
          </span>
        </div>

        {/* EXPERIENCE */}

        <div className="moto-impact-experience">

          <div className="experience-icon">
            ✦
          </div>

          <div>
            <strong>
              REAL EXPERIENCE
            </strong>

            <span>
              SMARTER RIDES
            </span>
          </div>

        </div>

      </div>

    </section>
  );
}

export default MotoHero;