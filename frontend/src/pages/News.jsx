
import Footer from "../components/Footer/Footer";
import "./News.css";

const newsArticles = [
  {
    number: "01",
    date: "SEPTEMBER 2026",
    category: "ECOSYSTEM",
    title: "KAINDRA expands its business ecosystem",
    description:
      "Discover how Kaindra brings different business initiatives, industries and opportunities together through one connected ecosystem.",
  },
  {
    number: "02",
    date: "SEPTEMBER 2026",
    category: "COMMUNITY",
    title: "Building new experiences for communities",
    description:
      "Explore the importance of connecting people, creative minds and communities to encourage collaboration and meaningful opportunities.",
  },
  {
    number: "03",
    date: "SEPTEMBER 2026",
    category: "INNOVATION",
    title: "New ideas and partnerships take shape",
    description:
      "Learn how new ideas, collaborations and partnerships can contribute to innovation and the future growth of businesses.",
  },
];

function News() {
  return (
    <>
      <main className="news-page">

        {/* NEWS HERO */}
        <section className="news-hero">

          <div className="news-container">

            <span className="news-label">
              <span />
              NEWS & INSIGHTS
            </span>

            <h1>
              Stories from
              <br />
              <span>KAINDRA.</span>
            </h1>

            <p>
              Discover the latest updates, ideas, developments
              and stories from across the Kaindra ecosystem.
              From business initiatives and fashion innovation
              to community connections and new opportunities,
              explore what is shaping our journey.
            </p>

            <a
              href="#news-articles"
              className="news-explore-btn"
            >
              Explore Stories
              <span>↗</span>
            </a>

          </div>

        </section>


        {/* NEWS ARTICLES */}
        <section
          className="news-articles-section"
          id="news-articles"
        >

          <div className="news-container">

            <div className="news-section-heading">

              <div>
                <span className="news-label">
                  LATEST UPDATES
                </span>

                <h2>
                  Explore what's happening.
                </h2>
              </div>

              <p>
                Ideas, developments and perspectives from
                different parts of the Kaindra ecosystem.
              </p>

            </div>


            <div className="news-grid">

              {newsArticles.map((article) => (

                <article
                  className="news-card"
                  key={article.number}
                >

                  <div className="news-card-top">

                    <span className="news-card-number">
                      {article.number}
                    </span>

                    <span className="news-card-category">
                      {article.category}
                    </span>

                  </div>

                  <div className="news-card-content">

                    <span className="news-date">
                      {article.date}
                    </span>

                    <h3>{article.title}</h3>

                    <p>{article.description}</p>

                  </div>

                  <div className="news-card-footer">

                    <span>KAINDRA JOURNAL</span>

                    <span className="news-card-arrow">
                      ↗
                    </span>

                  </div>

                </article>

              ))}

            </div>

          </div>

        </section>


        {/* NEWS CLOSING */}
        <section className="news-closing">

          <div className="news-container">

            <span className="news-label">
              THE KAINDRA JOURNEY
            </span>

            <h2>
              Ideas connect.
              <br />
              <span>Possibilities grow.</span>
            </h2>

            <p>
              Every story is part of a larger vision to
              connect businesses, people and opportunities.
            </p>

          </div>

        </section>

      </main>

      <Footer />
    </>
  );
}

export default News;
