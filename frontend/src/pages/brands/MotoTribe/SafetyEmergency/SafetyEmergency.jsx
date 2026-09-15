import { useState } from "react";
import "./SafetyEmergency.css";

function SafetyEmergency() {
  const [safetyItems, setSafetyItems] = useState([
    { id: 1, label: "HELMET", checked: true },
    { id: 2, label: "RIDING GEAR", checked: true },
    { id: 3, label: "FUEL LEVEL", checked: false },
    { id: 4, label: "BIKE CONDITION", checked: true },
    { id: 5, label: "EMERGENCY CONTACT", checked: true },
  ]);

  const [sosActive, setSosActive] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const contacts = [
    {
      id: 1,
      name: "ROAD ASSISTANCE",
      detail: "24 / 7 RIDER SUPPORT",
      action: "CALL",
    },
    {
      id: 2,
      name: "EMERGENCY SERVICES",
      detail: "IMMEDIATE ASSISTANCE",
      action: "CALL",
    },
    {
      id: 3,
      name: "TRUSTED RIDER",
      detail: "YOUR EMERGENCY CONTACT",
      action: "ALERT",
    },
  ];

  const toggleSafety = (id) => {
    setSafetyItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, checked: !item.checked }
          : item
      )
    );
  };

  const completedCount = safetyItems.filter(
    (item) => item.checked
  ).length;

  const safetyPercentage = Math.round(
    (completedCount / safetyItems.length) * 100
  );

  const handleSOS = () => {
    setSosActive(true);

    setTimeout(() => {
      setSosActive(false);
    }, 4000);
  };

  const handleContact = (contact) => {
    setSelectedContact(contact);

    setTimeout(() => {
      setSelectedContact(null);
    }, 2000);
  };

  return (
    <section
      id="safety-emergency"
      className="safety-emergency"
    >
      <div className="safety-container">

        <div className="safety-header">
          <div>
            <div className="safety-eyebrow">
              <span></span>
              SAFETY / EMERGENCY
            </div>

            <h2>
              RIDE WITH
              <br />
              <span>CONFIDENCE.</span>
            </h2>
          </div>

          <div className="safety-intro">
            <p>
              Your safety comes first. Keep essential
              checks, emergency support and trusted
              contacts within reach.
            </p>
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
              <span
                style={{
                  width: `${safetyPercentage}%`,
                }}
              ></span>
            </div>

            <div className="check-list">
              {safetyItems.map((item) => (
                <button
                  key={item.id}
                  className={
                    item.checked
                      ? "check-item checked"
                      : "check-item"
                  }
                  onClick={() => toggleSafety(item.id)}
                >
                  <span className="check-number">
                    0{item.id}
                  </span>

                  <span className="check-box">
                    {item.checked ? "✓" : ""}
                  </span>

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
              EMERGENCY RESPONSE
            </div>

            <div
              className={
                sosActive
                  ? "sos-button active"
                  : "sos-button"
              }
              onClick={handleSOS}
            >
              <div className="sos-ring ring-one"></div>
              <div className="sos-ring ring-two"></div>

              <div className="sos-center">
                <span>SOS</span>
                <small>
                  {sosActive
                    ? "ALERT ACTIVE"
                    : "PRESS FOR HELP"}
                </small>
              </div>
            </div>

            <p>
              {sosActive
                ? "Emergency alert simulation activated. Help request is being prepared."
                : "Use SOS when you need immediate emergency assistance."}
            </p>

            <div className="sos-status">
              <span></span>
              EMERGENCY SYSTEM READY
            </div>
          </div>
        </div>

        <div className="contacts-section">

          <div className="contacts-heading">
            <div>
              <span>EMERGENCY NETWORK</span>
              <strong>QUICK CONTACTS</strong>
            </div>

            <small>AVAILABLE WHEN YOU NEED THEM</small>
          </div>

          <div className="contact-grid">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={
                  selectedContact?.id === contact.id
                    ? "contact-card selected"
                    : "contact-card"
                }
              >
                <div className="contact-number">
                  0{contact.id}
                </div>

                <div className="contact-info">
                  <strong>{contact.name}</strong>
                  <span>{contact.detail}</span>
                </div>

                <button
                  onClick={() => handleContact(contact)}
                >
                  {selectedContact?.id === contact.id
                    ? "REQUESTED ✓"
                    : contact.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="safety-note">
          <span>IMPORTANT</span>
          <p>
            This is a frontend demonstration. Real emergency
            calling, GPS location sharing and live roadside
            assistance will require backend/API integration.
          </p>
        </div>

      </div>
    </section>
  );
}

export default SafetyEmergency;