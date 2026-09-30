import { useEffect, useRef, useState } from "react";
import "./LiveLocation.css";

const LOCATION_STORAGE_KEY = "mototribe_live_location";

const SHARING_OPTIONS = [
  {
    value: "PRIVATE",
    label: "Private",
    description: "Only you can see your location.",
  },
  {
    value: "RIDE_GROUP",
    label: "Ride Group",
    description: "Share with riders in this active ride.",
  },
  {
    value: "CONNECTIONS",
    label: "Connections",
    description: "Share with your MotoTribe connections.",
  },
];

function loadSavedLocation() {
  try {
    const savedLocation = localStorage.getItem(
      LOCATION_STORAGE_KEY
    );

    if (!savedLocation) {
      return null;
    }

    const parsedLocation = JSON.parse(savedLocation);

    return parsedLocation &&
      typeof parsedLocation === "object"
      ? parsedLocation
      : null;
  } catch {
    return null;
  }
}

function calculateDistance(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {
  const earthRadius = 6371;

  const lat1 = (latitude1 * Math.PI) / 180;
  const lat2 = (latitude2 * Math.PI) / 180;

  const deltaLatitude =
    ((latitude2 - latitude1) * Math.PI) / 180;

  const deltaLongitude =
    ((longitude2 - longitude1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatitude / 2) *
      Math.sin(deltaLatitude / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

function formatDistance(distance) {
  if (!distance || distance < 0.01) {
    return "0.00 km";
  }

  return `${distance.toFixed(2)} km`;
}

function formatCoordinate(value) {
  if (typeof value !== "number") {
    return "--";
  }

  return value.toFixed(6);
}

function formatSpeed(speed) {
  if (
    typeof speed !== "number" ||
    Number.isNaN(speed) ||
    speed < 0
  ) {
    return "--";
  }

  return `${(speed * 3.6).toFixed(1)} km/h`;
}

function formatAccuracy(accuracy) {
  if (
    typeof accuracy !== "number" ||
    Number.isNaN(accuracy)
  ) {
    return "--";
  }

  if (accuracy >= 1000) {
    return `${(accuracy / 1000).toFixed(1)} km`;
  }

  return `${Math.round(accuracy)} m`;
}

function formatUpdatedTime(timestamp) {
  if (!timestamp) {
    return "--";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getPermissionLabel(permissionStatus) {
  if (permissionStatus === "GRANTED") {
    return "GRANTED";
  }

  if (permissionStatus === "DENIED") {
    return "DENIED";
  }

  if (permissionStatus === "REQUESTING") {
    return "REQUESTING";
  }

  if (permissionStatus === "UNAVAILABLE") {
    return "UNAVAILABLE";
  }

  return "NOT REQUESTED";
}

function LiveLocation({ ride }) {
  const savedLocation = loadSavedLocation();

  const [isSharing, setIsSharing] = useState(
    savedLocation?.isSharing === true
  );

  const [sharingMode, setSharingMode] = useState(
    savedLocation?.sharingMode || "RIDE_GROUP"
  );

  const [location, setLocation] = useState(
    savedLocation?.location || null
  );

  const [distanceTravelled, setDistanceTravelled] =
    useState(
      savedLocation?.distanceTravelled || 0
    );

  const [permissionStatus, setPermissionStatus] =
    useState("UNKNOWN");

  const [locationError, setLocationError] =
    useState("");

  const [notice, setNotice] = useState("");

  const watchIdRef = useRef(null);

  const lastPositionRef = useRef(
    savedLocation?.location || null
  );

  const stopWatching = () => {
    if (
      watchIdRef.current !== null &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, []);

  const saveLocationData = (
    nextLocation,
    nextDistance,
    nextSharingMode,
    nextIsSharing
  ) => {
    try {
      localStorage.setItem(
        LOCATION_STORAGE_KEY,
        JSON.stringify({
          rideId: ride?.id || null,
          location: nextLocation,
          distanceTravelled: nextDistance,
          sharingMode: nextSharingMode,
          isSharing: nextIsSharing,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Ignore localStorage failures.
    }
  };

  const handlePosition = (position) => {
    const {
      latitude,
      longitude,
      accuracy,
      speed,
    } = position.coords;

    const nextLocation = {
      latitude,
      longitude,
      accuracy,
      speed,
      timestamp: new Date().toISOString(),
    };

    const previousLocation =
      lastPositionRef.current;

    let additionalDistance = 0;

    if (
      previousLocation &&
      typeof previousLocation.latitude ===
        "number" &&
      typeof previousLocation.longitude ===
        "number"
    ) {
      additionalDistance = calculateDistance(
        previousLocation.latitude,
        previousLocation.longitude,
        latitude,
        longitude
      );
    }

    const nextDistance =
      distanceTravelled + additionalDistance;

    lastPositionRef.current = nextLocation;

    setLocation(nextLocation);
    setDistanceTravelled(nextDistance);
    setPermissionStatus("GRANTED");
    setLocationError("");

    saveLocationData(
      nextLocation,
      nextDistance,
      sharingMode,
      true
    );
  };

  const handleLocationError = (error) => {
    if (error.code === 1) {
      setPermissionStatus("DENIED");

      setLocationError(
        "Location permission was denied. Allow location access in your browser to start live sharing."
      );
    } else if (error.code === 2) {
      setPermissionStatus("UNAVAILABLE");

      setLocationError(
        "Your current location could not be determined."
      );
    } else if (error.code === 3) {
      setPermissionStatus("UNAVAILABLE");

      setLocationError(
        "Location request timed out. Please try again."
      );
    } else {
      setPermissionStatus("UNAVAILABLE");

      setLocationError(
        "Unable to access your current location."
      );
    }

    setIsSharing(false);

    stopWatching();
  };

  const startSharing = () => {
    setNotice("");
    setLocationError("");

    if (!navigator.geolocation) {
      setPermissionStatus("UNAVAILABLE");

      setLocationError(
        "Live location is not supported by this browser."
      );

      return;
    }

    setIsSharing(true);
    setPermissionStatus("REQUESTING");

    const watchId =
      navigator.geolocation.watchPosition(
        handlePosition,
        handleLocationError,
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        }
      );

    watchIdRef.current = watchId;

    saveLocationData(
      location,
      distanceTravelled,
      sharingMode,
      true
    );

    setNotice(
      "Live location sharing started."
    );
  };

  const stopSharing = () => {
    stopWatching();

    setIsSharing(false);

    saveLocationData(
      location,
      distanceTravelled,
      sharingMode,
      false
    );

    setNotice(
      "Live location sharing stopped."
    );
  };

  const handleSharingModeChange = (event) => {
    const nextMode = event.target.value;

    setSharingMode(nextMode);

    saveLocationData(
      location,
      distanceTravelled,
      nextMode,
      isSharing
    );

    setNotice(
      "Location sharing preference updated."
    );
  };

  const resetSession = () => {
    stopWatching();

    setIsSharing(false);
    setLocation(null);
    setDistanceTravelled(0);
    setPermissionStatus("UNKNOWN");
    setLocationError("");
    setNotice(
      "Live location session reset."
    );

    lastPositionRef.current = null;

    try {
      localStorage.removeItem(
        LOCATION_STORAGE_KEY
      );
    } catch {
      // Ignore localStorage failures.
    }
  };

  const sharingLabel =
    SHARING_OPTIONS.find(
      (option) =>
        option.value === sharingMode
    )?.label || "Ride Group";

  return (
    <section className="live-location-card">
      <div className="live-location-header">
        <div className="live-location-heading">
          <span className="live-location-eyebrow">
            LIVE RIDE / LOCATION
          </span>

          <h2>LIVE LOCATION SHARING</h2>

          <p>
            Share your current ride location according
            to your selected privacy setting.
          </p>
        </div>

        <div
          className={`live-location-status ${
            isSharing ? "active" : "inactive"
          }`}
        >
          <span />

          {isSharing
            ? "LOCATION LIVE"
            : "LOCATION OFF"}
        </div>
      </div>

      <div className="live-location-privacy">
        <div className="live-location-privacy-icon">
          ◉
        </div>

        <div>
          <strong>LOCATION PRIVACY</strong>

          <p>
            Your exact location is shared only
            according to the option you select below.
          </p>
        </div>
      </div>

      <div className="live-location-sharing">
        <div className="live-location-section-title">
          <span>01</span>

          <div>
            <h3>WHO CAN SEE YOUR LOCATION?</h3>

            <p>
              Choose your live-location visibility.
            </p>
          </div>
        </div>

        <div className="live-location-options">
          {SHARING_OPTIONS.map((option) => (
            <label
              className={`live-location-option ${
                sharingMode === option.value
                  ? "selected"
                  : ""
              }`}
              key={option.value}
            >
              <input
                type="radio"
                name="location-sharing"
                value={option.value}
                checked={
                  sharingMode === option.value
                }
                onChange={
                  handleSharingModeChange
                }
              />

              <span className="live-location-radio" />

              <span className="live-location-option-content">
                <strong>{option.label}</strong>

                <small>
                  {option.description}
                </small>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="live-location-data">
        <div className="live-location-section-title">
          <span>02</span>

          <div>
            <h3>RIDE LOCATION DATA</h3>

            <p>
              Current browser-provided location
              information.
            </p>
          </div>
        </div>

        <div className="live-location-stats">
          <div className="live-location-stat">
            <span>LATITUDE</span>

            <strong>
              {formatCoordinate(
                location?.latitude
              )}
            </strong>
          </div>

          <div className="live-location-stat">
            <span>LONGITUDE</span>

            <strong>
              {formatCoordinate(
                location?.longitude
              )}
            </strong>
          </div>

          <div className="live-location-stat">
            <span>ACCURACY</span>

            <strong>
              {formatAccuracy(
                location?.accuracy
              )}
            </strong>
          </div>

          <div className="live-location-stat">
            <span>SPEED</span>

            <strong>
              {formatSpeed(location?.speed)}
            </strong>
          </div>

          <div className="live-location-stat">
            <span>DISTANCE</span>

            <strong>
              {formatDistance(
                distanceTravelled
              )}
            </strong>
          </div>

          <div className="live-location-stat">
            <span>PERMISSION</span>

            <strong
              className={`live-location-permission ${permissionStatus.toLowerCase()}`}
            >
              {getPermissionLabel(
                permissionStatus
              )}
            </strong>
          </div>
        </div>

        <div className="live-location-updated">
          <span>LAST UPDATED</span>

          <strong>
            {formatUpdatedTime(
              location?.timestamp
            )}
          </strong>
        </div>
      </div>

      {locationError && (
        <div className="live-location-message error">
          <span>!</span>

          <p>{locationError}</p>
        </div>
      )}

      {notice && (
        <div className="live-location-message success">
          <span>✦</span>

          <p>{notice}</p>
        </div>
      )}

      <div className="live-location-controls">
        {!isSharing ? (
          <button
            type="button"
            className="live-location-start"
            onClick={startSharing}
          >
            START LOCATION SHARING
          </button>
        ) : (
          <button
            type="button"
            className="live-location-stop"
            onClick={stopSharing}
          >
            STOP LOCATION SHARING
          </button>
        )}

        <button
          type="button"
          className="live-location-reset"
          onClick={resetSession}
        >
          RESET SESSION
        </button>
      </div>

      <div className="live-location-footer">
        <span>
          SHARING:{" "}
          {sharingLabel.toUpperCase()}
        </span>

        <p>
          {ride?.name
            ? `Active ride: ${ride.name}`
            : "Active MotoTribe ride"}
        </p>
      </div>
    </section>
  );
}

export default LiveLocation;