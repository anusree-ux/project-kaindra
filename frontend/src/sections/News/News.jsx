import { Link } from "react-router-dom";
import "./News.css";

const news = [
  {
    date: "06 SEP 2026",
    title: "KAINDRA expands its business ecosystem",
  },
  {
    date: "20 AUG 2026",
    title: "Building new experiences for communities",
  },
  {
    date: "12 JUL 2026",
    title: "New ideas and partnerships take shape",
  },
];

function News() {
  return (
    <section className="news-section">
      <div className="container">

        <div className="news-top">
          <div>
            <p className="section-label">NEWS</p>
            <h2 className="section-title">Latest from KAINDRA</h2>
          </div>

          <Link to="/news">View all →</Link>
        </div>

        <div className="news-list">
          {news.map((item) => (
            <article className="news-item" key={item.title}>
              <span>{item.date}</span>
              <h3>{item.title}</h3>
              <button>Read →</button>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}

export default News;