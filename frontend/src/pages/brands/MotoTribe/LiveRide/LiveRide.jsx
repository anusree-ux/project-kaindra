import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../../services/apiClient";
import { formatMongoRide } from "../../../../utils/mototribeRideAdapter";
import {
  getMotoRideById,
  getMotoRideStatus,
  getMotoRideCountdown,
} from "../../../../data/motoRides";
import RideCall from "../RideCall/RideCall";
import LiveRideChat from "../LiveRideChat/LiveRideChat";
import "./LiveRide.css";

function LiveRide() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("UPCOMING");
  const [countdown, setCountdown] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    if (rideId) {
      const selectedRide = getMotoRideById(rideId);
      if (selectedRide) {
        setRide(selectedRide);
        setStatus(getMotoRideStatus(selectedRide));
        setCountdown(getMotoRideCountdown(selectedRide));
        setLoading(false);
        return;
      }
    }

    async function fetchRideFromDb() {
      try {
        if (rideId) {
          const res = await apiClient.get(`/api/mototribe/rides/${rideId}`);
          const raw = res.data.data?.ride || res.data.data;
          if (isMounted && raw) {
            const formatted = formatMongoRide(raw);
            setRide(formatted);
            setStatus(getMotoRideStatus(formatted));
            setCountdown(getMotoRideCountdown(formatted));
          }
        } else {
          // Embedded on main page without rideId in URL
          // Fetch user's active/latest ride from the database
          const res = await apiClient.get("/api/mototribe/rides");
          const list = res.data.data?.rides || [];
          const activeRide =
            list.find((r) => r.status === "active") ||
            list.find((r) => r.status === "planning") ||
            list[0];

          if (isMounted && activeRide) {
            const formatted = formatMongoRide(activeRide);
            setRide(formatted);
            setStatus(getMotoRideStatus(formatted));
            setCountdown(getMotoRideCountdown(formatted));
          }
        }
      } catch (err) {
        console.error("Error fetching live ride from DB:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRideFromDb();

    return () => { isMounted = false; };
  }, [rideId]);

  // Periodic real-time sync with database
  useEffect(() => {
    const currentRideId = rideId || ride?.id || ride?._id;
    if (!currentRideId) return;

    const syncInterval = setInterval(() => {
      apiClient
        .get(`/api/mototribe/rides/${currentRideId}`)
        .then((res) => {
          const raw = res.data.data?.ride || res.data.data;
          if (raw) {
            const formatted = formatMongoRide(raw);
            setRide((prev) => ({ ...prev, ...formatted }));
            setStatus(getMotoRideStatus(formatted));
            setCountdown(getMotoRideCountdown(formatted));
          }
        })
        .catch(() => {});
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [rideId, ride?.id, ride?._id]);

  useEffect(() => {
    if (!ride) return;

    const timer = setInterval(() => {
      const now = new Date();

      setStatus(getMotoRideStatus(ride, now));
      setCountdown(getMotoRideCountdown(ride, now));
    }, 1000);

    return () => clearInterval(timer);
  }, [ride]);

  const handleStartRide = async () => {
    try {
      setUpdatingStatus(true);
      const res = await apiClient.patch(`/api/mototribe/rides/${ride.id}/start`);
      const updated = res.data?.data?.ride || res.data?.data;
      if (updated) {
        const formatted = formatMongoRide({ ...updated, isOrganizer: true });
        setRide(formatted);
        setStatus("LIVE");
        setCountdown({ expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    } catch (err) {
      console.error("Error starting ride:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCompleteRide = async () => {
    try {
      setUpdatingStatus(true);
      const res = await apiClient.patch(`/api/mototribe/rides/${ride.id}/complete`);
      const updated = res.data?.data?.ride || res.data?.data;
      if (updated) {
        const formatted = formatMongoRide({ ...updated, isOrganizer: true });
        setRide(formatted);
        setStatus("COMPLETED");
      }
    } catch (err) {
      console.error("Error completing ride:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="live-ride-page" id="live-ride">
        <div className="live-ride-not-found" style={{ textAlign: "center", padding: "80px 20px" }}>
          <span style={{ letterSpacing: "0.2em", color: "#d4a03e" }}>LIVE TELEMATICS</span>
          <h2 style={{ color: "#fff", marginTop: "12px" }}>Connecting to Live Ride...</h2>
        </div>
      </div>
    );
  }

  if (!ride) {
    if (!rideId) {
      // Embedded on main page and no active ride exists yet
      return (
        <div className="live-ride-page" id="live-ride">
          <div className="live-ride-not-found" style={{ textAlign: "center", padding: "60px 20px" }}>
            <span style={{ letterSpacing: "0.2em", color: "#d4a03e" }}>03 / LIVE RIDE DASHBOARD</span>
            <h2 style={{ color: "#fff", margin: "16px 0 8px" }}>No Active Ride In Progress</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: "480px", margin: "0 auto 24px" }}>
              Plan a journey or join an upcoming group ride to monitor live telemetry, route checkpoints, and jump into real-time tribe voice and video calls.
            </p>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("planner") || document.querySelector(".planner-page") || document.querySelector(".moto-ride-planner");
                if (el) el.scrollIntoView({ behavior: "smooth" });
                else navigate("/businesses/mototribe");
              }}
            >
              PLAN A RIDE →
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="live-ride-page">
        <div className="live-ride-not-found">
          <span>RIDE NOT FOUND</span>
          <h1>This ride does not exist.</h1>

          <button
            onClick={() => navigate("/businesses/mototribe")}
          >
            BACK TO MOTOTRIBE
          </button>
        </div>
      </div>
    );
  }

  const confirmedRiders =
    ride.participants?.filter(
      (participant) => participant.confirmed
    ) || [];

  const isLive = status === "LIVE";
  const isStarting = status === "STARTING";
  const isCompleted = status === "COMPLETED";

  return (
    <div className="live-ride-page">

      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <header className="live-ride-topbar-wrapper">
        <div className="live-ride-topbar">
          <button
            className="live-ride-back"
            onClick={() => navigate("/businesses/mototribe")}
          >
            ← BACK TO MOTOTRIBE
          </button>

          <div className="live-ride-brand">
            MOTOTRIBE
            <span>/ LIVE RIDE</span>
          </div>

          <div className="live-ride-status-badge">
            {isLive && (
              <>
                <span className="live-status-dot"></span>
                LIVE NOW
              </>
            )}

            {isStarting && "STARTING SOON"}

            {isCompleted && "COMPLETED"}

            {status === "UPCOMING" && "UPCOMING"}
          </div>
        </div>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="live-ride-hero">

        <div className="live-ride-hero-content">

          <span className="live-ride-kicker">
            {ride.type} / {ride.difficulty}
          </span>

          <h1>{ride.name}</h1>

          <div className="live-ride-route-title">
            <strong>{ride.start}</strong>
            <span>→</span>
            <strong>{ride.destination}</strong>
          </div>

        </div>

        <div className="live-ride-hero-side">

          <span>ORGANIZED BY</span>

          <strong>{ride.organizer}</strong>

          <small>{ride.organizerType}</small>

        </div>

      </section>

      {/* =====================================================
          RIDE STATS
      ===================================================== */}

      <section className="live-ride-stats">

        <div className="live-stat">
          <span>DISTANCE</span>
          <strong>{ride.distanceLabel}</strong>
        </div>

        <div className="live-stat">
          <span>DURATION</span>
          <strong>{ride.duration}</strong>
        </div>

        <div className="live-stat">
          <span>RIDERS</span>
          <strong>
            {ride.riders} / {ride.maxRiders}
          </strong>
        </div>

        <div className="live-stat">
          <span>RIDE BUDGET</span>
          <strong>
            ₹{Number(String(ride.budget || 0).replace(/[^\d]/g, "") || 0).toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="live-stat">
          <span>STATUS</span>
          <strong
            className={`stat-status stat-${status.toLowerCase()}`}
          >
            {status}
          </strong>
        </div>

      </section>

      {/* =====================================================
          MAIN DASHBOARD
      ===================================================== */}

      <main className="live-dashboard">

        {/* LEFT COLUMN */}

        <div className="live-dashboard-main">

          {/* ROUTE */}

          <section className="live-panel route-panel">

            <div className="panel-heading">

              <div>
                <span>01 / LIVE ROUTE</span>
                <h2>Journey route</h2>
              </div>

              <span className="tracking-state">
                {isLive
                  ? "● TRACKING ACTIVE"
                  : "○ TRACKING READY"}
              </span>

            </div>

            <div className="route-list">

              {/* START */}

              <div className="route-row">

                <div className="route-marker route-start">
                  <span></span>
                </div>

                <div className="route-content">

                  <span>START</span>

                  <strong>{ride.start}</strong>

                </div>

              </div>

              {(ride.stops || []).map((stop, index) => {
                const stopLabel = typeof stop === "object" ? (stop.name || stop.address || String(stop)) : String(stop);
                return (
                  <div
                    className="route-row"
                    key={`${stopLabel}-${index}`}
                  >

                    <div className="route-marker">
                      <span></span>
                    </div>

                    <div className="route-content">

                      <span>
                        STOP {String(index + 1).padStart(2, "0")}
                      </span>

                      <strong>{stopLabel}</strong>

                    </div>

                  </div>
                );
              })}

              {/* DESTINATION */}

              <div className="route-row">

                <div className="route-marker route-end">
                  <span></span>
                </div>

                <div className="route-content">

                  <span>DESTINATION</span>

                  <strong>{ride.destination}</strong>

                </div>

              </div>

            </div>

            <div className="route-full-path">

              <span>FULL ROUTE</span>

              <p>{ride.route}</p>

            </div>

          </section>

          {/* RIDERS */}

          <section className="live-panel">

            <div className="panel-heading">

              <div>
                <span>02 / RIDER GROUP</span>
                <h2>Riders on this journey</h2>
              </div>

              <strong className="panel-count">
                {confirmedRiders.length} CONFIRMED
              </strong>

            </div>

            <div className="riders-grid">

              {confirmedRiders.map((rider) => (
                <div
                  className="ride-rider-card"
                  key={rider.id}
                >

                  <div className="rider-avatar">
                    {rider.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="rider-info">

                    <strong>{rider.name}</strong>

                    <span>{rider.role}</span>

                  </div>

                  <div className="rider-state">
                    CONFIRMED
                  </div>

                </div>
              ))}

            </div>

          </section>

          {/* TRIBE VOICE & VIDEO CALL */}
          <RideCall ride={ride} currentStatus={status} />

          {/* LIVE RIDE GROUP CHAT */}
          <LiveRideChat ride={ride} />

        </div>

        {/* RIGHT COLUMN */}

        <aside className="live-dashboard-sidebar">

          {/* STATUS */}

          <section className="live-panel status-panel">

            <span className="sidebar-label">
              CURRENT STATUS
            </span>

            <div
              className={`status-display status-${status.toLowerCase()}`}
            >

              <div className="status-icon">

                {isLive && "●"}

                {isStarting && "◐"}

                {status === "UPCOMING" && "○"}

                {isCompleted && "✓"}

              </div>

              <div>

                <strong>
                  {isLive
                    ? "Ride is Live"
                    : isStarting
                    ? "Starting Soon"
                    : isCompleted
                    ? "Ride Completed"
                    : "Ride Upcoming"}
                </strong>

                <p>
                  {isLive
                    ? "Live ride tracking is currently active."
                    : isStarting
                    ? "The ride is about to begin."
                    : isCompleted
                    ? "This journey has been completed."
                    : "Live tracking activates when the ride begins."}
                </p>

              </div>

            </div>

            {countdown && !countdown.expired && (
              <div className="live-countdown">

                <span>STARTS IN</span>

                <div className="countdown-values">

                  <div>
                    <strong>{countdown.days}</strong>
                    <small>DAYS</small>
                  </div>

                  <div>
                    <strong>{countdown.hours}</strong>
                    <small>HRS</small>
                  </div>

                  <div>
                    <strong>{countdown.minutes}</strong>
                    <small>MIN</small>
                  </div>

                </div>

              </div>
            )}

            {ride.isOrganizer && (
              <div className="live-organizer-actions">
                {(status === "UPCOMING" || status === "STARTING") && (
                  <button
                    type="button"
                    className="live-action-btn live-start-btn"
                    disabled={updatingStatus}
                    onClick={handleStartRide}
                  >
                    {updatingStatus ? "STARTING RIDE..." : "START RIDE NOW ▶"}
                  </button>
                )}
                {isLive && (
                  <button
                    type="button"
                    className="live-action-btn live-complete-btn"
                    disabled={updatingStatus}
                    onClick={handleCompleteRide}
                  >
                    {updatingStatus ? "COMPLETING RIDE..." : "COMPLETE RIDE ✓"}
                  </button>
                )}
              </div>
            )}

          </section>

          {/* JOURNEY INTELLIGENCE */}

          <section className="live-panel">

            <div className="panel-heading sidebar-heading">

              <div>
                <span>03 / INTELLIGENCE</span>
                <h2>Journey insights</h2>
              </div>

            </div>

            <div className="intelligence-list">

              <div>
                <span>FUEL STOPS</span>
                <strong>
                  {ride.journeyIntelligence.fuelStops}
                </strong>
              </div>

              <div>
                <span>REST STOPS</span>
                <strong>
                  {ride.journeyIntelligence.restStops}
                </strong>
              </div>

              <div>
                <span>SERVICE STOPS</span>
                <strong>
                  {ride.journeyIntelligence.serviceStops}
                </strong>
              </div>

              <div>
                <span>SCENIC STOPS</span>
                <strong>
                  {ride.journeyIntelligence.scenicStops}
                </strong>
              </div>

            </div>

          </section>

          {/* VEHICLE */}

          <section className="live-panel vehicle-panel">

            <span className="sidebar-label">
              RIDE VEHICLE
            </span>

            <h3>{ride.vehicle.name}</h3>

            <div className="vehicle-details">

              <div>
                <span>FUEL</span>
                <strong>{ride.vehicle.fuelType}</strong>
              </div>

              <div>
                <span>MILEAGE</span>
                <strong>
                  {ride.vehicle.mileage} KM/L
                </strong>
              </div>

            </div>

          </section>

        </aside>

      </main>

      {/* =====================================================
          SAFETY BAR
      ===================================================== */}

      <section className="live-safety-bar">

        <div>

          <span>SAFETY NOTICE</span>

          <p>
            Maintain safe riding distance, follow the route,
            stay with the group and keep emergency equipment
            accessible.
          </p>

        </div>

        <button
          onClick={() =>
            navigate("/businesses/mototribe")
          }
        >
          MOTOTRIBE SAFETY →
        </button>

      </section>

    </div>
  );
}

export default LiveRide;