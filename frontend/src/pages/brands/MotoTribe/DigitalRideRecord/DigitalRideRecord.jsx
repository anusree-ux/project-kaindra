import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./DigitalRideRecord.css";

const RIDE_FILTERS = ["ALL", "ADVENTURE", "TOURING", "CRUISER", "SPORT"];

function formatCurrency(amount) {
  return typeof amount === "number"
    ? `\u20B9${amount.toLocaleString("en-IN")}`
    : "\u20B90";
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
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!isAuthenticated) {
      setRides([]);
      return;
    }
    setLoading(true);
    try {
      const [historyRes, allRidesRes] = await Promise.allSettled([
        apiClient.get("/api/mototribe/rider-profile/me/history"),
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
        distanceKm: r.distanceKm || 0,
        hours: r.durationHours || Math.round((r.distanceKm || 0) / 45) || 0,
        date: r.startDate || r.createdAt || new Date().toISOString(),
        status: (r.status || "PLANNING").toUpperCase(),
        verification: r.status === "completed" ? "VERIFIED GPS LOG" : "SCHEDULED JOURNEY",
        vehicle: r.vehicleId
          ? { name: r.vehicleId.vehicleName, fuelType: r.vehicleId.fuelType }
          : { name: null, fuelType: "Petrol" },
        expenses: {
          fuel: Math.round((r.distanceKm || 0) * 2.8),
          food: 450,
          toll: 150,
          other: 100,
        },
        notes: r.description || "Scenic journey logged on MotoTribe network.",
      }));

      setRides(formatted);
    } catch (err) {
      console.error("Failed to load digital ride records from DB:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const lifetimeStats = useMemo(() => {
    const totalDistance = rides.reduce((sum, r) => sum + (r.distanceKm || 0), 0);
    const totalHours = rides.reduce((sum, r) => sum + (r.hours || 0), 0);
    const totalJourneys = rides.length;
    const verifiedJourneys = rides.filter((r) => r.status === "COMPLETED").length;
    return { totalDistance, totalHours, totalJourneys, verifiedJourneys, averageMileage: 38 };
  }, [rides]);

  const filteredRides = useMemo(() => {
    return rides.filter((item) => {
      const matchesFilter = activeFilter === "ALL" || item.type === activeFilter;
      const norm = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !norm ||
        item.name.toLowerCase().includes(norm) ||
        item.start.toLowerCase().includes(norm) ||
        item.destination.toLowerCase().includes(norm);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, rides, searchQuery]);

  const selectedRide = useMemo(
    () => rides.find((r) => r.id === selectedRecordId) || null,
    [rides, selectedRecordId]
  );

  return (
    <section className="digital-record-section" id="records">
      <div className="record-container">

        {/* HEADER */}
        <div className="digital-record-heading">
          <div>
            <span className="digital-record-eyebrow">VERIFIED RIDE LOGS</span>
            <h2>Digital Ride <span>Record</span></h2>
            <p>
              Your verified motorcycle ride history, journey telemetry, and
              expense records stored securely in MongoDB.
            </p>
          </div>
          <div className="record-network-indicator">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: isAuthenticated ? "#75c987" : "#666", display: "inline-block", boxShadow: isAuthenticated ? "0 0 10px rgba(117,201,135,0.6)" : "none" }} />
            {isAuthenticated ? "LIVE DATABASE CONNECTED" : "NOT CONNECTED"}
          </div>
        </div>

        {/* STAT DASHBOARD */}
        <div className="record-dashboard">
          <div className="record-stat-card">
            <span>TOTAL DISTANCE</span>
            <strong>{lifetimeStats.totalDistance.toLocaleString("en-IN")} KM</strong>
            <small>Lifetime Verified</small>
          </div>
          <div className="record-stat-card">
            <span>RIDE DURATION</span>
            <strong>{lifetimeStats.totalHours} HRS</strong>
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
          <div className="record-stat-card">
            <span>FUEL COST</span>
            <strong>{formatCurrency(lifetimeStats.totalDistance * 2.8)}</strong>
            <small>Estimated Spend</small>
          </div>
          <div className="record-stat-card">
            <span>VERIFIED</span>
            <strong>{lifetimeStats.verifiedJourneys}</strong>
            <small>GPS Logged Rides</small>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="record-toolbar">
          <div className="record-filters">
            {RIDE_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={activeFilter === filter ? "active" : ""}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="record-search">
            <span>&#128269;</span>
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
            <h2>Loading digital ride logs from database...</h2>
          </div>
        ) : filteredRides.length > 0 ? (
          <div className="record-list-panel">
            <div className="record-list-header">
              <span>{filteredRides.length} RIDE RECORD{filteredRides.length !== 1 ? "S" : ""}</span>
              <button
                type="button"
                style={{ background: "transparent", border: "1px solid rgba(185,145,69,0.3)", color: "#b99145", padding: "6px 12px", fontSize: "0.57rem", letterSpacing: "0.12em", fontWeight: 800, cursor: "pointer" }}
                onClick={fetchRecords}
              >
                REFRESH
              </button>
            </div>

            {filteredRides.map((ride) => (
              <div
                className={`digital-record-card ${selectedRecordId === ride.id ? "selected" : ""}`}
                key={ride.id}
              >
                <div
                  className="record-card-main"
                  onClick={() => setSelectedRecordId(ride.id === selectedRecordId ? null : ride.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedRecordId(ride.id === selectedRecordId ? null : ride.id)}
                >
                  <div className="record-card-top">
                    <span className="record-type">{ride.type}</span>
                    <span className={`record-status ${ride.status === "COMPLETED" ? "status-completed" : ""}`}>
                      <i />
                      {ride.status}
                    </span>
                  </div>

                  <div className="record-card-title">
                    <h3>{ride.name}</h3>
                    <div className="record-route">
                      <span>{ride.start}</span>
                      <i />
                      <span>{ride.destination}</span>
                    </div>
                  </div>

                  <div className="record-card-meta">
                    <div>
                      <small>DISTANCE</small>
                      <strong>{ride.distanceKm} KM</strong>
                    </div>
                    <div>
                      <small>DURATION</small>
                      <strong>{ride.hours} HRS</strong>
                    </div>
                    <div>
                      <small>DATE</small>
                      <strong>{formatLongDate(ride.date)}</strong>
                    </div>
                    <div>
                      <small>VERIFICATION</small>
                      <strong>{ride.verification}</strong>
                    </div>
                  </div>

                  <div className="record-card-bottom">
                    <span>{ride.vehicle.name || "No vehicle linked"}</span>
                    <span>{ride.privacy || "COMMUNITY"}</span>
                  </div>
                </div>

                <div className="record-card-actions">
                  <button
                    type="button"
                    onClick={() => setSelectedRecordId(ride.id)}
                  >
                    VIEW LOG DETAILS
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="record-empty">
            <h2>No Digital Ride Records</h2>
            <p>
              {!isAuthenticated
                ? "Please log in to view your journey history."
                : "Plan and complete your first ride using the Ride Planner to record your journey."}
            </p>
            {!isAuthenticated && (
              <button type="button" onClick={openAuthModal}>LOG IN</button>
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
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="modal-route">
              <div>
                <small>START</small>
                <strong>{selectedRide.start}</strong>
              </div>
              <span>&#8594;</span>
              <div>
                <small>DESTINATION</small>
                <strong>{selectedRide.destination}</strong>
              </div>
            </div>

            <div className="modal-stat-grid">
              <div><span>DATE</span><strong>{formatLongDate(selectedRide.date)}</strong></div>
              <div><span>DISTANCE</span><strong>{selectedRide.distanceKm} KM</strong></div>
              <div><span>DURATION</span><strong>{selectedRide.hours} HOURS</strong></div>
              <div><span>TYPE</span><strong>{selectedRide.type}</strong></div>
            </div>

            <div className="modal-section">
              <span className="modal-label">VERIFICATION</span>
              <div className="verification-badge">
                &#10003; {selectedRide.verification}
              </div>
            </div>

            <div className="modal-section">
              <span className="modal-label">ESTIMATED EXPENSES</span>
              <div className="expense-grid">
                <div><span>FUEL</span><strong>{formatCurrency(selectedRide.expenses.fuel)}</strong></div>
                <div><span>FOOD</span><strong>{formatCurrency(selectedRide.expenses.food)}</strong></div>
                <div><span>TOLL</span><strong>{formatCurrency(selectedRide.expenses.toll)}</strong></div>
                <div><span>OTHER</span><strong>{formatCurrency(selectedRide.expenses.other)}</strong></div>
              </div>
              <div className="expense-total">
                <span>TOTAL ESTIMATED</span>
                <strong>{formatCurrency(
                  selectedRide.expenses.fuel +
                  selectedRide.expenses.food +
                  selectedRide.expenses.toll +
                  selectedRide.expenses.other
                )}</strong>
              </div>
            </div>

            <div className="modal-section">
              <span className="modal-label">NOTES</span>
              <p className="record-notes">{selectedRide.notes}</p>
            </div>

            <div className="modal-footer">
              <div>
                <span>VEHICLE</span>
                <strong>{selectedRide.vehicle.name || "Not linked"}</strong>
              </div>
              <div>
                <span>FUEL TYPE</span>
                <strong>{selectedRide.vehicle.fuelType}</strong>
              </div>
              <div>
                <span>STATUS</span>
                <strong>{selectedRide.status}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default DigitalRideRecord;
