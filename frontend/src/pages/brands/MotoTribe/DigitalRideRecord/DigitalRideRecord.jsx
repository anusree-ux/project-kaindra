import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { motoRides } from "../../../../data/motoRides";

import "./DigitalRideRecord.css";

const STORAGE_KEY = "mototribeRideRecords";

const RIDE_FILTERS = [
  "ALL",
  "ADVENTURE",
  "TOURING",
  "CRUISER",
  "SPORT",
];

const DEFAULT_RECORDS = [
  {
    id: "record-001",
    rideId: "ride-001",
    date: "2026-08-24",
    status: "COMPLETED",
    personalDistance: 1020,
    hours: 14,
    privacy: "PRIVATE",
    verification: "RIDER COMPLETED",
    notes:
      "Long coastal journey with multiple scenic stops.",
    expenses: {
      fuel: 2800,
      accommodation: 2200,
      food: 1400,
      toll: 650,
      maintenance: 0,
      other: 300,
    },
  },
  {
    id: "record-002",
    rideId: "ride-002",
    date: "2026-07-12",
    status: "COMPLETED",
    personalDistance: 310,
    hours: 6,
    privacy: "CONNECTIONS",
    verification: "RIDER COMPLETED",
    notes:
      "Weekend ride with mountain roads and local food stops.",
    expenses: {
      fuel: 950,
      accommodation: 0,
      food: 600,
      toll: 180,
      maintenance: 250,
      other: 100,
    },
  },
  {
    id: "record-003",
    rideId: "ride-003",
    date: "2026-06-21",
    status: "COMPLETED",
    personalDistance: 270,
    hours: 5,
    privacy: "RIDE GROUP",
    verification: "RIDER REPORTED",
    notes:
      "Early morning group ride with a scenic route.",
    expenses: {
      fuel: 800,
      accommodation: 0,
      food: 450,
      toll: 120,
      maintenance: 0,
      other: 80,
    },
  },
];

