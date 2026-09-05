import "./VisionMission.css";

export default function VisionMission() {
  return (
    <section className="vision-mission" id="vision">
      <div className="vm-container">
        <div className="vm-heading">
          <p>01 — VISION & MISSION</p>
          <h2>Transforming the way fashion connects.</h2>
        </div>

        <div className="vm-grid">
          <div className="vm-card">
            <span>VISION</span>
            <h3>A connected fashion future.</h3>
            <p>
              Build the world's most connected fashion ecosystem where every
              participant can discover, collaborate, create and grow.
            </p>
          </div>

          <div className="vm-card dark">
            <span>MISSION</span>
            <h3>Connect. Create. Scale.</h3>
            <p>
              Empower the entire fashion value chain with technology,
              collaboration and intelligent digital experiences.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}