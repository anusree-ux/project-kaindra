import { useEffect, useMemo, useState } from "react";
import "./LiveRide.css";

const initialParticipants = [
  {
    id: 1,
    name: "Arjun",
    initials: "AR",
    role: "ORGANIZER",
    distance: 184,
    status: "LEADING",
    online: true,
  },
  {
    id: 2,
    name: "Riya",
    initials: "RI",
    role: "RIDER",
    distance: 181,
    status: "RIDING",
    online: true,
  },
  {
    id: 3,
    name: "Vikram",
    initials: "VK",
    role: "RIDER",
    distance: 178,
    status: "RIDING",
    online: true,
  },
  {
    id: 4,
    name: "Neha",
    initials: "NE",
    role: "RIDER",
    distance: 176,
    status: "RIDING",
    online: true,
  },
  {
    id: 5,
    name: "Rahul",
    initials: "RA",
    role: "RIDER",
    distance: 170,
    status: "REST STOP",
    online: true,
  },
  {
    id: 6,
    name: "Karan",
    initials: "KA",
    role: "RIDER",
    distance: 168,
    status: "RIDING",
    online: false,
  },
];



const initialMessages = [
  {
    id: 1,
    name: "Arjun",
    initials: "AR",
    message: "Everyone ready for the next mountain section?",
    time: "10:32",
  },
  {
    id: 2,
    name: "Riya",
    initials: "RI",
    message: "Ready. Weather looks clear ahead.",
    time: "10:34",
  },
  {
    id: 3,
    name: "MotoTribe AI",
    initials: "AI",
    message: "Next recommended fuel stop is approximately 28 KM ahead.",
    time: "10:36",
    ai: true,
  },
];

