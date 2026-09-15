import { useMemo, useState } from "react";
import "./DigitalRideRecord.css";
import { motoRides } from "../../../../data/motoRides";

const completedRideData = [
  {
    id: "record-001",
    rideId: "ride-001",
    date: "2026-08-18",
    status: "COMPLETED",
    personalDistance: 1020,
    hours: 22,
  },
  {
    id: "record-002",
    rideId: "ride-002",
    date: "2026-08-24",
    status: "COMPLETED",
    personalDistance: 310,
    hours: 7,
  },
  {
    id: "record-003",
    rideId: "ride-003",
    date: "2026-08-30",
    status: "COMPLETED",
    personalDistance: 270,
    hours: 6,
  },
];

function DigitalRideRecord() {
  const [records, setRecords] = useState(() => {
    try {
      const stored = localStorage.getItem(
        "mototribeRideRecords"
      );

      return stored
        ? JSON.parse(stored)
        : completedRideData;
    } catch {
      return completedRideData;
    }
  });

  const [activeFilter, setActiveFilter] =
    useState("ALL");

  const [search, setSearch] = useState("");

  const [selectedRecord, setSelectedRecord] =
    useState(null);

  const getRide = (rideId) =>
    motoRides.find((ride) => ride.id === rideId);

  const saveRecords = (updatedRecords) => {
    setRecords(updatedRecords);

    localStorage.setItem(
      "mototribeRideRecords",
      JSON.stringify(updatedRecords)
    );
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const ride = getRide(record.rideId);

      if (!ride) return false;

      const matchesSearch =
        ride.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        ride.start
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        ride.destination
          .toLowerCase()
          .includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === "ALL") {
        return true;
      }

      return ride.type === activeFilter;
    });
  }, [records, search, activeFilter]);

  const totalDistance = records.reduce(
    (total, record) =>
      total + Number(record.personalDistance || 0),
    0
  );

  const totalHours = records.reduce(
    (total, record) =>
      total + Number(record.hours || 0),
    0
  );

  const averageDistance =
    records.length > 0
      ? Math.round(totalDistance / records.length)
      : 0;

  const styleCounts = records.reduce(
    (result, record) => {
      const ride = getRide(record.rideId);

      if (!ride) return result;

      result[ride.type] =
        (result[ride.type] || 0) + 1;

      return result;
    },
    {}
  );

  const favoriteStyle =
    Object.entries(styleCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || "—";

  const deleteRecord = (recordId) => {
    const confirmed = window.confirm(
      "Remove this ride from your digital record?"
    );

    if (!confirmed) return;

    const updatedRecords = records.filter(
      (record) => record.id !== recordId
    );

    saveRecords(updatedRecords);

    setSelectedRecord(null);
  };

  return (
    <section
      className="digital-record-section"
      id="digital-ride-record"
    >
      <div className="digital-record-container">

        {/* HEADER */}

        <div className="digital-record-header">

          <div>
            <span className="digital-record-eyebrow">
              MOTOTRIBE / DIGITAL RIDE RECORD
            </span>

            <h2>
              Every ride.
              <br />
              Remembered.
            </h2>

            <p>
              Your digital riding history keeps track
              of the journeys, distance and experiences
              that shape your time on the road.
            </p>
          </div>

          <div className="record-header-mark">
            <span>RIDER</span>
            <strong>LOG / 01</strong>
          </div>

        </div>

        {/* STATS */}

        <div className="digital-record-stats">

          <div className="record-stat">
            <span>TOTAL RIDES</span>
            <strong>{records.length}</strong>
          </div>

          <div className="record-stat">
            <span>TOTAL DISTANCE</span>
            <strong>
              {totalDistance.toLocaleString("en-IN")}
              <small> KM</small>
            </strong>
          </div>

          <div className="record-stat">
            <span>RIDING HOURS</span>
            <strong>
              {totalHours}
              <small> HRS</small>
            </strong>
          </div>

          <div className="record-stat">
            <span>FAVOURITE STYLE</span>
            <strong className="record-stat-style">
              {favoriteStyle}
            </strong>
          </div>

        </div>

        {/* CONTROLS */}

        <div className="digital-record-controls">

          <div className="record-search">
            <input
              type="text"
              placeholder="Search your rides..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="record-filters">

            {[
              "ALL",
              "ADVENTURE",
              "TOURING",
              "CRUISER",
              "SPORT",
            ].map((filter) => (
              <button
                key={filter}
                className={
                  activeFilter === filter
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveFilter(filter)
                }
              >
                {filter}
              </button>
            ))}

          </div>

        </div>

        {/* RECORD LIST */}

        <div className="digital-record-content">

          <div className="record-list">

            <div className="record-list-heading">
              <span>RIDE HISTORY</span>

              <span>
                {filteredRecords.length} RECORDS
              </span>
            </div>

            {filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => {
                const ride = getRide(record.rideId);

                if (!ride) return null;

                return (
                  <article
                    className="digital-ride-card"
                    key={record.id}
                  >

                    <div className="ride-record-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="ride-record-main">

                      <div className="ride-record-top">

                        <span className="ride-record-type">
                          {ride.type}
                        </span>

                        <span className="ride-record-status">
                          {record.status}
                        </span>

                      </div>

                      <h3>{ride.name}</h3>

                      <p className="ride-record-route">
                        {ride.start}
                        <span>→</span>
                        {ride.destination}
                      </p>

                      <div className="ride-record-meta">

                        <span>
                          {record.date}
                        </span>

                        <span>
                          {record.personalDistance} KM
                        </span>

                        <span>
                          {record.hours} HRS
                        </span>

                      </div>

                    </div>

                    <button
                      className="ride-record-view"
                      onClick={() =>
                        setSelectedRecord(record)
                      }
                    >
                      VIEW
                    </button>

                  </article>
                );
              })
            ) : (
              <div className="record-empty">
                <span>NO RECORDS FOUND</span>

                <h3>
                  Your ride history is empty.
                </h3>

                <p>
                  Completed journeys will appear here.
                </p>
              </div>
            )}

          </div>

          {/* SIDE SUMMARY */}

          <aside className="record-side-panel">

            <div className="record-side-card">

              <span className="side-card-label">
                RIDING PROFILE
              </span>

              <h3>
                YOUR ROAD
                <br />
                STORY
              </h3>

              <p>
                Every recorded journey contributes
                to your MotoTribe riding profile.
              </p>

              <div className="profile-progress">

                <div>
                  <span>RIDE EXPERIENCE</span>
                  <strong>
                    {Math.min(
                      100,
                      records.length * 12
                    )}
                    %
                  </strong>
                </div>

                <div className="progress-track">
                  <span
                    style={{
                      width: `${Math.min(
                        100,
                        records.length * 12
                      )}%`,
                    }}
                  ></span>
                </div>

              </div>

            </div>

            <div className="record-side-card compact">

              <span className="side-card-label">
                AVERAGE RIDE
              </span>

              <strong className="average-distance">
                {averageDistance}
                <small> KM</small>
              </strong>

              <p>
                Average distance across your
                recorded journeys.
              </p>

            </div>

          </aside>

        </div>

        {/* DETAIL MODAL */}

        {selectedRecord && (
          <div
            className="ride-record-overlay"
            onClick={() =>
              setSelectedRecord(null)
            }
          >
            <div
              className="ride-record-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {(() => {
                const ride = getRide(
                  selectedRecord.rideId
                );

                if (!ride) return null;

                return (
                  <>
                    <button
                      className="record-modal-close"
                      onClick={() =>
                        setSelectedRecord(null)
                      }
                    >
                      ×
                    </button>

                    <span className="modal-record-label">
                      DIGITAL RIDE RECORD
                    </span>

                    <h2>{ride.name}</h2>

                    <div className="modal-route">
                      {ride.start}
                      <span>→</span>
                      {ride.destination}
                    </div>

                    <div className="modal-record-grid">

                      <div>
                        <span>DATE</span>
                        <strong>
                          {selectedRecord.date}
                        </strong>
                      </div>

                      <div>
                        <span>TYPE</span>
                        <strong>
                          {ride.type}
                        </strong>
                      </div>

                      <div>
                        <span>DISTANCE</span>
                        <strong>
                          {selectedRecord.personalDistance}
                          {" "}KM
                        </strong>
                      </div>

                      <div>
                        <span>RIDING TIME</span>
                        <strong>
                          {selectedRecord.hours}
                          {" "}HRS
                        </strong>
                      </div>

                    </div>

                    <div className="modal-route-info">

                      <span>ROUTE</span>

                      <p>
                        {ride.route}
                      </p>

                    </div>

                    <div className="modal-record-actions">

                      <button
                        onClick={() =>
                          setSelectedRecord(null)
                        }
                      >
                        CLOSE
                      </button>

                      <button
                        className="delete-record"
                        onClick={() =>
                          deleteRecord(
                            selectedRecord.id
                          )
                        }
                      >
                        REMOVE RECORD
                      </button>

                    </div>
                  </>
                );
              })()}

            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export default DigitalRideRecord;