import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

import Hero from "../Sections/Hero/Hero";
import Brands from "../Sections/Brands/Brands";
import Market from "../Sections/Market/Market";
import News from "../Sections/News/News";
import Timeline from "../Sections/Timeline/Timeline";
import CareersSection from "../Sections/Careers/Careers";
import Gallery from "../Sections/Gallery/Gallery";

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <Brands />
        <Market />
        <News />
        <Timeline />
        <CareersSection />
        <Gallery />
      </main>

      <Footer />
    </>
  );
}

export default Home;