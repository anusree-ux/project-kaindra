import { useEffect, useMemo, useState } from "react";
import "./RidePassport.css";
import { motoRides } from "../../../../data/motoRides";

const defaultPassport = {
  riderName: "MOTOTRIBE RIDER",
  riderId: "MT-2026-00421",
  memberSince: "2026",
  level: "EXPLORER",
  rides: 12,
  distance: 2840,
  countries: 1,
  communities: 4,
};

const milestones = [
  {
    id: "first-ride",
    number: "01",
    title: "FIRST RIDE",
    description: "Completed your first recorded journey.",
    requirement: "1 RIDE",
  },
  {
    id: "distance-1000",
    number: "02",
    title: "1000 KM",
    description: "Crossed the first 1,000 kilometre milestone.",
    requirement: "1,000 KM",
  },
  {
    id: "explorer",
    number: "03",
    title: "EXPLORER",
    description: "Discover multiple routes and riding communities.",
    requirement: "10 RIDES",
  },
  {
    id: "long-haul",
    number: "04",
    title: "LONG HAUL",
    description: "Complete a long-distance motorcycle journey.",
    requirement: "500+ KM",
  },
];

function RidePassport() {
  const [passport, setPassport] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeRidePassport") ||
          JSON.stringify(defaultPassport)
      );
    } catch {
      return defaultPassport;
    }
  });

  const [activeMilestone, setActiveMilestone] =
    useState("first-ride");

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(
    passport.riderName
  );

  useEffect(() => {
    localStorage.setItem(
      "mototribeRidePassport",
      JSON.stringify(passport)
    );
  }, [passport]);

  const completedMilestones = useMemo(() => {
    return {
      "first-ride": passport.rides >= 1,
      "distance-1000": passport.distance >= 1000,
      explorer: passport.rides >= 10,
      "long-haul":
        motoRides.some((ride) => ride.distance >= 500) ||
        passport.distance >= 500,
    };
  }, [passport]);

  const updateName = () => {
    const trimmedName = nameInput.trim();

    if (!trimmedName) {
      setNameInput(passport.riderName);
      setEditingName(false);
      return;
    }

    setPassport((current) => ({
      ...current,
      riderName: trimmedName.toUpperCase(),
    }));

    setEditingName(false);
  };

  const resetPassport = () => {
    setPassport(defaultPassport);
    setNameInput(defaultPassport.riderName);
  };

  const selectedMilestone = milestones.find(
    (milestone) => milestone.id === activeMilestone
  );

  return (
    <section
      className="ride-passport-section"
      id="ride-passport"
    >
      <div className="ride-passport-container">

        {/* HEADER */}

        <div className="passport-header">

          <div>
            <span className="passport-eyebrow">
              MOTOTRIBE / RIDE PASSPORT
            </span>

            <h2>
              Every ride
              <br />
              leaves a mark.
            </h2>

            <p>
              Your digital riding identity. Track
              journeys, milestones and the roads
              you've explored.
            </p>
          </div>

          <div className="passport-id-block">
            <span>PASSPORT ID</span>

            <strong>
              {passport.riderId}
            </strong>

            <small>
              MEMBER SINCE {passport.memberSince}
            </small>
          </div>

        </div>

        {/* PASSPORT CARD */}

        <div className="passport-card">

          <div className="passport-card-top">

            <div className="passport-brand">
              <span>MT</span>

              <div>
                <strong>MOTOTRIBE</strong>
                <small>DIGITAL RIDE PASSPORT</small>
              </div>
            </div>

            <span className="passport-valid">
              VERIFIED RIDER
            </span>

          </div>

          <div className="passport-card-main">

            <div className="passport-rider-info">

              <span className="rider-label">
                RIDER
              </span>

              {editingName ? (
                <div className="name-editor">

                  <input
                    value={nameInput}
                    onChange={(event) =>
                      setNameInput(event.target.value)
                    }
                    autoFocus
                  />

                  <button onClick={updateName}>
                    SAVE
                  </button>

                </div>
              ) : (
                <div className="rider-name-row">

                  <h3>
                    {passport.riderName}
                  </h3>

                  <button
                    onClick={() =>
                      setEditingName(true)
                    }
                  >
                    EDIT
                  </button>

                </div>
              )}

              <span className="rider-level">
                {passport.level}
              </span>

            </div>

            <div className="passport-emblem">
              <span>MT</span>
            </div>

          </div>

          <div className="passport-card-bottom">

            <div>
              <span>RIDES</span>
              <strong>{passport.rides}</strong>
            </div>

            <div>
              <span>DISTANCE</span>
              <strong>
                {passport.distance.toLocaleString()} KM
              </strong>
            </div>

            <div>
              <span>COMMUNITIES</span>
              <strong>{passport.communities}</strong>
            </div>

            <div>
              <span>STATUS</span>
              <strong>ACTIVE</strong>
            </div>

          </div>

        </div>

        {/* STATS */}

        <div className="passport-stat-section">

          <div className="passport-stat-heading">

            <span>RIDING PROFILE</span>

            <h3>
              Your journey
              <br />
              in numbers.
            </h3>

          </div>

          <div className="passport-stat-grid">

            <div className="passport-stat">
              <span>01</span>
              <strong>
                {passport.rides}
              </strong>
              <small>
                RECORDED RIDES
              </small>
            </div>

            <div className="passport-stat">
              <span>02</span>
              <strong>
                {passport.distance.toLocaleString()}
              </strong>
              <small>
                TOTAL KM
              </small>
            </div>

            <div className="passport-stat">
              <span>03</span>
              <strong>
                {passport.communities}
              </strong>
              <small>
                COMMUNITIES
              </small>
            </div>

            <div className="passport-stat">
              <span>04</span>
              <strong>
                {passport.countries}
              </strong>
              <small>
                COUNTRIES
              </small>
            </div>

          </div>

        </div>

        {/* MILESTONES */}

        <div className="passport-milestones">

          <div className="milestone-heading">

            <span>RIDE MILESTONES</span>

            <h3>
              Roads become
              <br />
              achievements.
            </h3>

          </div>

          <div className="milestone-layout">

            <div className="milestone-list">

              {milestones.map((milestone) => {
                const completed =
                  completedMilestones[milestone.id];

                return (
                  <button
                    key={milestone.id}
                    className={`milestone-item ${
                      activeMilestone === milestone.id
                        ? "active"
                        : ""
                    } ${
                      completed
                        ? "completed"
                        : ""
                    }`}
                    onClick={() =>
                      setActiveMilestone(milestone.id)
                    }
                  >

                    <span className="milestone-number">
                      {milestone.number}
                    </span>

                    <span className="milestone-status">
                      {completed ? "✓" : "—"}
                    </span>

                    <span className="milestone-title">
                      {milestone.title}
                    </span>

                    <span className="milestone-arrow">
                      →
                    </span>

                  </button>
                );
              })}

            </div>

            <div className="milestone-detail">

              <span className="milestone-detail-label">
                MILESTONE /{" "}
                {selectedMilestone?.number}
              </span>

              <div className="milestone-detail-icon">
                {completedMilestones[
                  activeMilestone
                ]
                  ? "✓"
                  : selectedMilestone?.number}
              </div>

              <span className="milestone-detail-title">
                {selectedMilestone?.title}
              </span>

              <p>
                {selectedMilestone?.description}
              </p>

              <small>
                TARGET /{" "}
                {selectedMilestone?.requirement}
              </small>

              <strong>
                {completedMilestones[
                  activeMilestone
                ]
                  ? "MILESTONE COMPLETED"
                  : "MILESTONE IN PROGRESS"}
              </strong>

            </div>

          </div>

        </div>

        {/* RECENT JOURNEYS */}

        <div className="passport-journeys">

          <div className="journeys-heading">

            <span>RECENT JOURNEYS</span>

            <h3>
              Roads already
              <br />
              explored.
            </h3>

          </div>

          <div className="passport-journey-list">

            {motoRides.slice(0, 3).map((ride, index) => (
              <div
                className="passport-journey"
                key={ride.id}
              >

                <span className="journey-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="journey-info">

                  <span>
                    {ride.type}
                  </span>

                  <strong>
                    {ride.name}
                  </strong>

                  <small>
                    {ride.start} →{" "}
                    {ride.destination}
                  </small>

                </div>

                <div className="journey-distance">
                  <strong>
                    {ride.distanceLabel}
                  </strong>

                  <span>
                    {ride.duration}
                  </span>
                </div>

              </div>
            ))}

          </div>

        </div>

        {/* RESET */}

        <div className="passport-controls">

          <p>
            Passport information is stored locally
            on this device for the prototype.
          </p>

          <button onClick={resetPassport}>
            RESET PASSPORT DATA
          </button>

        </div>

        {/* FOOTER */}

        <div className="passport-footer">

          <span>
            MOTOTRIBE DIGITAL IDENTITY
          </span>

          <p>
            Ride. Record. Remember.
          </p>

        </div>

      </div>
    </section>
  );
}

export default RidePassport;