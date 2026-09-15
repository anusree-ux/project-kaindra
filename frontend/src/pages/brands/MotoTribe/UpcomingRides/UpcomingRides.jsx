import { useEffect, useMemo, useState, useCallback } from "react";
import apiClient from "../../../../services/apiClient";
import "./UpcomingRides.css";

const filters = [
  "ALL",
  "ADVENTURE",
  "TOURING",
  "CRUISER",
  "COMMUNITY",
  "OFFICIAL",
];

function UpcomingRides() {
  const [rides, setRides] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedRide, setSelectedRide] = useState(null);
  const [joinedRides, setJoinedRides] = useState([]);
  const [requestedRides, setRequestedRides] = useState([]);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // 1. Fetch live upcoming rides from MongoDB database
  const fetchUpcomingRides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/mototribe/rides");
      const dbList = res.data.data?.rides || [];

      const formatted = dbList.map((r) => {
        const startDateObj = r.startDate ? new Date(r.startDate) : new Date();
        const yyyy = startDateObj.getFullYear();
        const mm = String(startDateObj.getMonth() + 1).padStart(2, "0");
        const dd = String(startDateObj.getDate()).padStart(2, "0");
        const timeStr = startDateObj.toTimeString().substring(0, 5);

        return {
          id: r._id,
          name: r.title || `${r.origin} to ${r.destination}`,
          start: r.origin || "Origin",
          destination: r.destination || "Destination",
          date: `${yyyy}-${mm}-${dd}`,
          time: timeStr !== "00:00" ? timeStr : "06:00",
          type: "ADVENTURE",
          difficulty: r.distanceKm > 300 ? "ADVANCED" : "INTERMEDIATE",
          organizer: r.organizerId?.name || "MotoTribe Rider",
          organizerType: "COMMUNITY",
          riders: 1,
          maxRiders: 20,
          requestRequired: false,
          distance: `${r.distanceKm || 150} KM`,
          duration: `${Math.ceil((r.distanceKm || 150) / 120)} Days`,
          route: `${r.origin} → ${r.destination}`,
          description: `Community ride organized by ${r.organizerId?.name || "verified rider"} from ${r.origin} to ${r.destination}.`,
          requirements: [
            "Helmet and full riding gear required",
            "Motorcycle in good mechanical condition",
            "Valid driving license and vehicle registration",
          ],
          safety: "Follow group riding etiquette and keep safe braking distances on highways.",
          status: r.status === "ongoing" ? "LIVE" : "UPCOMING",
        };
      });

      setRides(formatted);
      setSelectedRide(formatted.length > 0 ? formatted[0] : null);
    } catch (err) {
      console.error("Error fetching live upcoming rides:", err);
      setRides([]);
      setSelectedRide(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcomingRides();

    const handleRideCreated = () => {
      fetchUpcomingRides();
    };

    window.addEventListener("mototribe:ride-created", handleRideCreated);
    return () => {
      window.removeEventListener("mototribe:ride-created", handleRideCreated);
    };
  }, [fetchUpcomingRides]);

  /*
   * Clock timer for countdowns
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
    if (!ride || !ride.date) return new Date();
    return new Date(`${ride.date}T${ride.time || "06:00"}:00`);
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

    return ride.status || "UPCOMING";
  };

  const handleJoin = async (ride) => {
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
                riders: Math.max(1, item.riders - 1),
              }
            : item
        )
      );

      setSelectedRide((current) =>
        current && current.id === ride.id
          ? {
              ...current,
              riders: Math.max(1, current.riders - 1),
            }
          : current
      );

      return;
    }

    try {
      await apiClient.post(`/api/mototribe/rides/${ride.id}/join`).catch(() => {});
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
    } catch (err) {
      console.error("Error joining ride:", err);
    }
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

            {loading ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "13px",
                  letterSpacing: "1px",
                }}
              >
                LOADING UPCOMING RIDES FROM DATABASE...
              </div>
            ) : filteredRides.length > 0 ? (
              filteredRides.map((ride) => {
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
              })
            ) : (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px dashed rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🏍</div>
                <h3 style={{ fontSize: "14px", letterSpacing: "1px", color: "#fff", marginBottom: "6px" }}>
                  NO UPCOMING RIDES IN DATABASE
                </h3>
                <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", margin: 0 }}>
                  Plan a ride using the AI Route Builder above to schedule your first journey!
                </p>
              </div>
            )}
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