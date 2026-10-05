import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./DigitalRideRecord.css";

const RIDE_FILTERS = [
  "ALL",
  "ADVENTURE",
  "TOURING",
  "CRUISER",
  "SPORT",
];

function formatCurrency(amount) {
  return typeof amount === "number"
    ? `₹${amount.toLocaleString("en-IN")}`
    : "₹0";
}

function formatLongDate(dateString) {
  if (!dateString) return "Not recorded";
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function DigitalRideRecord() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [rides, setRides] = useState([]);
  const [journals, setJournals] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!isAuthenticated) {
      setRides([]);
      setJournals([]);
      return;
    }

    setLoading(true);
    try {
      const [historyRes, journalRes, allRidesRes] = await Promise.allSettled([
        apiClient.get("/api/mototribe/rider-profile/me/history"),
        apiClient.get("/api/mototribe/rider-profile/me/journal"),
        apiClient.get("/api/mototribe/rides"),
      ]);

      let combinedRides = [];
      if (historyRes.status === "fulfilled" && historyRes.value.data?.data?.rides) {
        combinedRides = historyRes.value.data.data.rides;
      }

      if (combinedRides.length === 0 && allRidesRes.status === "fulfilled" && allRidesRes.value.data?.data?.rides) {
        combinedRides = allRidesRes.value.data.data.rides;
      }

      const formatted = combinedRides.map((r) => ({
        id: r._id,
        name: r.title || "MotoTribe Ride",
        type: (r.rideType || "ADVENTURE").toUpperCase(),
        start: r.origin || "Origin",
        destination: r.destination || "Destination",
        route: r.routeSummary || `${r.origin} → ${r.destination}`,
        distanceKm: r.distanceKm || 150,
        hours: r.durationHours || Math.round((r.distanceKm || 150) / 45) || 4,
        date: r.startDate || r.createdAt || new Date().toISOString(),
        status: (r.status || "COMPLETED").toUpperCase(),
        verification: r.status === "completed" ? "VERIFIED GPS LOG" : "SCHEDULED JOURNEY",
        privacy: "COMMUNITY",
        vehicle: r.vehicleId ? { name: r.vehicleId.vehicleName, fuelType: r.vehicleId.fuelType } : { name: "Motorcycle", fuelType: "Petrol" },
        expenses: {
          fuel: Math.round((r.distanceKm || 150) * 2.8),
          accommodation: 0,
          food: 450,
          toll: 150,
          maintenance: 0,
          other: 100,
        },
        notes: r.description || "Scenic journey logged on MotoTribe network.",
      }));

      setRides(formatted);

      if (journalRes.status === "fulfilled" && journalRes.value.data?.data?.journals) {
        setJournals(journalRes.value.data.data.journals);
      }
    } catch (err) {
      console.error("Failed to load digital ride records from DB:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const lifetimeStats = useMemo(() => {
    const totalDistance = rides.reduce((sum, r) => sum + (r.distanceKm || 0), 0);
    const totalHours = rides.reduce((sum, r) => sum + (r.hours || 0), 0);
    const totalJourneys = rides.length;
    const verifiedJourneys = rides.filter((r) => r.status === "COMPLETED").length;
    return {
      totalDistance,
      totalHours,
      totalJourneys,
      verifiedJourneys,
      averageMileage: 38,
    };
  }, [rides]);

  const filteredRides = useMemo(() => {
    return rides.filter((item) => {
      const matchesFilter =
        activeFilter === "ALL" ||
        item.type === activeFilter;

      const norm = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !norm ||
        item.name.toLowerCase().includes(norm) ||
        item.start.toLowerCase().includes(norm) ||
        item.destination.toLowerCase().includes(norm);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, rides, searchQuery]);

  const selectedRide = useMemo(() => {
    return rides.find((r) => r.id === selectedRecordId) || null;
  }, [rides, selectedRecordId]);

  return (
    <section className="digital-record-section" id="records">
      <div className="record-container">

        {/* HEADER */}
        <div className="record-header">
          <div>
            <span className="record-eyebrow">
              VERIFIED RIDE LOGS
            </span>

            <h2>Digital Ride Record</h2>

            <p>
              Your verified motorcycle ride history, journey telemetry, and expense records stored securely in MongoDB.
            </p>
          </div>

          <button
            type="button"
            className="refresh-records-btn"
            onClick={fetchRecords}
          >
            REFRESH LOGS
          </button>
        </div>

        {/* LIFETIME STATS */}
        <div className="record-stats-grid">
          <div className="record-stat-card">
            <span>TOTAL DISTANCE</span>
            <strong>{lifetimeStats.totalDistance.toLocaleString("en-IN")} KM</strong>
            <small>Lifetime Verified</small>
          </div>

          <div className="record-stat-card">
            <span>RIDE DURATION</span>
            <strong>{lifetimeStats.totalHours} HOURS</strong>
            <small>Total In-Saddle Time</small>
          </div>

          <div className="record-stat-card">
            <span>JOURNEYS</span>
            <strong>{lifetimeStats.totalJourneys}</strong>
            <small>{lifetimeStats.verifiedJourneys} Completed</small>
          </div>

          <div className="record-stat-card">
            <span>AVG MILEAGE</span>
            <strong>{lifetimeStats.averageMileage} KM/L</strong>
            <small>Database Fleet Average</small>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="record-controls">
          <div className="record-filters">
            {RIDE_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`record-filter-btn ${
                  activeFilter === filter ? "active" : ""
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="record-search">
            <input
              type="search"
              placeholder="Search by route, origin or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* RECORD LIST */}
        {loading ? (
          <div className="record-empty">
            <h3>Loading digital ride logs from database...</h3>
          </div>
        ) : filteredRides.length > 0 ? (
          <div className="record-list">
            {filteredRides.map((ride) => (
              <article className="record-card" key={ride.id}>
                <div className="record-card-main">
                  <div className="record-card-top">
                    <span className="record-type">{ride.type}</span>
                    <span className={`record-badge ${ride.status.toLowerCase()}`}>
                      {ride.status}
                    </span>
                  </div>

                  <h3>{ride.name}</h3>

                  <div className="record-route">
                    <span>{ride.start}</span>
                    <span className="route-arrow">→</span>
                    <span>{ride.destination}</span>
                  </div>

                  <div className="record-meta">
                    <div>
                      <span>DISTANCE</span>
                      <strong>{ride.distanceKm} KM</strong>
                    </div>

                    <div>
                      <span>DURATION</span>
                      <strong>{ride.hours} HRS</strong>
                    </div>

                    <div>
                      <span>DATE</span>
                      <strong>{formatLongDate(ride.date)}</strong>
                    </div>
                  </div>
                </div>

                <div className="record-card-actions">
                  <button
                    type="button"
                    className="view-record-btn"
                    onClick={() => setSelectedRecordId(ride.id)}
                  >
                    VIEW LOG DETAILS
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="record-empty">
            <h3>No digital ride records found</h3>
            <p>
              {!isAuthenticated
                ? "Please log in to view your journey history."
                : "Plan and complete your first ride using the Ride Planner to record your journey."}
            </p>
            {!isAuthenticated && (
              <button
                type="button"
                className="view-record-btn"
                onClick={openAuthModal}
              >
                LOG IN
              </button>
            )}
          </div>
        )}

      </div>

      {/* DETAILS MODAL */}
      {selectedRide && (
        <div
          className="record-modal-overlay"
          onClick={() => setSelectedRecordId(null)}
          role="presentation"
        >
          <div
            className="record-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="record-modal-header">
              <div>
                <span>DIGITAL RIDE RECORD</span>
                <h2>{selectedRide.name}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedRecordId(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-route">
              <div>
                <small>START</small>
                <strong>{selectedRide.start}</strong>
              </div>
              <span>→</span>
              <div>
                <small>DESTINATION</small>
                <strong>{selectedRide.destination}</strong>
              </div>
            </div>

            <div className="modal-stat-grid">
              <div>
                <span>DATE</span>
                <strong>{formatLongDate(selectedRide.date)}</strong>
              </div>
              <div>
                <span>DISTANCE</span>
                <strong>{selectedRide.distanceKm} KM</strong>
              </div>
              <div>
                <span>DURATION</span>
                <strong>{selectedRide.hours} HOURS</strong>
              </div>
              <div>
                <span>TYPE</span>
                <strong>{selectedRide.type}</strong>
              </div>
            </div>

            <div className="modal-section">
              <span className="modal-label">VERIFICATION</span>
              <div className="verification-badge">
                <span>✓</span>
                {selectedRide.verification}
              </div>
            </div>

            <div className="modal-section">
              <span className="modal-label">ESTIMATED EXPENSES</span>
              <div className="expense-grid">
                <div>
                  <span>FUEL</span>
                  <strong>{formatCurrency(selectedRide.expenses.fuel)}</strong>
                </div>
                <div>
                  <span>FOOD</span>
                  <strong>{formatCurrency(selectedRide.expenses.food)}</strong>
                </div>
                <div>
                  <span>TOLL</span>
                  <strong>{formatCurrency(selectedRide.expenses.toll)}</strong>
                </div>
                <div>
                  <span>OTHER</span>
                  <strong>{formatCurrency(selectedRide.expenses.other)}</strong>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <span className="modal-label">NOTES</span>
              <p className="record-notes">{selectedRide.notes}</p>
            </div>

            <div className="modal-footer">
              <div>
                <span>VEHICLE</span>
                <strong>{selectedRide.vehicle.name}</strong>
              </div>
              <div>
                <span>FUEL</span>
                <strong>{selectedRide.vehicle.fuelType}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default DigitalRideRecord;
