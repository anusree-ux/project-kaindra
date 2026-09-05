import "./Timeline.css";

function Timeline() {
  const timelineData = [
    {
      year: "2020",
      title: "The Beginning",
      description:
        "KAINDRA started with a simple idea — build businesses that create real value.",
    },
    {
      year: "2022",
      title: "Growing the Vision",
      description:
        "New ideas, people and opportunities came together to expand the KAINDRA ecosystem.",
    },
    {
      year: "2024",
      title: "New Businesses",
      description:
        "Multiple brands and business initiatives were introduced across different industries.",
    },
    {
      year: "2026",
      title: "Building the Future",
      description:
        "KAINDRA continues to connect technology, businesses and communities for what's next.",
    },
  ];

  return (
    <section className="timeline">
      <div className="timeline-container">

        <div className="timeline-header">
          <p>OUR JOURNEY</p>
          <h2>Growing with purpose.</h2>
        </div>

        <div className="timeline-list">
          {timelineData.map((item, index) => (
            <div className="timeline-item" key={item.year}>

              <div className="timeline-year">
                {item.year}
              </div>

              <div className="timeline-line">
                <span className="timeline-dot"></span>

                {index !== timelineData.length - 1 && (
                  <span className="timeline-connector"></span>
                )}
              </div>

              <div className="timeline-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Timeline;