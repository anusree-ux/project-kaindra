import ModaNavbar from "./ModaSphere/ModaNavbar/ModaNavbar";
import ModaHero from "./ModaSphere/ModaHero/ModaHero";
import VisionMission from "./ModaSphere/VisionMission/VisionMission";
import Ecosystem from "./ModaSphere/Ecosystem/Ecosystem";
import CorePillars from "./ModaSphere/CorePillars/CorePillars";
import ValueProposition from "./ModaSphere/ValueProposition/ValueProposition";
import SubEcosystems from "./ModaSphere/SubEcosystems/SubEcosystems";
import Stakeholders from "./ModaSphere/Stakeholders/Stakeholders";
import RevenueStreams from "./ModaSphere/RevenueStreams/RevenueStreams";
import TechnologyFoundation from "./ModaSphere/TechnologyFoundation/TechnologyFoundation";
import GoToMarket from "./ModaSphere/GoToMarket/GoToMarket";
import LongTermImpact from "./ModaSphere/LongTermImpact/LongTermImpact";
import SuccessMetrics from "./ModaSphere/SuccessMetrics/SuccessMetrics";

import "./ModaSphere.css";

export default function ModaSphere() {
  return (
    <div className="modasphere-page">
      <ModaNavbar />
      <ModaHero />
      <VisionMission />
      <Ecosystem />
      <CorePillars />
      <ValueProposition />
      <SubEcosystems />
      <Stakeholders />
      <RevenueStreams />
      <TechnologyFoundation />
      <GoToMarket />
      <LongTermImpact />
      <SuccessMetrics />
    </div>
  );
}