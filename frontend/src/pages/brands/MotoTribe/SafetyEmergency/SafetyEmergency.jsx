import { useState, useEffect, useCallback } from "react";
import apiClient from "../../../../services/apiClient";
import { useAuth } from "../../../../context/AuthContext";
import "./SafetyEmergency.css";

function SafetyEmergency() {
  const { isAuthenticated, openAuthModal } = useAuth();

  const [safetyItems, setSafetyItems] = useState([
    { id: 1, label: "HELMET", checked: true },
    { id: 2, label: "RIDING GEAR", checked: true },
    { id: 3, label: "FUEL LEVEL", checked: false },
    { id: 4, label: "BIKE CONDITION", checked: true },
    { id: 5, label: "EMERGENCY CONTACT", checked: true },
  ]);

  const [activeRide, setActiveRide] = useState(null);
  const [sosAlerts, setSosAlerts] = useState([]);

  // 2-step SOS modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosResult, setSosResult] = useState(null);
  const [sosError, setSosError] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);

  // Fetch active ride & SOS history
  const fetchRideAndSosData = useCallback(async () => {
    try {
      const response = await apiClient.get("/mototribe/rides");
      const fetchedRides = response.data.data?.rides || [];

      if (fetchedRides.length > 0) {
        // Priority 1: Ongoing rides sorted by startDate ASC
        const ongoingRides = fetchedRides
          .filter((r) => r.status === "ongoing")
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        // Priority 2: Planning rides sorted by startDate ASC
        const planningRides = fetchedRides
          .filter((r) => r.status === "planning")
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        const selected = ongoingRides[0] || planningRides[0] || fetchedRides[0];
        setActiveRide(selected);

        if (selected) {
          const sosRes = await apiClient.get(`/mototribe/rides/${selected._id}/sos`);
          setSosAlerts(sosRes.data.data?.alerts || []);
        }
      }
    } catch {
      // Backend request error
    }
  }, []);

  useEffect(() => {
    fetchRideAndSosData();
  }, [fetchRideAndSosData]);

  const toggleSafety = (id) => {
    setSafetyItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, checked: !item.checked }
          : item
      )
    );
  };

  const completedCount = safetyItems.filter((item) => item.checked).length;
  const safetyPercentage = Math.round((completedCount / safetyItems.length) * 100);

  // Step 1: User clicks SOS button -> Check auth then open confirmation dialog
  const handleSOSClick = () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    setSosError("");
    setSosResult(null);
    setShowConfirmModal(true);
  };

  // Step 2: User confirms emergency SOS dispatch
  const handleConfirmSOS = async () => {
    if (!activeRide) {
      setSosError("No active ride found. SOS can only be triggered during an active ride.");
      return;
    }

    if (activeRide.status !== "ongoing") {
      setSosError(`Cannot trigger backend SOS alert when ride status is '${activeRide.status}'. Active status must be 'ongoing'.`);
      return;
    }

    setSosLoading(true);
    setSosError("");

    const sendSosRequest = async (lat, lng) => {
      try {
        const response = await apiClient.post(`/mototribe/rides/${activeRide._id}/sos`, {
          latitude: lat,
          longitude: lng,
        });

        setSosResult(response.data.data?.alert);
        fetchRideAndSosData();
      } catch (err) {
        setSosError(err.response?.data?.message || "Failed to transmit SOS emergency alert.");
      } finally {
        setSosLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendSosRequest(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback location if GPS unavailable or denied
          const fallbackLat = activeRide.originLat || 12.9716;
          const fallbackLng = activeRide.originLng || 77.5946;
          sendSosRequest(fallbackLat, fallbackLng);
        },
        { timeout: 5000 }
      );
    } else {
      const fallbackLat = activeRide.originLat || 12.9716;
      const fallbackLng = activeRide.originLng || 77.5946;
      sendSosRequest(fallbackLat, fallbackLng);
    }
  };

  // Resolve an existing alert
  const handleResolveSos = async (alertId) => {
    if (!activeRide) return;
    try {
      await apiClient.patch(`/mototribe/rides/${activeRide._id}/sos/${alertId}/resolve`);
      fetchRideAndSosData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resolve alert");
    }
  };

  const handleContact = (contact) => {
    setSelectedContact(contact);
    setTimeout(() => {
      setSelectedContact(null);
    }, 2000);
  };

  const activeAlert = sosAlerts.find((a) => a.status === "active");

  return (
    <section id="safety-emergency" className="safety-emergency">
      <div className="safety-container">

        <div className="safety-header">
          <div>
            <div className="safety-eyebrow">
              <span></span>
              SAFETY / EMERGENCY PROTOCOL
            </div>

            <h2>
              RIDE WITH
              <br />
              <span>CONFIDENCE.</span>
            </h2>
          </div>

          <div className="safety-intro">
            <p>
              Your safety comes first. Real-time emergency SOS broadcast with instant SMS dispatch to saved emergency contacts.
            </p>
            {activeRide && (
              <div style={{ marginTop: "12px", color: "#c99b45", fontSize: "11px", letterSpacing: "1px" }}>
                ACTIVE RIDE: <strong>{activeRide.title}</strong> ({activeRide.status.toUpperCase()})
              </div>
            )}
          </div>
        </div>

        <div className="safety-grid">

          <div className="safety-check">

            <div className="check-header">
              <div>
                <span>PRE-RIDE PROTOCOL</span>
                <strong>SAFETY CHECK</strong>
              </div>

              <div className="check-score">
                {safetyPercentage}%
              </div>
            </div>

            <div className="check-progress">
              <span style={{ width: `${safetyPercentage}%` }}></span>
            </div>

            <div className="check-list">
              {safetyItems.map((item) => (
                <button
                  key={item.id}
                  className={item.checked ? "check-item checked" : "check-item"}
                  onClick={() => toggleSafety(item.id)}
                >
                  <span className="check-number">0{item.id}</span>
                  <span className="check-box">{item.checked ? "✓" : ""}</span>
                  <strong>{item.label}</strong>
                  <span className="check-status">
                    {item.checked ? "READY" : "CHECK"}
                  </span>
                </button>
              ))}
            </div>

            <div className="check-result">
              <span>RIDE READINESS</span>
              <strong>
                {safetyPercentage === 100
                  ? "READY TO RIDE"
                  : "COMPLETE YOUR CHECK"}
              </strong>
            </div>
          </div>

          <div className="sos-panel">

            <div className="sos-label">
              REAL-TIME EMERGENCY RESPONSE
            </div>

            <div
              className={activeAlert || sosResult ? "sos-button active" : "sos-button"}
              onClick={handleSOSClick}
            >
              <div className="sos-ring ring-one"></div>
              <div className="sos-ring ring-two"></div>

              <div className="sos-center">
                <span>SOS</span>
                <small>
                  {activeAlert ? "ALERT ACTIVE" : "PRESS FOR HELP"}
                </small>
              </div>
            </div>

            <p>
              {activeAlert
                ? `ACTIVE SOS ALERT TRIGGERED at ${new Date(activeAlert.triggeredAt).toLocaleTimeString()}. Emergency SMS dispatched!`
                : "Press SOS button to open emergency response confirmation. Alerts broadcast live to your tribe & emergency contacts."}
            </p>

            {activeAlert && (
              <button
                onClick={() => handleResolveSos(activeAlert._id)}
                style={{
                  background: "#7d9b73",
                  color: "#080808",
                  border: "none",
                  padding: "8px 16px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  borderRadius: "4px",
                  marginBottom: "15px",
                }}
              >
                RESOLVE SOS ALERT
              </button>
            )}

            <div className="sos-status">
              <span></span>
              {activeRide ? `CONNECTED: ${activeRide.title}` : "NO ACTIVE RIDE CONNECTED"}
            </div>
          </div>
        </div>

        {/* RECENT SOS ALERTS LOG */}
        {sosAlerts.length > 0 && (
          <div style={{ marginTop: "30px", background: "#0d0f0f", border: "1px solid rgba(255,255,255,0.08)", padding: "20px" }}>
            <h4 style={{ color: "#c99b45", margin: "0 0 15px 0", fontSize: "12px", letterSpacing: "1px" }}>
              RECENT RIDE SOS LOGS ({sosAlerts.length})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sosAlerts.map((alertItem) => (
                <div key={alertItem._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                  <div>
                    <span style={{ color: alertItem.status === "active" ? "#ff4d4d" : "#7d9b73", fontWeight: "bold", fontSize: "11px", marginRight: "10px" }}>
                      [{alertItem.status.toUpperCase()}]
                    </span>
                    <span style={{ color: "#ddd", fontSize: "12px" }}>
                      Rider: {alertItem.userId?.name || alertItem.userId?.email || "Rider"}
                    </span>
                    <span style={{ color: "#777", fontSize: "11px", marginLeft: "10px" }}>
                      Location: ({alertItem.latitude?.toFixed(4)}, {alertItem.longitude?.toFixed(4)})
                    </span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#666" }}>
                    {new Date(alertItem.triggeredAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2-STEP CONFIRMATION MODAL */}
        {showConfirmModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.85)",
              zIndex: 9999,
              display: "grid",
              placeItems: "center",
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#101212",
                border: "2px solid #ff4d4d",
                borderRadius: "8px",
                maxWidth: "500px",
                width: "100%",
                padding: "30px",
                textAlign: "center",
                color: "#fff",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🚨</div>
              <h3 style={{ color: "#ff4d4d", margin: "0 0 10px 0", letterSpacing: "1px" }}>
                TRIGGER EMERGENCY SOS ALERT?
              </h3>
              <p style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.6", marginBottom: "20px" }}>
                This action will broadcast a high-priority SOS emergency alert to your ride group and dispatch SMS messages with your live GPS location to all saved emergency contacts.
              </p>

              {activeRide ? (
                <div style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)", padding: "12px", borderRadius: "4px", marginBottom: "20px", fontSize: "12px", textAlign: "left" }}>
                  <div><strong>Ride:</strong> {activeRide.title}</div>
                  <div><strong>Status:</strong> {activeRide.status}</div>
                </div>
              ) : (
                <div style={{ color: "#ff4d4d", marginBottom: "20px", fontSize: "12px" }}>
                  ⚠️ Warning: No active ongoing ride found.
                </div>
              )}

              {sosError && (
                <div style={{ color: "#ff4d4d", marginBottom: "15px", fontSize: "12px", background: "rgba(255,0,0,0.2)", padding: "10px", borderRadius: "4px" }}>
                  {sosError}
                </div>
              )}

              {sosResult && (
                <div style={{ color: "#00e676", marginBottom: "15px", fontSize: "12px", background: "rgba(0,230,118,0.2)", padding: "10px", borderRadius: "4px" }}>
                  ✅ Emergency SOS transmitted! Alert ID: {sosResult._id}
                </div>
              )}

              <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  style={{
                    padding: "12px 24px",
                    background: "#222",
                    color: "#ccc",
                    border: "1px solid #444",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  disabled={sosLoading}
                >
                  CANCEL
                </button>

                <button
                  onClick={handleConfirmSOS}
                  style={{
                    padding: "12px 24px",
                    background: "#ff4d4d",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                  }}
                  disabled={sosLoading || !activeRide || activeRide.status !== "ongoing"}
                >
                  {sosLoading ? "TRANSMITTING SOS..." : "CONFIRM & TRANSMIT SOS NOW"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="contacts-section">
          <div className="contacts-heading">
            <div>
              <span>EMERGENCY NETWORK</span>
              <strong>QUICK CONTACTS</strong>
            </div>

            <small>AVAILABLE WHEN YOU NEED THEM</small>
          </div>

          <div className="contact-grid">
            {[
              { id: 1, name: "ROAD ASSISTANCE", detail: "24 / 7 RIDER SUPPORT", action: "CALL" },
              { id: 2, name: "EMERGENCY SERVICES", detail: "IMMEDIATE ASSISTANCE", action: "CALL" },
              { id: 3, name: "TRUSTED RIDER", detail: "YOUR EMERGENCY CONTACT", action: "ALERT" },
            ].map((contact) => (
              <div
                key={contact.id}
                className={selectedContact?.id === contact.id ? "contact-card selected" : "contact-card"}
              >
                <div className="contact-number">0{contact.id}</div>
                <div className="contact-info">
                  <strong>{contact.name}</strong>
                  <span>{contact.detail}</span>
                </div>
                <button onClick={() => handleContact(contact)}>
                  {selectedContact?.id === contact.id ? "REQUESTED ✓" : contact.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="safety-note">
          <span>SYSTEM NOTICE</span>
          <p>
            Connected to real backend SOS notification service. SOS alerts require active ongoing ride status to dispatch live GPS broadcast and SMS alerts to saved rider emergency contacts.
          </p>
        </div>

      </div>
    </section>
  );
}

export default SafetyEmergency;