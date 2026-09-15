import { useEffect, useState } from "react";
import "./SafetyEmergency.css";

const defaultContacts = [
  {
    id: "contact-1",
    name: "Emergency Contact",
    relation: "PRIMARY CONTACT",
    phone: "+91 98765 43210",
  },
  {
    id: "contact-2",
    name: "MotoTribe Support",
    relation: "RIDER SUPPORT",
    phone: "+91 1800 123 456",
  },
];

const safetyChecks = [
  "Helmet and protective riding gear secured",
  "Motorcycle inspection completed",
  "Emergency contacts accessible",
  "Route shared with a trusted person",
  "Fuel and essential supplies checked",
];

function SafetyEmergency() {
  const [sosActive, setSosActive] = useState(false);

  const [locationShared, setLocationShared] = useState(() => {
    return localStorage.getItem("mototribeLocationShared") === "true";
  });

  const [contacts, setContacts] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeEmergencyContacts") ||
          JSON.stringify(defaultContacts)
      );
    } catch {
      return defaultContacts;
    }
  });

  const [completedChecks, setCompletedChecks] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeSafetyChecks") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [selectedEmergency, setSelectedEmergency] =
    useState(null);

  useEffect(() => {
    localStorage.setItem(
      "mototribeLocationShared",
      String(locationShared)
    );
  }, [locationShared]);

  useEffect(() => {
    localStorage.setItem(
      "mototribeEmergencyContacts",
      JSON.stringify(contacts)
    );
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(
      "mototribeSafetyChecks",
      JSON.stringify(completedChecks)
    );
  }, [completedChecks]);

  const toggleSafetyCheck = (index) => {
    setCompletedChecks((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  };

  const triggerSOS = () => {
    setSosActive(true);
    setLocationShared(true);
  };

  const cancelSOS = () => {
    setSosActive(false);
  };

  const callContact = (contact) => {
    window.location.href = `tel:${contact.phone.replace(
      /\s/g,
      ""
    )}`;
  };

  const emergencyActions = [
    {
      id: "medical",
      icon: "+",
      title: "MEDICAL",
      subtitle: "Emergency medical assistance",
      number: "108",
    },
    {
      id: "police",
      icon: "!",
      title: "POLICE",
      subtitle: "Police emergency assistance",
      number: "112",
    },
    {
      id: "roadside",
      icon: "⚙",
      title: "ROADSIDE",
      subtitle: "Motorcycle breakdown support",
      number: "1800",
    },
  ];

  return (
    <section
      className={`safety-emergency-section ${
        sosActive ? "sos-mode" : ""
      }`}
      id="safety-emergency"
    >
      <div className="safety-emergency-container">

        {/* HEADER */}

        <div className="safety-header">

          <div>
            <span className="safety-eyebrow">
              MOTOTRIBE / SAFETY & EMERGENCY
            </span>

            <h2>
              Ride safe.
              <br />
              Stay connected.
            </h2>

            <p>
              Emergency tools and safety controls
              designed to keep riders connected when
              the unexpected happens.
            </p>
          </div>

          <div className="safety-system-status">

            <span className="system-status-dot"></span>

            <div>
              <small>SAFETY SYSTEM</small>
              <strong>
                {sosActive
                  ? "EMERGENCY ACTIVE"
                  : "SYSTEM READY"}
              </strong>
            </div>

          </div>

        </div>

        {/* SOS PANEL */}

        <div className="sos-panel">

          <div className="sos-panel-copy">

            <span className="sos-label">
              EMERGENCY RESPONSE
            </span>

            <h3>
              Need immediate
              <br />
              assistance?
            </h3>

            <p>
              Activate SOS to alert your emergency
              contacts and share your current ride
              status.
            </p>

            {sosActive && (
              <div className="sos-active-message">
                <span className="pulse-dot"></span>

                EMERGENCY ALERT ACTIVE
              </div>
            )}

          </div>

          <div className="sos-action-area">

            <button
              className={`sos-button ${
                sosActive ? "active" : ""
              }`}
              onClick={
                sosActive ? cancelSOS : triggerSOS
              }
            >
              <span className="sos-button-ring"></span>

              <strong>
                {sosActive ? "CANCEL" : "SOS"}
              </strong>

              <small>
                {sosActive
                  ? "ALERT ACTIVE"
                  : "PRESS TO ACTIVATE"}
              </small>
            </button>

          </div>

          <div className="sos-status-list">

            <div>
              <span>01</span>
              <strong>CONTACT ALERT</strong>
              <small>
                {sosActive ? "ACTIVE" : "READY"}
              </small>
            </div>

            <div>
              <span>02</span>
              <strong>LOCATION</strong>
              <small>
                {locationShared
                  ? "SHARED"
                  : "PRIVATE"}
              </small>
            </div>

            <div>
              <span>03</span>
              <strong>RIDE STATUS</strong>
              <small>MONITORED</small>
            </div>

          </div>

        </div>

        {/* EMERGENCY SERVICES */}

        <div className="emergency-services">

          <div className="emergency-heading">
            <span>QUICK RESPONSE</span>

            <h3>
              Emergency
              <br />
              services.
            </h3>
          </div>

          <div className="emergency-grid">

            {emergencyActions.map((action) => (
              <button
                key={action.id}
                className="emergency-card"
                onClick={() =>
                  setSelectedEmergency(action)
                }
              >

                <div className="emergency-card-top">

                  <span className="emergency-icon">
                    {action.icon}
                  </span>

                  <span className="emergency-arrow">
                    →
                  </span>

                </div>

                <strong>{action.title}</strong>

                <p>{action.subtitle}</p>

                <small>
                  {action.number}
                </small>

              </button>
            ))}

          </div>

        </div>

        {/* SELECTED EMERGENCY */}

        {selectedEmergency && (
          <div className="emergency-confirmation">

            <div>
              <span>
                SELECTED / {selectedEmergency.title}
              </span>

              <strong>
                {selectedEmergency.subtitle}
              </strong>

              <p>
                Emergency number:{" "}
                {selectedEmergency.number}
              </p>
            </div>

            <div className="confirmation-actions">

              <a
                href={`tel:${selectedEmergency.number}`}
                className="call-emergency-button"
              >
                CALL NOW ↗
              </a>

              <button
                onClick={() =>
                  setSelectedEmergency(null)
                }
              >
                CLOSE
              </button>

            </div>

          </div>
        )}

        {/* SAFETY CHECKLIST */}

        <div className="safety-check-section">

          <div className="safety-check-heading">

            <span>PRE-RIDE SAFETY</span>

            <h3>
              Five checks
              <br />
              before departure.
            </h3>

          </div>

          <div className="safety-check-list">

            {safetyChecks.map((check, index) => {
              const completed =
                completedChecks.includes(index);

              return (
                <button
                  key={check}
                  className={`safety-check ${
                    completed ? "completed" : ""
                  }`}
                  onClick={() =>
                    toggleSafetyCheck(index)
                  }
                >

                  <span className="safety-check-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="safety-check-box">
                    {completed ? "✓" : ""}
                  </span>

                  <span className="safety-check-text">
                    {check}
                  </span>

                  <span className="safety-check-arrow">
                    →
                  </span>

                </button>
              );
            })}

          </div>

        </div>

        {/* LOCATION SHARING */}

        <div className="location-sharing-panel">

          <div className="location-sharing-icon">
            ◉
          </div>

          <div className="location-sharing-copy">

            <span>LOCATION CONTROL</span>

            <h3>
              Share your ride location
            </h3>

            <p>
              Keep your trusted contacts informed
              about your journey status.
            </p>

          </div>

          <button
            className={`location-toggle ${
              locationShared ? "enabled" : ""
            }`}
            onClick={() =>
              setLocationShared((current) => !current)
            }
          >

            <span className="toggle-track">
              <span className="toggle-thumb"></span>
            </span>

            <span>
              {locationShared
                ? "SHARING ACTIVE"
                : "SHARING OFF"}
            </span>

          </button>

        </div>

        {/* EMERGENCY CONTACTS */}

        <div className="emergency-contacts">

          <div className="contacts-heading">

            <span>TRUSTED CONTACTS</span>

            <h3>
              People to
              <br />
              reach first.
            </h3>

          </div>

          <div className="contacts-list">

            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="emergency-contact"
              >

                <div className="contact-index">
                  {contact.id.endsWith("1")
                    ? "01"
                    : "02"}
                </div>

                <div className="contact-info">

                  <span>
                    {contact.relation}
                  </span>

                  <strong>
                    {contact.name}
                  </strong>

                  <small>
                    {contact.phone}
                  </small>

                </div>

                <button
                  className="contact-call"
                  onClick={() =>
                    callContact(contact)
                  }
                >
                  CALL
                </button>

              </div>
            ))}

          </div>

        </div>

        {/* FOOTER */}

        <div className="safety-footer">

          <span>
            MOTOTRIBE SAFETY NETWORK
          </span>

          <p>
            Emergency numbers shown are demo
            interfaces for the frontend prototype.
          </p>

        </div>

      </div>
    </section>
  );
}

export default SafetyEmergency;