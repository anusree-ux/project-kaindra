import "./VisionMission.css";

export default function VisionMission() {
  return (
    <section
      className="vision-mission"
      id="vision"
    >
      <div className="vision-mission-inner">

        <div className="vision-heading">
          <span>VISION & MISSION</span>

          <h2>
            Transforming the way
            fashion connects.
          </h2>

          <p>
            Building a connected fashion ecosystem where
            creativity, commerce, technology and community
            come together to shape the future of fashion.
          </p>
        </div>

        <div className="vision-cards">

          <article className="vision-card vision-card-light">
            <span>VISION</span>

            <h3>
              A connected
              fashion future.
            </h3>

            <p>
              Build the world's most connected fashion
              ecosystem where every participant can
              discover, collaborate, create and grow.
            </p>
          </article>

          <article className="vision-card vision-card-dark">
            <span>MISSION</span>

            <h3>
              Connect.
              Create. Scale.
            </h3>

            <p>
              Empower designers, brands, manufacturers,
              retailers, influencers and consumers with
              innovative tools, platforms and opportunities
              for growth, collaboration and impact.
            </p>
          </article>

        </div>

      </div>
    </section>
  );
}