function LiveRide() {
  const [participants, setParticipants] = useState(initialParticipants);
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");

  const [rideStatus, setRideStatus] = useState("LIVE");
  const [isRecording, setIsRecording] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [showEmergency, setShowEmergency] = useState(false);

  const [distance, setDistance] = useState(184);
  const [elapsedSeconds, setElapsedSeconds] = useState(3 * 3600 + 42 * 60);

  const [activeTab, setActiveTab] = useState("OVERVIEW");

  useEffect(() => {
    if (rideStatus !== "LIVE" || !isRecording) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((current) => current + 1);

      setDistance((current) => {
        if (current >= 540) {
          return 540;
        }

        return Number((current + 0.02).toFixed(2));
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rideStatus, isRecording]);

  const progress = useMemo(() => {
    return Math.min((distance / 540) * 100, 100);
  }, [distance]);

  const remainingDistance = Math.max(540 - distance, 0);

  const eta = useMemo(() => {
    if (distance <= 0) {
      return "—";
    }

    const averageSpeed = 52;
    const remainingHours = remainingDistance / averageSpeed;

    const hours = Math.floor(remainingHours);
    const minutes = Math.round((remainingHours - hours) * 60);

    return `${hours}h ${minutes}m`;
  }, [distance, remainingDistance]);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(secs).padStart(2, "0"),
    ].join(":");
  };

  const toggleRecording = () => {
    setIsRecording((current) => !current);
  };

  const completeRide = () => {
    setRideStatus("COMPLETED");
    setIsRecording(false);
  };

  const sendMessage = (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        name: "You",
        initials: "YOU",
        message: trimmedMessage,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      },
    ]);

    setMessage("");
  };

  const addAnnouncement = () => {
    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        name: "MotoTribe AI",
        initials: "AI",
        message:
          "Journey update: maintain group distance. A rest opportunity is available ahead.",
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        ai: true,
      },
    ]);
  };

  const simulateRiderUpdate = () => {
    setParticipants((current) =>
      current.map((rider, index) => {
        if (index === current.length - 1) {
          return {
            ...rider,
            distance: Math.min(rider.distance + 1, distance),
            status: "RIDING",
            online: true,
          };
        }

        return rider;
      })
    );
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
              Stay connected with your ride group, monitor journey progress,
              communicate with riders and access safety information while the
              journey is active.
            </p>
          </div>

          <div className="live-status-box">
            <span className="live-pulse"></span>
            <div>
              <small>EVENT STATUS</small>
              <strong>{rideStatus}</strong>
            </div>
          </div>
        </div>

        <div className="live-event-bar">
          <div>
            <span>RIDE</span>
            <strong>MANALI MOUNTAIN ESCAPE</strong>
          </div>

          <div>
            <span>ROUTE</span>
            <strong>DELHI → MANALI</strong>
          </div>

          <div>
            <span>RIDERS</span>
            <strong>{participants.length} ACTIVE</strong>
          </div>

          <div>
            <span>RECORDING</span>
            <strong>{isRecording ? "ACTIVE" : "PAUSED"}</strong>
          </div>
        </div>

        <div className="live-tabs">
          {["OVERVIEW", "PARTICIPANTS", "CHAT", "SAFETY"].map((tab) => (
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
                    <strong>DELHI → MANALI</strong>
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

                  <div className="map-label label-start">DELHI</div>
                  <div className="map-label label-current">
                    CURRENT POSITION
                  </div>
                  <div className="map-label label-end">MANALI</div>

                  <div className="map-service service-fuel">FUEL</div>
                  <div className="map-service service-rest">REST</div>
                  <div className="map-service service-warning">
                    WARNING
                  </div>
                </div>

                <div className="map-progress">
                  <div className="progress-heading">
                    <span>JOURNEY PROGRESS</span>
                    <strong>{Math.round(progress)}%</strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-value"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="progress-distance">
                    <span>0 KM</span>
                    <strong>{distance.toFixed(0)} KM COMPLETED</strong>
                    <span>540 KM</span>
                  </div>
                </div>
              </div>

              <div className="live-stat-grid">
                <div className="live-stat-card">
                  <span>DISTANCE</span>
                  <strong>{distance.toFixed(0)} KM</strong>
                  <small>OF 540 KM</small>
                </div>

                <div className="live-stat-card">
                  <span>RIDE TIME</span>
                  <strong>{formatDuration(elapsedSeconds)}</strong>
                  <small>ACTIVE DURATION</small>
                </div>

                <div className="live-stat-card">
                  <span>REMAINING</span>
                  <strong>{remainingDistance.toFixed(0)} KM</strong>
                  <small>TO DESTINATION</small>
                </div>

                <div className="live-stat-card">
                  <span>ETA</span>
                  <strong>{eta}</strong>
                  <small>ESTIMATED</small>
                </div>
              </div>
            </div>

            <aside className="live-side-column">
              <div className="participants-card">
                <div className="card-heading">
                  <div>
                    <span>RIDE GROUP</span>
                    <h3>PARTICIPANTS</h3>
                  </div>

                  <strong>{participants.length}</strong>
                </div>

                <div className="participant-list">
                  {participants.map((rider) => (
                    <div className="live-participant" key={rider.id}>
                      <div className="rider-avatar">
                        {rider.initials}
                        {rider.online && <span></span>}
                      </div>

                      <div className="rider-info">
                        <strong>{rider.name}</strong>
                        <small>
                          {rider.role} · {rider.distance} KM
                        </small>
                      </div>

                      <div className="rider-status">
                        {rider.status}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="secondary-action"
                  onClick={simulateRiderUpdate}
                >
                  REFRESH RIDER POSITIONS
                  <span>↻</span>
                </button>
              </div>

              <div className="ai-coordinator-card">
                <div className="ai-card-heading">
                  <span className="ai-symbol">AI</span>

                  <div>
                    <span>MOTOTRIBE AI</span>
                    <strong>RIDE COORDINATOR</strong>
                  </div>

                  <span className="ai-live-dot"></span>
                </div>

                <p>
                  You are approximately 184 KM into the journey. The next
                  recommended fuel opportunity is 28 KM ahead.
                </p>

                <div className="ai-insight">
                  <span>INSIGHT</span>
                  <strong>
                    Maintain the current group formation for the mountain
                    section.
                  </strong>
                </div>

                <button onClick={addAnnouncement}>
                  GET JOURNEY UPDATE
                  <span>→</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {activeTab === "PARTICIPANTS" && (
          <div className="full-tab-panel">
            <div className="panel-title">
              <span>LIVE RIDE GROUP</span>
              <h3>WHO IS RIDING?</h3>
            </div>

            <div className="expanded-participants">
              {participants.map((rider) => (
                <div className="expanded-rider" key={rider.id}>
                  <div className="expanded-rider-avatar">
                    {rider.initials}
                    {rider.online && <span></span>}
                  </div>

                  <div className="expanded-rider-main">
                    <strong>{rider.name}</strong>
                    <span>{rider.role}</span>
                  </div>

                  <div className="expanded-rider-distance">
                    <small>PROGRESS</small>
                    <strong>{rider.distance} KM</strong>
                  </div>

                  <div className="expanded-rider-status">
                    {rider.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "CHAT" && (
          <div className="chat-panel">
            <div className="chat-header">
              <div>
                <span>RIDE COMMUNICATION</span>
                <h3>RIDE CHAT</h3>
              </div>

              <span>{participants.length} RIDERS</span>
            </div>

            <div className="chat-messages">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`chat-message ${item.ai ? "ai-message" : ""}`}
                >
                  <div className="chat-avatar">{item.initials}</div>

                  <div className="chat-content">
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.time}</small>
                    </div>

                    <p>{item.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <form className="chat-input" onSubmit={sendMessage}>
              <input
                type="text"
                placeholder="Message the ride group..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />

              <button type="submit">SEND →</button>
            </form>
          </div>
        )}

        {activeTab === "SAFETY" && (
          <div className="safety-dashboard">
            <div className="safety-main">
              <span className="live-eyebrow">LIVE JOURNEY SAFETY</span>

              <h3>RIDE SAFETY CENTER</h3>

              <p>
                Safety controls available during the organized ride. Actual
                emergency services and location sharing will require backend
                and device integrations.
              </p>

              <div className="safety-controls">
                <div className="safety-control">
                  <div>
                    <strong>Location Sharing</strong>
                    <small>
                      Shared with the current ride group
                    </small>
                  </div>

                  <button
                    className={locationSharing ? "enabled" : ""}
                    onClick={() =>
                      setLocationSharing((current) => !current)
                    }
                  >
                    {locationSharing ? "ON" : "OFF"}
                  </button>
                </div>

                <div className="safety-control">
                  <div>
                    <strong>Ride Recording</strong>
                    <small>Journey progress is being recorded</small>
                  </div>

                  <button
                    className={isRecording ? "enabled" : ""}
                    onClick={toggleRecording}
                  >
                    {isRecording ? "ON" : "OFF"}
                  </button>
                </div>

                <div className="safety-control">
                  <div>
                    <strong>Emergency Contact</strong>
                    <small>Configured for this demo ride</small>
                  </div>

                  <button className="enabled">READY</button>
                </div>
              </div>
            </div>

            <div className="emergency-card">
              <span>EMERGENCY ACCESS</span>

              <div className="emergency-ring">
                <span>SOS</span>
              </div>

              <strong>NEED HELP?</strong>

              <p>
                Use emergency access to start the safety response flow.
              </p>

              <button onClick={() => setShowEmergency(true)}>
                OPEN EMERGENCY CENTER
              </button>
            </div>
          </div>
        )}

        <div className="live-controls">
          <div className="recording-control">
            <span
              className={`recording-dot ${
                isRecording ? "recording" : ""
              }`}
            ></span>

            <div>
              <small>RIDE RECORDING</small>
              <strong>
                {isRecording ? "RECORDING ACTIVE" : "RECORDING PAUSED"}
              </strong>
            </div>
          </div>

          <button
            className="pause-button"
            onClick={toggleRecording}
            disabled={rideStatus === "COMPLETED"}
          >
            {isRecording ? "PAUSE RIDE" : "RESUME RIDE"}
          </button>

          <button
            className="end-button"
            onClick={completeRide}
            disabled={rideStatus === "COMPLETED"}
          >
            {rideStatus === "COMPLETED"
              ? "RIDE COMPLETED"
              : "END RIDE"}
          </button>
        </div>

        {showEmergency && (
          <div className="emergency-overlay">
            <div className="emergency-modal">
              <button
                className="close-emergency"
                onClick={() => setShowEmergency(false)}
              >
                ×
              </button>

              <span>SAFETY RESPONSE</span>

              <h3>EMERGENCY CENTER</h3>

              <p>
                This frontend demo prepares the emergency workflow. A
                production implementation would connect shared location,
                emergency contacts, ride organizers and emergency services.
              </p>

              <div className="emergency-options">
                <button>CONTACT EMERGENCY CONTACT</button>
                <button>ALERT RIDE ORGANIZER</button>
                <button>SHARE CURRENT LOCATION</button>
              </div>

              <small>
                No real emergency call or location transmission is performed
                by this frontend demo.
              </small>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default LiveRide;