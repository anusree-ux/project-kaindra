import "./SubEcosystems.css";

const ecosystems = [
  "DesignSphere",
  "MakerSphere",
  "BrandSphere",
  "RetailSphere",
  "InfluenceSphere",
  "ConsumerSphere"
];

export default function SubEcosystems() {
  return (
    <section className="sub-ecosystems">
      <div className="sub-container">
        <p>05 — SUB-ECOSYSTEMS</p>

        <h2>Specialized spaces.<br />One connected world.</h2>

        <div className="sub-grid">
          {ecosystems.map((item, index) => (
            <div className="sub-card" key={item}>
              <span>0{index + 1}</span>
              <h3>{item}</h3>
              <div>Explore →</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}