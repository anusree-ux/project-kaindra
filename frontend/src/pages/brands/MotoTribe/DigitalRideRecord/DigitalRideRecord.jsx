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
      const stored = localStorage.getItem("mototribeRideRecords");
      return stored ? JSON.parse(stored) : completedRideData;
    } catch {
      return completedRideData;
    }
  });

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const getRide = (rideId) =>
    motoRides.find((ride) => ride.id === rideId);

  const saveRecords = (updatedRecords) => {
    setRecords(updatedRecords);

    try {
      localStorage.setItem(
        "mototribeRideRecords",
        JSON.stringify(updatedRecords)
      );
    } catch (error) {
      console.error("Unable to save ride records:", error);
    }
  };

  const filteredRecords = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return records.filter((record) => {
      const ride = getRide(record.rideId);

      if (!ride) return false;

      const matchesSearch = [
        ride.name,
        ride.start,
        ride.destination,
        ride.type,
      ].some((value) =>
        String(value || "").toLowerCase().includes(searchTerm)
      );

      const matchesFilter =
        activeFilter === "ALL" || ride.type === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [records, search, activeFilter]);

  const totalDistance = records.reduce(
    (total, record) =>
      total + Number(record.personalDistance || 0),
    0
  );

  const totalHours = records.reduce(
    (total, record) => total + Number(record.hours || 0),
    0
  );

  const averageDistance =
    records.length > 0
      ? Math.round(totalDistance / records.length)
      : 0;

  const styleCounts = records.reduce((result, record) => {
    const ride = getRide(record.rideId);

    if (ride) {
      result[ride.type] = (result[ride.type] || 0) + 1;
    }

    return result;
  }, {});

  const favoriteStyle =
    Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "—";

  const deleteRecord = (recordId) => {
    const confirmed = window.confirm(
      "Remove this ride from your digital record?"
    );

    if (!confirmed) return;

    saveRecords(records.filter((record) => record.id !== recordId));
    setSelectedRecord(null);
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) return date;

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsedDate);
  };

  const experience = Math.min(100, records.length * 12);

  return (
    <section
      className="digital-record-section"
      id="digital-ride-record"
    >
      <div className="digital-record-container">
        {/* HEADER */}

        <header className="digital-record-header">
          <div className="digital-record-intro">
            <span className="digital-record-eyebrow">
              MOTOTRIBE / DIGITAL RIDE RECORD
            </span>

            <h2>
              Every ride.
              <br />
              <span>Remembered.</span>
            </h2>

            <p>
              Your journeys, your distance, your memories.
              Every road tells a story worth keeping.
            </p>
          </div>

          <div className="record-header-mark">
            <span className="record-mark-icon">M</span>
            <span className="record-mark-caption">PERSONAL ARCHIVE</span>
            <strong>RIDER LOG / 01</strong>
            <span className="record-mark-status">
              <i /> RECORD SYSTEM ACTIVE
            </span>
          </div>
        </header>

        {/* STATISTICS */}

        <div className="digital-record-stats">
          <div className="record-stat">
            <span className="record-stat-label">TOTAL RIDES</span>
            <strong>{records.length}</strong>
            <span className="record-stat-foot">Journeys recorded</span>
          </div>

          <div className="record-stat">
            <span className="record-stat-label">TOTAL DISTANCE</span>
            <strong>
              {totalDistance.toLocaleString("en-IN")}
              <small>KM</small>
            </strong>
            <span className="record-stat-foot">Kilometres travelled</span>
          </div>

          <div className="record-stat">
            <span className="record-stat-label">RIDING HOURS</span>
            <strong>
              {totalHours}
              <small>HRS</small>
            </strong>
            <span className="record-stat-foot">Time on the road</span>
          </div>

          <div className="record-stat">
            <span className="record-stat-label">FAVOURITE STYLE</span>
            <strong className="record-stat-style">
              {favoriteStyle}
            </strong>
            <span className="record-stat-foot">Most recorded ride type</span>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}

        <div className="digital-record-controls">
          <label className="record-search">
            <span className="record-search-icon" aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              aria-label="Search rides"
              placeholder="Search rides, destinations..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <span className="record-search-shortcut">SEARCH</span>
          </label>

          <div className="record-filters" aria-label="Filter rides">
            {["ALL", "ADVENTURE", "TOURING", "CRUISER", "SPORT"].map(
              (filter) => (
                <button
                  type="button"
                  key={filter}
                  className={activeFilter === filter ? "active" : ""}
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              )
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}

        <div className="digital-record-content">
          <div className="record-list">
            <div className="record-list-heading">
              <div>
                <span className="section-index">01 / ARCHIVE</span>
                <h3>Ride history</h3>
              </div>

              <span className="record-count">
                {String(filteredRecords.length).padStart(2, "0")} RECORDS
              </span>
            </div>

            {filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => {
                const ride = getRide(record.rideId);

                if (!ride) return null;

                return (
                  <article className="digital-ride-card" key={record.id}>
                    <div className="ride-record-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="ride-record-main">
                      <div className="ride-record-top">
                        <span className="ride-record-type">
                          {ride.type}
                        </span>

                        <span className="ride-record-status">
                          <i />
                          {record.status}
                        </span>
                      </div>

                      <h3>{ride.name}</h3>

                      <p className="ride-record-route">
                        <span>{ride.start}</span>
                        <span className="route-arrow">→</span>
                        <span>{ride.destination}</span>
                      </p>

                      <div className="ride-record-meta">
                        <span>
                          <small>DATE</small>
                          {formatDate(record.date)}
                        </span>

                        <span>
                          <small>DISTANCE</small>
                          {Number(record.personalDistance || 0).toLocaleString(
                            "en-IN"
                          )}{" "}
                          KM
                        </span>

                        <span>
                          <small>DURATION</small>
                          {record.hours} HRS
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ride-record-view"
                      onClick={() => setSelectedRecord(record)}
                      aria-label={`View details for ${ride.name}`}
                    >
                      <span>VIEW DETAILS</span>
                      <span className="view-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </button>
                  </article>
                );
              })
            ) : (
              <div className="record-empty">
                <span className="empty-icon">↗</span>
                <span className="section-index">NO MATCHING RECORDS</span>
                <h3>No rides found</h3>
                <p>
                  Try a different search term or choose another ride category.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveFilter("ALL");
                  }}
                >
                  CLEAR FILTERS
                </button>
              </div>
            )}
          </div>

          {/* SIDE PANEL */}

          <aside className="record-side-panel">
            <div className="record-side-card profile-card">
              <span className="side-card-label">YOUR RIDING PROFILE</span>

              <div className="profile-heading">
                <div>
                  <span className="profile-kicker">THE OPEN ROAD</span>
                  <h3>
                    Your road.
                    <br />
                    Your story.
                  </h3>
                </div>

                <div className="profile-emblem">M</div>
              </div>

              <p>
                Every journey adds another chapter to your riding story.
                Keep exploring, keep recording.
              </p>

              <div className="profile-progress">
                <div className="profile-progress-heading">
                  <span>RIDE EXPERIENCE</span>
                  <strong>{experience}%</strong>
                </div>

                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label="Ride experience"
                  aria-valuenow={experience}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${experience}%` }} />
                </div>
              </div>

              <div className="profile-footer">
                <span>KEEP MOVING</span>
                <span>EST. MILEAGE LOG</span>
              </div>
            </div>

            <div className="record-side-card average-card">
              <span className="side-card-label">AVERAGE RIDE</span>

              <strong className="average-distance">
                {averageDistance.toLocaleString("en-IN")}
                <small> KM</small>
              </strong>

              <p>Average distance per recorded journey.</p>

              <div className="average-card-footer">
                <span>BASED ON YOUR RECORDS</span>
                <span>↗</span>
              </div>
            </div>

            <div className="record-side-note">
              <span className="record-note-dot" />
              YOUR JOURNEYS, PRESERVED.
            </div>
          </aside>
        </div>

        {/* DETAIL MODAL */}

        {selectedRecord && (
          <div
            className="ride-record-overlay"
            onClick={() => setSelectedRecord(null)}
          >
            <div
              className="ride-record-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ride-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              {(() => {
                const ride = getRide(selectedRecord.rideId);

                if (!ride) return null;

                return (
                  <>
                    <button
                      type="button"
                      className="record-modal-close"
                      aria-label="Close ride details"
                      onClick={() => setSelectedRecord(null)}
                    >
                      ×
                    </button>

                    <span className="modal-record-label">
                      MOTOTRIBE / DIGITAL RIDE RECORD
                    </span>

                    <h2 id="ride-modal-title">{ride.name}</h2>

                    <div className="modal-route">
                      <span>{ride.start}</span>
                      <span>→</span>
                      <span>{ride.destination}</span>
                    </div>

                    <div className="modal-record-grid">
                      <div>
                        <span>DATE</span>
                        <strong>{formatDate(selectedRecord.date)}</strong>
                      </div>

                      <div>
                        <span>RIDE TYPE</span>
                        <strong>{ride.type}</strong>
                      </div>

                      <div>
                        <span>DISTANCE</span>
                        <strong>
                          {Number(
                            selectedRecord.personalDistance || 0
                          ).toLocaleString("en-IN")}{" "}
                          KM
                        </strong>
                      </div>

                      <div>
                        <span>RIDING TIME</span>
                        <strong>{selectedRecord.hours} HRS</strong>
                      </div>
                    </div>

                    <div className="modal-route-info">
                      <span>ROUTE DETAILS</span>
                      <p>{ride.route || `${ride.start} to ${ride.destination}`}</p>
                    </div>

                    <div className="modal-record-actions">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(null)}
                      >
                        CLOSE
                      </button>

                      <button
                        type="button"
                        className="delete-record"
                        onClick={() => deleteRecord(selectedRecord.id)}
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