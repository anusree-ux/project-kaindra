import Hero from "../sections/Hero/Hero";
import Market from "../sections/Market/Market";
import Brands from "../sections/Brands/Brands";
import Gallery from "../sections/Gallery/Gallery";
import News from "../sections/News/News";
import Timeline from "../sections/Timeline/Timeline";

// ModaSphere sections

import ModaHero from "./brands/ModaSphere/ModaHero/ModaHero";
import VisionMission from "./brands/ModaSphere/VisionMission/VisionMission";
import CorePillars from "./brands/ModaSphere/CorePillars/CorePillars";
import ValueProposition from "./brands/ModaSphere/ValueProposition/ValueProposition";
import Stakeholders from "./brands/ModaSphere/Stakeholders/Stakeholders";
import SubEcosystems from "./brands/ModaSphere/SubEcosystems/SubEcosystems";
import RevenueStreams from "./brands/ModaSphere/RevenueStreams/RevenueStreams";
import TechnologyFoundation from "./brands/ModaSphere/TechnologyFoundation/TechnologyFoundation";
import GoToMarket from "./brands/ModaSphere/GoToMarket/GoToMarket";
import LongTermImpact from "./brands/ModaSphere/LongTermImpact/LongTermImpact";
import SuccessMetrics from "./brands/ModaSphere/SuccessMetrics/SuccessMetrics";

function Home() {
  return (
    <>
      {/* KAINDRA */}
      <Hero />

      <Market />

      {/* MODASPHERE */}
      <div id="modasphere">
        

        <ModaHero />

        <VisionMission />

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
      <Brands />

      <Gallery />

      <News />

      <Timeline />
    </>
  );
}

export default Home;