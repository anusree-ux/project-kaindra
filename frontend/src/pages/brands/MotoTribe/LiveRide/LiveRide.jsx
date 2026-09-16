import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./LiveRide.css";

function LiveRide() {
  const { isAuthenticated } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [liveLocations, setLiveLocations] = useState([]);
  const [routeReports, setRouteReports] = useState([]);
  const [fuelEstimate, setFuelEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [sosSubmitting, setSosSubmitting] = useState(false);
  const [sosStatusMsg, setSosStatusMsg] = useState("");

  // Select active ride deterministically
  const fetchActiveRide = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.get("/api/mototribe/rides");
      const rides = res.data?.data?.rides || [];

      const ongoingRides = rides
        .filter((r) => r.status === "ongoing")
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      const planningRides = rides
        .filter((r) => r.status === "planning")
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      const selected = ongoingRides[0] || planningRides[0] || null;
      setActiveRide(selected);
    } catch {
      setActiveRide(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchActiveRide();
  }, [fetchActiveRide]);

  // Fetch Live Locations, Route Reports & Fuel Estimate for active ride
  useEffect(() => {
    if (!activeRide?._id) return;

    const fetchRideData = async () => {
      // 1. Live Locations
      try {
        const locRes = await apiClient.get(`/api/mototribe/rides/${activeRide._id}/live-locations`);
        setLiveLocations(locRes.data?.data?.locations || []);
      } catch {
        setLiveLocations([]);
      }

      // 2. Route Reports
      try {
        const orig = typeof activeRide.origin === "object" ? activeRide.origin.name : activeRide.origin;
        const dest = typeof activeRide.destination === "object" ? activeRide.destination.name : activeRide.destination;

        if (orig && dest) {
          const repRes = await apiClient.get(`/api/mototribe/route-reports?origin=${encodeURIComponent(orig)}&destination=${encodeURIComponent(dest)}`);
          setRouteReports(repRes.data?.data?.reports || []);
        }
      } catch {
        setRouteReports([]);
      }

      // 3. Fuel Cost Estimate
      try {
        const fuelRes = await apiClient.get(`/api/mototribe/rides/${activeRide._id}/fuel-estimate`);
        setFuelEstimate(fuelRes.data?.data || null);
      } catch {
        setFuelEstimate(null);
      }
    };

    fetchRideData();
  }, [activeRide]);

  // Format Origin / Destination names
  const originName = useMemo(() => {
    if (!activeRide) return "N/A";
    return typeof activeRide.origin === "object" ? activeRide.origin.name : activeRide.origin;
  }, [activeRide]);

  const destName = useMemo(() => {
    if (!activeRide) return "N/A";
    return typeof activeRide.destination === "object" ? activeRide.destination.name : activeRide.destination;
  }, [activeRide]);

  // SOS Trigger Handler with 2-Step Confirmation
  const handleTriggerSos = async () => {
    if (!activeRide?._id) return;

    try {
      setSosSubmitting(true);
      setSosStatusMsg("");

      // Attempt to get browser coordinates or default to ride origin
      let lat = activeRide.originLat || 12.9716;
      let lng = activeRide.originLng || 77.5946;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          // Fallback to ride coordinates
        }
      }

      const res = await apiClient.post(`/api/mototribe/rides/${activeRide._id}/sos`, {
        latitude: lat,
        longitude: lng,
      });

      setSosStatusMsg(res.data?.message || "EMERGENCY SOS ALERT TRIGGERED! SMS notifications sent to emergency contacts.");
    } catch (err) {
      setSosStatusMsg(err.response?.data?.message || "Failed to trigger SOS. Ensure ride status is 'ongoing'.");
    } finally {
      setSosSubmitting(false);
    }
  };

  return (
    <section className="live-ride-section" id="live-ride">
      <div className="live-ride-shell">
        <div className="live-ride-header">
          <div>
            <span className="live-eyebrow">MOTOTRIBE / LIVE JOURNEY</span>

            <h2>
              LIVE
              <span> RIDE</span>
            </h2>

            <p>
              Stay connected with your ride group, monitor live positions, and
              access safety alerts while the journey is active.
            </p>
          </div>

          <div className="live-status-box">
            <span className="live-pulse"></span>
            <div>
              <small>EVENT STATUS</small>
              <strong>{activeRide ? activeRide.status.toUpperCase() : "NO RIDE"}</strong>
            </div>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="live-ride-empty">
            <h3>AUTHENTICATION REQUIRED</h3>
            <p>Please log in to view live ride metrics and group tracking.</p>
          </div>
        ) : loading ? (
          <div className="live-ride-empty">
            <div className="empty-spinner"></div>
            <h3>LOADING LIVE RIDE DATA...</h3>
          </div>
        ) : !activeRide ? (
          <div className="live-ride-empty">
            <h3>NO ACTIVE RIDE IN PROGRESS</h3>
            <p>You have no ongoing or planned rides currently active.</p>
          </div>
        ) : (
          <>
            <div className="live-event-bar">
              <div>
                <span>RIDE</span>
                <strong>{activeRide.title}</strong>
              </div>

              <div>
                <span>ROUTE</span>
                <strong>{originName} → {destName}</strong>
              </div>

              <div>
                <span>LIVE RIDERS</span>
                <strong>{liveLocations.length} ACTIVE</strong>
              </div>

              <div>
                <span>TRIP ESTIMATE</span>
                <strong>{fuelEstimate?.estimatedCostInr ? `₹${fuelEstimate.estimatedCostInr}` : "COMPUTING"}</strong>
              </div>
            </div>

            <div className="live-tabs">
              {["OVERVIEW", "LIVE POSITIONS", "ROUTE REPORTS", "SAFETY & SOS"].map((tab) => (
                <button
                  key={tab}
                  className={activeTab === tab ? "active" : ""}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "OVERVIEW" && (
              <div className="live-overview">
                <div className="live-main-column">
                  <div className="live-map-card">
                    <div className="map-card-header">
                      <div>
                        <span>LIVE ROUTE</span>
                        <strong>{originName} → {destName}</strong>
                      </div>

                      <div className="map-live-indicator">
                        <span></span>
                        LIVE TRACKING
                      </div>
                    </div>

                    <div className="route-map">
                      <div className="map-grid"></div>

                      <div className="mountain-shape mountain-one"></div>
                      <div className="mountain-shape mountain-two"></div>

                      <div className="route-path">
                        <span className="route-node route-start"></span>
                        <span className="route-node route-current"></span>
                        <span className="route-node route-end"></span>
                      </div>

                      <div className="current-location">
                        <span className="current-location-pulse"></span>
                        <span className="current-location-dot"></span>
                      </div>

                      <div className="map-label label-start">{originName}</div>
                      <div className="map-label label-end">{destName}</div>
                    </div>
                  </div>

                  <div className="live-stat-grid">
                    <div className="live-stat-card">
                      <span>DISTANCE</span>
                      <strong>{activeRide.distanceKm ? `${activeRide.distanceKm} KM` : "--"}</strong>
                      <small>PLANNED</small>
                    </div>

                    <div className="live-stat-card">
                      <span>DURATION</span>
                      <strong>{activeRide.durationDays ? `${activeRide.durationDays} DAYS` : "1 DAY"}</strong>
                      <small>PLANNED DURATION</small>
                    </div>

                    <div className="live-stat-card">
                      <span>ESTIMATED FUEL</span>
                      <strong>{fuelEstimate?.litersNeeded ? `${fuelEstimate.litersNeeded} L` : "--"}</strong>
                      <small>TOTAL LITERS NEEDED</small>
                    </div>

                    <div className="live-stat-card">
                      <span>ESTIMATED COST</span>
                      <strong>{fuelEstimate?.estimatedCostInr ? `₹${fuelEstimate.estimatedCostInr}` : "--"}</strong>
                      <small>BASED ON STATE MEDIAN</small>
                    </div>
                  </div>
                </div>

                <aside className="live-side-column">
                  <div className="participants-card">
                    <div className="card-heading">
                      <div>
                        <span>COMMUNITY HAZARDS</span>
                        <h3>ROUTE REPORTS</h3>
                      </div>
                      <strong>{routeReports.length}</strong>
                    </div>

                    <div className="participant-list">
                      {routeReports.length === 0 ? (
                        <p className="no-reports-msg">No community route reports for this route yet.</p>
                      ) : (
                        routeReports.map((report) => (
                          <div className="live-participant" key={report._id}>
                            <div className="rider-avatar">⚠️</div>
                            <div className="rider-info">
                              <strong>{report.reportType.toUpperCase()}</strong>
                              <small>{report.content}</small>
                            </div>
                            <div className="rider-status">
                              👍 {report.helpfulCount || 0}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {activeTab === "LIVE POSITIONS" && (
              <div className="full-tab-panel">
                <div className="panel-title">
                  <span>LIVE TRACKING</span>
                  <h3>RIDER POSITIONS</h3>
                </div>

                <div className="expanded-participants">
                  {liveLocations.length === 0 ? (
                    <p className="no-reports-msg">No live rider location updates yet.</p>
                  ) : (
                    liveLocations.map((loc) => (
                      <div className="expanded-rider" key={loc._id}>
                        <div className="expanded-rider-avatar">📍</div>
                        <div className="expanded-rider-main">
                          <strong>{loc.userId?.name || "Rider"}</strong>
                          <span>Lat: {loc.latitude.toFixed(4)}, Lng: {loc.longitude.toFixed(4)}</span>
                        </div>
                        <div className="expanded-rider-distance">
                          <small>LAST UPDATE</small>
                          <strong>{new Date(loc.updatedAt).toLocaleTimeString()}</strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "ROUTE REPORTS" && (
              <div className="full-tab-panel">
                <div className="panel-title">
                  <span>COMMUNITY ROAD KNOWLEDGE</span>
                  <h3>ROUTE HAZARDS & TIPS</h3>
                </div>

                <div className="expanded-participants">
                  {routeReports.length === 0 ? (
                    <p className="no-reports-msg">No community route reports found for {originName} → {destName}.</p>
                  ) : (
                    routeReports.map((rep) => (
                      <div className="expanded-rider" key={rep._id}>
                        <div className="expanded-rider-avatar">💬</div>
                        <div className="expanded-rider-main">
                          <strong>{rep.reportType.replace("_", " ").toUpperCase()}</strong>
                          <p>{rep.content}</p>
                        </div>
                        <div className="expanded-rider-distance">
                          <small>HELPFUL</small>
                          <strong>{rep.helpfulCount || 0} Votes</strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "SAFETY & SOS" && (
              <div className="safety-dashboard">
                <div className="safety-main">
                  <span className="live-eyebrow">EMERGENCY SOS RESPONSE</span>
                  <h3>RIDE SAFETY CENTER</h3>
                  <p>
                    Triggering an Emergency SOS dispatches real SMS alerts with live coordinates to your emergency contacts and broadcasts to all ride participants.
                  </p>

                  <div className="emergency-card">
                    <span>EMERGENCY ACCESS</span>
                    <button
                      className="sos-confirm-trigger-btn"
                      onClick={() => setShowEmergencyModal(true)}
                    >
                      TRIGGER EMERGENCY SOS
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2-Step SOS Confirmation Modal */}
            {showEmergencyModal && (
              <div className="emergency-overlay">
                <div className="emergency-modal">
                  <button
                    className="close-emergency"
                    onClick={() => {
                      setShowEmergencyModal(false);
                      setSosStatusMsg("");
                    }}
                  >
                    ×
                  </button>

                  <span>SAFETY RESPONSE CONFIRMATION</span>
                  <h3>ARE YOU SURE YOU WANT TO TRIGGER SOS?</h3>

                  <p>
                    This will send real SMS emergency alerts with your current coordinates to your configured emergency contacts and broadcast to the ride group.
                  </p>

                  {sosStatusMsg && (
                    <div className={`sos-alert-status ${sosStatusMsg.includes("EMERGENCY") ? "success" : "error"}`}>
                      {sosStatusMsg}
                    </div>
                  )}

                  <div className="emergency-options">
                    <button
                      className="confirm-sos-btn"
                      onClick={handleTriggerSos}
                      disabled={sosSubmitting}
                    >
                      {sosSubmitting ? "TRIGGERING SOS..." : "YES, TRIGGER EMERGENCY SOS NOW"}
                    </button>
                    <button
                      className="cancel-sos-btn"
                      onClick={() => {
                        setShowEmergencyModal(false);
                        setSosStatusMsg("");
                      }}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default LiveRide;