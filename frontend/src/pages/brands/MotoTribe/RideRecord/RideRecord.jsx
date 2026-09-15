import { useState } from "react";
import "./RideRecord.css";

function RideRecord() {
  const [selectedRide, setSelectedRide] = useState(0);

  const rides = [
    {
      date: "28 AUG 2026",
      title: "NANDI HILLS SUNRISE",
      route: "BANGALORE → NANDI HILLS",
      distance: "120 KM",
      duration: "04H 18M",
      terrain: "HILLS",
      elevation: "1,478 M",
      rating: "9.2",
    },
    {
      date: "16 AUG 2026",
      title: "WESTERN GHATS RUN",
      route: "BANGALORE → SAKLESHPUR",
      distance: "286 KM",
      duration: "07H 42M",
      terrain: "MOUNTAIN",
      elevation: "1,210 M",
      rating: "9.6",
    },
    {
      date: "02 AUG 2026",
      title: "COASTAL ESCAPE",
      route: "MANGALORE → UDUPI",
      distance: "190 KM",
      duration: "05H 12M",
      terrain: "COASTAL",
      elevation: "280 M",
      rating: "8.9",
    },
    {
      date: "19 JUL 2026",
      title: "COORG EXPLORER",
      route: "BANGALORE → COORG",
      distance: "260 KM",
      duration: "06H 35M",
      terrain: "MOUNTAIN",
      elevation: "1,520 M",
      rating: "9.4",
    },
  ];

  const currentRide = rides[selectedRide];

  return (
    <section id="ride-record" className="ride-record">
      <div className="ride-record-container">

        {/* HEADER */}

        <div className="record-header">

          <div>
            <div className="record-eyebrow">
              <span></span>
              RECORD / RIDE HISTORY
            </div>

            <h2>
              EVERY RIDE.
              <br />
              <span>REMEMBERED.</span>
            </h2>
          </div>

          <div className="record-intro">
            <p>
              Your rides become part of your journey.
              Track distance, terrain, elevation and
              every road you've conquered.
            </p>
          </div>

        </div>

        {/* RIDER STATS */}

        <div className="record-stats">

          <div className="record-stat">
            <span>TOTAL DISTANCE</span>
            <strong>12,840</strong>
            <small>KM</small>
          </div>

          <div className="record-stat">
            <span>RIDES COMPLETED</span>
            <strong>47</strong>
            <small>RIDES</small>
          </div>

          <div className="record-stat">
            <span>TIME ON ROAD</span>
            <strong>186</strong>
            <small>HOURS</small>
          </div>

          <div className="record-stat">
            <span>HIGHEST ALTITUDE</span>
            <strong>2,640</strong>
            <small>METERS</small>
          </div>

        </div>

        {/* MAIN RECORD */}

        <div className="record-main">

          {/* RIDE LIST */}

          <div className="record-list">

            <div className="record-list-title">
              <span>03</span>
              RECENT JOURNEYS
            </div>

            {rides.map((ride, index) => (
              <button
                key={ride.title}
                className={
                  selectedRide === index
                    ? "record-item active"
                    : "record-item"
                }
                onClick={() => setSelectedRide(index)}
              >
                <div className="record-item-number">
                  0{index + 1}
                </div>

                <div className="record-item-info">
                  <span>{ride.date}</span>
                  <strong>{ride.title}</strong>
                  <small>{ride.route}</small>
                </div>

                <div className="record-item-distance">
                  {ride.distance}
                </div>

                <div className="record-arrow">
                  →
                </div>
              </button>
            ))}

          </div>

          {/* DETAIL */}

          <div className="record-detail">

            <div className="detail-top">
              <span>SELECTED JOURNEY</span>
              <strong>0{selectedRide + 1}</strong>
            </div>

            <div className="route-visual">

              <div className="route-point start">
                <span></span>
                <small>START</small>
                <strong>
                  {currentRide.route.split(" → ")[0]}
                </strong>
              </div>

              <div className="route-line">
                <span></span>
              </div>

              <div className="route-point end">
                <span></span>
                <small>FINISH</small>
                <strong>
                  {currentRide.route.split(" → ")[1]}
                </strong>
              </div>

            </div>

            <h3>{currentRide.title}</h3>

            <div className="detail-metrics">

              <div>
                <span>DISTANCE</span>
                <strong>{currentRide.distance}</strong>
              </div>

              <div>
                <span>DURATION</span>
                <strong>{currentRide.duration}</strong>
              </div>

              <div>
                <span>TERRAIN</span>
                <strong>{currentRide.terrain}</strong>
              </div>

              <div>
                <span>ELEVATION</span>
                <strong>{currentRide.elevation}</strong>
              </div>

            </div>

            <div className="ride-score">

              <div>
                <span>RIDE EXPERIENCE</span>
                <strong>{currentRide.rating}/10</strong>
              </div>

              <div className="score-bar">
                <span
                  style={{
                    width: `${Number(currentRide.rating) * 10}%`,
                  }}
                ></span>
              </div>

            </div>

          </div>

        </div>

        {/* MILESTONE */}

        <div className="record-milestone">

          <div className="milestone-icon">
            MT
          </div>

          <div className="milestone-content">
            <span>NEXT MILESTONE</span>
            <strong>15,000 KM RIDER</strong>
            <small>
              2,160 KM remaining to unlock your next
              Ride Passport achievement.
            </small>
          </div>

          <div className="milestone-progress">
            <div>
              <span>12,840 KM</span>
              <span>15,000 KM</span>
            </div>

            <div className="milestone-bar">
              <span></span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export default RideRecord;