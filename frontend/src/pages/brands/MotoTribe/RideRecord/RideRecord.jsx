import { useEffect, useMemo, useState } from "react";

import "./RideRecord.css";

const RECORDS_KEY = "mototribeRideRecords";
const RECORDS_UPDATED_EVENT = "mototribeRideRecordsUpdated";

const DEMO_RIDES = [
  {
    id: "ride-001",
    date: "28 AUG 2026",
    title: "NANDI HILLS SUNRISE",
    route: "BANGALORE → NANDI HILLS",
    distance: 120,
    duration: "04H 18M",
    terrain: "HILLS",
    elevation: 1478,
    rating: 9.2,
    source: "DEMO",
  },
  {
    id: "ride-002",
    date: "16 AUG 2026",
    title: "WESTERN GHATS RUN",
    route: "BANGALORE → SAKLESHPUR",
    distance: 286,
    duration: "07H 42M",
    terrain: "MOUNTAIN",
    elevation: 1210,
    rating: 9.6,
    source: "DEMO",
  },
  {
    id: "ride-003",
    date: "02 AUG 2026",
    title: "COASTAL ESCAPE",
    route: "MANGALORE → UDUPI",
    distance: 190,
    duration: "05H 12M",
    terrain: "COASTAL",
    elevation: 280,
    rating: 8.9,
    source: "DEMO",
  },
  {
    id: "ride-004",
    date: "19 JUL 2026",
    title: "COORG EXPLORER",
    route: "BANGALORE → COORG",
    distance: 260,
    duration: "06H 35M",
    terrain: "MOUNTAIN",
    elevation: 1520,
    rating: 9.4,
    source: "DEMO",
  },
];

const MILESTONE_TARGET = 15000;

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return fallback;
    }

    const parsed = JSON.parse(saved);

    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(
    Number(value || 0)
  );
}

function getNumber(value) {
  if (typeof value === "number") {
    return value;
  }

  const match = String(value ?? "").match(/[\d.]+/);

  return match ? Number(match[0]) || 0 : 0;
}

function formatRecordDate(dateValue, completedAt) {
  const rawDate = completedAt || dateValue;

  if (!rawDate) {
    return "DATE NOT AVAILABLE";
  }

  try {
    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue || rawDate).toUpperCase();
    }

    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
  } catch {
    return String(dateValue || rawDate).toUpperCase();
  }
}

function getDuration(record) {
  if (record?.duration) {
    return String(record.duration).toUpperCase();
  }

  return "RECORDED RIDE";
}

function getTerrain(record) {
  if (record?.terrain) {
    return String(record.terrain).toUpperCase();
  }

  return "ROAD";
}

function getRoute(record) {
  if (record?.route) {
    return String(record.route).toUpperCase();
  }

  const start =
    record?.start ||
    record?.origin ||
    "START";

  const destination =
    record?.destination ||
    record?.end ||
    "FINISH";

  return `${start} → ${destination}`.toUpperCase();
}

function normalizeCompletedRecord(record) {
  const distance = getNumber(record?.distance);

  const route = getRoute(record);

  const rating = Math.min(
    Math.max(getNumber(record?.rating), 0),
    10
  );

  return {
    id:
      record?.id ||
      `record-${record?.rideId || "ride"}`,

    rideId:
      record?.rideId ||
      record?.id,

    date: formatRecordDate(
      record?.date,
      record?.completedAt
    ),

    title: String(
      record?.rideName ||
        record?.title ||
        "MOTOTRIBE RIDE"
    ).toUpperCase(),

    route,

    distance,

    duration: getDuration(record),

    terrain: getTerrain(record),

    elevation: getNumber(
      record?.elevation
    ),

    rating,

    source: "COMPLETED",

    completedAt:
      record?.completedAt || "",

    organizer:
      record?.organizer || "",

    vehicle:
      record?.vehicle || null,

    totalExpense: getNumber(
      record?.totalExpense
    ),

    notes:
      record?.notes || "",

    visibility:
      record?.visibility || "PRIVATE",

    sharedAsGuide:
      Boolean(record?.sharedAsGuide),

    status:
      record?.status || "COMPLETED",
  };
}