function createRecordId() {
  return `record-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeRecord(record, index) {
  return {
    id:
      typeof record?.id === "string" && record.id.trim()
        ? record.id
        : `record-${index + 1}`,

    rideId:
      typeof record?.rideId === "string"
        ? record.rideId
        : "",

    date:
      typeof record?.date === "string"
        ? record.date
        : "",

    status:
      typeof record?.status === "string"
        ? record.status.toUpperCase()
        : "COMPLETED",

    personalDistance:
      Number(record?.personalDistance) || 0,

    hours:
      Number(record?.hours) || 0,

    privacy:
      typeof record?.privacy === "string"
        ? record.privacy.toUpperCase()
        : "PRIVATE",

    verification:
      typeof record?.verification === "string"
        ? record.verification
        : "RIDER COMPLETED",

    notes:
      typeof record?.notes === "string"
        ? record.notes
        : "",

    expenses: {
      fuel: Number(record?.expenses?.fuel) || 0,
      accommodation:
        Number(record?.expenses?.accommodation) || 0,
      food: Number(record?.expenses?.food) || 0,
      toll: Number(record?.expenses?.toll) || 0,
      maintenance:
        Number(record?.expenses?.maintenance) || 0,
      other: Number(record?.expenses?.other) || 0,
    },
  };
}

function loadRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return DEFAULT_RECORDS.map(normalizeRecord);
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEFAULT_RECORDS.map(normalizeRecord);
    }

    return parsed.map(normalizeRecord);
  } catch {
    return DEFAULT_RECORDS.map(normalizeRecord);
  }
}

function formatDate(date) {
  if (!date) {
    return "DATE NOT AVAILABLE";
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLongDate(date) {
  if (!date) {
    return "DATE NOT AVAILABLE";
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getRideDistance(ride, record) {
  if (record?.personalDistance > 0) {
    return record.personalDistance;
  }

  if (!ride?.distance) {
    return 0;
  }

  const numericDistance = Number.parseFloat(
    String(ride.distance).replace(/,/g, "")
  );

  return Number.isNaN(numericDistance)
    ? 0
    : numericDistance;
}

function getTotalExpenses(expenses = {}) {
  return Object.values(expenses).reduce(
    (total, value) => total + (Number(value) || 0),
    0
  );
}

function getRecordType(ride) {
  return ride?.type || "RIDE";
}

function DigitalRideRecord() {
  const [records, setRecords] = useState(loadRecords);

  const [activeFilter, setActiveFilter] =
    useState("ALL");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedRecordId, setSelectedRecordId] =
    useState(null);

  const [message, setMessage] = useState("");

  const rideMap = useMemo(() => {
    return new Map(
      motoRides.map((ride) => [String(ride.id), ride])
    );
  }, []);

  const recordsWithRides = useMemo(() => {
    return records
      .map((record) => ({
        record,
        ride: rideMap.get(String(record.rideId)),
      }))
      .filter((item) => item.ride);
  }, [records, rideMap]);

  const validRecords = useMemo(() => {
    return recordsWithRides.map(
      (item) => item.record
    );
  }, [recordsWithRides]);

  const rideTypes = useMemo(() => {
    const types = new Set(
      recordsWithRides
        .map(({ ride }) => ride?.type)
        .filter(Boolean)
    );

    return [
      "ALL",
      ...Array.from(types).filter(
        (type) => type !== "ALL"
      ),
    ];
  }, [recordsWithRides]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return recordsWithRides.filter(
      ({ record, ride }) => {
        const matchesFilter =
          activeFilter === "ALL" ||
          ride?.type === activeFilter;

        if (!matchesFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const searchableText = [
          ride?.name,
          ride?.start,
          ride?.destination,
          ride?.type,
          ride?.organizer,
          record?.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          normalizedSearch
        );
      }
    );
  }, [
    activeFilter,
    recordsWithRides,
    searchTerm,
  ]);

  const selectedRecord = useMemo(() => {
    return records.find(
      (record) => record.id === selectedRecordId
    );
  }, [records, selectedRecordId]);

  const selectedRide = useMemo(() => {
    if (!selectedRecord) {
      return null;
    }

    return rideMap.get(
      String(selectedRecord.rideId)
    );
  }, [rideMap, selectedRecord]);

  const totalDistance = useMemo(() => {
    return recordsWithRides.reduce(
      (total, { record, ride }) =>
        total + getRideDistance(ride, record),
      0
    );
  }, [recordsWithRides]);

  const totalHours = useMemo(() => {
    return validRecords.reduce(
      (total, record) =>
        total + (Number(record.hours) || 0),
      0
    );
  }, [validRecords]);

  const totalExpenses = useMemo(() => {
    return validRecords.reduce(
      (total, record) =>
        total + getTotalExpenses(record.expenses),
      0
    );
  }, [validRecords]);

  const completedRides = useMemo(() => {
    return validRecords.filter(
      (record) =>
        record.status === "COMPLETED"
    ).length;
  }, [validRecords]);

  const regionsExplored = useMemo(() => {
    const regions = new Set();

    recordsWithRides.forEach(({ ride }) => {
      if (ride?.start) {
        regions.add(ride.start);
      }

      if (ride?.destination) {
        regions.add(ride.destination);
      }
    });

    return regions.size;
  }, [recordsWithRides]);

  const longestRide = useMemo(() => {
    return recordsWithRides.reduce(
      (longest, { record, ride }) => {
        const distance = getRideDistance(
          ride,
          record
        );

        return Math.max(longest, distance);
      },
      0
    );
  }, [recordsWithRides]);

  const averageMileage = useMemo(() => {
    if (!selectedRide?.vehicle?.mileage) {
      return null;
    }

    return Number(selectedRide.vehicle.mileage);
  }, [selectedRide]);

  const saveRecords = useCallback(
    (updatedRecords, successMessage = "") => {
      setRecords(updatedRecords);

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(updatedRecords)
        );

        if (successMessage) {
          setMessage(successMessage);
        }
      } catch {
        setMessage(
          "Ride history could not be saved on this device."
        );
      }
    },
    []
  );

  const handleDeleteRecord = (recordId) => {
    const confirmed = window.confirm(
      "Delete this ride record from your personal ride history?"
    );

    if (!confirmed) {
      return;
    }

    const updatedRecords = records.filter(
      (record) => record.id !== recordId
    );

    saveRecords(
      updatedRecords,
      "Ride record removed successfully."
    );

    if (selectedRecordId === recordId) {
      setSelectedRecordId(null);
    }
  };

  const handleCreateDemoRecord = () => {
    const availableRide = motoRides.find(
      (ride) =>
        !records.some(
          (record) =>
            String(record.rideId) ===
            String(ride.id)
        )
    );

    if (!availableRide) {
      setMessage(
        "All available demo rides already have records."
      );
      return;
    }

    const newRecord = normalizeRecord(
      {
        id: createRecordId(),
        rideId: availableRide.id,
        date:
          availableRide.date ||
          new Date().toISOString().slice(0, 10),
        status: "COMPLETED",
        personalDistance: 0,
        hours: 0,
        privacy: "PRIVATE",
        verification: "RIDER COMPLETED",
        notes:
          "Personal ride record ready for rider notes.",
        expenses: {},
      },
      records.length
    );

    saveRecords(
      [...records, newRecord],
      "New ride record created."
    );

    setSelectedRecordId(newRecord.id);
  };

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!selectedRecordId) {
      document.body.style.overflow = "";
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedRecordId(null);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow = "";
    };
  }, [selectedRecordId]);

  return (
    <section
      className="digital-ride-record-section"
      id="digital-ride-record"
    >
      <div className="digital-ride-record-shell">

        <header className="digital-record-heading">
          <div>
            <span className="digital-record-eyebrow">
              MOTOTRIBE / DIGITAL RIDE RECORD
            </span>

            <h2>
              EVERY RIDE
              <span> BECOMES A RECORD</span>
            </h2>

            <p>
              Build a personal motorcycle journey
              history. Review completed rides,
              distance, expenses, experiences and
              memories from every journey.
            </p>
          </div>

          <div className="record-network-indicator">
            <span></span>
            RIDE HISTORY ACTIVE
          </div>
        </header>

        {message && (
          <div
            className="record-message"
            role="status"
            aria-live="polite"
          >
            <span>✓</span>
            {message}
          </div>
        )}

        <div className="record-dashboard">

          <div className="record-stat-card">
            <span>TOTAL RIDES</span>
            <strong>
              {String(completedRides).padStart(
                2,
                "0"
              )}
            </strong>
            <small>COMPLETED JOURNEYS</small>
          </div>

          <div className="record-stat-card">
            <span>TOTAL DISTANCE</span>
            <strong>
              {totalDistance.toLocaleString("en-IN")}
            </strong>
            <small>KM TRAVELLED</small>
          </div>

          <div className="record-stat-card">
            <span>RIDING TIME</span>
            <strong>{totalHours}</strong>
            <small>HOURS RECORDED</small>
          </div>

          <div className="record-stat-card">
            <span>REGIONS</span>
            <strong>
              {String(regionsExplored).padStart(
                2,
                "0"
              )}
            </strong>
            <small>PLACES EXPLORED</small>
          </div>

          <div className="record-stat-card">
            <span>LONGEST RIDE</span>
            <strong>
              {longestRide.toLocaleString("en-IN")}
            </strong>
            <small>KM SINGLE JOURNEY</small>
          </div>

          <div className="record-stat-card">
            <span>RIDE EXPENSES</span>
            <strong>
              {formatCurrency(totalExpenses)}
            </strong>
            <small>RECORDED EXPENSES</small>
          </div>

        </div>

        <div className="record-toolbar">

          <div className="record-filters">
            {(rideTypes.length
              ? rideTypes
              : RIDE_FILTERS
            ).map((filter) => (
              <button
                key={filter}
                type="button"
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

          <div className="record-search">
            <span>⌕</span>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search ride history..."
              aria-label="Search ride history"
            />
          </div>

        </div>

        <div className="record-content">

          <div className="record-list-panel">

            <div className="record-list-header">
              <span>
                {String(
                  filteredRecords.length
                ).padStart(2, "0")}{" "}
                RECORDS
              </span>

              <span>
                PERSONAL RIDE HISTORY
              </span>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="record-empty-state">
                <span>NO MATCHING RIDES</span>

                <h3>
                  YOUR RIDE HISTORY IS WAITING
                </h3>

                <p>
                  No ride records match the current
                  filter or search.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("ALL");
                    setSearchTerm("");
                  }}
                >
                  CLEAR FILTERS
                </button>
              </div>
            ) : (
              filteredRecords.map(
                ({ record, ride }) => {
                  const distance =
                    getRideDistance(
                      ride,
                      record
                    );

                  const expenses =
                    getTotalExpenses(
                      record.expenses
                    );

                  const isSelected =
                    selectedRecordId ===
                    record.id;

                  return (
                    <article
                      key={record.id}
                      className={`digital-record-card ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="record-card-main"
                        onClick={() =>
                          setSelectedRecordId(
                            record.id
                          )
                        }
                        aria-label={`View ${ride.name} ride record`}
                      >
                        <div className="record-card-top">

                          <span className="record-type">
                            {getRecordType(ride)}
                          </span>

                          <span
                            className={`record-status status-${record.status.toLowerCase()}`}
                          >
                            <i></i>
                            {record.status}
                          </span>

                        </div>

                        <div className="record-card-title">

                          <h3>{ride.name}</h3>

                          <div className="record-route">
                            <span>
                              {ride.start}
                            </span>

                            <i></i>

                            <span>
                              {ride.destination}
                            </span>
                          </div>

                        </div>

                        <div className="record-card-meta">

                          <div>
                            <small>DATE</small>
                            <strong>
                              {formatDate(
                                record.date
                              )}
                            </strong>
                          </div>

                          <div>
                            <small>DISTANCE</small>
                            <strong>
                              {distance.toLocaleString(
                                "en-IN"
                              )}{" "}
                              KM
                            </strong>
                          </div>

                          <div>
                            <small>DURATION</small>
                            <strong>
                              {record.hours} HRS
                            </strong>
                          </div>

                          <div>
                            <small>EXPENSE</small>
                            <strong>
                              {formatCurrency(
                                expenses
                              )}
                            </strong>
                          </div>

                        </div>

                        <div className="record-card-bottom">

                          <span>
                            {record.verification}
                          </span>

                          <span>
                            {record.privacy}
                          </span>

                        </div>
                      </button>

                      <div className="record-card-actions">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRecordId(
                              record.id
                            )
                          }
                        >
                          VIEW RECORD
                        </button>

                        <button
                          type="button"
                          className="delete-record-button"
                          onClick={() =>
                            handleDeleteRecord(
                              record.id
                            )
                          }
                        >
                          DELETE
                        </button>

                      </div>
                    </article>
                  );
                }
              )
            )}

          </div>

          <aside className="record-insight-panel">

            <span className="panel-eyebrow">
              RIDER MEMORY
            </span>

            <h3>
              EVERY JOURNEY
              <span> BUILDS YOUR STORY.</span>
            </h3>

            <p>
              MotoTribe keeps your completed rides
              connected to distance, vehicle data,
              expenses, experiences and journey
              memories.
            </p>

            <div className="record-progress">

              <div className="progress-heading">
                <span>RIDE HISTORY</span>
                <strong>
                  {validRecords.length}
                </strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      validRecords.length * 8.33,
                      100
                    )}%`,
                  }}
                ></div>
              </div>

              <small>
                Your personal journey archive
                grows with every completed ride.
              </small>

            </div>

            <div className="record-insight-grid">

              <div>
                <span>LONGEST</span>
                <strong>
                  {longestRide.toLocaleString(
                    "en-IN"
                  )}{" "}
                  KM
                </strong>
              </div>

              <div>
                <span>RIDING TIME</span>
                <strong>
                  {totalHours} HRS
                </strong>
              </div>

              <div>
                <span>REGIONS</span>
                <strong>
                  {regionsExplored}
                </strong>
              </div>

              <div>
                <span>EXPENSES</span>
                <strong>
                  {formatCurrency(
                    totalExpenses
                  )}
                </strong>
              </div>

            </div>

            <div className="record-guide-box">

              <span>
                EVERY RECORD BECOMES A GUIDE
              </span>

              <p>
                Completed journeys can eventually
                contribute rider experiences,
                road conditions, recommendations,
                warnings and route knowledge to the
                MotoTribe community.
              </p>

            </div>

            <button
              type="button"
              className="create-record-button"
              onClick={handleCreateDemoRecord}
            >
              + CREATE RIDE RECORD
            </button>

          </aside>

        </div>

        <div className="record-lifecycle">

          <div className="lifecycle-heading">
            <span>
              MOTOTRIBE / KNOWLEDGE CYCLE
            </span>

            <h3>
              PLAN → RIDE → RECORD → SHARE → GUIDE
            </h3>
          </div>

          <div className="lifecycle-track">

            <div className="lifecycle-step active">
              <span>01</span>
              <strong>PLAN</strong>
              <small>Build the journey</small>
            </div>

            <div className="lifecycle-line"></div>

            <div className="lifecycle-step active">
              <span>02</span>
              <strong>RIDE</strong>
              <small>Take the journey</small>
            </div>

            <div className="lifecycle-line"></div>

            <div className="lifecycle-step active">
              <span>03</span>
              <strong>RECORD</strong>
              <small>Save the experience</small>
            </div>

            <div className="lifecycle-line"></div>

            <div className="lifecycle-step">
              <span>04</span>
              <strong>SHARE</strong>
              <small>Choose visibility</small>
            </div>

            <div className="lifecycle-line"></div>

            <div className="lifecycle-step">
              <span>05</span>
              <strong>GUIDE</strong>
              <small>Help future riders</small>
            </div>

          </div>

        </div>

      </div>

      {selectedRecord && selectedRide && (
        <div
          className="record-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedRecordId(null);
            }
          }}
        >
          <div
            className="record-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ride-record-modal-title"
          >

            <div className="record-modal-header">

              <div>
                <span>
                  DIGITAL RIDE RECORD
                </span>

                <h2 id="ride-record-modal-title">
                  {selectedRide.name}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedRecordId(null)
                }
                aria-label="Close ride record"
              >
                ×
              </button>

            </div>

            <div className="modal-route">

              <div>
                <small>START</small>
                <strong>
                  {selectedRide.start}
                </strong>
              </div>

              <span>→</span>

              <div>
                <small>DESTINATION</small>
                <strong>
                  {selectedRide.destination}
                </strong>
              </div>

            </div>

            <div className="modal-stat-grid">

              <div>
                <span>DATE</span>
                <strong>
                  {formatLongDate(
                    selectedRecord.date
                  )}
                </strong>
              </div>

              <div>
                <span>DISTANCE</span>
                <strong>
                  {getRideDistance(
                    selectedRide,
                    selectedRecord
                  ).toLocaleString(
                    "en-IN"
                  )}{" "}
                  KM
                </strong>
              </div>

              <div>
                <span>DURATION</span>
                <strong>
                  {selectedRecord.hours} HOURS
                </strong>
              </div>

              <div>
                <span>TYPE</span>
                <strong>
                  {selectedRide.type ||
                    "RIDE"}
                </strong>
              </div>

            </div>

            <div className="modal-section">

              <span className="modal-label">
                RIDE ROUTE
              </span>

              <p>
                {selectedRide.route ||
                  `${selectedRide.start} → ${selectedRide.destination}`}
              </p>

            </div>

            <div className="modal-section">

              <span className="modal-label">
                VERIFICATION
              </span>

              <div className="verification-badge">
                <span>●</span>
                {selectedRecord.verification}
              </div>

            </div>

            <div className="modal-section">

              <span className="modal-label">
                PRIVACY
              </span>

              <div className="privacy-options">

                <span
                  className={
                    selectedRecord.privacy ===
                    "PRIVATE"
                      ? "active"
                      : ""
                  }
                >
                  🔒 PRIVATE
                </span>

                <span
                  className={
                    selectedRecord.privacy ===
                    "CONNECTIONS"
                      ? "active"
                      : ""
                  }
                >
                  👥 CONNECTIONS
                </span>

                <span
                  className={
                    selectedRecord.privacy ===
                    "RIDE GROUP"
                      ? "active"
                      : ""
                  }
                >
                  🏍️ RIDE GROUP
                </span>

                <span
                  className={
                    selectedRecord.privacy ===
                    "COMMUNITY"
                      ? "active"
                      : ""
                  }
                >
                  🌍 COMMUNITY
                </span>

              </div>

            </div>

            <div className="modal-section">

              <span className="modal-label">
                JOURNEY EXPENSES
              </span>

              <div className="expense-grid">

                <div>
                  <span>FUEL</span>
                  <strong>
                    {formatCurrency(
                      selectedRecord
                        .expenses.fuel
                    )}
                  </strong>
                </div>

                <div>
                  <span>STAY</span>
                  <strong>
                    {formatCurrency(
                      selectedRecord
                        .expenses
                        .accommodation
                    )}
                  </strong>
                </div>

                <div>
                  <span>FOOD</span>
                  <strong>
                    {formatCurrency(
                      selectedRecord
                        .expenses.food
                    )}
                  </strong>
                </div>

                <div>
                  <span>TOLL</span>
                  <strong>
                    {formatCurrency(
                      selectedRecord
                        .expenses.toll
                    )}
                  </strong>
                </div>

                <div>
                  <span>MAINTENANCE</span>
                  <strong>
                    {formatCurrency(
                      selectedRecord
                        .expenses
                        .maintenance
                    )}
                  </strong>
                </div>

                <div>
                  <span>OTHER</span>
                  <strong>
                    {formatCurrency(
                      selectedRecord
                        .expenses.other
                    )}
                  </strong>
                </div>

              </div>

              <div className="expense-total">
                <span>TOTAL RIDE EXPENDITURE</span>
                <strong>
                  {formatCurrency(
                    getTotalExpenses(
                      selectedRecord.expenses
                    )
                  )}
                </strong>
              </div>

            </div>

            <div className="modal-section">

              <span className="modal-label">
                RIDER NOTES
              </span>

              <p className="record-notes">
                {selectedRecord.notes ||
                  "No rider notes have been added yet."}
              </p>

            </div>

            <div className="modal-footer">

              <div>
                <span>VEHICLE</span>
                <strong>
                  {selectedRide.vehicle?.name ||
                    "Not recorded"}
                </strong>
              </div>

              <div>
                <span>FUEL</span>
                <strong>
                  {selectedRide.vehicle
                    ?.fuelType ||
                    "Not recorded"}
                </strong>
              </div>

              <div>
                <span>MILEAGE</span>
                <strong>
                  {averageMileage
                    ? `${averageMileage} KM/L`
                    : "Not recorded"}
                </strong>
              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
}

export default DigitalRideRecord;