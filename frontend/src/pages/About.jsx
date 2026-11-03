
import "./About.css";
import Footer from "../components/Footer/Footer";

const ecosystemAreas = [
  {
    number: "01",
    title: "Fashion & Lifestyle",
    description: "Design, creativity and emerging fashion opportunities.",
    icon: "✳",
  },
  {
    number: "02",
    title: "Tribal Communities",
    description: "Connecting heritage, culture, craftsmanship and people.",
    icon: "❋",
  },
  {
    number: "03",
    title: "Technology & Innovation",
    description: "Building possibilities through ideas and technology.",
    icon: "⌘",
  },
  {
    number: "04",
    title: "Business & Commerce",
    description: "Creating opportunities for businesses to connect and grow.",
    icon: "↗",
  },
  {
    number: "05",
    title: "Education & Knowledge",
    description: "Encouraging learning, skills and new perspectives.",
    icon: "◇",
  },
  {
    number: "06",
    title: "Beyond Boundaries",
    description: "Exploring new industries and meaningful collaborations.",
    icon: "∞",
  },
];


/* =========================================
   REUSABLE GOLDEN ENERGY EFFECTS
========================================= */

function GoldenEnergyEffects({ className = "" }) {
  return (
    <div
      className={`hero-energy-overlay ${className}`}
      aria-hidden="true"
    >
      {/* GOLDEN ORBITAL RINGS */}
      <span className="hero-energy-orbit energy-orbit-one" />
      <span className="hero-energy-orbit energy-orbit-two" />

      {/* GOLDEN LIGHTNING */}
      <svg
        className="hero-electric-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          className="hero-lightning-path lightning-one"
          d="M 28 53 L 31 49 L 29 46 L 34 42 L 32 38 L 38 34 L 36 31 L 41 27"
        />

        <path
          className="hero-lightning-path lightning-two"
          d="M 72 43 L 68 46 L 70 50 L 65 54 L 67 58 L 62 62 L 64 66 L 59 70"
        />

        <path
          className="hero-lightning-path lightning-three"
          d="M 39 76 L 43 72 L 42 69 L 47 65"
        />

        <path
          className="hero-lightning-path lightning-four"
          d="M 61 25 L 57 29 L 59 33 L 54 37"
        />
      </svg>

      {/* GOLDEN SPARKLES */}
      <span className="hero-energy-spark sparkle-one" />
      <span className="hero-energy-spark sparkle-two" />
      <span className="hero-energy-spark sparkle-three" />
      <span className="hero-energy-spark sparkle-four" />
      <span className="hero-energy-spark sparkle-five" />
      <span className="hero-energy-spark sparkle-six" />
      <span className="hero-energy-spark sparkle-seven" />
      <span className="hero-energy-spark sparkle-eight" />

      {/* GLOWING PARTICLES */}
      <span className="hero-energy-particle particle-one" />
      <span className="hero-energy-particle particle-two" />
      <span className="hero-energy-particle particle-three" />
      <span className="hero-energy-particle particle-four" />
    </div>
  );
}


