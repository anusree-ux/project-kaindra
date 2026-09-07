import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

import Hero from "../sections/Hero/Hero";
import Brands from "../sections/Brands/Brands";
import Market from "../sections/Market/Market";
import News from "../sections/News/News";
import Timeline from "../sections/Timeline/Timeline";
import CareersSection from "../sections/Careers/Careers";
import Gallery from "../sections/Gallery/Gallery";

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