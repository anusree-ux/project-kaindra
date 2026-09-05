import "./ModaNavbar.css";

export default function ModaNavbar() {
  return (
    <header className="moda-navbar">
      <div className="moda-nav-container">
        <div className="moda-logo">
          <span>MODA</span>
          <strong>SPHERE</strong>
        </div>

        <nav className="moda-nav-links">
          <a href="#vision">Vision</a>
          <a href="#ecosystem">Ecosystem</a>
          <a href="#pillars">Pillars</a>
          <a href="#stakeholders">Stakeholders</a>
          <a href="#technology">Technology</a>
          <a href="#impact">Impact</a>
        </nav>

        <button className="moda-nav-button">Explore</button>
      </div>
    </header>
  );
}