function About() {
  return (
    <main className="about-page">

      {/* =====================================
          HERO
      ====================================== */}

      <section className="about-hero">

        <div className="about-container about-hero-grid">

          <div className="about-hero-content">

            <span className="about-label">
              <span className="label-line" />
              ABOUT KAINDRA
            </span>

            <h1>
              Connecting ideas,
              <br />
              people and
              <span> possibilities.</span>
            </h1>

            <p>
              Kaindra is building a connected ecosystem where
              innovation, business, technology and communities
              come together to create meaningful opportunities
              for the future.
            </p>

            <div className="hero-actions">

              <a href="#about-introduction" className="about-explore">
                Discover Kaindra <span>↗</span>
              </a>

              <span className="hero-side-note">
                CONNECTING POSSIBILITIES
              </span>

            </div>

          </div>


          {/* HERO IMAGE */}
          <div className="about-hero-visual">

            <div className="hero-image-frame">

              <img
                src="/images/modamart-slides/about-hero-ai.jpg"
                alt="Kaindra connected technology ecosystem"
              />

              <div className="hero-image-shade" />

              <GoldenEnergyEffects />

              <div className="hero-image-caption">
                <span>01 — OUR ECOSYSTEM</span>
                <h3>Ideas become possibilities.</h3>
              </div>

            </div>

            <div className="hero-vertical-text">
              CONNECT · COLLABORATE · GROW
            </div>

          </div>

        </div>

        <div className="hero-decoration hero-decoration-one" />
        <div className="hero-decoration hero-decoration-two" />

      </section>


      {/* =====================================
          INTRODUCTION
      ====================================== */}

      <section
        className="about-introduction"
        id="about-introduction"
      >

        <div className="about-container">

          <div className="about-intro-grid">

            {/* INTRODUCTION IMAGE */}
            <div className="about-intro-visual">

              <div className="about-intro-image">

                <img
                  src="/images/modamart-slides/about-ecosystem-ai.jpg"
                  alt="AI-generated illustration of people and industries collaborating"
                />

                <GoldenEnergyEffects className="intro-energy-overlay" />

                <div className="intro-image-overlay">
                  <span>THE KAINDRA ECOSYSTEM</span>
                  <h3>Different worlds. Shared possibilities.</h3>
                </div>

              </div>

            </div>


            {/* INTRODUCTION CONTENT */}
            <div className="about-intro-content">

              <span className="section-eyebrow">
                MORE THAN AN ECOSYSTEM
              </span>

              <h2>
                Building an ecosystem
                <span> designed to connect.</span>
              </h2>

              <p>
                Kaindra brings together businesses, ideas,
                technology and communities through a connected
                ecosystem. Our approach is focused on creating
                opportunities for collaboration, innovation and
                sustainable growth.
              </p>

              <p>
                We explore emerging industries and develop
                initiatives that connect different perspectives,
                capabilities and experiences. Each initiative
                contributes to a larger ecosystem while
                maintaining its own identity and purpose.
              </p>

              <div className="about-intro-highlight">

                <span className="highlight-symbol">✳</span>

                <div>
                  <strong>One connected vision.</strong>
                  <p>Bringing different possibilities together.</p>
                </div>

              </div>

              <a
                href="#ecosystem-areas"
                className="intro-discover-link"
              >
                Explore our ecosystem <span>↗</span>
              </a>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================
          ECOSYSTEM AREAS
      ====================================== */}

      <section
        className="ecosystem-areas"
        id="ecosystem-areas"
      >

        <div className="about-container">

          <div className="ecosystem-heading">

            <div>

              <span className="about-number">
                02 / WHAT CONNECTS US
              </span>

              <h2>
                Many possibilities.
                <br />
                <span>One larger vision.</span>
              </h2>

            </div>

            <p>
              Our ecosystem explores different industries,
              perspectives and opportunities. Every area
              contributes to a bigger picture.
            </p>

          </div>


          <div className="ecosystem-grid">

            {ecosystemAreas.map((area) => (

              <article
                className="ecosystem-card"
                key={area.number}
              >

                <div className="ecosystem-card-top">

                  <span className="ecosystem-card-number">
                    {area.number}
                  </span>

                  <span className="ecosystem-card-icon">
                    {area.icon}
                  </span>

                </div>

                <div className="ecosystem-card-content">

                  <h3>{area.title}</h3>
                  <p>{area.description}</p>

                </div>

                <div className="ecosystem-card-bottom">

                  <span>PART OF KAINDRA</span>
                  <span className="ecosystem-arrow">↗</span>

                </div>

              </article>

            ))}

          </div>

        </div>

      </section>


      {/* =====================================
          VISION AND MISSION
      ====================================== */}

      <section className="about-vision-mission">

        <div className="about-container">

          <div className="about-vm-heading">

            <span className="about-label">
              <span className="label-line" />
              VISION & MISSION
            </span>

            <h2>
              Creating connections
              <br />
              for the <span>future.</span>
            </h2>

            <p>
              A shared direction that inspires everything
              we build and every connection we create.
            </p>

          </div>


          <div className="about-vm-grid">


            {/* =================================
                VISION
            ================================== */}

            <article className="about-vm-card vision-card">

              <div className="vm-image">

                <img
                  src="/images/modamart-slides/about-vision-ai.jpg"
                  alt="AI-generated visual representing a connected future"
                />

                <GoldenEnergyEffects className="vision-energy-overlay" />

                <span className="vision-image-border" />

                <span className="vm-image-label">
                  OUR VISION
                </span>

                <span className="vm-image-number">
                  01
                </span>

              </div>


              <div className="vm-content">

                <span className="vm-number">
                  01 / VISION
                </span>

                <h3>A connected future.</h3>

                <p>
                  To build a global ecosystem where people,
                  businesses and ideas can discover,
                  collaborate, create and grow together.
                </p>

                <span className="vm-bottom-line" />

              </div>

            </article>


            {/* =================================
                MISSION
            ================================== */}

            <article className="about-vm-card mission-card">

              <div className="vm-image mission-image">

                <img
                  src="/images/modamart-slides/about-mission-ai.jpg"
                  alt="AI-generated visual representing collaboration and shared growth"
                />

                <GoldenEnergyEffects className="mission-energy-overlay" />

                <span className="mission-image-border" />

                <span className="vm-image-label">
                  OUR MISSION
                </span>

                <span className="vm-image-number">
                  02
                </span>

              </div>


              <div className="vm-content">

                <span className="vm-number">
                  02 / MISSION
                </span>

                <h3>Connect. Create. Grow.</h3>

                <p>
                  To connect creativity, technology,
                  businesses and communities through
                  innovative initiatives that create
                  meaningful opportunities and long-term
                  impact.
                </p>

                <span className="vm-bottom-line" />

              </div>

            </article>


          </div>

        </div>

      </section>


      {/* =====================================
          OUR APPROACH
      ====================================== */}

      <section className="about-approach">

        <div className="about-container about-approach-grid">

          <div className="about-approach-content">

            <span className="about-label">
              <span className="label-line" />
              OUR APPROACH
            </span>

            <h2>
              Different ideas.
              <br />
              <span>One connected ecosystem.</span>
            </h2>

            <p>
              Kaindra believes that the strongest ideas emerge
              when different industries, communities and
              perspectives come together. We create and connect
              initiatives that encourage innovation, collaboration
              and new possibilities.
            </p>

            <div className="approach-points">

              <div>
                <span>01</span>
                <p>Encouraging innovation</p>
                <span className="approach-point-arrow">↗</span>
              </div>

              <div>
                <span>02</span>
                <p>Connecting opportunities</p>
                <span className="approach-point-arrow">↗</span>
              </div>

              <div>
                <span>03</span>
                <p>Creating meaningful growth</p>
                <span className="approach-point-arrow">↗</span>
              </div>

            </div>

          </div>


          
{/* APPROACH IMAGE */}
<div className="about-approach-visual">

  <div className="about-approach-image">

    <img
      src="/images/modamart-slides/about-approach-ai.jpg"
      alt="AI-generated visual representing different industries working together"
    />

    {/* GOLDEN SPARKLES, LIGHTNING AND GLOW */}
    <GoldenEnergyEffects className="approach-energy-overlay" />

    {/* GOLDEN BORDER */}
    <span className="approach-image-border" />

    {/* IMAGE CAPTION */}
    <div className="approach-image-caption">
      <span>THE KAINDRA WAY</span>
      <h3>Connect. Create. Grow.</h3>
    </div>

  </div>

</div>

        </div>

      </section>


      {/* =====================================
          FINAL MESSAGE
      ====================================== */}

      <section className="about-closing">

        <div className="about-container about-closing-inner">

          <span className="about-number">
            THE KAINDRA VISION
          </span>

          <h2>
            Together, we create
            <br />
            <span>what comes next.</span>
          </h2>

          <p>
            A connected ecosystem built around people,
            possibilities and progress.
          </p>

          <a
            href="#about-introduction"
            className="closing-link"
          >
            Discover our vision <span>↗</span>
          </a>

          <div className="closing-decoration">
            ✳
          </div>

        </div>

      </section>


      {/* FOOTER */}
      <Footer />

    </main>
  );
}

export default About;
