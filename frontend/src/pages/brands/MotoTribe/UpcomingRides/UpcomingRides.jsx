import { useNavigate } from "react-router-dom";
import { motoRides } from "../../../../data/motoRides";

import "./UpcomingRides.css";

function UpcomingRides() {
  const navigate = useNavigate();

  const handleRideClick = (ride) => {
    const rideId = ride.detailsId || ride.id;

    navigate(`/businesses/mototribe/ride/${rideId}`);
  };

  return (
    <section className="upcoming-rides" id="upcoming-rides">
      <div className="upcoming-rides-container">

        {/* SECTION HEADER */}
        <div className="upcoming-rides-header">
          <div>
            <span className="upcoming-eyebrow">MOTOTRIBE / RIDES</span>

            <h2>
              Choose your next
              <br />
              <span>adventure.</span>
            </h2>
          </div>

          <p>
            Join the community, discover new routes and ride beyond
            the ordinary.
          </p>
        </div>

        {/* RIDES */}
        <div className="rides-grid">
          {motoRides.map((ride, index) => {

            const title =
              ride.title ||
              ride.name ||
              ride.rideName ||
              `MotoTribe Ride ${index + 1}`;

            const category =
              ride.category ||
              ride.type ||
              ride.rideType ||
              "ADVENTURE";

            const difficulty =
              ride.difficulty ||
              ride.level ||
              ride.experienceLevel ||
              "INTERMEDIATE";

            const start =
              ride.startLocation ||
              ride.start ||
              ride.from ||
              ride.startPoint ||
              "";

            const destination =
              ride.destination ||
              ride.to ||
              ride.endLocation ||
              ride.endPoint ||
              ride.location ||
              "";

            const distance =
              ride.distance !== undefined
                ? `${ride.distance} KM`
                : "—";

            const currentRiders =
              ride.currentRiders ??
              ride.riders ??
              ride.joinedRiders ??
              0;

            const maxRiders =
              ride.maxRiders ??
              ride.capacity ??
              ride.totalRiders ??
              0;

            return (
              <article className="ride-card" key={ride.detailsId || ride.id || index}>

                {/* TOP */}
                <div className="ride-card-header">

                  <div className="ride-number">
                    0{index + 1}
                  </div>

                  <div className="ride-tags">
                    <span className="ride-category">
                      {category}
                    </span>

                    <span className="ride-level">
                      {difficulty}
                    </span>
                  </div>

                </div>

                {/* MAIN CONTENT */}
                <div className="ride-card-content">

                  <span className="ride-small-label">
                    UPCOMING JOURNEY
                  </span>

                  <h3>{title}</h3>

                  <div className="ride-route">

                    {start && (
                      <span>{start}</span>
                    )}

                    {start && destination && (
                      <span className="route-arrow">→</span>
                    )}

                    {destination && (
                      <span>{destination}</span>
                    )}

                  </div>

                </div>

                {/* INFO */}
                <div className="ride-info">

                  <div className="ride-info-item">
                    <span>DATE</span>
                    <strong>{ride.date || "TBA"}</strong>
                  </div>

                  <div className="ride-info-item">
                    <span>DISTANCE</span>
                    <strong>{distance}</strong>
                  </div>

                  <div className="ride-info-item">
                    <span>RIDERS</span>
                    <strong>
                      {currentRiders}/{maxRiders}
                    </strong>
                  </div>

                </div>

                {/* BUTTON */}
                <button
                  className="ride-details-btn"
                  onClick={() => handleRideClick(ride)}
                >
                  <span>VIEW RIDE</span>

                  <span className="ride-arrow-btn">
                    →
                  </span>
                </button>

              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default UpcomingRides;