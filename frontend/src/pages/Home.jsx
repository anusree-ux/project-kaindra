

import Gallery from "../sections/Gallery/Gallery";

import Timeline from "../sections/Timeline/Timeline";

// ModaSphere sections

import ModaHero from "./brands/ModaSphere/ModaHero/ModaHero";
import CorePillars from "./brands/ModaSphere/CorePillars/CorePillars";
import ValueProposition from "./brands/ModaSphere/ValueProposition/ValueProposition";
import Stakeholders from "./brands/ModaSphere/Stakeholders/Stakeholders";
import SubEcosystems from "./brands/ModaSphere/SubEcosystems/SubEcosystems";
import RevenueStreams from "./brands/ModaSphere/RevenueStreams/RevenueStreams";
import TechnologyFoundation from "./brands/ModaSphere/TechnologyFoundation/TechnologyFoundation";
import GoToMarket from "./brands/ModaSphere/GoToMarket/GoToMarket";
import LongTermImpact from "./brands/ModaSphere/LongTermImpact/LongTermImpact";
import SuccessMetrics from "./brands/ModaSphere/SuccessMetrics/SuccessMetrics";
import Footer from "../components/Footer/Footer";

function Home() {
  return (
    <>

      {/* MODASPHERE */}
      <div id="modasphere">
        

        <ModaHero />



        <CorePillars />

        <ValueProposition />

        <Stakeholders />

        <SubEcosystems />

        <TechnologyFoundation />

        <GoToMarket />

        <RevenueStreams />

        <LongTermImpact />

        <SuccessMetrics />
      </div>

      {/* KAINDRA */}
    

      <Gallery />



      <Timeline />
      <Footer/>
    </>
  );
}

export default Home;