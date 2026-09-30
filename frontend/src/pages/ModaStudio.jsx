import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Palette,
  Layers3,
  Users,
  PenTool,
  Shirt,
  Camera,
  Ruler,
} from "lucide-react";

import "./ModaStudio.css";

const collections = [
  {
    title: "Urban Form",
    category: "STREETWEAR",
    image:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Heritage Reimagined",
    category: "CULTURAL",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Future Motion",
    category: "TECH / ACTIVE",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Quiet Luxury",
    category: "LUXURY",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85",
  },
];

const services = [
  {
    icon: Palette,
    number: "01",
    title: "Concept Development",
    text: "Turn an initial idea into a clear fashion concept, visual direction and collection identity.",
  },
  {
    icon: PenTool,
    number: "02",
    title: "Design Development",
    text: "Build silhouettes, details, color systems and design directions for complete collections.",
  },
  {
    icon: Shirt,
    number: "03",
    title: "Collection Building",
    text: "Develop coordinated product ranges designed to work together as one collection.",
  },
  {
    icon: Camera,
    number: "04",
    title: "Visual Direction",
    text: "Create the visual language, styling and presentation needed to bring a collection to market.",
  },
];

const workspaceItems = [
  {
    icon: Palette,
    title: "Moodboards",
    text: "Build visual directions and references.",
  },
  {
    icon: Ruler,
    title: "Design Planning",
    text: "Organize silhouettes, materials and details.",
  },
  {
    icon: Layers3,
    title: "Collection Systems",
    text: "Connect individual products into collections.",
  },
  {
    icon: Users,
    title: "Collaboration",
    text: "Work with designers, creators and brands.",
  },
];

