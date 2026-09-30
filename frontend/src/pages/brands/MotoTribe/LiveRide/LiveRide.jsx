import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "./LiveRide.css";
import RideMap from "../RideMap/RideMap";
import LiveLocation from "../LiveLocation/LiveLocation";
import LiveRideChat from "../LiveRideChat/LiveRideChat";
import SafetySOS from "../SafetySOS/SafetySOS";
import Navigation from "../Navigation/Navigation";
import RideCall from "../RideCall/RideCall";
import {
  getMotoRideById,
  getMotoRideStatus,
  getMotoRideCountdown,
} from "../../../../data/motoRides";

function LiveRide() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const [now, setNow] = useState(() => new Date());

  // Keep the clock updated without setting ride-related state in an effect.
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Derive ride directly from the route parameter.
  const ride = getMotoRideById(rideId);

  // Derive status and countdown directly from ride + current time.
  const status = ride
    ? getMotoRideStatus(ride, now)
    : "UPCOMING";

  const countdown = ride
    ? getMotoRideCountdown(ride, now)
    : {
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };

  // --------------------------------------------------
  // RIDE NOT FOUND
  // --------------------------------------------------

  if (!ride) {
    return (
      <section className="live-ride-page">
        <div className="live-ride-not-found">
          <span className="live-ride-not-found-label">
            MOTOTRIBE / LIVE RIDE
          </span>

          <h1>Ride Not Found</h1>

          <p>
            The requested ride could not be found. Please return to the
            MotoTribe rides and select a valid ride.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/businesses/mototribe")
            }
            className="live-ride-back-button"
          >
            ← BACK TO MOTOTRIBE
          </button>
        </div>
      </section>
    );
  }

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const formatCountdown = () => {
    if (status === "COMPLETED") {
      return "RIDE COMPLETED";
    }

    if (status === "LIVE") {
      return "RIDE IN PROGRESS";
    }

    if (status === "STARTING") {
      return "STARTING SOON";
    }

    if (countdown.days > 0) {
      return `${countdown.days}D ${String(
        countdown.hours
      ).padStart(2, "0")}H ${String(
        countdown.minutes
      ).padStart(2, "0")}M`;
    }

    return `${String(
      countdown.hours
    ).padStart(2, "0")}:${String(
      countdown.minutes
    ).padStart(2, "0")}:${String(
      countdown.seconds
    ).padStart(2, "0")}`;
  };

  const statusClass = status.toLowerCase();

  const handleBack = () => {
    navigate(
      `/businesses/mototribe/ride/${ride.id}`
    );
  };

  const handleExpenses = () => {
    navigate(
      `/businesses/mototribe/ride/${ride.id}/expenses`
    );
  };

  // --------------------------------------------------
  // COMPLETE RIDE
  // --------------------------------------------------

  const handleCompleteRide = () => {
    navigate(
      `/businesses/mototribe/ride/${ride.id}/complete`
    );
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <section className="live-ride-page">
      {/* HEADER */}

      <header className="live-ride-header">
        <button
          type="button"
          className="live-ride-header-back"
          onClick={handleBack}
        >
          ← BACK TO RIDE
        </button>

        <div className="live-ride-header-center">
          <span className="live-ride-header-label">
            MOTOTRIBE / LIVE RIDE
          </span>

          <span
            className={`live-ride-status ${statusClass}`}
          >
            <span className="live-ride-status-dot" />
            {status}
          </span>
        </div>

        <div className="live-ride-header-actions">
          <button
            type="button"
            className="live-ride-expenses-button"
            onClick={handleExpenses}
          >
            EXPENSES
          </button>

          <button
            type="button"
            className="live-ride-complete-button"
            onClick={handleCompleteRide}
          >
            COMPLETE RIDE
          </button>
        </div>
      </header>

      {/* HERO */}

      <div className="live-ride-hero">
        <div className="live-ride-hero-content">
          <div className="live-ride-meta">
            <span>{ride.type || "RIDE"}</span>
            <span>•</span>
            <span>
              {ride.difficulty || "STANDARD"}
            </span>
          </div>

          <h1>{ride.name}</h1>

          <p className="live-ride-route">
            {ride.start} → {ride.destination}
          </p>

          <p className="live-ride-organizer">
            Organized by{" "}
            <strong>{ride.organizer}</strong>
          </p>
        </div>

        <div
          className={`live-ride-hero-status ${statusClass}`}
        >
          <span className="live-ride-hero-status-label">
            CURRENT STATUS
          </span>

          <strong>{status}</strong>

          <div className="live-ride-countdown">
            {formatCountdown()}
          </div>
        </div>
      </div>

      {/* STATS */}

      <div className="live-ride-stats">
        <div className="live-ride-stat">
          <span className="live-ride-stat-label">
            DISTANCE
          </span>

          <strong>
            {ride.distanceLabel ||
              `${ride.distance} km`}
          </strong>
        </div>

        <div className="live-ride-stat">
          <span className="live-ride-stat-label">
            DURATION
          </span>

          <strong>
            {ride.duration || "—"}
          </strong>
        </div>

        <div className="live-ride-stat">
          <span className="live-ride-stat-label">
            RIDERS
          </span>

          <strong>
            {ride.participants?.length ||
              ride.riders ||
              0}
            /
            {ride.maxRiders || "—"}
          </strong>
        </div>

        <div className="live-ride-stat">
          <span className="live-ride-stat-label">
            BUDGET
          </span>

          <strong>
            {ride.budget || "—"}
          </strong>
        </div>

        <div className="live-ride-stat">
          <span className="live-ride-stat-label">
            STATUS
          </span>

          <strong>{status}</strong>
        </div>
      </div>

      {/* MAIN CONTENT */}

      <div className="live-ride-content">
        <main className="live-ride-main">
          {/* ROUTE */}

          <section className="live-ride-card">
            <div className="live-ride-card-header">
              <div>
                <span className="live-ride-section-label">
                  JOURNEY ROUTE
                </span>

                <h2>Live Route</h2>
              </div>

              <span className="live-ride-route-badge">
                {ride.distanceLabel ||
                  `${ride.distance} km`}
              </span>
            </div>

            <div className="live-ride-route-list">
              <div className="live-ride-route-point start">
                <span className="live-ride-route-marker" />

                <div>
                  <span>START</span>
                  <strong>{ride.start}</strong>
                </div>
              </div>

              {ride.stops?.map(
                (stop, index) => (
                  <div
                    className="live-ride-route-point"
                    key={`${stop}-${index}`}
                  >
                    <span className="live-ride-route-marker" />

                    <div>
                      <span>
                        STOP {index + 1}
                      </span>

                      <strong>{stop}</strong>
                    </div>
                  </div>
                )
              )}

              <div className="live-ride-route-point destination">
                <span className="live-ride-route-marker" />

                <div>
                  <span>DESTINATION</span>
                  <strong>
                    {ride.destination}
                  </strong>
                </div>
              </div>
            </div>

            {ride.route && (
              <div className="live-ride-route-summary">
                <span>FULL ROUTE</span>
                <p>{ride.route}</p>
              </div>
            )}
          </section>

          {/* PARTICIPANTS */}

          <section className="live-ride-card">
            <div className="live-ride-card-header">
              <div>
                <span className="live-ride-section-label">
                  RIDE GROUP
                </span>

                <h2>Confirmed Riders</h2>
              </div>

              <span className="live-ride-count">
                {ride.participants?.length ||
                  0}{" "}
                RIDERS
              </span>
            </div>

            <div className="live-ride-participants">
              {ride.participants?.length > 0 ? (
                ride.participants.map(
                  (participant, index) => {
                    const participantName =
                      typeof participant ===
                      "string"
                        ? participant
                        : participant.name ||
                          `Rider ${
                            index + 1
                          }`;

                    const participantBike =
                      typeof participant ===
                      "object"
                        ? participant.vehicle ||
                          participant.bike
                        : null;

                    return (
                      <div
                        className="live-ride-participant"
                        key={`${participantName}-${index}`}
                      >
                        <div className="live-ride-avatar">
                          {participantName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="live-ride-participant-info">
                          <strong>
                            {participantName}
                          </strong>

                          {participantBike && (
                            <span>
                              {
                                participantBike
                              }
                            </span>
                          )}
                        </div>

                        <span className="live-ride-participant-status">
                          CONFIRMED
                        </span>
                      </div>
                    );
                  }
                )
              ) : (
                <div className="live-ride-empty">
                  No participant details
                  available yet.
                </div>
              )}
            </div>
          </section>

          {/* JOURNEY INTELLIGENCE */}

          {ride.journeyIntelligence && (
            <section className="live-ride-card">
              <div className="live-ride-card-header">
                <div>
                  <span className="live-ride-section-label">
                    JOURNEY INTELLIGENCE
                  </span>

                  <h2>Ride Conditions</h2>
                </div>
              </div>

              <div className="live-ride-intelligence-grid">
                {ride.journeyIntelligence
                  .weather && (
                  <div className="live-ride-intelligence-item">
                    <span>
                      WEATHER
                    </span>

                    <strong>
                      {
                        ride
                          .journeyIntelligence
                          .weather
                      }
                    </strong>
                  </div>
                )}

                {ride.journeyIntelligence
                  .traffic && (
                  <div className="live-ride-intelligence-item">
                    <span>
                      TRAFFIC
                    </span>

                    <strong>
                      {
                        ride
                          .journeyIntelligence
                          .traffic
                      }
                    </strong>
                  </div>
                )}

                {ride.journeyIntelligence
                  .fuel && (
                  <div className="live-ride-intelligence-item">
                    <span>FUEL</span>

                    <strong>
                      {
                        ride
                          .journeyIntelligence
                          .fuel
                      }
                    </strong>
                  </div>
                )}

                {ride.journeyIntelligence
                  .roadCondition && (
                  <div className="live-ride-intelligence-item">
                    <span>
                      ROAD CONDITION
                    </span>

                    <strong>
                      {
                        ride
                          .journeyIntelligence
                          .roadCondition
                      }
                    </strong>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* VEHICLE */}

          {ride.vehicle && (
            <section className="live-ride-card">
              <div className="live-ride-card-header">
                <div>
                  <span className="live-ride-section-label">
                    VEHICLE
                  </span>

                  <h2>Ride Vehicle</h2>
                </div>
              </div>

              <div className="live-ride-vehicle">
                <div>
                  <span>MODEL</span>

                  <strong>
                    {ride.vehicle.name ||
                      ride.vehicle.model ||
                      "Ride Vehicle"}
                  </strong>
                </div>

                {ride.vehicle
                  .registrationNumber && (
                  <div>
                    <span>
                      REGISTRATION
                    </span>

                    <strong>
                      {
                        ride.vehicle
                          .registrationNumber
                      }
                    </strong>
                  </div>
                )}

                {ride.vehicle.fuelType && (
                  <div>
                    <span>
                      FUEL TYPE
                    </span>

                    <strong>
                      {
                        ride.vehicle
                          .fuelType
                      }
                    </strong>
                  </div>
                )}

                {ride.vehicle.mileage && (
                  <div>
                    <span>
                      MILEAGE
                    </span>

                    <strong>
                      {ride.vehicle.mileage}{" "}
                      km/l
                    </strong>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* LIVE RIDE FEATURES */}

          <LiveLocation ride={ride} />

          <RideMap ride={ride} />

          <Navigation ride={ride} />

          <RideCall ride={ride} />

          <LiveRideChat ride={ride} />

          <SafetySOS ride={ride} />
        </main>

        {/* SIDEBAR */}

        <aside className="live-ride-sidebar">
          <div
            className={`live-ride-status-panel ${statusClass}`}
          >
            <span className="live-ride-section-label">
              RIDE STATUS
            </span>

            <strong>{status}</strong>

            <div className="live-ride-sidebar-countdown">
              {formatCountdown()}
            </div>

            <p>
              {status === "LIVE"
                ? "The ride is currently in progress."
                : status === "STARTING"
                ? "The ride is about to begin."
                : status === "COMPLETED"
                ? "This ride has been completed."
                : "The ride is scheduled and waiting to start."}
            </p>
          </div>

          <div className="live-ride-sidebar-card">
            <span className="live-ride-section-label">
              ORGANIZER
            </span>

            <strong>
              {ride.organizer}
            </strong>

            {ride.organizerType && (
              <span>
                {ride.organizerType}
              </span>
            )}
          </div>

          {ride.safety && (
            <div className="live-ride-sidebar-card">
              <span className="live-ride-section-label">
                SAFETY
              </span>

              <p>{ride.safety}</p>
            </div>
          )}
        </aside>
      </div>

      {/* SAFETY BAR */}

      <div className="live-ride-safety-bar">
        <div>
          <span className="live-ride-safety-icon">
            !
          </span>

          <div>
            <strong>RIDE SAFE</strong>

            <p>
              Stay alert, follow the group
              instructions and keep emergency
              contacts accessible.
            </p>
          </div>
        </div>

        <div className="live-ride-bottom-actions">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/businesses/mototribe/ride/${ride.id}/expenses`
              )
            }
          >
            MANAGE EXPENSES →
          </button>

          <button
            type="button"
            className="live-ride-complete-bottom-button"
            onClick={handleCompleteRide}
          >
            COMPLETE RIDE →
          </button>
        </div>
      </div>
    </section>
  );
}

export default LiveRide;