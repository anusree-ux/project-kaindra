import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PostRideSummary.css";

const RECORDS_KEY = "mototribeRideRecords";
const COMPLETED_RIDES_KEY = "mototribe_completed_rides";
const PASSPORT_KEY = "mototribeRidePassport";

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

function writeStorage(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    return true;
  } catch {
    return false;
  }
}

function getNumber(value) {
  if (typeof value === "number") {
    return value;
  }

  const match = String(value ?? "").match(
    /[\d.]+/
  );

  return match ? Number(match[0]) || 0 : 0;
}

function getExpenses(rideId) {
  const keys = [
    `mototribe_expenses_${rideId}`,
    `mototribeRideExpenses_${rideId}`,
  ];

  for (const key of keys) {
    const expenses = readStorage(key, []);

    if (Array.isArray(expenses)) {
      return expenses;
    }
  }

  return [];
}

function getVehicles() {
  const vehicles = readStorage(
    "mototribe_vehicles",
    []
  );

  return Array.isArray(vehicles)
    ? vehicles
    : [];
}

function getRideDuration(ride) {
  if (ride?.duration) {
    return ride.duration;
  }

  return "Recorded ride";
}

function PostRideSummary({ ride }) {
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] =
    useState("PRIVATE");
  const [shareAsGuide, setShareAsGuide] =
    useState(false);

  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");

  const expenses = useMemo(
    () => getExpenses(ride?.id),
    [ride?.id]
  );

  const vehicles = useMemo(
    () => getVehicles(),
    []
  );

  const vehicle =
    vehicles.find(
      (item) => item.isDefault
    ) || vehicles[0];

  const distance = getNumber(
    ride?.distance
  );

  const totalExpense = expenses.reduce(
    (total, expense) =>
      total + getNumber(expense?.amount),
    0
  );

  const completeRide = () => {
    if (rating === 0) {
      setNotice(
        "Please select a rating before completing the ride."
      );

      return;
    }

    /*
      Generate the timestamp only when the
      user actually clicks COMPLETE & SAVE RIDE.

      This avoids React's:
      "Cannot call impure function during render"
      error.
    */
    const timestamp = new Date().getTime();

    const completedAt =
      new Date().toISOString();

    const rideRecord = {
      id: `record-${ride.id}-${timestamp}`,

      rideId: ride.id,

      rideName:
        ride.name || "MotoTribe Ride",

      date: ride.date || "",

      start:
        ride.start ||
        ride.origin ||
        "",

      destination:
        ride.destination || "",

      distance,

      duration:
        getRideDuration(ride),

      completedAt,

      status: "COMPLETED",

      organizer:
        ride.organizer || "",

      vehicle: vehicle
        ? {
            id: vehicle.id,

            name: vehicle.name,

            registrationNumber:
              vehicle.registrationNumber,

            fuelType:
              vehicle.fuelType,

            mileage:
              vehicle.mileage,
          }
        : null,

      expenses,

      totalExpense,

      rating,

      notes: notes.trim(),

      visibility,

      sharedAsGuide: shareAsGuide,
    };

    /*
      Save Digital Ride Record
    */

    const existingRecords =
      readStorage(
        RECORDS_KEY,
        []
      );

    const records =
      Array.isArray(existingRecords)
        ? existingRecords
        : [];

    const updatedRecords = [
      rideRecord,

      ...records.filter(
        (record) =>
          String(record.rideId) !==
          String(ride.id)
      ),
    ];

    writeStorage(
      RECORDS_KEY,
      updatedRecords
    );

    /*
      Save completed ride
    */

    const completedRides =
      readStorage(
        COMPLETED_RIDES_KEY,
        []
      );

    const completed =
      Array.isArray(completedRides)
        ? completedRides
        : [];

    const updatedCompleted = [
      {
        rideId: ride.id,

        completedAt,

        distance,

        rating,
      },

      ...completed.filter(
        (item) =>
          String(item.rideId) !==
          String(ride.id)
      ),
    ];

    writeStorage(
      COMPLETED_RIDES_KEY,
      updatedCompleted
    );

    /*
      Update Ride Passport
    */

    const passport =
      readStorage(
        PASSPORT_KEY,
        {
          rides: 0,

          distance: 0,
        }
      );

    const alreadyCompleted =
      completed.some(
        (item) =>
          String(item.rideId) ===
          String(ride.id)
      );

    writeStorage(
      PASSPORT_KEY,
      {
        ...passport,

        rides:
          Number(passport.rides || 0) +
          (alreadyCompleted
            ? 0
            : 1),

        distance:
          Number(
            passport.distance || 0
          ) +
          (alreadyCompleted
            ? 0
            : distance),
      }
    );

    /*
      Save ride lifecycle state
    */

    writeStorage(
      `mototribe_ride_lifecycle_${ride.id}`,
      {
        rideId: ride.id,

        status: "COMPLETED",

        completedAt,

        recordId:
          rideRecord.id,
      }
    );

    setSaved(true);

    setNotice(
      "Ride completed and saved to your Digital Ride Record."
    );
  };

  const shareRide = async () => {
    const text = `${ride.name || "MotoTribe Ride"}
${
  ride.start ||
  ride.origin ||
  "Start"
} → ${
      ride.destination ||
      "Destination"
    }
${distance} KM
Rating: ${rating}/5`;

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            ride.name ||
            "MotoTribe Ride",

          text,
        });

        setNotice(
          "Ride experience shared."
        );

        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          text
        );

        setNotice(
          "Ride experience copied."
        );

        return;
      }

      setNotice(
        "Sharing is not supported on this device."
      );
    } catch {
      setNotice(
        "Ride sharing was cancelled."
      );
    }
  };

  if (!ride) {
    return null;
  }

  return (
    <section className="post-ride-summary">
      <div className="post-ride-summary-header">
        <div>
          <span className="post-ride-eyebrow">
            MOTOTRIBE / RIDE COMPLETE
          </span>

          <h1>
            YOUR RIDE IS NOW A RECORD.
          </h1>

          <p>
            Save your journey, record your
            experience and share it with
            the tribe.
          </p>
        </div>

        <div className="post-ride-status">
          <span>✓</span>

          COMPLETED
        </div>
      </div>

      <div className="post-ride-hero">
        <div>
          <small>
            COMPLETED JOURNEY
          </small>

          <h2>
            {ride.name ||
              "MotoTribe Ride"}
          </h2>

          <p>
            {ride.start ||
              ride.origin ||
              "Start"}{" "}
            →{" "}
            {ride.destination ||
              "Destination"}
          </p>
        </div>

        <div className="post-ride-distance">
          <strong>
            {distance}
          </strong>

          <span>KM</span>
        </div>
      </div>

      <div className="post-ride-stats">
        <div>
          <small>
            DISTANCE
          </small>

          <strong>
            {distance} KM
          </strong>
        </div>

        <div>
          <small>
            DURATION
          </small>

          <strong>
            {getRideDuration(ride)}
          </strong>
        </div>

        <div>
          <small>
            EXPENSES
          </small>

          <strong>
            ₹
            {totalExpense.toLocaleString(
              "en-IN"
            )}
          </strong>
        </div>

        <div>
          <small>
            VEHICLE
          </small>

          <strong>
            {vehicle?.name ||
              "Not selected"}
          </strong>
        </div>
      </div>

      <div className="post-ride-grid">
        <div className="post-ride-card">
          <div className="post-ride-heading">
            <span>01</span>

            <h3>
              RATE YOUR RIDE
            </h3>
          </div>

          <div className="post-ride-stars">
            {[1, 2, 3, 4, 5].map(
              (star) => (
                <button
                  key={star}
                  type="button"
                  className={
                    star <= rating
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setRating(star)
                  }
                >
                  ★
                </button>
              )
            )}
          </div>

          <p>
            Rate your overall ride
            experience.
          </p>
        </div>

        <div className="post-ride-card">
          <div className="post-ride-heading">
            <span>02</span>

            <h3>
              RIDER JOURNAL
            </h3>
          </div>

          <textarea
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value
              )
            }
            placeholder="Write about your ride..."
            rows={6}
          />
        </div>
      </div>

      <div className="post-ride-card">
        <div className="post-ride-heading">
          <span>03</span>

          <h3>
            SHARING & GUIDE
          </h3>
        </div>

        <div className="post-ride-sharing">
          <label>
            <span>
              RIDE VISIBILITY
            </span>

            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(
                  event.target.value
                )
              }
            >
              <option value="PRIVATE">
                Private
              </option>

              <option value="CONNECTIONS">
                Connections
              </option>

              <option value="RIDE_GROUP">
                Ride Group
              </option>

              <option value="COMMUNITY">
                Community
              </option>
            </select>
          </label>

          <label className="guide-checkbox">
            <input
              type="checkbox"
              checked={shareAsGuide}
              onChange={(event) =>
                setShareAsGuide(
                  event.target.checked
                )
              }
            />

            <span>
              <strong>
                Turn this ride into a guide
              </strong>

              <small>
                Share useful experience
                information with future
                riders.
              </small>
            </span>
          </label>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="post-ride-card">
          <div className="post-ride-heading">
            <span>04</span>

            <h3>
              EXPENSE BREAKDOWN
            </h3>

            <strong>
              ₹
              {totalExpense.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

          <div className="post-ride-expenses">
            {expenses.map(
              (expense, index) => (
                <div
                  key={
                    expense.id ||
                    index
                  }
                >
                  <span>
                    {expense.category ||
                      "OTHER"}
                  </span>

                  <small>
                    {expense.note ||
                      "Ride expense"}
                  </small>

                  <strong>
                    ₹
                    {getNumber(
                      expense.amount
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {notice && (
        <div className="post-ride-notice">
          ✦ {notice}
        </div>
      )}

      <div className="post-ride-actions">
        {!saved ? (
          <button
            type="button"
            className="post-ride-primary"
            onClick={
              completeRide
            }
          >
            COMPLETE & SAVE RIDE
          </button>
        ) : (
          <>
            <button
              type="button"
              className="post-ride-primary"
              onClick={shareRide}
            >
              SHARE RIDE EXPERIENCE
            </button>

            <button
              type="button"
              className="post-ride-secondary"
              onClick={() =>
                navigate(
                  "/businesses/mototribe"
                )
              }
            >
              BACK TO MOTOTRIBE
            </button>
          </>
        )}
      </div>

      <footer className="post-ride-footer">
        EVERY RIDE BECOMES A RECORD.
      </footer>
    </section>
  );
}

export default PostRideSummary;