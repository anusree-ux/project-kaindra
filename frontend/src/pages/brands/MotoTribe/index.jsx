import MotoNavbar from "./MotoNavbar/MotoNavbar";
import AuthModal from "./Auth/AuthModal";
import "./MotoTribe.css";

import MotoHero from "./MotoHero/MotoHero";

import JourneyIntelligence from "./JourneyIntelligence/JourneyIntelligence";

import LiveRiders from "./LiveRiders/LiveRiders";

import RidePlanner from "./RidePlanner/RidePlanner";

import UpcomingRides from "./UpcomingRides/UpcomingRides";

import LiveRide from "./LiveRide/LiveRide";

import DigitalRideRecord from "./DigitalRideRecord/DigitalRideRecord";

import RideAssistant from "./RideAssistant/RideAssistant";

import NearbyServices from "./NearbyServices/NearbyServices";

import SafetyEmergency from "./SafetyEmergency/SafetyEmergency";

import RidePassport from "./RidePassport/RidePassport";

import TrustedTribe from "./TrustedTribe/TrustedTribe";

import CommunityGuide from "./CommunityGuide/CommunityGuide";

import RiderConnect from "./RiderConnect/RiderConnect";

import FuelPrice from "./FuelPrice/FuelPrice";
function MotoTribe() {
  return (
    <div className="moto-tribe-page">
      <MotoNavbar />
      <AuthModal />

      <main>
        {/* HERO */}
        <MotoHero />

        {/* AI JOURNEY INTELLIGENCE */}
        <JourneyIntelligence />

        {/* FIND / CONNECT WITH RIDERS */}
        <LiveRiders />
        
        {/* COMMUNITY FUEL PRICE INTELLIGENCE */}
        <FuelPrice />

        {/* RIDER CONNECT */}
        <RiderConnect />

        {/* PLAN A RIDE */}
        <RidePlanner />

        {/* UPCOMING RIDES */}
        <UpcomingRides />

        {/* LIVE RIDE DASHBOARD */}
        <LiveRide />

        {/* DIGITAL RIDE RECORD + HISTORY */}
        <DigitalRideRecord />

        <CommunityGuide />

        {/* AI RIDE ASSISTANT */}
        <RideAssistant />

        {/* NEARBY SERVICES */}
        <NearbyServices />

    

        {/* SAFETY & EMERGENCY */}
        <SafetyEmergency />

        {/* RIDER PASSPORT / ACHIEVEMENTS */}
        <RidePassport />

        {/* TRUSTED TRIBE */}
        <TrustedTribe />
      </main>
    </div>
  );
}

export default MotoTribe;