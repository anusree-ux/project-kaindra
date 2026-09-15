import { useEffect, useMemo, useState } from "react";
import "./UpcomingRides.css";

const initialRides = [
  {
    id: 1,
    name: "Manali Mountain Escape",
    start: "Delhi",
    destination: "Manali",
    date: "2026-09-14",
    time: "05:30",
    type: "ADVENTURE",
    difficulty: "ADVANCED",
    organizer: "MotoTribe North",
    organizerType: "OFFICIAL",
    riders: 18,
    maxRiders: 25,
    requestRequired: false,
    distance: "540 KM",
    duration: "2 Days",
    route: "Delhi → Chandigarh → Mandi → Manali",
    description:
      "A high-altitude motorcycle journey through mountain roads, valleys and scenic Himalayan routes.",
    requirements: [
      "Experienced highway riding",
      "Motorcycle in good condition",
      "Valid riding documents",
      "Safety equipment recommended",
    ],
    safety:
      "Weather and mountain-road conditions should be checked before departure.",
    status: "UPCOMING",
  },
  {
    id: 2,
    name: "Coorg Morning Escape",
    start: "Bengaluru",
    destination: "Coorg",
    date: "2026-09-20",
    time: "06:00",
    type: "TOURING",
    difficulty: "INTERMEDIATE",
    organizer: "Bengaluru Riders",
    organizerType: "COMMUNITY",
    riders: 26,
    maxRiders: 35,
    requestRequired: true,
    distance: "270 KM",
    duration: "1 Day",
    route: "Bengaluru → Ramanagara → Mysuru → Coorg",
    description:
      "A relaxed community ride covering scenic highways and the green roads toward Coorg.",
    requirements: [
      "Intermediate riding experience",
      "Helmet and riding gear",
      "Full tank before departure",
    ],
    safety:
      "Ride as a group and maintain safe distance on highway sections.",
    status: "UPCOMING",
  },
  {
    id: 3,
    name: "Goa Coastal Run",
    start: "Pune",
    destination: "Goa",
    date: "2026-10-02",
    time: "04:30",
    type: "TOURING",
    difficulty: "INTERMEDIATE",
    organizer: "Western Moto Tribe",
    organizerType: "COMMUNITY",
    riders: 31,
    maxRiders: 40,
    requestRequired: false,
    distance: "590 KM",
    duration: "2 Days",
    route: "Pune → Kolhapur → Amboli → Goa",
    description:
      "A coastal touring experience combining highway riding, forest roads and Goa's coastal routes.",
    requirements: [
      "Long-distance riding capability",
      "Motorcycle service before departure",
      "Emergency contact information",
    ],
    safety:
      "Carry rain protection and maintain caution on forest and wet-road sections.",
    status: "UPCOMING",
  },
  {
    id: 4,
    name: "Himalayan Explorer",
    start: "Chandigarh",
    destination: "Spiti Valley",
    date: "2026-10-10",
    time: "05:00",
    type: "ADVENTURE",
    difficulty: "EXPERT",
    organizer: "MotoTribe Expeditions",
    organizerType: "OFFICIAL",
    riders: 12,
    maxRiders: 18,
    requestRequired: true,
    distance: "760 KM",
    duration: "4 Days",
    route: "Chandigarh → Shimla → Kaza → Spiti",
    description:
      "An expedition-style mountain ride designed for experienced adventure riders.",
    requirements: [
      "Advanced mountain riding experience",
      "Adventure-ready motorcycle",
      "Emergency equipment",
      "Pre-ride motorcycle inspection",
    ],
    safety:
      "High-altitude terrain requires preparation, appropriate equipment and route awareness.",
    status: "UPCOMING",
  },
  {
    id: 5,
    name: "Night Cruiser Run",
    start: "Hyderabad",
    destination: "Vijayawada",
    date: "2026-09-18",
    time: "22:00",
    type: "CRUISER",
    difficulty: "INTERMEDIATE",
    organizer: "Deccan Night Riders",
    organizerType: "COMMUNITY",
    riders: 14,
    maxRiders: 20,
    requestRequired: false,
    distance: "275 KM",
    duration: "1 Night",
    route: "Hyderabad → Suryapet → Vijayawada",
    description:
      "A controlled night ride for riders who enjoy long highway cruising.",
    requirements: [
      "Night riding experience",
      "Reflective riding gear",
      "Motorcycle lights checked",
    ],
    safety:
      "Maintain visibility and avoid fatigue during the night journey.",
    status: "UPCOMING",
  },
];

