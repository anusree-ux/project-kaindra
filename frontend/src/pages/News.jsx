import Footer from "../components/Footer/Footer";
import NewsFeed from "../sections/News/News";

function News() {
  return (
    <>
      <section className="page-section">
        <NewsFeed isPage />
      </section>
      <Footer />
    </>
  );
}

export default News;
