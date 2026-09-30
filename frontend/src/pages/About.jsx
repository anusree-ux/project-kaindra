import "./About.css";
import Footer from "../components/Footer/Footer";

function About() {
  return (
    <div className="about-page">

      {/* =========================
          ABOUT HERO
      ========================= */}

      <section className="about-hero">
        <div className="about-container">

          <span className="about-label">
            ABOUT KAINDRA
          </span>

          <h1>
            Connecting ideas,
            <br />
            people and possibilities.
          </h1>

          <p>
            Kaindra is building a connected ecosystem where
            innovation, business, technology and communities
            come together to create meaningful opportunities
            for the future.
          </p>

        </div>
      </section>


      {/* =========================
          ABOUT
      ========================= */}

      <section className="about-introduction">
        <div className="about-container">

          <div className="about-intro-grid">

            <div>
              <span className="about-number">
                ABOUT US
              </span>
            </div>

            <div className="about-intro-content">

              <h2>
                Building an ecosystem
                <br />
                designed to connect.
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
             

            </div>

          </div>

        </div>
      </section>
      

      {/* =========================
          VISION & MISSION
      ========================= */}

      <section className="about-vision-mission">

        <div className="about-container">

          <div className="about-vm-heading">

            <span className="about-label">
              VISION & MISSION
            </span>

            <h2>
              Creating connections
              <br />
              for the future.
            </h2>

          </div>


          <div className="about-vm-grid">

            {/* Vision */}
            <div className="about-vm-card vision-card">

              <span>VISION</span>

              <h3>
                A connected future.
              </h3>

              <p>
                To build a global ecosystem where people,
                businesses and ideas can discover,
                collaborate, create and grow together.
              </p>

            </div>


            {/* Mission */}
            <div className="about-vm-card mission-card">

              <span>MISSION</span>

              <h3>
                Connect. Create. Grow.
              </h3>

              <p>
                To connect creativity, technology,
                businesses and communities through
                innovative initiatives that create
                meaningful opportunities and long-term
                impact.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          OUR APPROACH
      ========================= */}

      <section className="about-approach">

        <div className="about-container">

          <span className="about-label">
            OUR APPROACH
          </span>

          <h2>
            Different ideas.
            <br />
            One connected ecosystem.
          </h2>

          <p>
            Kaindra believes that the strongest ideas emerge
            when different industries, communities and
            perspectives come together. We create and connect
            initiatives that encourage innovation, collaboration
            and new possibilities.
          </p>

        </div>

      </section>
       <Footer />

    </div>
  );
}

export default About;