const filters = [
  "ALL",
  "ADVENTURE",
  "TOURING",
  "CRUISER",
  "COMMUNITY",
  "OFFICIAL",
];

function UpcomingRides() {
  const [rides, setRides] = useState(initialRides);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedRide, setSelectedRide] = useState(initialRides[0]);
  const [joinedRides, setJoinedRides] = useState([]);
  const [requestedRides, setRequestedRides] = useState([]);
  const [now, setNow] = useState(new Date());

  /*
   * Demo clock.
   * In the production application this will come from the backend/event service.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filteredRides = useMemo(() => {
    if (activeFilter === "ALL") {
      return rides;
    }

    if (activeFilter === "COMMUNITY") {
      return rides.filter((ride) => ride.organizerType === "COMMUNITY");
    }

    if (activeFilter === "OFFICIAL") {
      return rides.filter((ride) => ride.organizerType === "OFFICIAL");
    }

    return rides.filter((ride) => ride.type === activeFilter);
  }, [activeFilter, rides]);

  const getRideDate = (ride) => {
    return new Date(`${ride.date}T${ride.time}:00`);
  };

  const getCountdown = (ride) => {
    const target = getRideDate(ride);
    const difference = target.getTime() - now.getTime();

    if (difference <= 0) {
      return {
        expired: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const totalSeconds = Math.floor(difference / 1000);

    return {
      expired: false,
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  };

  const getCurrentStatus = (ride) => {
    const target = getRideDate(ride);
    const difference = target.getTime() - now.getTime();

    if (difference <= 0) {
      return "LIVE";
    }

    if (difference <= 60 * 60 * 1000) {
      return "STARTING";
    }

    return ride.status;
  };

  const handleJoin = (ride) => {
    const alreadyJoined = joinedRides.includes(ride.id);

    if (alreadyJoined) {
      setJoinedRides((current) =>
        current.filter((rideId) => rideId !== ride.id)
      );

      setRides((current) =>
        current.map((item) =>
          item.id === ride.id
            ? {
                ...item,
                riders: Math.max(0, item.riders - 1),
              }
            : item
        )
      );

      setSelectedRide((current) =>
        current && current.id === ride.id
          ? {
              ...current,
              riders: Math.max(0, current.riders - 1),
            }
          : current
      );

      return;
    }

    if (ride.riders >= ride.maxRiders) {
      return;
    }

    setJoinedRides((current) => [...current, ride.id]);

    setRides((current) =>
      current.map((item) =>
        item.id === ride.id
          ? {
              ...item,
              riders: item.riders + 1,
            }
          : item
      )
    );

    setSelectedRide((current) =>
      current && current.id === ride.id
        ? {
            ...current,
            riders: current.riders + 1,
          }
        : current
    );
  };

  const handleRequest = (ride) => {
    if (requestedRides.includes(ride.id)) {
      setRequestedRides((current) =>
        current.filter((rideId) => rideId !== ride.id)
      );
      return;
    }

    setRequestedRides((current) => [...current, ride.id]);
  };

  const isJoined = (rideId) => joinedRides.includes(rideId);

  const isRequested = (rideId) => requestedRides.includes(rideId);

  const getButtonLabel = (ride) => {
    if (isJoined(ride.id)) {
      return "LEAVE RIDE";
    }

    if (ride.requestRequired) {
      return isRequested(ride.id) ? "REQUEST SENT" : "REQUEST TO JOIN";
    }

    return "JOIN RIDE";
  };

  const handlePrimaryAction = (ride) => {
    if (ride.requestRequired) {
      handleRequest(ride);
    } else {
      handleJoin(ride);
    }
  };

  const formatDate = (date) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const selectedCountdown = selectedRide
    ? getCountdown(selectedRide)
    : null;

  const selectedStatus = selectedRide
    ? getCurrentStatus(selectedRide)
    : "UPCOMING";

  return (
    <section className="upcoming-rides-section" id="upcoming-rides">
      <div className="upcoming-rides-shell">
        <div className="upcoming-rides-heading">
          <div>
            <span className="section-eyebrow">MOTOTRIBE / RIDE NETWORK</span>

            <h2>
              UPCOMING
              <span> RIDES</span>
            </h2>

            <p>
              Discover organized journeys, community rides and official
              MotoTribe events. Join the ride that matches your route,
              experience and riding style.
            </p>
          </div>

          <div className="ride-network-status">
            <span className="network-dot"></span>
            <span>RIDE NETWORK ACTIVE</span>
          </div>
        </div>

        <div className="ride-filter-bar">
          {filters.map((filter) => (
            <button
              key={filter}
              className={activeFilter === filter ? "active" : ""}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="upcoming-rides-layout">
          <div className="ride-list">
            <div className="ride-list-header">
              <span>
                {filteredRides.length.toString().padStart(2, "0")} RIDES
              </span>

              <span>SELECT A RIDE TO EXPLORE</span>
            </div>

            {filteredRides.map((ride) => {
              const countdown = getCountdown(ride);
              const status = getCurrentStatus(ride);
              const capacity = Math.round(
                (ride.riders / ride.maxRiders) * 100
              );

              return (
                <article
                  key={ride.id}
                  className={`ride-card ${
                    selectedRide?.id === ride.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedRide(ride)}
                >
                  <div className="ride-card-top">
                    <div className="ride-type">
                      {ride.type}
                    </div>

                    <div
                      className={`ride-status status-${status.toLowerCase()}`}
                    >
                      <span></span>
                      {status}
                    </div>
                  </div>

                  <div className="ride-card-main">
                    <h3>{ride.name}</h3>

                    <div className="ride-route-line">
                      <span>{ride.start}</span>
                      <i></i>
                      <span>{ride.destination}</span>
                    </div>
                  </div>

                  <div className="ride-card-meta">
                    <div>
                      <small>DATE</small>
                      <strong>{formatDate(ride.date)}</strong>
                    </div>

                    <div>
                      <small>START</small>
                      <strong>{ride.time}</strong>
                    </div>

                    <div>
                      <small>DISTANCE</small>
                      <strong>{ride.distance}</strong>
                    </div>

                    <div>
                      <small>RIDERS</small>
                      <strong>
                        {ride.riders}/{ride.maxRiders}
                      </strong>
                    </div>
                  </div>

                  <div className="capacity-wrapper">
                    <div className="capacity-label">
                      <span>RIDE CAPACITY</span>
                      <span>{capacity}%</span>
                    </div>

                    <div className="capacity-track">
                      <div
                        className="capacity-fill"
                        style={{ width: `${capacity}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="ride-card-bottom">
                    <div className="ride-organizer">
                      <span>ORGANIZED BY</span>
                      <strong>{ride.organizer}</strong>
                    </div>

                    <div className="card-countdown">
                      {status === "UPCOMING" && !countdown.expired ? (
                        <>
                          <span>STARTS IN</span>
                          <strong>
                            {countdown.days}D {countdown.hours}H{" "}
                            {countdown.minutes}M
                          </strong>
                        </>
                      ) : (
                        <strong>{status}</strong>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {selectedRide && (
            <aside className="ride-detail-panel">
              <div className="detail-topline">
                <span>RIDE EVENT</span>

                <span
                  className={`detail-status status-${selectedStatus.toLowerCase()}`}
                >
                  <span></span>
                  {selectedStatus}
                </span>
              </div>

              <h3>{selectedRide.name}</h3>

              <p className="detail-description">
                {selectedRide.description}
              </p>

              <div className="detail-route">
                <div className="route-point">
                  <span className="route-marker start"></span>

                  <div>
                    <small>START</small>
                    <strong>{selectedRide.start}</strong>
                  </div>
                </div>

                <div className="route-line"></div>

                <div className="route-point">
                  <span className="route-marker destination"></span>

                  <div>
                    <small>DESTINATION</small>
                    <strong>{selectedRide.destination}</strong>
                  </div>
                </div>
              </div>

              <div className="detail-stats">
                <div>
                  <span>DATE</span>
                  <strong>{formatDate(selectedRide.date)}</strong>
                </div>

                <div>
                  <span>START TIME</span>
                  <strong>{selectedRide.time}</strong>
                </div>

                <div>
                  <span>DISTANCE</span>
                  <strong>{selectedRide.distance}</strong>
                </div>

                <div>
                  <span>DURATION</span>
                  <strong>{selectedRide.duration}</strong>
                </div>
              </div>

              {selectedStatus === "UPCOMING" && selectedCountdown && (
                <div className="detail-countdown">
                  <span>RIDE STARTS IN</span>

                  <div className="countdown-grid">
                    <div>
                      <strong>
                        {String(selectedCountdown.days).padStart(2, "0")}
                      </strong>
                      <small>DAYS</small>
                    </div>

                    <div>
                      <strong>
                        {String(selectedCountdown.hours).padStart(2, "0")}
                      </strong>
                      <small>HOURS</small>
                    </div>

                    <div>
                      <strong>
                        {String(selectedCountdown.minutes).padStart(2, "0")}
                      </strong>
                      <small>MIN</small>
                    </div>

                    <div>
                      <strong>
                        {String(selectedCountdown.seconds).padStart(2, "0")}
                      </strong>
                      <small>SEC</small>
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <span className="detail-label">ROUTE</span>

                <p>{selectedRide.route}</p>
              </div>

              <div className="detail-section">
                <span className="detail-label">RIDE PROFILE</span>

                <div className="profile-tags">
                  <span>{selectedRide.type}</span>
                  <span>{selectedRide.difficulty}</span>
                  <span>{selectedRide.organizerType}</span>
                </div>
              </div>

              <div className="detail-section">
                <span className="detail-label">REQUIREMENTS</span>

                <ul className="requirements-list">
                  {selectedRide.requirements.map((requirement) => (
                    <li key={requirement}>
                      <span>+</span>
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-section safety-note">
                <span className="detail-label">SAFETY NOTE</span>

                <p>{selectedRide.safety}</p>
              </div>

              <div className="detail-participants">
                <div>
                  <span>PARTICIPANTS</span>
                  <strong>
                    {selectedRide.riders} / {selectedRide.maxRiders}
                  </strong>
                </div>

                <div className="participant-dots">
                  {Array.from({
                    length: Math.min(selectedRide.riders, 8),
                  }).map((_, index) => (
                    <span key={index}>
                      {index + 1}
                    </span>
                  ))}

                  {selectedRide.riders > 8 && (
                    <span className="more">
                      +{selectedRide.riders - 8}
                    </span>
                  )}
                </div>
              </div>

              <button
                className={`primary-ride-action ${
                  isJoined(selectedRide.id) ? "joined" : ""
                }`}
                onClick={() => handlePrimaryAction(selectedRide)}
                disabled={
                  selectedRide.riders >= selectedRide.maxRiders &&
                  !isJoined(selectedRide.id) &&
                  !selectedRide.requestRequired
                }
              >
                {getButtonLabel(selectedRide)}
                <span>→</span>
              </button>

              {selectedRide.requestRequired &&
                isRequested(selectedRide.id) && (
                  <div className="request-message">
                    <span>✓</span>
                    Your request has been recorded for this demo ride.
                  </div>
                )}

              {isJoined(selectedRide.id) && (
                <div className="joined-message">
                  <span>✓</span>
                  You are part of this ride. The next stage will be the Live
                  Ride dashboard.
                </div>
              )}
            </aside>
          )}
        </div>

        <div className="ride-lifecycle">
          <div className="lifecycle-heading">
            <span className="section-eyebrow">EVENT LIFECYCLE</span>

            <h3>EVERY RIDE HAS A JOURNEY</h3>
          </div>

          <div className="lifecycle-track">
            <div className="lifecycle-step active">
              <span>01</span>
              <strong>UPCOMING</strong>
              <small>Discover & Join</small>
            </div>

            <div className="lifecycle-connector"></div>

            <div className="lifecycle-step">
              <span>02</span>
              <strong>STARTING</strong>
              <small>Prepare to Ride</small>
            </div>

            <div className="lifecycle-connector"></div>

            <div className="lifecycle-step">
              <span>03</span>
              <strong>LIVE</strong>
              <small>Ride Together</small>
            </div>

            <div className="lifecycle-connector"></div>

            <div className="lifecycle-step">
              <span>04</span>
              <strong>COMPLETED</strong>
              <small>Create Ride Record</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UpcomingRides;