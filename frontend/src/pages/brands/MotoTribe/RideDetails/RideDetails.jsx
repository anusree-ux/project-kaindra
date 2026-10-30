import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import apiClient from "../../../../services/apiClient";
import { formatMongoRide } from "../../../../utils/mototribeRideAdapter";
import {
  getMotoRideById,
  getMotoRideStatus,
  getMotoRideCountdown,
} from "../../../../data/motoRides";

import "./RideDetails.css";
import LiveRideChat from "../LiveRideChat/LiveRideChat";
import RideCall from "../RideCall/RideCall";

/* --------------------------------------------------
   LOCAL STORAGE HELPERS
-------------------------------------------------- */

const getStoredArray = (key) => {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setStoredArray = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors in demo mode.
  }
};



/* --------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------- */

function RideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  return (
    <RideDetailsContent
      key={rideId}
      rideId={rideId}
      navigate={navigate}
    />
  );
}

/* --------------------------------------------------
   RIDE DETAILS CONTENT
-------------------------------------------------- */

function RideDetailsContent({ rideId, navigate }) {
  const [ride, setRide] = useState(() => getMotoRideById(rideId));
  const [loading, setLoading] = useState(() => !getMotoRideById(rideId));

  useEffect(() => {
    let isMounted = true;
    const staticRide = getMotoRideById(rideId);
    if (staticRide) {
      setRide(staticRide);
      setLoading(false);
      return;
    }

    async function fetchRide() {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/mototribe/rides/${rideId}`);
        const raw = res.data.data?.ride || res.data.data;
        if (isMounted && raw) {
          setRide(formatMongoRide(raw));
        }
      } catch (err) {
        console.error("Error fetching ride details from DB:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRide();
    return () => {
      isMounted = false;
    };
  }, [rideId]);

  /* --------------------------------------------------
     INITIAL PARTICIPANTS
  -------------------------------------------------- */

  const getInitialParticipants = () => {
    if (!ride) {
      return [];
    }

    const savedParticipants = localStorage.getItem(
      `mototribeParticipants_${rideId}`
    );

    if (!savedParticipants) {
      return ride.participants || [];
    }

    try {
      const parsedParticipants =
        JSON.parse(savedParticipants);

      return Array.isArray(parsedParticipants)
        ? parsedParticipants
        : ride.participants || [];
    } catch {
      return ride.participants || [];
    }
  };

  /* --------------------------------------------------
     INITIAL JOIN REQUESTS
  -------------------------------------------------- */

  const getInitialJoinRequests = () => {
    const savedRequests = localStorage.getItem(
      `mototribeRequests_${rideId}`
    );

    if (!savedRequests) {
      return [];
    }

    try {
      const parsedRequests =
        JSON.parse(savedRequests);

      return Array.isArray(parsedRequests)
        ? parsedRequests
        : [];
    } catch {
      return [];
    }
  };

  /* --------------------------------------------------
     INITIAL JOIN STATUS
  -------------------------------------------------- */

  const getInitialJoinStatus = () => {
    const joinedIds = getStoredArray(
      "mototribeJoinedRides"
    );

    const requestedIds = getStoredArray(
      "mototribeRequestedRides"
    );

    if (joinedIds.includes(rideId)) {
      return "JOINED";
    }

    if (requestedIds.includes(rideId)) {
      return "REQUESTED";
    }

    return "NOT_JOINED";
  };

  /* --------------------------------------------------
     STATE
  -------------------------------------------------- */

  const [now, setNow] = useState(() => new Date());

  const [joinStatus, setJoinStatus] = useState(
    getInitialJoinStatus
  );

  const [participants, setParticipants] = useState(
    getInitialParticipants
  );

  const [joinRequests, setJoinRequests] = useState(
    getInitialJoinRequests
  );

  const [selectedPoiCategory, setSelectedPoiCategory] = useState(null);

  /* --------------------------------------------------
     CLOCK
  -------------------------------------------------- */

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleRideDeleted = (e) => {
      const deletedId = e.detail?.rideId;
      if (deletedId && String(deletedId) === String(rideId)) {
        alert("This ride has been deleted.");
        navigate("/businesses/mototribe");
      }
    };

    window.addEventListener("mototribe:ride-deleted", handleRideDeleted);
    return () => {
      window.removeEventListener("mototribe:ride-deleted", handleRideDeleted);
    };
  }, [rideId, navigate]);

  /* --------------------------------------------------
     LOADING & NOT FOUND
  -------------------------------------------------- */

  if (loading) {
    return (
      <section className="ride-details-page">
        <div className="ride-details-not-found" style={{ borderColor: "rgba(185, 145, 69, 0.4)" }}>
          <span className="section-eyebrow">MOTOTRIBE / RIDE NETWORK</span>
          <h2 style={{ color: "#d4a03e", fontSize: "1.4rem", letterSpacing: "0.08em" }}>LOADING RIDE DETAILS...</h2>
          <p style={{ color: "#888" }}>Syncing ride route, itinerary and participant details...</p>
        </div>
      </section>
    );
  }

  if (!ride) {
    return (
      <section className="ride-details-page">
        <div className="ride-details-not-found">
          <span>404 / RIDE NOT FOUND</span>

          <h1>THIS RIDE DOES NOT EXIST</h1>

          <p>
            The requested MotoTribe ride could not be
            found.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/businesses/mototribe")
            }
          >
            BACK TO MOTOTRIBE
          </button>
        </div>
      </section>
    );
  }

  /* --------------------------------------------------
     SAVE PARTICIPANTS
  -------------------------------------------------- */

  const saveParticipants = (participantsList) => {
    setParticipants(participantsList);

    try {
      localStorage.setItem(
        `mototribeParticipants_${rideId}`,
        JSON.stringify(participantsList)
      );
    } catch {
      // Ignore storage errors.
    }
  };

  /* --------------------------------------------------
     SAVE REQUESTS
  -------------------------------------------------- */

  const saveRequests = (requestsList) => {
    setJoinRequests(requestsList);

    try {
      localStorage.setItem(
        `mototribeRequests_${rideId}`,
        JSON.stringify(requestsList)
      );
    } catch {
      // Ignore storage errors.
    }
  };

  /* --------------------------------------------------
     JOIN RIDE
  -------------------------------------------------- */

  const handleJoinRide = () => {
    if (joinStatus === "JOINED") {
      return;
    }

    const hasCurrentUser = participants.some(
      (participant) => participant.id === "current-user"
    );

    if (!hasCurrentUser) {
      saveParticipants([
        ...participants,
        {
          id: "current-user",
          name: "You",
          role: "RIDER",
          confirmed: true,
        },
      ]);
    }

    const joinedIds = getStoredArray(
      "mototribeJoinedRides"
    );

    if (!joinedIds.includes(rideId)) {
      setStoredArray("mototribeJoinedRides", [
        ...joinedIds,
        rideId,
      ]);
    }

    const requestedIds = getStoredArray(
      "mototribeRequestedRides"
    );

    setStoredArray(
      "mototribeRequestedRides",
      requestedIds.filter((id) => id !== rideId)
    );

    setJoinStatus("JOINED");
  };

  /* --------------------------------------------------
     REQUEST TO JOIN
  -------------------------------------------------- */

  const handleRequestJoin = () => {
    if (
      joinStatus === "JOINED" ||
      joinStatus === "REQUESTED"
    ) {
      return;
    }

    const hasCurrentRequest = joinRequests.some(
      (request) =>
        request.id === "current-user-request"
    );

    if (!hasCurrentRequest) {
      saveRequests([
        ...joinRequests,
        {
          id: "current-user-request",
          name: "You",
          status: "PENDING",
        },
      ]);
    }

    const requestedIds = getStoredArray(
      "mototribeRequestedRides"
    );

    if (!requestedIds.includes(rideId)) {
      setStoredArray("mototribeRequestedRides", [
        ...requestedIds,
        rideId,
      ]);
    }

    setJoinStatus("REQUESTED");
  };

  /* --------------------------------------------------
     LEAVE RIDE
  -------------------------------------------------- */

  const handleLeaveRide = () => {
    saveParticipants(
      participants.filter(
        (participant) =>
          participant.id !== "current-user"
      )
    );

    const joinedIds = getStoredArray(
      "mototribeJoinedRides"
    );

    setStoredArray(
      "mototribeJoinedRides",
      joinedIds.filter((id) => id !== rideId)
    );

    setJoinStatus("NOT_JOINED");
  };

  /* --------------------------------------------------
     CONFIRM REQUEST
  -------------------------------------------------- */

  const handleConfirmRequest = (requestId) => {
    const request = joinRequests.find(
      (item) => item.id === requestId
    );

    if (!request) {
      return;
    }

    saveRequests(
      joinRequests.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: "APPROVED",
            }
          : item
      )
    );
  };



  /* --------------------------------------------------
     NAVIGATION & ACTIONS
  -------------------------------------------------- */

  const handleDeleteRide = async () => {
    if (!rideId) return;
    const confirmDelete = window.confirm(
      `Permanently delete planned ride "${ride?.name || "this ride"}"?\n\nThis will remove it completely from the database before it starts. This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await apiClient.delete(`/api/mototribe/rides/${rideId}`);
      window.dispatchEvent(
        new CustomEvent("mototribe:ride-deleted", { detail: { rideId } })
      );
      alert("Ride successfully deleted from the database.");
      navigate("/businesses/mototribe");
    } catch (err) {
      console.error("Failed to delete ride:", err);
      const msg = err.response?.data?.message || err.message || "Failed to delete ride.";
      alert(msg);
    }
  };


  const handleBack = () => {
    navigate("/businesses/mototribe");
  };

  const handleOpenExpenses = () => {
    navigate(
      `/businesses/mototribe/ride/${rideId}/expenses`
    );
  };

  const handleOpenLiveRide = () => {
    navigate(
      `/businesses/mototribe/ride/${rideId}/live`
    );
  };

  /* --------------------------------------------------
     RIDE STATUS
  -------------------------------------------------- */

  const rideStatus = getMotoRideStatus(
    ride,
    now
  );

  const countdown = getMotoRideCountdown(
    ride,
    now
  );

  /* --------------------------------------------------
     PARTICIPANT COUNT
  -------------------------------------------------- */

  const participantCount = participants.length;

  const capacityPercentage =
    ride.maxRiders > 0
      ? Math.min(
          (participantCount / ride.maxRiders) * 100,
          100
        )
      : 0;

  /* --------------------------------------------------
     DATE
  -------------------------------------------------- */

  const formattedDate = new Date(
    `${ride.date}T00:00:00`
  ).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  /* --------------------------------------------------
     RENDER
  -------------------------------------------------- */

  return (
    <section className="ride-details-page">
      <div className="ride-details-container">

        {/* BACK */}

        <button
          type="button"
          className="ride-details-back"
          onClick={handleBack}
        >
          ← BACK TO RIDES
        </button>

        {/* HERO */}

        <header className="ride-details-hero">
          <div className="ride-details-hero-content">

            <div className="ride-details-tags">
              <span>{ride.type}</span>

              <span>{ride.difficulty}</span>

              <span
                className={`ride-details-status status-${rideStatus.toLowerCase()}`}
              >
                {rideStatus}
              </span>
            </div>

            <h1>{ride.name}</h1>

            <p className="ride-details-description">
              {ride.description}
            </p>

            <div className="ride-details-organizer">
              <span>ORGANIZED BY</span>

              <strong>{ride.organizer}</strong>

              <small>
                {ride.organizerType}
              </small>
            </div>
          </div>
        </header>

        {/* COUNTDOWN */}

        <div className="ride-details-countdown-section">
          <div>
            <span>DEPARTURE</span>

            <strong>{formattedDate}</strong>

            <small>{ride.time}</small>
          </div>

          <div className="ride-details-countdown">
            {rideStatus === "LIVE" ? (
              <div className="ride-live-indicator">
                ● LIVE NOW
              </div>
            ) : rideStatus === "COMPLETED" ? (
              <div className="ride-completed-indicator">
                RIDE COMPLETED
              </div>
            ) : countdown.expired ? (
              <div>STARTING</div>
            ) : (
              <>
                <div>
                  <strong>
                    {String(
                      countdown.days
                    ).padStart(2, "0")}
                  </strong>

                  <span>DAYS</span>
                </div>

                <div>
                  <strong>
                    {String(
                      countdown.hours
                    ).padStart(2, "0")}
                  </strong>

                  <span>HRS</span>
                </div>

                <div>
                  <strong>
                    {String(
                      countdown.minutes
                    ).padStart(2, "0")}
                  </strong>

                  <span>MIN</span>
                </div>

                <div>
                  <strong>
                    {String(
                      countdown.seconds
                    ).padStart(2, "0")}
                  </strong>

                  <span>SEC</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* QUICK ACCESS JUMP BAR: CALL & CHAT */}
        <div className="ride-details-quick-bar">
          <button
            type="button"
            className="ride-quick-btn call-btn"
            onClick={() => {
              const el = document.getElementById("mototribe-call-section");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            <span className="ride-quick-icon">📹</span>
            <div className="ride-quick-text">
              <strong>TRIBE VOICE & VIDEO CALL</strong>
              <small>Real-time group call with convoy</small>
            </div>
            <span className="ride-quick-arrow">↓</span>
          </button>

          <button
            type="button"
            className="ride-quick-btn chat-btn"
            onClick={() => {
              const el = document.getElementById("ride-group-chat");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            <span className="ride-quick-icon">💬</span>
            <div className="ride-quick-text">
              <strong>RIDE GROUP CHAT</strong>
              <small>Live convoy chat & coordination</small>
            </div>
            <span className="ride-quick-arrow">↓</span>
          </button>
        </div>

        {/* MAIN GRID */}

        <div className="ride-details-grid">

          <div className="ride-details-main">

            {/* ROUTE */}

            <section className="ride-info-card">
              <div className="ride-info-card-heading">
                <span>01</span>
                <h2>JOURNEY ROUTE</h2>
              </div>

              <div className="ride-route-main">
                <div className="ride-route-location">
                  <span className="ride-route-marker">
                    A
                  </span>

                  <div>
                    <small>START</small>

                    <strong>
                      {ride.start}
                    </strong>
                  </div>
                </div>

                <div className="ride-route-arrow">
                  ↓
                </div>

                <div className="ride-route-location">
                  <span className="ride-route-marker">
                    B
                  </span>

                  <div>
                    <small>DESTINATION</small>

                    <strong>
                      {ride.destination}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="ride-route-full">
                <span>FULL ROUTE</span>

                <p>{ride.route}</p>
              </div>

              <div className="ride-route-stops">
                <span>PLANNED STOPS</span>

                <div>
                  {(ride.stops || []).map(
                    (stop, index) => (
                      <span
                        key={typeof stop === 'object' ? `${stop.name || index}-${index}` : `${stop}-${index}`}
                      >
                        <b>
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </b>

                        {stop}
                      </span>
                    )
                  )}
                </div>
              </div>
            </section>

            {/* JOURNEY INTELLIGENCE */}

            <section className="ride-info-card">
              <div className="ride-info-card-heading">
                <span>02</span>

                <h2>
                  JOURNEY INTELLIGENCE
                </h2>
              </div>

              <div className="journey-intelligence-grid">
                <div
                  className={selectedPoiCategory === "fuel" ? "active-poi-card" : ""}
                  onClick={() =>
                    setSelectedPoiCategory(
                      selectedPoiCategory === "fuel" ? null : "fuel"
                    )
                  }
                  title="Click to view verified fuel stations from DB & Google Maps"
                >
                  <strong>
                    {ride.journeyIntelligence?.fuelStops ?? 0}
                  </strong>
                  <span>FUEL STOPS</span>
                </div>

                <div
                  className={selectedPoiCategory === "rest_stop" ? "active-poi-card" : ""}
                  onClick={() =>
                    setSelectedPoiCategory(
                      selectedPoiCategory === "rest_stop" ? null : "rest_stop"
                    )
                  }
                  title="Click to view rest cafes and highway stops"
                >
                  <strong>
                    {ride.journeyIntelligence?.restStops ?? 0}
                  </strong>
                  <span>REST STOPS</span>
                </div>

                <div
                  className={selectedPoiCategory === "repair_shop" ? "active-poi-card" : ""}
                  onClick={() =>
                    setSelectedPoiCategory(
                      selectedPoiCategory === "repair_shop" ? null : "repair_shop"
                    )
                  }
                  title="Click to view mechanic and repair workshops"
                >
                  <strong>
                    {ride.journeyIntelligence?.serviceStops ?? 0}
                  </strong>
                  <span>SERVICE STOPS</span>
                </div>

                <div
                  className={selectedPoiCategory === "hotel" ? "active-poi-card" : ""}
                  onClick={() =>
                    setSelectedPoiCategory(
                      selectedPoiCategory === "hotel" ? null : "hotel"
                    )
                  }
                  title="Click to view hotels and accommodations"
                >
                  <strong>
                    {ride.journeyIntelligence?.accommodationStops ?? 0}
                  </strong>
                  <span>ACCOMMODATION</span>
                </div>

                <div
                  className={selectedPoiCategory === "scenic_spot" ? "active-poi-card" : ""}
                  onClick={() =>
                    setSelectedPoiCategory(
                      selectedPoiCategory === "scenic_spot" ? null : "scenic_spot"
                    )
                  }
                  title="Click to view scenic stops and viewpoints"
                >
                  <strong>
                    {ride.journeyIntelligence?.scenicStops ?? 0}
                  </strong>
                  <span>SCENIC STOPS</span>
                </div>
              </div>

              {selectedPoiCategory && (
                <div className="journey-intelligence-poi-panel">
                  <div className="journey-intelligence-poi-header">
                    <div>
                      <h3>
                        {selectedPoiCategory === "fuel" && "⚡ VERIFIED FUEL STOPS"}
                        {selectedPoiCategory === "rest_stop" && "☕ REST STOPS & HIGHWAY CAFES"}
                        {selectedPoiCategory === "repair_shop" && "⚙ SERVICE & REPAIR WORKSHOPS"}
                        {selectedPoiCategory === "hotel" && "⌂ ACCOMMODATIONS & STAYS"}
                        {selectedPoiCategory === "scenic_spot" && "◎ SCENIC SPOTS & ATTRACTIONS"}
                      </h3>
                      <span className="poi-source-badge">
                        Corridor data stored in Database & synced with Google Places
                      </span>
                    </div>
                    <button
                      type="button"
                      className="journey-intelligence-poi-close"
                      onClick={() => setSelectedPoiCategory(null)}
                      aria-label="Close POI panel"
                    >
                      ✕
                    </button>
                  </div>

                  {(() => {
                    const activePlaces = (ride.journeyIntelligence?.places || []).filter(
                      (p) => p.category === selectedPoiCategory
                    );

                    if (activePlaces.length === 0) {
                      return (
                        <div style={{ color: "#7e807a", fontSize: "11px", padding: "8px 0" }}>
                          Stops along this highway corridor are synchronized with the database.
                        </div>
                      );
                    }

                    return (
                      <div className="journey-intelligence-poi-list">
                        {activePlaces.map((poi, idx) => (
                          <div
                            key={poi.googlePlaceId || `${poi.name}-${idx}`}
                            className="journey-intelligence-poi-item"
                          >
                            <div className="journey-poi-top">
                              <span className="journey-poi-name">{poi.name}</span>
                              {poi.rating && (
                                <span className="journey-poi-rating">★ {poi.rating}</span>
                              )}
                            </div>
                            {poi.address && (
                              <div className="journey-poi-address">{poi.address}</div>
                            )}
                            <div className="journey-poi-footer">
                              <span className="journey-poi-distance">
                                {poi.distanceMeters
                                  ? `${(poi.distanceMeters / 1000).toFixed(1)} KM`
                                  : "En Route"}
                              </span>
                              <span className="journey-poi-status">
                                {poi.isOpenNow === false ? "CLOSED" : "OPEN NOW"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>

            {/* REQUIREMENTS */}

            <section className="ride-info-card">
              <div className="ride-info-card-heading">
                <span>03</span>

                <h2>
                  RIDE REQUIREMENTS
                </h2>
              </div>

              <ul className="ride-requirements-list">
                {(ride.requirements || []).map(
                  (requirement) => (
                    <li key={requirement}>
                      <span>✓</span>

                      {requirement}
                    </li>
                  )
                )}
              </ul>
            </section>

            {/* VEHICLE */}

            <section className="ride-info-card">
              <div className="ride-info-card-heading">
                <span>04</span>

                <h2>
                  VEHICLE INFORMATION
                </h2>
              </div>

              <div className="vehicle-details">
                <div>
                  <span>MOTORCYCLE</span>

                  <strong>
                    {ride.vehicle?.name ||
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>FUEL TYPE</span>

                  <strong>
                    {ride.vehicle?.fuelType ||
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>
                    EXPECTED MILEAGE
                  </span>

                  <strong>
                    {ride.vehicle?.mileage ||
                      "--"}{" "}
                    KM/L
                  </strong>
                </div>
              </div>
            </section>

            {/* SAFETY */}

            <section className="ride-info-card safety-card">
              <div className="ride-info-card-heading">
                <span>05</span>

                <h2>
                  SAFETY INFORMATION
                </h2>
              </div>

              <p>{ride.safety}</p>
            </section>

            {/* PARTICIPANTS */}

            <section className="ride-info-card">
              <div className="ride-info-card-heading">
                <span>06</span>

                <h2>RIDERS</h2>

                <strong className="rider-count-label">
                  {participantCount} /{" "}
                  {ride.maxRiders}
                </strong>
              </div>

              <div className="riders-capacity">
                <div className="capacity-bar">
                  <div
                    className="capacity-fill"
                    style={{
                      width: `${capacityPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div className="riders-list">
                {participants.map(
                  (participant) => (
                    <div
                      key={participant.id}
                      className="rider-item"
                    >
                      <div className="rider-avatar">
                        {participant.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {participant.name}
                        </strong>

                        <span>
                          {participant.role}
                        </span>
                      </div>

                      {participant.confirmed && (
                        <span className="rider-confirmed">
                          ✓
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            </section>

            {/* JOIN REQUESTS */}

            {joinRequests.length > 0 && (
              <section className="ride-info-card">
                <div className="ride-info-card-heading">
                  <span>07</span>

                  <h2>
                    JOIN REQUESTS
                  </h2>
                </div>

                <div className="join-requests-list">
                  {joinRequests.map(
                    (request) => (
                      <div
                        key={request.id}
                        className="join-request-item"
                      >
                        <div>
                          <strong>
                            {request.name}
                          </strong>

                          <span>
                            {request.status}
                          </span>
                        </div>

                        {request.status ===
                          "PENDING" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleConfirmRequest(
                                request.id
                              )
                            }
                          >
                            APPROVE
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* TRIBE VOICE & VIDEO CALL */}
            <RideCall ride={ride} currentStatus={status} />

            {/* RIDE GROUP CHAT - UNIFIED LIVE RIDE CHAT */}
            <div id="ride-group-chat" className="ride-unified-group-chat">
              <LiveRideChat ride={ride} />
            </div>
          </div>

          {/* SIDEBAR */}

          <aside className="ride-details-sidebar">

            {/* OVERVIEW */}

            <div className="ride-sidebar-card">
              <span className="sidebar-label">
                RIDE OVERVIEW
              </span>

              <div className="sidebar-stats">
                <div>
                  <span>DISTANCE</span>

                  <strong>
                    {ride.distanceLabel}
                  </strong>
                </div>

                <div>
                  <span>DURATION</span>

                  <strong>
                    {ride.duration}
                  </strong>
                </div>

                <div>
                  <span>EST. BUDGET</span>

                  <strong>
                    ₹
                    {Number(
                      ride.budget || 0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {/* JOIN ACTION */}

            <div className="ride-sidebar-card ride-action-card">
              <span className="sidebar-label">
                YOUR RIDE STATUS
              </span>

              {joinStatus === "JOINED" && (
                <div className="current-ride-status joined">
                  <strong>
                    ✓ YOU ARE JOINED
                  </strong>

                  <p>
                    You are confirmed as a rider
                    for this journey.
                  </p>
                </div>
              )}

              {joinStatus === "REQUESTED" && (
                <div className="current-ride-status requested">
                  <strong>
                    ◷ REQUEST PENDING
                  </strong>

                  <p>
                    Your request has been submitted
                    and is waiting for approval.
                  </p>
                </div>
              )}

              {joinStatus === "NOT_JOINED" && (
                <div className="current-ride-status">
                  <strong>
                    NOT JOINED
                  </strong>

                  <p>
                    Join this journey to become part
                    of the riding group.
                  </p>
                </div>
              )}

              {joinStatus === "JOINED" ? (
                <>
                  <button
                    type="button"
                    className="ride-primary-action"
                    onClick={handleOpenLiveRide}
                  >
                    RIDE DASHBOARD
                  </button>

                  <button
                    type="button"
                    className="ride-secondary-action"
                    onClick={handleOpenExpenses}
                  >
                    MANAGE EXPENSES
                  </button>

                  <button
                    type="button"
                    className="ride-danger-action"
                    onClick={handleLeaveRide}
                  >
                    LEAVE RIDE
                  </button>

                  {ride?.isOrganizer && (!ride?.rawStatus || ride?.rawStatus === "planning") && (
                    <button
                      type="button"
                      className="ride-danger-action"
                      style={{ marginTop: "10px", borderColor: "#ef4444", color: "#ef4444" }}
                      onClick={handleDeleteRide}
                    >
                      DELETE PLANNED RIDE ✕
                    </button>
                  )}
                </>
              ) : joinStatus === "REQUESTED" ? (
                <button
                  type="button"
                  className="ride-primary-action disabled"
                  disabled
                >
                  REQUEST PENDING
                </button>
              ) : ride.requestRequired ? (
                <button
                  type="button"
                  className="ride-primary-action"
                  onClick={handleRequestJoin}
                >
                  REQUEST TO JOIN
                </button>
              ) : (
                <button
                  type="button"
                  className="ride-primary-action"
                  onClick={handleJoinRide}
                >
                  JOIN RIDE
                </button>
              )}
            </div>

            {/* LIVE RIDE */}

            {rideStatus === "LIVE" && (
              <div className="ride-sidebar-card live-ride-card">
                <span className="sidebar-label">
                  LIVE JOURNEY
                </span>

                <h3>
                  THIS RIDE IS LIVE
                </h3>

                <p>
                  Follow the live journey and stay
                  connected with your riding group.
                </p>

                <div className="live-ride-action-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={handleOpenLiveRide}
                  >
                    ENTER LIVE RIDE
                  </button>

                  <button
                    type="button"
                    className="live-call-nav-btn"
                    style={{
                      background: "#00E5FF",
                      color: "#0a0a0f",
                      fontWeight: "700",
                      padding: "10px 14px",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                    onClick={handleOpenLiveRide}
                  >
                    JOIN LIVE CALL ☎
                  </button>
                </div>
              </div>
            )}

            {/* CHAT QUICK ACTION */}

            <div className="ride-sidebar-card ride-chat-sidebar-card">
              <span className="sidebar-label">
                GROUP COMMUNICATION
              </span>

              <div className="ride-chat-sidebar-icon">
                CHAT
              </div>

              <h3>
                STAY CONNECTED
              </h3>

              <p>
                Use the group chat above to share
                updates, arrival information and ride
                coordination messages.
              </p>

              <button
                type="button"
                onClick={() => {
                  const chatEl = document.getElementById("ride-group-chat");
                  if (chatEl) {
                    chatEl.scrollIntoView({ behavior: "smooth", block: "start" });
                  } else {
                    navigate(`/businesses/mototribe/ride/${rideId}/live`);
                  }
                }}
              >
                OPEN GROUP CHAT 💬 ↓
              </button>
            </div>

            {/* SOURCE */}

            <div className="ride-sidebar-source">
              <span>DATA SOURCE</span>

              <strong>
                {ride.source}
              </strong>
            </div>
          </aside>
        </div>

        {/* FOOTER */}

        <footer className="ride-details-footer">
          <div>
            <span>MOTOTRIBE</span>

            <strong>
              RIDE BEYOND THE ORDINARY.
            </strong>
          </div>

          <button
            type="button"
            onClick={handleBack}
          >
            BACK TO UPCOMING RIDES ↑
          </button>
        </footer>
      </div>
    </section>
  );
}

export default RideDetails;