function getCompletedRecords() {
  const savedRecords = readStorage(
    RECORDS_KEY,
    []
  );

  if (!Array.isArray(savedRecords)) {
    return [];
  }

  return savedRecords
    .filter(
      (record) =>
        record?.status === "COMPLETED"
    )
    .map(normalizeCompletedRecord)
    .sort((a, b) => {
      const first = new Date(
        a.completedAt || a.date
      ).getTime();

      const second = new Date(
        b.completedAt || b.date
      ).getTime();

      return second - first;
    });
}

function RideRecord() {
  const [completedRecords, setCompletedRecords] =
    useState(() => getCompletedRecords());

  const rides = useMemo(() => {
    const savedIds = new Set(
      completedRecords.map((ride) =>
        String(
          ride.rideId || ride.id
        )
      )
    );

    const demoRides =
      DEMO_RIDES.filter(
        (ride) =>
          !savedIds.has(
            String(ride.id)
          )
      );

    return [
      ...completedRecords,
      ...demoRides,
    ];
  }, [completedRecords]);

  const [selectedRide, setSelectedRide] =
    useState(0);

  /*
   * Synchronize completed rides when
   * PostRideSummary updates localStorage.
   */
  useEffect(() => {
    const syncRecords = () => {
      setCompletedRecords(
        getCompletedRecords()
      );
    };

    window.addEventListener(
      RECORDS_UPDATED_EVENT,
      syncRecords
    );

    window.addEventListener(
      "storage",
      syncRecords
    );

    return () => {
      window.removeEventListener(
        RECORDS_UPDATED_EVENT,
        syncRecords
      );

      window.removeEventListener(
        "storage",
        syncRecords
      );
    };
  }, []);

  /*
   * Do not call setState inside an effect
   * just to clamp the selected index.
   *
   * Instead derive a safe index during render.
   */
  const safeSelectedRide = Math.min(
    selectedRide,
    Math.max(rides.length - 1, 0)
  );

  const currentRide =
    rides[safeSelectedRide] ||
    rides[0] ||
    DEMO_RIDES[0];

  const routePoints = useMemo(() => {
    const parts =
      currentRide.route.split("→");

    return {
      start:
        parts[0]?.trim() ||
        "START",

      end:
        parts[1]?.trim() ||
        "FINISH",
    };
  }, [currentRide]);

  const riderStats = useMemo(() => {
    const completedDistance =
      completedRecords.reduce(
        (total, ride) =>
          total +
          getNumber(ride.distance),
        0
      );

    const demoDistance =
      DEMO_RIDES.reduce(
        (total, ride) =>
          total +
          getNumber(ride.distance),
        0
      );

    const totalDistance =
      completedRecords.length > 0
        ? completedDistance
        : 12840;

    const ridesCompleted =
      completedRecords.length > 0
        ? completedRecords.length
        : 47;

    const timeOnRoad =
      completedRecords.length > 0
        ? completedRecords.reduce(
            (total, ride) => {
              const duration =
                String(
                  ride.duration || ""
                );

              const hoursMatch =
                duration.match(
                  /(\d+)\s*H/
                );

              const minutesMatch =
                duration.match(
                  /(\d+)\s*M/
                );

              const hours =
                hoursMatch
                  ? Number(
                      hoursMatch[1]
                    )
                  : 0;

              const minutes =
                minutesMatch
                  ? Number(
                      minutesMatch[1]
                    )
                  : 0;

              return (
                total +
                hours +
                minutes / 60
              );
            },
            0
          )
        : 186;

    const highestAltitude =
      completedRecords.length > 0
        ? Math.max(
            0,
            ...completedRecords.map(
              (ride) =>
                getNumber(
                  ride.elevation
                )
            )
          )
        : 2640;

    return {
      totalDistance:
        totalDistance ||
        demoDistance,

      ridesCompleted,

      timeOnRoad:
        Math.round(
          timeOnRoad
        ),

      highestAltitude,
    };
  }, [completedRecords]);

  const milestoneRemaining =
    Math.max(
      MILESTONE_TARGET -
        riderStats.totalDistance,
      0
    );

  const milestoneProgress =
    Math.min(
      (riderStats.totalDistance /
        MILESTONE_TARGET) *
        100,
      100
    );

  if (!currentRide) {
    return null;
  }

  return (
    <section
      id="ride-record"
      className="ride-record"
    >
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
              <span>
                REMEMBERED.
              </span>
            </h2>

          </div>

          <div className="record-intro">

            <p>
              Your rides become part
              of your journey. Track
              distance, terrain,
              elevation and every road
              you've conquered.
            </p>

            {completedRecords.length >
              0 && (
              <div className="record-live-indicator">
                <span></span>

                {
                  completedRecords.length
                }{" "}
                COMPLETED RIDE
                {completedRecords.length ===
                1
                  ? ""
                  : "S"}{" "}
                RECORDED
              </div>
            )}

          </div>

        </div>

        {/* RIDER STATS */}

        <div className="record-stats">

          <div className="record-stat">

            <span>
              TOTAL DISTANCE
            </span>

            <strong>
              {formatNumber(
                riderStats.totalDistance
              )}
            </strong>

            <small>
              KM
            </small>

          </div>

          <div className="record-stat">

            <span>
              RIDES COMPLETED
            </span>

            <strong>
              {formatNumber(
                riderStats.ridesCompleted
              )}
            </strong>

            <small>
              RIDES
            </small>

          </div>

          <div className="record-stat">

            <span>
              TIME ON ROAD
            </span>

            <strong>
              {formatNumber(
                riderStats.timeOnRoad
              )}
            </strong>

            <small>
              HOURS
            </small>

          </div>

          <div className="record-stat">

            <span>
              HIGHEST ALTITUDE
            </span>

            <strong>
              {formatNumber(
                riderStats.highestAltitude
              )}
            </strong>

            <small>
              METERS
            </small>

          </div>

        </div>

        {/* MAIN RECORD */}

        <div className="record-main">

          {/* RIDE LIST */}

          <div className="record-list">

            <div className="record-list-title">

              <span>
                {String(
                  rides.length
                ).padStart(2, "0")}
              </span>

              RECENT JOURNEYS

            </div>

            {rides.map(
              (ride, index) => (
                <button
                  key={ride.id}
                  type="button"
                  className={
                    safeSelectedRide ===
                    index
                      ? "record-item active"
                      : "record-item"
                  }
                  onClick={() =>
                    setSelectedRide(
                      index
                    )
                  }
                  aria-pressed={
                    safeSelectedRide ===
                    index
                  }
                  aria-label={`View ${ride.title} ride record`}
                >

                  <div className="record-item-number">
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </div>

                  <div className="record-item-info">

                    <span>
                      {ride.date}
                    </span>

                    <strong>
                      {ride.title}
                    </strong>

                    <small>
                      {ride.route}
                    </small>

                    {ride.source ===
                      "COMPLETED" && (
                      <em className="record-completed-label">
                        COMPLETED / SAVED
                      </em>
                    )}

                  </div>

                  <div className="record-item-distance">
                    {formatNumber(
                      ride.distance
                    )}{" "}
                    KM
                  </div>

                  <div
                    className="record-arrow"
                    aria-hidden="true"
                  >
                    →
                  </div>

                </button>
              )
            )}

          </div>

          {/* DETAIL */}

          <div className="record-detail">

            <div className="detail-top">

              <span>
                SELECTED JOURNEY
              </span>

              <strong>
                {String(
                  safeSelectedRide + 1
                ).padStart(2, "0")}
              </strong>

            </div>

            <div className="route-visual">

              <div className="route-point start">

                <span></span>

                <small>
                  START
                </small>

                <strong>
                  {routePoints.start}
                </strong>

              </div>

              <div className="route-line">
                <span></span>
              </div>

              <div className="route-point end">

                <span></span>

                <small>
                  FINISH
                </small>

                <strong>
                  {routePoints.end}
                </strong>

              </div>

            </div>

            <h3>
              {currentRide.title}
            </h3>

            {currentRide.source ===
              "COMPLETED" && (
              <div className="record-completed-status">
                <span></span>
                RIDE COMPLETED & SAVED
              </div>
            )}

            <div className="detail-metrics">

              <div>

                <span>
                  DISTANCE
                </span>

                <strong>
                  {formatNumber(
                    currentRide.distance
                  )}{" "}
                  KM
                </strong>

              </div>

              <div>

                <span>
                  DURATION
                </span>

                <strong>
                  {currentRide.duration}
                </strong>

              </div>

              <div>

                <span>
                  TERRAIN
                </span>

                <strong>
                  {currentRide.terrain}
                </strong>

              </div>

              <div>

                <span>
                  ELEVATION
                </span>

                <strong>
                  {currentRide.elevation >
                  0
                    ? `${formatNumber(
                        currentRide.elevation
                      )} M`
                    : "NOT RECORDED"}
                </strong>

              </div>

            </div>

            {currentRide.source ===
              "COMPLETED" && (
              <div className="record-extra-details">

                <div>

                  <span>
                    STATUS
                  </span>

                  <strong>
                    {currentRide.status}
                  </strong>

                </div>

                <div>

                  <span>
                    RATING
                  </span>

                  <strong>
                    {currentRide.rating >
                    0
                      ? `${currentRide.rating}/10`
                      : "NOT RATED"}
                  </strong>

                </div>

                <div>

                  <span>
                    EXPENSES
                  </span>

                  <strong>
                    ₹
                    {formatNumber(
                      currentRide.totalExpense
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    VISIBILITY
                  </span>

                  <strong>
                    {currentRide.visibility}
                  </strong>

                </div>

                {currentRide
                  .vehicle
                  ?.name && (
                  <div>

                    <span>
                      VEHICLE
                    </span>

                    <strong>
                      {
                        currentRide
                          .vehicle
                          .name
                      }
                    </strong>

                  </div>
                )}

                {currentRide.notes && (
                  <div className="record-notes">

                    <span>
                      JOURNAL
                    </span>

                    <strong>
                      {currentRide.notes}
                    </strong>

                  </div>
                )}

              </div>
            )}

            <div className="ride-score">

              <div className="ride-score-header">

                <span>
                  RIDE EXPERIENCE
                </span>

                <strong>
                  {currentRide.rating >
                  0
                    ? `${currentRide.rating}/10`
                    : "NOT RATED"}
                </strong>

              </div>

              <div
                className="score-bar"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="10"
                aria-valuenow={
                  currentRide.rating ||
                  0
                }
                aria-label="Ride experience rating"
              >

                <span
                  style={{
                    width: `${Math.min(
                      Number(
                        currentRide.rating ||
                          0
                      ) * 10,
                      100
                    )}%`,
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

            <span>
              NEXT MILESTONE
            </span>

            <strong>
              {formatNumber(
                MILESTONE_TARGET
              )}{" "}
              KM RIDER
            </strong>

            <small>
              {milestoneRemaining >
              0
                ? `${formatNumber(
                    milestoneRemaining
                  )} KM remaining to unlock your next Ride Passport achievement.`
                : "Milestone unlocked. Your next Ride Passport achievement is ready."}
            </small>

          </div>

          <div className="milestone-progress">

            <div className="milestone-progress-labels">

              <span>
                {formatNumber(
                  riderStats.totalDistance
                )}{" "}
                KM
              </span>

              <span>
                {formatNumber(
                  MILESTONE_TARGET
                )}{" "}
                KM
              </span>

            </div>

            <div
              className="milestone-bar"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax={
                MILESTONE_TARGET
              }
              aria-valuenow={
                riderStats.totalDistance
              }
              aria-label="Ride milestone progress"
            >

              <span
                style={{
                  width: `${milestoneProgress}%`,
                }}
              ></span>

            </div>

            <small className="milestone-percentage">
              {milestoneProgress.toFixed(
                1
              )}
              % COMPLETE
            </small>

          </div>

        </div>

      </div>
    </section>
  );
}

export default RideRecord;