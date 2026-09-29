import { useEffect, useState } from "react";
import "./SafetySOS.css";

function getEmergencyContacts() {
  try {
    const savedProfile = localStorage.getItem(
      "mototribe_rider_profile"
    );

    if (!savedProfile) {
      return [];
    }

    const parsedProfile = JSON.parse(savedProfile);

    if (!Array.isArray(parsedProfile.contacts)) {
      return [];
    }

    return parsedProfile.contacts.filter(
      (contact) =>
        contact &&
        contact.name &&
        contact.phone
    );
  } catch {
    return [];
  }
}

function SafetySOS({ ride }) {
  const [sosState, setSosState] = useState("IDLE");
  const [countdown, setCountdown] = useState(5);

  const [notice, setNotice] = useState("");

  const [contacts] = useState(() =>
    getEmergencyContacts()
  );

  useEffect(() => {
    if (sosState !== "COUNTDOWN") {
      return;
    }

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((previous) => previous - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setSosState("ACTIVE");

      setNotice(
        "SOS alert activated. Your emergency contacts and ride group are ready to be notified."
      );
    }, 0);

    return () => clearTimeout(timer);
  }, [sosState, countdown]);

  const startSOS = () => {
    setCountdown(5);
    setNotice("");
    setSosState("COUNTDOWN");
  };

  const cancelSOS = () => {
    setSosState("IDLE");
    setCountdown(5);
    setNotice("SOS alert cancelled.");
  };

  const resetSOS = () => {
    setSosState("IDLE");
    setCountdown(5);
    setNotice("");
  };

  const callContact = (phone) => {
    window.open(`tel:${phone}`, "_self");
  };

  const messageContact = (phone) => {
    window.open(`sms:${phone}`, "_self");
  };

  const callEmergency = () => {
    window.open("tel:112", "_self");
  };

  const notifyGroup = () => {
    setNotice(
      `Emergency notification prepared for ${
        ride?.name || "this ride"
      }.`
    );
  };

  const shareRide = async () => {
    const rideUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: ride?.name || "MotoTribe Live Ride",
          text: "I need assistance during my MotoTribe ride.",
          url: rideUrl,
        });

        setNotice("Live ride details shared.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(rideUrl);
        setNotice("Live ride link copied.");
      } else {
        setNotice(
          "Ride sharing is not supported on this device."
        );
      }
    } catch {
      setNotice("Ride sharing was cancelled.");
    }
  };

  return (
    <section className="safety-sos-card">
      <div className="safety-sos-header">
        <div>
          <span className="safety-sos-eyebrow">
            SAFETY / EMERGENCY
          </span>

          <h2>EMERGENCY CONTROL</h2>

          <p>
            Quickly alert your emergency contacts and riding
            group when assistance is needed.
          </p>
        </div>

        <div
          className={`safety-sos-indicator ${sosState.toLowerCase()}`}
        >
          <span />

          {sosState === "ACTIVE"
            ? "SOS ACTIVE"
            : "READY"}
        </div>
      </div>

      <div className="safety-sos-main">
        {sosState === "IDLE" && (
          <>
            <button
              type="button"
              className="safety-sos-button"
              onClick={startSOS}
            >
              <span className="safety-sos-button-icon">
                SOS
              </span>

              <span className="safety-sos-button-text">
                <strong>EMERGENCY SOS</strong>

                <small>
                  Press to start emergency alert
                </small>
              </span>
            </button>

            <p className="safety-sos-hint">
              A 5-second cancellation window will appear
              before the alert becomes active.
            </p>
          </>
        )}

        {sosState === "COUNTDOWN" && (
          <div className="safety-sos-countdown">
            <div className="safety-sos-countdown-number">
              {countdown}
            </div>

            <div className="safety-sos-countdown-content">
              <span>EMERGENCY ALERT</span>

              <strong>
                Sending SOS in {countdown} seconds
              </strong>

              <p>
                Cancel now if this alert was triggered
                accidentally.
              </p>
            </div>

            <button
              type="button"
              className="safety-sos-cancel"
              onClick={cancelSOS}
            >
              CANCEL SOS
            </button>
          </div>
        )}

        {sosState === "ACTIVE" && (
          <div className="safety-sos-active">
            <div className="safety-sos-active-icon">
              SOS
            </div>

            <div className="safety-sos-active-content">
              <span>
                EMERGENCY ALERT ACTIVE
              </span>

              <strong>
                Emergency assistance has been activated.
              </strong>

              <p>
                Contact your emergency person or emergency
                services immediately if you are in danger.
              </p>
            </div>

            <button
              type="button"
              className="safety-sos-resolve"
              onClick={resetSOS}
            >
              END ALERT
            </button>
          </div>
        )}
      </div>

      <div className="safety-sos-contacts-section">
        <div className="safety-sos-section-heading">
          <div>
            <span>01</span>

            <h3>EMERGENCY CONTACTS</h3>
          </div>

          <small>
            {contacts.length} saved
          </small>
        </div>

        {contacts.length === 0 ? (
          <div className="safety-sos-no-contacts">
            <div className="safety-sos-no-contacts-icon">
              !
            </div>

            <div>
              <strong>
                No emergency contacts saved
              </strong>

              <p>
                Add emergency contacts from your MotoTribe
                rider profile before starting a ride.
              </p>
            </div>
          </div>
        ) : (
          <div className="safety-sos-contacts-list">
            {contacts.map((contact, index) => (
              <div
                className="safety-sos-contact"
                key={`${contact.phone}-${index}`}
              >
                <div className="safety-sos-contact-avatar">
                  {contact.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="safety-sos-contact-info">
                  <strong>{contact.name}</strong>

                  <span>
                    {contact.relationship ||
                      "Emergency Contact"}
                  </span>

                  <small>{contact.phone}</small>
                </div>

                <div className="safety-sos-contact-actions">
                  <button
                    type="button"
                    onClick={() =>
                      callContact(contact.phone)
                    }
                    title={`Call ${contact.name}`}
                  >
                    CALL
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      messageContact(contact.phone)
                    }
                    title={`Message ${contact.name}`}
                  >
                    SMS
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="safety-sos-actions">
        <button
          type="button"
          className="safety-sos-action emergency"
          onClick={callEmergency}
        >
          <span>112</span>

          <div>
            <strong>CALL EMERGENCY</strong>

            <small>
              India emergency number
            </small>
          </div>
        </button>

        <button
          type="button"
          className="safety-sos-action"
          onClick={notifyGroup}
        >
          <span>◉</span>

          <div>
            <strong>NOTIFY GROUP</strong>

            <small>
              Prepare rider notification
            </small>
          </div>
        </button>

        <button
          type="button"
          className="safety-sos-action"
          onClick={shareRide}
        >
          <span>↗</span>

          <div>
            <strong>SHARE RIDE</strong>

            <small>
              Share live ride details
            </small>
          </div>
        </button>
      </div>

      {notice && (
        <div className="safety-sos-notice">
          <span>✦</span>
          {notice}
        </div>
      )}

      <div className="safety-sos-footer">
        <span>SAFETY FIRST</span>

        <p>
          Emergency contact actions are currently running
          in frontend demo mode.
        </p>
      </div>
    </section>
  );
}

export default SafetySOS;