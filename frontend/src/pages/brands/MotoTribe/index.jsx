import MotoNavbar from "./MotoNavbar/MotoNavbar";
import MotoHero from "./MotoHero/MotoHero";

import JourneyIntelligence from "./JourneyIntelligence/JourneyIntelligence";
import FuelPrice from "./FuelPrice/FuelPrice";
import LiveRiders from "./LiveRiders/LiveRiders";
import RiderConnect from "./RiderConnect/RiderConnect";

import RidePlanner from "./RidePlanner/RidePlanner";
import UpcomingRides from "./UpcomingRides/UpcomingRides";
import LiveRide from "./LiveRide/LiveRide";

import DigitalRideRecord from "./DigitalRideRecord/DigitalRideRecord";
import CommunityGuide from "./CommunityGuide/CommunityGuide";

import RideAssistant from "./RideAssistant/RideAssistant";
import NearbyServices from "./NearbyServices/NearbyServices";

import SafetyEmergency from "./SafetyEmergency/SafetyEmergency";
import RidePassport from "./RidePassport/RidePassport";
import TrustedTribe from "./TrustedTribe/TrustedTribe";

function MotoTribe() {
  return (
    <div className="moto-tribe-page">
      <MotoNavbar />

      <main>
        {/* HERO */}
        <MotoHero />

        {/* CONNECT */}
        <JourneyIntelligence />
        <FuelPrice />
        <LiveRiders />
        <RiderConnect />

        {/* PLAN */}
        <RidePlanner />

        {/* RIDE */}
        <UpcomingRides />
        <LiveRide />

        {/* RECORD */}
        <DigitalRideRecord />

        {/* SHARE */}
        <CommunityGuide />

        {/* GUIDE */}
        <RideAssistant />
        <NearbyServices />

        {/* SAFETY */}
        <SafetyEmergency />

        {/* RIDER IDENTITY */}
        <RidePassport />

        {/* TRUST NETWORK */}
        <TrustedTribe />
      </main>
    </div>
  );
}

export default MotoTribe;