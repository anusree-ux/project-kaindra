import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getMotoRideById,
  getMotoRideStatus,
  getMotoRideCountdown,
} from "../../../../data/motoRides";

import "./RideDetails.css";

function RideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [now, setNow] = useState(() => new Date());

  const [joinStatus, setJoinStatus] =
    useState("NOT_JOINED");

  const [participants, setParticipants] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);

  // --------------------------------------------------
  // UPDATE CLOCK
  // --------------------------------------------------

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // --------------------------------------------------
  // LOAD RIDE
  // --------------------------------------------------

  useEffect(() => {
    const selectedRide = getMotoRideById(rideId);

    if (!selectedRide) {
      setNotFound(true);
      setRide(null);
      return;
    }

    setRide(selectedRide);
    setNotFound(false);

    // ----------------------------------------------
    // LOAD PARTICIPANTS
    // ----------------------------------------------

    const savedParticipants = localStorage.getItem(
      `mototribeParticipants_${rideId}`
    );

    if (savedParticipants) {
      try {
        setParticipants(
          JSON.parse(savedParticipants)
        );
      } catch {
        setParticipants(
          selectedRide.participants || []
        );
      }
    } else {
      setParticipants(
        selectedRide.participants || []
      );
    }

    // ----------------------------------------------
    // LOAD REQUESTS
    // ----------------------------------------------

    const savedRequests = localStorage.getItem(
      `mototribeRequests_${rideId}`
    );

    if (savedRequests) {
      try {
        setJoinRequests(
          JSON.parse(savedRequests)
        );
      } catch {
        setJoinRequests([]);
      }
    } else {
      setJoinRequests([]);
    }

    // ----------------------------------------------
    // LOAD GLOBAL JOIN / REQUEST STATE
    // ----------------------------------------------

    const savedJoinedRides = localStorage.getItem(
      "mototribeJoinedRides"
    );

    const savedRequestedRides = localStorage.getItem(
      "mototribeRequestedRides"
    );

    let joinedIds = [];
    let requestedIds = [];

    try {
      joinedIds = savedJoinedRides
        ? JSON.parse(savedJoinedRides)
        : [];
    } catch {
      joinedIds = [];
    }

    try {
      requestedIds = savedRequestedRides
        ? JSON.parse(savedRequestedRides)
        : [];
    } catch {
      requestedIds = [];
    }

    if (joinedIds.includes(rideId)) {
      setJoinStatus("JOINED");
    } else if (requestedIds.includes(rideId)) {
      setJoinStatus("REQUESTED");
    } else {
      setJoinStatus("NOT_JOINED");
    }
  }, [rideId]);

  // --------------------------------------------------
  // SAVE PARTICIPANTS
  // --------------------------------------------------

  const saveParticipants = (updatedParticipants) => {
    setParticipants(updatedParticipants);

    localStorage.setItem(
      `mototribeParticipants_${rideId}`,
      JSON.stringify(updatedParticipants)
    );
  };

  // --------------------------------------------------
  // SAVE REQUESTS
  // --------------------------------------------------

  const saveRequests = (updatedRequests) => {
    setJoinRequests(updatedRequests);

    localStorage.setItem(
      `mototribeRequests_${rideId}`,
      JSON.stringify(updatedRequests)
    );
  };

  // --------------------------------------------------
  // JOIN RIDE
  // --------------------------------------------------

  const handleJoinRide = () => {
    if (!ride) return;

    if (joinStatus === "JOINED") {
      return;
    }

    const existingParticipant = participants.some(
      (participant) =>
        participant.id === "current-user"
    );

    let updatedParticipants = participants;

    if (!existingParticipant) {
      const currentUser = {
        id: "current-user",
        name: "You",
        role: "RIDER",
        confirmed: true,
      };

      updatedParticipants = [
        ...participants,
        currentUser,
      ];

      saveParticipants(updatedParticipants);
    }

    // ----------------------------------------------
    // GLOBAL JOIN STATE
    // ----------------------------------------------

    let joinedIds = [];

    try {
      joinedIds = JSON.parse(
        localStorage.getItem(
          "mototribeJoinedRides"
        ) || "[]"
      );
    } catch {
      joinedIds = [];
    }

    if (!joinedIds.includes(rideId)) {
      joinedIds.push(rideId);
    }

    localStorage.setItem(
      "mototribeJoinedRides",
      JSON.stringify(joinedIds)
    );

    // ----------------------------------------------
    // REMOVE REQUEST STATE
    // ----------------------------------------------

    let requestedIds = [];

    try {
      requestedIds = JSON.parse(
        localStorage.getItem(
          "mototribeRequestedRides"
        ) || "[]"
      );
    } catch {
      requestedIds = [];
    }

    requestedIds = requestedIds.filter(
      (id) => id !== rideId
    );

    localStorage.setItem(
      "mototribeRequestedRides",
      JSON.stringify(requestedIds)
    );

    setJoinStatus("JOINED");
  };

  // --------------------------------------------------
  // REQUEST TO JOIN
  // --------------------------------------------------

  const handleRequestJoin = () => {
    if (!ride) return;

    if (
      joinStatus === "JOINED" ||
      joinStatus === "REQUESTED"
    ) {
      return;
    }

    const existingRequest = joinRequests.some(
      (request) =>
        request.id === "current-user-request"
    );

    let updatedRequests = joinRequests;

    if (!existingRequest) {
      const currentRequest = {
        id: "current-user-request",
        name: "You",
        status: "PENDING",
      };

      updatedRequests = [
        ...joinRequests,
        currentRequest,
      ];

      saveRequests(updatedRequests);
    }

    // ----------------------------------------------
    // GLOBAL REQUEST STATE
    // ----------------------------------------------

    let requestedIds = [];

    try {
      requestedIds = JSON.parse(
        localStorage.getItem(
          "mototribeRequestedRides"
        ) || "[]"
      );
    } catch {
      requestedIds = [];
    }

    if (!requestedIds.includes(rideId)) {
      requestedIds.push(rideId);
    }

    localStorage.setItem(
      "mototribeRequestedRides",
      JSON.stringify(requestedIds)
    );

    setJoinStatus("REQUESTED");
  };

  // --------------------------------------------------
  // LEAVE RIDE
  // --------------------------------------------------

  const handleLeaveRide = () => {
    if (!ride) return;

    const updatedParticipants =
      participants.filter(
        (participant) =>
          participant.id !== "current-user"
      );

    saveParticipants(updatedParticipants);

    // ----------------------------------------------
    // REMOVE FROM GLOBAL JOINED RIDES
    // ----------------------------------------------

    let joinedIds = [];

    try {
      joinedIds = JSON.parse(
        localStorage.getItem(
          "mototribeJoinedRides"
        ) || "[]"
      );
    } catch {
      joinedIds = [];
    }

    joinedIds = joinedIds.filter(
      (id) => id !== rideId
    );

    localStorage.setItem(
      "mototribeJoinedRides",
      JSON.stringify(joinedIds)
    );

    setJoinStatus("NOT_JOINED");
  };

  // --------------------------------------------------
  // CONFIRM REQUEST
  // --------------------------------------------------

  const handleConfirmRequest = (requestId) => {
    const request = joinRequests.find(
      (item) => item.id === requestId
    );

    if (!request) return;

    const updatedRequests =
      joinRequests.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: "APPROVED",
            }
          : item
      );

    saveRequests(updatedRequests);
  };

  // --------------------------------------------------
  // BACK
  // --------------------------------------------------

  const handleBack = () => {
    navigate("/businesses/mototribe");
  };

  // --------------------------------------------------
  // OPEN EXPENSES
  // --------------------------------------------------

  const handleOpenExpenses = () => {
    navigate(
      `/businesses/mototribe/ride/${rideId}/expenses`
    );
  };

  // --------------------------------------------------
  // NOT FOUND
  // --------------------------------------------------

  if (notFound) {
    return (
      <section className="ride-details-page">

        <div className="ride-details-not-found">

          <span>404 / RIDE NOT FOUND</span>

          <h1>
            THIS RIDE DOES NOT EXIST
          </h1>

          <p>
            The requested MotoTribe ride could not
            be found.
          </p>

          <button
            type="button"
            onClick={handleBack}
          >
            BACK TO MOTOTRIBE
          </button>

        </div>

      </section>
    );
  }

  if (!ride) {
    return (
      <section className="ride-details-page">

        <div className="ride-details-loading">
          LOADING RIDE...
        </div>

      </section>
    );
  }

  // --------------------------------------------------
  // RIDE STATUS
  // --------------------------------------------------

  const rideStatus = getMotoRideStatus(
    ride,
    now
  );

  const countdown = getMotoRideCountdown(
    ride,
    now
  );

  // --------------------------------------------------
  // PARTICIPANT COUNT
  // --------------------------------------------------

  const participantCount =
    participants.length;

  const capacityPercentage =
    ride.maxRiders > 0
      ? Math.min(
          (participantCount /
            ride.maxRiders) *
            100,
          100
        )
      : 0;

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formattedDate = new Date(
    `${ride.date}T00:00:00`
  ).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="ride-details-page">

      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}

      <div className="ride-details-container">

        <button
          type="button"
          className="ride-details-back"
          onClick={handleBack}
        >
          ← BACK TO RIDES
        </button>

        {/* ======================================== */}
        {/* HERO */}
        {/* ======================================== */}

        <header className="ride-details-hero">

          <div className="ride-details-hero-content">

            <div className="ride-details-tags">

              <span>
                {ride.type}
              </span>

              <span>
                {ride.difficulty}
              </span>

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

              <span>
                ORGANIZED BY
              </span>

              <strong>
                {ride.organizer}
              </strong>

              <small>
                {ride.organizerType}
              </small>

            </div>

          </div>

        </header>

        {/* ======================================== */}
        {/* COUNTDOWN */}
        {/* ======================================== */}

        <div className="ride-details-countdown-section">

          <div>

            <span>
              DEPARTURE
            </span>

            <strong>
              {formattedDate}
            </strong>

            <small>
              {ride.time}
            </small>

          </div>

          <div className="ride-details-countdown">

            {rideStatus === "LIVE" ? (
              <div className="ride-live-indicator">
                ● LIVE NOW
              </div>
            ) : rideStatus ===
              "COMPLETED" ? (
              <div className="ride-completed-indicator">
                RIDE COMPLETED
              </div>
            ) : countdown.expired ? (
              <div>
                STARTING
              </div>
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

        {/* ======================================== */}
        {/* RIDE INFORMATION */}
        {/* ======================================== */}

        <div className="ride-details-grid">

          <div className="ride-details-main">

            {/* ------------------------------------ */}
            {/* ROUTE */}
            {/* ------------------------------------ */}

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
                    <small>
                      START
                    </small>

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
                    <small>
                      DESTINATION
                    </small>

                    <strong>
                      {ride.destination}
                    </strong>
                  </div>

                </div>

              </div>

              <div className="ride-route-full">

                <span>
                  FULL ROUTE
                </span>

                <p>
                  {ride.route}
                </p>

              </div>

              <div className="ride-route-stops">

                <span>
                  PLANNED STOPS
                </span>

                <div>

                  {ride.stops.map(
                    (stop, index) => (
                      <span key={stop}>
                        <b>
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </b>
                        {stop}
                      </span>
                    )
                  )}

                </div>

              </div>

            </section>

            {/* ------------------------------------ */}
            {/* JOURNEY INTELLIGENCE */}
            {/* ------------------------------------ */}

            <section className="ride-info-card">

              <div className="ride-info-card-heading">
                <span>02</span>
                <h2>
                  JOURNEY INTELLIGENCE
                </h2>
              </div>

              <div className="journey-intelligence-grid">

                <div>
                  <strong>
                    {
                      ride
                        .journeyIntelligence
                        .fuelStops
                    }
                  </strong>

                  <span>
                    FUEL STOPS
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      ride
                        .journeyIntelligence
                        .restStops
                    }
                  </strong>

                  <span>
                    REST STOPS
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      ride
                        .journeyIntelligence
                        .serviceStops
                    }
                  </strong>

                  <span>
                    SERVICE STOPS
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      ride
                        .journeyIntelligence
                        .accommodationStops
                    }
                  </strong>

                  <span>
                    ACCOMMODATION
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      ride
                        .journeyIntelligence
                        .scenicStops
                    }
                  </strong>

                  <span>
                    SCENIC STOPS
                  </span>
                </div>

              </div>

            </section>

            {/* ------------------------------------ */}
            {/* REQUIREMENTS */}
            {/* ------------------------------------ */}

            <section className="ride-info-card">

              <div className="ride-info-card-heading">
                <span>03</span>
                <h2>
                  RIDE REQUIREMENTS
                </h2>
              </div>

              <ul className="ride-requirements-list">

                {ride.requirements.map(
                  (requirement) => (
                    <li key={requirement}>
                      <span>✓</span>
                      {requirement}
                    </li>
                  )
                )}

              </ul>

            </section>

            {/* ------------------------------------ */}
            {/* VEHICLE */}
            {/* ------------------------------------ */}

            <section className="ride-info-card">

              <div className="ride-info-card-heading">
                <span>04</span>
                <h2>
                  VEHICLE INFORMATION
                </h2>
              </div>

              <div className="vehicle-details">

                <div>
                  <span>
                    MOTORCYCLE
                  </span>

                  <strong>
                    {ride.vehicle.name}
                  </strong>
                </div>

                <div>
                  <span>
                    FUEL TYPE
                  </span>

                  <strong>
                    {ride.vehicle.fuelType}
                  </strong>
                </div>

                <div>
                  <span>
                    EXPECTED MILEAGE
                  </span>

                  <strong>
                    {ride.vehicle.mileage} KM/L
                  </strong>
                </div>

              </div>

            </section>

            {/* ------------------------------------ */}
            {/* SAFETY */}
            {/* ------------------------------------ */}

            <section className="ride-info-card safety-card">

              <div className="ride-info-card-heading">
                <span>05</span>
                <h2>
                  SAFETY INFORMATION
                </h2>
              </div>

              <p>
                {ride.safety}
              </p>

            </section>

            {/* ------------------------------------ */}
            {/* PARTICIPANTS */}
            {/* ------------------------------------ */}

            <section className="ride-info-card">

              <div className="ride-info-card-heading">

                <span>06</span>

                <h2>
                  RIDERS
                </h2>

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

            {/* ------------------------------------ */}
            {/* JOIN REQUESTS */}
            {/* ------------------------------------ */}

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

          </div>

          {/* ======================================== */}
          {/* SIDEBAR */}
          {/* ======================================== */}

          <aside className="ride-details-sidebar">

            {/* ------------------------------------ */}
            {/* QUICK STATS */}
            {/* ------------------------------------ */}

            <div className="ride-sidebar-card">

              <span className="sidebar-label">
                RIDE OVERVIEW
              </span>

              <div className="sidebar-stats">

                <div>
                  <span>
                    DISTANCE
                  </span>

                  <strong>
                    {ride.distanceLabel}
                  </strong>
                </div>

                <div>
                  <span>
                    DURATION
                  </span>

                  <strong>
                    {ride.duration}
                  </strong>
                </div>

                <div>
                  <span>
                    EST. BUDGET
                  </span>

                  <strong>
                    ₹
                    {ride.budget.toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>

              </div>

            </div>

            {/* ------------------------------------ */}
            {/* JOIN ACTION */}
            {/* ------------------------------------ */}

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

              {/* -------------------------------- */}
              {/* ACTION BUTTONS */}
              {/* -------------------------------- */}

              {joinStatus === "JOINED" ? (
                <>
                  <button
                    type="button"
                    className="ride-primary-action"
                    onClick={() =>
                      navigate(
                        `/businesses/mototribe/ride/${rideId}`
                      )
                    }
                  >
                    RIDE DASHBOARD
                  </button>

                  <button
                    type="button"
                    className="ride-secondary-action"
                    onClick={
                      handleOpenExpenses
                    }
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
                </>
              ) : joinStatus ===
                "REQUESTED" ? (
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
                  onClick={
                    handleRequestJoin
                  }
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

            {/* ------------------------------------ */}
            {/* LIVE RIDE */}
            {/* ------------------------------------ */}

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

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/businesses/mototribe/ride/${rideId}`
                    )
                  }
                >
                  ENTER LIVE RIDE
                </button>

              </div>
            )}

            {/* ------------------------------------ */}
            {/* SOURCE */}
            {/* ------------------------------------ */}

            <div className="ride-sidebar-source">

              <span>
                DATA SOURCE
              </span>

              <strong>
                {ride.source}
              </strong>

            </div>

          </aside>

        </div>

        {/* ======================================== */}
        {/* FOOTER */}
        {/* ======================================== */}

        <footer className="ride-details-footer">

          <div>
            <span>
              MOTOTRIBE
            </span>

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