function ModaStudio() {
  const [activeCategory, setActiveCategory] = useState("ALL");

  const categories = [
    "ALL",
    "STREETWEAR",
    "CULTURAL",
    "TECH / ACTIVE",
    "LUXURY",
  ];

  const filteredCollections =
    activeCategory === "ALL"
      ? collections
      : collections.filter(
          (item) => item.category === activeCategory
        );

  return (
    <main className="modastudio-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="modastudio-hero">

        <div className="modastudio-hero-image">
          <img
            src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1800&q=90"
            alt="Fashion design studio"
          />
        </div>

        <div className="modastudio-hero-overlay"></div>

        <div className="modastudio-container modastudio-hero-content">

          <div className="modastudio-hero-top">
            <span>MODASPHERE / MODASTUDIO</span>

            <span className="modastudio-hero-index">
              01 / 10
            </span>
          </div>

          <div className="modastudio-hero-main">

            <p className="modastudio-eyebrow">
              DESIGN & CREATION
            </p>

            <h1>
              Where fashion
              <br />
              <span>takes shape.</span>
            </h1>

            <p className="modastudio-hero-description">
              A creative workspace for designers, creators and
              fashion businesses to develop ideas, collections
              and products.
            </p>

            <a
              href="#collections"
              className="modastudio-hero-button"
            >
              Explore Studio
              <ArrowRight size={18} />
            </a>

          </div>

          <div className="modastudio-hero-bottom">

            <span>
              CONCEPT
            </span>

            <span>
              DESIGN
            </span>

            <span>
              COLLECTION
            </span>

            <span>
              CREATION
            </span>

          </div>

        </div>
      </section>


      {/* =====================================================
          INTRO / STUDIO BOARD
      ===================================================== */}

      <section className="modastudio-intro">

        <div className="modastudio-container">

          <div className="modastudio-intro-grid">

            <div className="modastudio-intro-label">
              THE STUDIO
            </div>

            <div className="modastudio-intro-content">

              <h2>
                Ideas become
                <br />
                <em>fashion.</em>
              </h2>

              <p>
                ModaStudio brings the creative side of
                ModaSphere together — from the first visual
                reference to the final collection.
              </p>

              <div className="modastudio-intro-stats">

                <div>
                  <strong>04</strong>
                  <span>Creative stages</span>
                </div>

                <div>
                  <strong>∞</strong>
                  <span>Design possibilities</span>
                </div>

                <div>
                  <strong>01</strong>
                  <span>Connected ecosystem</span>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CREATIVE WORKSPACE
      ===================================================== */}

      <section className="modastudio-workspace">

        <div className="modastudio-container">

          <div className="modastudio-section-top">

            <div>
              <span className="modastudio-small-label">
                CREATIVE WORKSPACE
              </span>

              <h2>
                Everything you need
                <br />
                to create.
              </h2>
            </div>

            <p>
              A connected creative environment designed
              around the way modern fashion is developed.
            </p>

          </div>


          <div className="modastudio-workspace-grid">

            {workspaceItems.map((item, index) => {

              const Icon = item.icon;

              return (
                <article
                  className="modastudio-workspace-card"
                  key={item.title}
                >

                  <div className="workspace-card-number">
                    0{index + 1}
                  </div>

                  <div className="workspace-card-icon">
                    <Icon size={23} strokeWidth={1.4} />
                  </div>

                  <h3>
                    {item.title}
                  </h3>

                  <p>
                    {item.text}
                  </p>

                  <ArrowUpRight
                    className="workspace-arrow"
                    size={19}
                  />

                </article>
              );
            })}

          </div>

        </div>

      </section>


      {/* =====================================================
          COLLECTIONS
      ===================================================== */}

      <section
        className="modastudio-collections"
        id="collections"
      >

        <div className="modastudio-container">

          <div className="modastudio-section-heading">

            <div>
              <span className="modastudio-small-label">
                CREATIVE DIRECTIONS
              </span>

              <h2>
                Explore the
                <br />
                possibilities.
              </h2>
            </div>

            <p>
              Fashion can move across cultures, materials,
              technology and creative disciplines.
            </p>

          </div>


          <div className="modastudio-filters">

            {categories.map((category) => (

              <button
                key={category}
                type="button"
                className={
                  activeCategory === category
                    ? "active"
                    : ""
                }
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>

            ))}

          </div>


          <div className="modastudio-collection-grid">

            {filteredCollections.map((collection, index) => (

              <article
                className={`modastudio-collection-card collection-${index + 1}`}
                key={collection.title}
              >

                <div className="collection-image">

                  <img
                    src={collection.image}
                    alt={collection.title}
                  />

                  <div className="collection-overlay"></div>

                  <span className="collection-number">
                    0{index + 1}
                  </span>

                  <ArrowUpRight
                    className="collection-open"
                    size={24}
                  />

                </div>

                <div className="collection-info">

                  <span>
                    {collection.category}
                  </span>

                  <h3>
                    {collection.title}
                  </h3>

                </div>

              </article>

            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          SERVICES
      ===================================================== */}

      <section className="modastudio-services">

        <div className="modastudio-container">

          <div className="modastudio-section-heading light">

            <div>
              <span className="modastudio-small-label">
                WHAT WE CREATE
              </span>

              <h2>
                From first idea
                <br />
                to final direction.
              </h2>
            </div>

          </div>


          <div className="modastudio-services-list">

            {services.map((service) => {

              const Icon = service.icon;

              return (
                <article
                  className="modastudio-service-row"
                  key={service.number}
                >

                  <span className="service-number">
                    {service.number}
                  </span>

                  <div className="service-icon">
                    <Icon size={25} strokeWidth={1.4} />
                  </div>

                  <div className="service-content">

                    <h3>
                      {service.title}
                    </h3>

                    <p>
                      {service.text}
                    </p>

                  </div>

                  <ArrowRight
                    className="service-arrow"
                    size={21}
                  />

                </article>
              );
            })}

          </div>

        </div>

      </section>


      {/* =====================================================
          CREATION PROCESS
      ===================================================== */}

      <section className="modastudio-process">

        <div className="modastudio-container">

          <div className="modastudio-process-heading">

            <span className="modastudio-small-label">
              THE CREATION PROCESS
            </span>

            <h2>
              From blank page
              <br />
              to <em>finished collection.</em>
            </h2>

          </div>


          <div className="modastudio-process-track">

            <div className="process-line"></div>

            <div className="process-step">

              <span>01</span>

              <div className="process-dot"></div>

              <h3>
                Discover
              </h3>

              <p>
                Research culture, trends, materials
                and creative references.
              </p>

            </div>


            <div className="process-step">

              <span>02</span>

              <div className="process-dot"></div>

              <h3>
                Develop
              </h3>

              <p>
                Shape the concept into silhouettes,
                details and visual directions.
              </p>

            </div>


            <div className="process-step">

              <span>03</span>

              <div className="process-dot"></div>

              <h3>
                Build
              </h3>

              <p>
                Develop the collection and connect
                it with production capabilities.
              </p>

            </div>


            <div className="process-step">

              <span>04</span>

              <div className="process-dot"></div>

              <h3>
                Launch
              </h3>

              <p>
                Move the finished creation into the
                wider ModaSphere ecosystem.
              </p>

            </div>

          </div>

        </div>
      </section>

    </main>
  );
}

export default ModaStudio;