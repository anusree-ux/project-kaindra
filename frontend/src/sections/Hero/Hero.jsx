import "./Hero.css";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-background">
        <div className="hero-gradient"></div>
      </div>

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

      <div className="hero-scroll">
        <span></span>
        <p>Scroll to explore</p>
      </div>
    </section>
  );
}

export default Hero;