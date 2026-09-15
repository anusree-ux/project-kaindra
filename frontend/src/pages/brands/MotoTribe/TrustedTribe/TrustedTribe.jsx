import { useEffect, useMemo, useState } from "react";
import "./TrustedTribe.css";

const defaultTrustedRiders = [
  {
    id: "trusted-1",
    name: "Arjun",
    role: "LEAD RIDER",
    location: "Delhi",
    rides: 18,
    status: "ONLINE",
    alerts: true,
  },
  {
    id: "trusted-2",
    name: "Rahul",
    role: "RIDING PARTNER",
    location: "Chandigarh",
    rides: 12,
    status: "RIDING",
    alerts: true,
  },
  {
    id: "trusted-3",
    name: "Meera",
    role: "RIDING PARTNER",
    location: "Manali",
    rides: 9,
    status: "OFFLINE",
    alerts: false,
  },
];

const defaultSettings = {
  rideAlerts: true,
  emergencyAlerts: true,
  locationSharing: false,
  departureAlerts: true,
};

function TrustedTribe() {
  const [trustedRiders, setTrustedRiders] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeTrustedRiders") ||
          JSON.stringify(defaultTrustedRiders)
      );
    } catch {
      return defaultTrustedRiders;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeTrustedSettings") ||
          JSON.stringify(defaultSettings)
      );
    } catch {
      return defaultSettings;
    }
  });

  const [activeRider, setActiveRider] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newRider, setNewRider] = useState({
    name: "",
    role: "RIDING PARTNER",
    location: "",
  });

  useEffect(() => {
    localStorage.setItem(
      "mototribeTrustedRiders",
      JSON.stringify(trustedRiders)
    );
  }, [trustedRiders]);

  useEffect(() => {
    localStorage.setItem(
      "mototribeTrustedSettings",
      JSON.stringify(settings)
    );
  }, [settings]);

  const onlineCount = useMemo(
    () =>
      trustedRiders.filter(
        (rider) =>
          rider.status === "ONLINE" ||
          rider.status === "RIDING"
      ).length,
    [trustedRiders]
  );

  const alertsCount = useMemo(
    () =>
      trustedRiders.filter((rider) => rider.alerts).length,
    [trustedRiders]
  );

  const toggleSetting = (setting) => {
    setSettings((current) => ({
      ...current,
      [setting]: !current[setting],
    }));
  };

  const toggleRiderAlerts = (riderId) => {
    setTrustedRiders((current) =>
      current.map((rider) =>
        rider.id === riderId
          ? {
              ...rider,
              alerts: !rider.alerts,
            }
          : rider
      )
    );
  };

  const removeRider = (riderId) => {
    setTrustedRiders((current) =>
      current.filter((rider) => rider.id !== riderId)
    );

    setActiveRider(null);
  };

  const addRider = (event) => {
    event.preventDefault();

    if (!newRider.name.trim()) {
      return;
    }

    const rider = {
      id: `trusted-${Date.now()}`,
      name: newRider.name.trim(),
      role: newRider.role,
      location: newRider.location.trim() || "Unknown",
      rides: 0,
      status: "OFFLINE",
      alerts: true,
    };

    setTrustedRiders((current) => [
      ...current,
      rider,
    ]);

    setNewRider({
      name: "",
      role: "RIDING PARTNER",
      location: "",
    });

    setShowAddForm(false);
  };

  const settingItems = [
    {
      key: "rideAlerts",
      number: "01",
      title: "RIDE ALERTS",
      description:
        "Notify trusted riders when a journey begins or ends.",
    },
    {
      key: "emergencyAlerts",
      number: "02",
      title: "EMERGENCY ALERTS",
      description:
        "Send emergency notifications to the trusted network.",
    },
    {
      key: "locationSharing",
      number: "03",
      title: "LIVE LOCATION",
      description:
        "Allow trusted riders to view your active ride location.",
    },
    {
      key: "departureAlerts",
      number: "04",
      title: "DEPARTURE ALERTS",
      description:
        "Notify the network when you leave for a planned ride.",
    },
  ];

  return (
    <section
      className="trusted-tribe-section"
      id="trusted-tribe"
    >
      <div className="trusted-tribe-container">

        {/* HEADER */}

        <div className="trusted-header">

          <div>
            <span className="trusted-eyebrow">
              MOTOTRIBE / TRUSTED TRIBE
            </span>

            <h2>
              Ride with
              <br />
              people you trust.
            </h2>

            <p>
              Build a trusted network of riders who
              stay connected before, during and after
              every journey.
            </p>
          </div>

          <div className="trusted-network-status">

            <span className="network-dot"></span>

            <div>
              <small>NETWORK STATUS</small>

              <strong>
                {onlineCount} RIDERS ACTIVE
              </strong>
            </div>

          </div>

        </div>

        {/* NETWORK SUMMARY */}

        <div className="trusted-summary">

          <div className="summary-intro">

            <span>YOUR TRUST NETWORK</span>

            <h3>
              Connected riders.
              <br />
              Shared confidence.
            </h3>

          </div>

          <div className="summary-stat">
            <span>RIDERS</span>
            <strong>
              {trustedRiders.length}
            </strong>
          </div>

          <div className="summary-stat">
            <span>ACTIVE</span>
            <strong>
              {onlineCount}
            </strong>
          </div>

          <div className="summary-stat">
            <span>ALERTS</span>
            <strong>
              {alertsCount}
            </strong>
          </div>

        </div>

        {/* TRUSTED RIDERS */}

        <div className="trusted-riders-section">

          <div className="trusted-section-heading">

            <div>
              <span>TRUSTED RIDERS</span>

              <h3>
                Your riding
                <br />
                circle.
              </h3>
            </div>

            <button
              className="add-rider-button"
              onClick={() =>
                setShowAddForm((current) => !current)
              }
            >
              {showAddForm
                ? "CLOSE"
                : "+ ADD RIDER"}
            </button>

          </div>

          {/* ADD RIDER */}

          {showAddForm && (
            <form
              className="add-rider-form"
              onSubmit={addRider}
            >

              <div className="form-field">

                <label>RIDER NAME</label>

                <input
                  type="text"
                  placeholder="Enter rider name"
                  value={newRider.name}
                  onChange={(event) =>
                    setNewRider((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />

              </div>

              <div className="form-field">

                <label>ROLE</label>

                <select
                  value={newRider.role}
                  onChange={(event) =>
                    setNewRider((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                >
                  <option>
                    RIDING PARTNER
                  </option>

                  <option>
                    LEAD RIDER
                  </option>

                  <option>
                    FAMILY CONTACT
                  </option>

                  <option>
                    EMERGENCY CONTACT
                  </option>
                </select>

              </div>

              <div className="form-field">

                <label>LOCATION</label>

                <input
                  type="text"
                  placeholder="City / region"
                  value={newRider.location}
                  onChange={(event) =>
                    setNewRider((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />

              </div>

              <button
                type="submit"
                className="save-rider-button"
              >
                SAVE RIDER
              </button>

            </form>
          )}

          {/* RIDER LIST */}

          <div className="trusted-rider-list">

            {trustedRiders.length === 0 ? (
              <div className="empty-trusted-state">
                <strong>
                  NO TRUSTED RIDERS
                </strong>

                <p>
                  Add a rider to start building your
                  trusted network.
                </p>
              </div>
            ) : (
              trustedRiders.map((rider, index) => (
                <div
                  className={`trusted-rider-card ${
                    activeRider?.id === rider.id
                      ? "selected"
                      : ""
                  }`}
                  key={rider.id}
                >

                  <button
                    className="rider-card-main"
                    onClick={() =>
                      setActiveRider(rider)
                    }
                  >

                    <span className="rider-card-number">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <span className="rider-avatar">
                      {rider.name
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <span className="rider-card-info">

                      <small>
                        {rider.role}
                      </small>

                      <strong>
                        {rider.name}
                      </strong>

                      <span>
                        {rider.location}
                      </span>

                    </span>

                    <span
                      className={`rider-status rider-status-${rider.status.toLowerCase()}`}
                    >
                      <i></i>
                      {rider.status}
                    </span>

                    <span className="rider-card-arrow">
                      →
                    </span>

                  </button>

                  <button
                    className={`rider-alert-button ${
                      rider.alerts
                        ? "enabled"
                        : ""
                    }`}
                    onClick={() =>
                      toggleRiderAlerts(rider.id)
                    }
                  >
                    {rider.alerts
                      ? "ALERTS ON"
                      : "ALERTS OFF"}
                  </button>

                </div>
              ))
            )}

          </div>

        </div>

        {/* RIDER DETAIL */}

        {activeRider && (
          <div className="rider-detail-panel">

            <div className="rider-detail-profile">

              <span className="detail-avatar">
                {activeRider.name
                  .charAt(0)
                  .toUpperCase()}
              </span>

              <div>

                <span>
                  {activeRider.role}
                </span>

                <h3>
                  {activeRider.name}
                </h3>

                <small>
                  {activeRider.location}
                </small>

              </div>

            </div>

            <div className="rider-detail-stats">

              <div>
                <span>RIDES</span>
                <strong>
                  {activeRider.rides}
                </strong>
              </div>

              <div>
                <span>STATUS</span>
                <strong>
                  {activeRider.status}
                </strong>
              </div>

              <div>
                <span>ALERTS</span>
                <strong>
                  {activeRider.alerts
                    ? "ON"
                    : "OFF"}
                </strong>
              </div>

            </div>

            <div className="rider-detail-actions">

              <button
                onClick={() =>
                  toggleRiderAlerts(activeRider.id)
                }
              >
                {activeRider.alerts
                  ? "DISABLE ALERTS"
                  : "ENABLE ALERTS"}
              </button>

              <button
                className="remove-rider"
                onClick={() =>
                  removeRider(activeRider.id)
                }
              >
                REMOVE RIDER
              </button>

              <button
                onClick={() => setActiveRider(null)}
              >
                CLOSE
              </button>

            </div>

          </div>
        )}

        {/* NETWORK SETTINGS */}

        <div className="trusted-settings">

          <div className="trusted-settings-heading">

            <span>NETWORK CONTROLS</span>

            <h3>
              Choose what
              <br />
              your tribe sees.
            </h3>

          </div>

          <div className="trusted-settings-list">

            {settingItems.map((setting) => (
              <button
                key={setting.key}
                className={`trusted-setting ${
                  settings[setting.key]
                    ? "enabled"
                    : ""
                }`}
                onClick={() =>
                  toggleSetting(setting.key)
                }
              >

                <span className="setting-number">
                  {setting.number}
                </span>

                <span className="setting-content">

                  <strong>
                    {setting.title}
                  </strong>

                  <small>
                    {setting.description}
                  </small>

                </span>

                <span className="setting-state">
                  {settings[setting.key]
                    ? "ON"
                    : "OFF"}
                </span>

                <span className="setting-toggle">
                  <i></i>
                </span>

              </button>
            ))}

          </div>

        </div>

        {/* TRUST PRINCIPLE */}

        <div className="trust-principle">

          <div className="trust-principle-mark">
            MT
          </div>

          <div>

            <span>
              THE MOTOTRIBE PRINCIPLE
            </span>

            <h3>
              Trust is part of
              <br />
              every journey.
            </h3>

            <p>
              Your trusted tribe exists to make every
              ride more connected, predictable and
              safer for everyone involved.
            </p>

          </div>

          <div className="trust-principle-index">
            01 / 01
          </div>

        </div>

        {/* FOOTER */}

        <div className="trusted-footer">

          <span>
            MOTOTRIBE TRUST NETWORK
          </span>

          <p>
            CONNECTED BY THE ROAD.
          </p>

        </div>

      </div>
    </section>
  );
}

export default TrustedTribe;