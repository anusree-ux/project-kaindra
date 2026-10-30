import MotoNavbar from "./MotoNavbar/MotoNavbar";
import "./MotoTribe.css";

import MotoHero from "./MotoHero/MotoHero";

import JourneyIntelligence from "./JourneyIntelligence/JourneyIntelligence";

import LiveRiders from "./LiveRiders/LiveRiders";

import RidePlanner from "./RidePlanner/RidePlanner";

import UpcomingRides from "./UpcomingRides/UpcomingRides";


import DigitalRideRecord from "./DigitalRideRecord/DigitalRideRecord";

import RideAssistant from "./RideAssistant/RideAssistant";

import NearbyServices from "./NearbyServices/NearbyServices";

import SafetyEmergency from "./SafetyEmergency/SafetyEmergency";

import RidePassport from "./RidePassport/RidePassport";

import TrustedTribe from "./TrustedTribe/TrustedTribe";
import MotoAuthManager from "./Auth/MotoAuthManager";

import CommunityGuide from "./CommunityGuide/CommunityGuide";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../../../context/AuthContext";
import { getAccessToken } from "../../../services/apiClient";
import RiderConnect from "./RiderConnect/RiderConnect";
import FuelPrice from "./FuelPrice/FuelPrice";

function MotoTribe() {
  const { isAuthenticated } = useAuth();

  // Real-time socket sync for global MotoTribe ride creation & deletion
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = getAccessToken();
    const socketUrl =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000"
        : window.location.origin;

    const socket = io(socketUrl, {
      auth: { token: token ? `Bearer ${token}` : "" },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });

    socket.on("mototribe:ride_created", (data) => {
      window.dispatchEvent(new CustomEvent("mototribe:ride-created", { detail: data }));
    });

    socket.on("mototribe:ride_deleted", (data) => {
      window.dispatchEvent(new CustomEvent("mototribe:ride-deleted", { detail: data }));
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <div className="moto-tribe-page">
      <MotoNavbar />

      <main>
        {/* HERO */}
        <MotoAuthManager />
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