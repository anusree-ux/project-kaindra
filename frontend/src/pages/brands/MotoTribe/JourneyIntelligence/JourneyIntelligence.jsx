import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./JourneyIntelligence.css";

function JourneyIntelligence() {
  const { isAuthenticated } = useAuth();
  const [rides, setRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [liveSteps, setLiveSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routeStatus, setRouteStatus] = useState("loading"); // "loading" | "success" | "not_computed" | "error"
  const [showStops, setShowStops] = useState(true);
  const [selectedInfo, setSelectedInfo] = useState("weather");

  // Rider Live Device Location via Geolocation API
  const [riderCoords, setRiderCoords] = useState(null); // { lat, lng, isLive: true }
  const [locStatus, setLocStatus] = useState("ACQUIRING GPS...");
  const [mapMode, setMapMode] = useState("osm"); // "osm" | "dark" | "satellite"

  const mapContainerRef = useRef(null);
  const leafletInstanceRef = useRef(null);

  // 1. Acquire Device's Real-time Geolocation Location
  const requestDeviceLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocStatus("GEOLOCATION NOT SUPPORTED");
      return;
    }

    setLocStatus("ACQUIRING DEVICE GPS...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRiderCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          isLive: true,
          accuracy: Math.round(pos.coords.accuracy || 0),
        });
        setLocStatus("LIVE DEVICE GPS CONNECTED");
      },
      (err) => {
        console.warn("[JourneyIntelligence] Geolocation notice:", err.message);
        setLocStatus("GPS DENIED (USING RIDE ORIGIN)");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }, []);

  useEffect(() => {
    requestDeviceLocation();

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setRiderCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            isLive: true,
            accuracy: Math.round(pos.coords.accuracy || 0),
          });
          setLocStatus("LIVE DEVICE GPS CONNECTED");
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 30000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [requestDeviceLocation]);

  // 2. Fetch User Rides
  const fetchRides = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.get("/api/mototribe/rides");
      const fetchedRides = res.data?.data?.rides || [];

      const ongoingRides = fetchedRides
        .filter((r) => r.status === "ongoing")
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      const planningRides = fetchedRides
        .filter((r) => r.status === "planning")
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      const selected = ongoingRides[0] || planningRides[0] || null;

      setRides(fetchedRides);
      setActiveRide(selected);
    } catch {
      setRides([]);
      setActiveRide(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRides();

    const handleRideCreated = () => {
      fetchRides();
    };

    window.addEventListener("mototribe:ride-created", handleRideCreated);
    return () => {
      window.removeEventListener("mototribe:ride-created", handleRideCreated);
    };
  }, [fetchRides]);

  // 3. Fetch Weather & Route Info using Rider Device Location / Active Ride
  useEffect(() => {
    if (!activeRide?._id) return;

    const fetchRideDetails = async () => {
      // Fetch Weather for rider's device location
      try {
        let weatherUrl = `/api/mototribe/rides/${activeRide._id}/weather`;
        if (riderCoords?.lat && riderCoords?.lng) {
          weatherUrl += `?lat=${riderCoords.lat}&lng=${riderCoords.lng}`;
        }
        const wRes = await apiClient.get(weatherUrl);
        setWeatherData(wRes.data?.data?.weather || null);
      } catch {
        if (riderCoords?.lat && riderCoords?.lng) {
          try {
            const standaloneRes = await apiClient.get(
              `/api/mototribe/weather?lat=${riderCoords.lat}&lng=${riderCoords.lng}`
            );
            setWeatherData(standaloneRes.data?.data?.weather || null);
          } catch {
            setWeatherData(null);
          }
        } else {
          setWeatherData(null);
        }
      }

      // Fetch Route Info
      try {
        setRouteStatus("loading");
        const rRes = await apiClient.get(`/api/mototribe/rides/${activeRide._id}/route`);
        setRouteInfo(rRes.data?.data?.routeInfo || null);
        setRouteStatus("success");
      } catch (err) {
        if (err.response?.status === 404) {
          setRouteStatus("not_computed");
        } else {
          setRouteStatus("error");
        }
        setRouteInfo(null);
      }
    };

    fetchRideDetails();
  }, [activeRide, riderCoords]);

  // 4. Initialize Interactive Real Map & OSRM Real Turn Navigation
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Load Leaflet CSS
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (!window.L || !mapContainerRef.current) return;

      const deviceLat = riderCoords?.lat || activeRide?.originLat || 12.9716;
      const deviceLng = riderCoords?.lng || activeRide?.originLng || 77.5946;
      const destLat = activeRide?.destLat;
      const destLng = activeRide?.destLng;

      // Clean existing instance
      if (leafletInstanceRef.current) {
        leafletInstanceRef.current.remove();
        leafletInstanceRef.current = null;
      }

      const map = window.L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([deviceLat, deviceLng], 12);

      leafletInstanceRef.current = map;

      // Add Zoom Control at top-right
      window.L.control.zoom({ position: "topright" }).addTo(map);

      // Tile Layer (OpenStreetMap / Esri Dark / Satellite)
      const tileUrl =
        mapMode === "satellite"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : mapMode === "dark"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      window.L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: "abc",
        attribution: "© OpenStreetMap, Esri",
      }).addTo(map);

      // 🔵 Rider Device Location Marker
      const riderIconHtml = `
        <div style="position:relative; width:22px; height:22px;">
          <div style="position:absolute; inset:-8px; border-radius:50%; background:rgba(26,115,232,0.35); animation:ping 1.5s infinite;"></div>
          <div style="width:22px; height:22px; border-radius:50%; background:#1a73e8; border:3px solid #ffffff; box-shadow:0 0 12px rgba(26,115,232,0.8);"></div>
        </div>
      `;

      const customRiderIcon = window.L.divIcon({
        html: riderIconHtml,
        className: "custom-rider-pin",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const riderMarker = window.L.marker([deviceLat, deviceLng], { icon: customRiderIcon }).addTo(map);
      riderMarker.bindPopup(`
        <div style="color:#111; font-family:sans-serif; font-size:12px; padding:4px;">
          <strong>📍 RIDER LIVE DEVICE GPS</strong><br/>
          Latitude: ${deviceLat.toFixed(4)}°<br/>
          Longitude: ${deviceLng.toFixed(4)}°
        </div>
      `);

      // 🏁 Destination Marker & Real Turn Navigation
      if (destLat && destLng) {
        const destIconHtml = `
          <div style="width:20px; height:20px; border-radius:50%; background:#ea4335; border:3px solid #ffffff; box-shadow:0 0 12px rgba(234,67,53,0.8);"></div>
        `;
        const customDestIcon = window.L.divIcon({
          html: destIconHtml,
          className: "custom-dest-pin",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const destMarker = window.L.marker([destLat, destLng], { icon: customDestIcon }).addTo(map);
        const destName = typeof activeRide.destination === "object" ? activeRide.destination.name : activeRide.destination;
        destMarker.bindPopup(`
          <div style="color:#111; font-family:sans-serif; font-size:12px; padding:4px;">
            <strong>🏁 DESTINATION</strong><br/>
            ${destName || "Ride Destination"}
          </div>
        `);

        // Fetch OSRM Routing + Turn-by-Turn Maneuvers
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${deviceLng},${deviceLat};${destLng},${destLat}?steps=true&overview=full&geometries=geojson`;

        fetch(osrmUrl)
          .then((res) => res.json())
          .then((data) => {
            if (data.routes && data.routes[0]) {
              const routeObj = data.routes[0];
              const geojsonCoords = routeObj.geometry.coordinates;
              const latLngs = geojsonCoords.map((c) => [c[1], c[0]]);

              const roadPolyline = window.L.polyline(latLngs, {
                color: "#1a73e8", // Google Maps Blue
                weight: 6,
                opacity: 0.9,
              }).addTo(map);

              map.fitBounds(roadPolyline.getBounds(), { padding: [50, 50] });

              // Extract Real Step-by-Step Turn Maneuvers
              if (routeObj.legs?.[0]?.steps) {
                const parsedSteps = routeObj.legs[0].steps
                  .filter((s) => s.distance > 30)
                  .map((step) => {
                    const type = step.maneuver?.type || "turn";
                    const modifier = step.maneuver?.modifier || "";
                    const street = step.name ? ` onto ${step.name}` : "";

                    let icon = "⬆️";
                    let title = `Continue straight${street}`;

                    if (modifier.includes("left")) {
                      icon = "↖️";
                      title = `Turn left${street}`;
                    } else if (modifier.includes("right")) {
                      icon = "↗️";
                      title = `Turn right${street}`;
                    } else if (type === "depart") {
                      icon = "📍";
                      title = `Head out${street}`;
                    } else if (type === "arrive") {
                      icon = "🏁";
                      title = "Arrive at destination";
                    } else if (type === "roundabout" || type === "rotary") {
                      icon = "🔄";
                      title = `Take roundabout exit${street}`;
                    }

                    const distText =
                      step.distance >= 1000
                        ? `${(step.distance / 1000).toFixed(1)} km`
                        : `${Math.round(step.distance)} m`;
                    const durMin = Math.max(1, Math.round(step.duration / 60));

                    return {
                      icon,
                      title,
                      detail: `${distText} • ~${durMin} min`,
                    };
                  });

                setLiveSteps(parsedSteps);
              }
            } else {
              const polyline = window.L.polyline([[deviceLat, deviceLng], [destLat, destLng]], {
                color: "#1a73e8",
                weight: 5,
                opacity: 0.85,
                dashArray: "8, 8",
              }).addTo(map);
              map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
            }
          })
          .catch(() => {
            const polyline = window.L.polyline([[deviceLat, deviceLng], [destLat, destLng]], {
              color: "#1a73e8",
              weight: 5,
              opacity: 0.85,
              dashArray: "8, 8",
            }).addTo(map);
            map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
          });
      }
    };

    // Load Leaflet JS
    const scriptId = "leaflet-js";
    if (!window.L) {
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else {
        script.onload = () => initMap();
      }
    } else {
      initMap();
    }
  }, [riderCoords, activeRide, mapMode]);

  // Recenter map on rider's device location
  const handleRecenter = () => {
    if (leafletInstanceRef.current && riderCoords?.lat && riderCoords?.lng) {
      leafletInstanceRef.current.setView([riderCoords.lat, riderCoords.lng], 14, { animate: true });
    } else {
      requestDeviceLocation();
    }
  };

  // Format Origin / Destination strings
  const originName = useMemo(() => {
    if (!activeRide) return "";
    return typeof activeRide.origin === "object" ? activeRide.origin.name : activeRide.origin;
  }, [activeRide]);

  const destName = useMemo(() => {
    if (!activeRide) return "";
    return typeof activeRide.destination === "object" ? activeRide.destination.name : activeRide.destination;
  }, [activeRide]);

  // Weather Data safely extracted
  const currentWeather = useMemo(() => {
    if (!weatherData) return null;
    return weatherData.current || weatherData;
  }, [weatherData]);

  // Combined display steps for overlay
  const displaySteps = useMemo(() => {
    if (liveSteps.length > 0) return liveSteps;
    if (routeInfo?.steps?.length > 0) {
      return routeInfo.steps.map((s, idx) => ({
        icon: "📍",
        title: s.html_instructions?.replace(/<[^>]*>?/gm, "").substring(0, 32) || `Turn Step ${idx + 1}`,
        detail: `${s.distance?.text || ""} • ${s.duration?.text || ""}`,
      }));
    }
    return [];
  }, [liveSteps, routeInfo]);

  // Dynamic Intelligence Metrics
  const intelligenceMetrics = useMemo(() => {
    const tempVal = currentWeather?.tempCelsius ?? currentWeather?.temp ?? null;
    const tempDisplay = tempVal !== null && tempVal !== undefined ? `${Math.round(tempVal)}°C` : "--";
    const conditionText = (currentWeather?.condition || currentWeather?.main || "NORMAL").toUpperCase();

    let weatherDesc = "Live weather details from OpenWeather API";
    if (currentWeather?.description) {
      const parts = [currentWeather.description.toUpperCase()];
      if (currentWeather.humidity !== undefined && currentWeather.humidity !== null) {
        parts.push(`HUMIDITY ${currentWeather.humidity}%`);
      }
      if (currentWeather.windSpeedKmh !== undefined && currentWeather.windSpeedKmh !== null) {
        parts.push(`WIND ${currentWeather.windSpeedKmh} KM/H`);
      }
      weatherDesc = parts.join(" • ");
    }

    return [
      {
        id: "weather",
        icon: "◒",
        label: "WEATHER",
        value: tempDisplay,
        status: conditionText,
        detail: weatherDesc,
      },
      {
        id: "route",
        icon: "╱",
        label: "ROUTE STATUS",
        value: routeStatus === "success" ? "COMPUTED" : "NOT COMPUTED",
        status: routeStatus === "success" ? "TRAFFIC AWARE" : "PENDING",
        detail: routeStatus === "success" ? "Live turn-by-turn road navigation guidance" : "Compute route in Ride Planner to view turn guidance",
      },
      {
        id: "distance",
        icon: "≋",
        label: "DISTANCE",
        value: activeRide ? `${activeRide.distanceKm || 0} KM` : "--",
        status: activeRide?.durationDays ? `${activeRide.durationDays} DAY(S)` : "1 DAY",
        detail: riderCoords?.isLive
          ? "Distance from rider's live device location"
          : "Total planned journey distance",
      },
      {
        id: "budget",
        icon: "⛽",
        label: "PLANNED BUDGET",
        value: activeRide?.budget ? `₹${activeRide.budget}` : "--",
        status: "ESTIMATED",
        detail: "Estimated fuel & journey expense budget",
      },
    ];
  }, [currentWeather, activeRide, routeStatus, riderCoords]);

  const selectedData =
    intelligenceMetrics.find((item) => item.id === selectedInfo) ||
    intelligenceMetrics[0];

  return (
    <section id="journey-intelligence" className="journey-intelligence">
      <div className="journey-container">
        <div className="journey-heading">
          <div>
            <span className="journey-eyebrow">
              <span className="journey-eyebrow-line" />
              MOTO AI • JOURNEY INTELLIGENCE
            </span>

            <h2>
              KNOW THE ROAD
              <span>BEFORE YOU RIDE.</span>
            </h2>

            <p>
              MotoTribe combines live device GPS location, real turn-by-turn street maps, and OpenWeather analysis to keep you safe and informed.
            </p>
          </div>

          <div className="journey-heading-status">
            <span className="status-pulse" />
            <div>
              <strong>INTELLIGENCE ONLINE</strong>
              <small>{locStatus}</small>
            </div>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="journey-empty-state">
            <div className="empty-icon">🔒</div>
            <h3>AUTHENTICATION REQUIRED</h3>
            <p>Please log in to view your live journey intelligence and active routes.</p>
          </div>
        ) : loading ? (
          <div className="journey-empty-state">
            <div className="empty-spinner"></div>
            <h3>LOADING JOURNEY INTELLIGENCE...</h3>
            <p>Fetching active rides, acquiring device GPS, and loading live weather.</p>
          </div>
        ) : !activeRide ? (
          <div className="journey-empty-state">
            <div className="empty-icon">🏍️</div>
            <h3>NO ACTIVE OR UPCOMING RIDES</h3>
            <p>You have no ongoing or upcoming planned rides. Create a ride in the Ride Planner to view active journey intelligence!</p>
          </div>
        ) : (
          <>
            <div className="journey-layout">
              <div className="journey-map-card">
                <div className="map-topbar">
                  <div>
                    <span className="status-badge">{activeRide.status.toUpperCase()} RIDE</span>
                    <strong>{activeRide.title}</strong>
                  </div>

                  <div className="map-controls-group">
                    <button
                      type="button"
                      className="map-mode-btn"
                      onClick={() =>
                        setMapMode(
                          mapMode === "dark" ? "osm" : mapMode === "osm" ? "satellite" : "dark"
                        )
                      }
                    >
                      {mapMode === "dark"
                        ? "🌙 DARK MAP"
                        : mapMode === "osm"
                        ? "🗺️ STREET MAP"
                        : "🛰️ SATELLITE"}
                    </button>

                    <button
                      type="button"
                      className="recenter-btn"
                      onClick={handleRecenter}
                      title="Recenter on Device Location"
                    >
                      🎯 DEVICE GPS
                    </button>

                    <button
                      type="button"
                      className={`map-toggle ${showStops ? "active" : ""}`}
                      onClick={() => setShowStops(!showStops)}
                    >
                      <span />
                      STEPS
                    </button>
                  </div>
                </div>

                <div className="journey-map" style={{ position: "relative", minHeight: "420px", overflow: "hidden" }}>
                  {/* REAL INTERACTIVE MAP CANVAS */}
                  <div
                    ref={mapContainerRef}
                    className="real-interactive-map"
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      inset: 0,
                      zIndex: 1,
                      background: "#0d0e12",
                    }}
                  />

                  {/* Real Step-by-step Turn Navigation Overlay */}
                  {showStops && displaySteps.length > 0 && (
                    <div className="map-stop-list" style={{ zIndex: 3 }}>
                      {displaySteps.slice(0, 4).map((step, idx) => (
                        <div className="map-stop" key={idx}>
                          <span className="map-stop-icon">{step.icon}</span>
                          <div>
                            <small>STEP {idx + 1}</small>
                            <strong>{step.title}</strong>
                            <p>{step.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rider Device Live Location Floating Badge */}
                  <div className="map-rider rider-one" style={{ zIndex: 3 }}>
                    <span className="pulse-dot">●</span>
                    <small>RIDER (DEVICE GPS)</small>
                  </div>
                </div>

                <div className="map-bottom">
                  <div className="map-stat">
                    <span>DISTANCE</span>
                    <strong>{activeRide.distanceKm ? `${activeRide.distanceKm} KM` : "--"}</strong>
                  </div>

                  <div className="map-stat">
                    <span>DURATION</span>
                    <strong>{activeRide.durationDays ? `${activeRide.durationDays} DAYS` : "1 DAY"}</strong>
                  </div>

                  <div className="map-stat">
                    <span>DEVICE GPS</span>
                    <strong style={{ fontSize: "0.85rem", color: riderCoords?.isLive ? "#00ffaa" : "#e6ad50" }}>
                      {riderCoords?.isLive
                        ? `${riderCoords.lat.toFixed(2)}°, ${riderCoords.lng.toFixed(2)}°`
                        : "ACQUIRING..."}
                    </strong>
                  </div>

                  <div className="map-stat">
                    <span>OPENWEATHER</span>
                    <strong>
                      {currentWeather?.tempCelsius !== undefined && currentWeather?.tempCelsius !== null
                        ? `${Math.round(currentWeather.tempCelsius)}°C`
                        : currentWeather?.temp !== undefined && currentWeather?.temp !== null
                        ? `${Math.round(currentWeather.temp)}°C`
                        : "--"}
                    </strong>
                  </div>
                </div>
              </div>

              <aside className="journey-intelligence-panel">
                <div className="panel-header">
                  <div>
                    <span>AI ANALYSIS</span>
                    <h3>JOURNEY<br />INTELLIGENCE</h3>
                  </div>

                  <div className="panel-ai-mark">AI</div>
                </div>

                <div className="intelligence-grid">
                  {intelligenceMetrics.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`intelligence-item ${
                        selectedInfo === item.id ? "active" : ""
                      }`}
                      onClick={() => setSelectedInfo(item.id)}
                    >
                      <div className="intelligence-icon">{item.icon}</div>

                      <div>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <small>{item.status}</small>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="selected-intelligence">
                  <div className="selected-info-header">
                    <span>{selectedData.label}</span>
                    <span className="verified-tag">LIVE API</span>
                  </div>

                  <strong>{selectedData.value}</strong>

                  <p>{selectedData.detail}</p>
                </div>
              </aside>
            </div>

            {/* Ride Selector Tabs if multiple rides exist */}
            {rides.length > 1 && (
              <div className="route-selector">
                <div className="route-selector-heading">
                  <div>
                    <span>YOUR RIDES</span>
                    <h3>SELECT A RIDE TO INSPECT</h3>
                  </div>

                  <span className="route-count">
                    {rides.length} RIDES AVAILABLE
                  </span>
                </div>

                <div className="route-options">
                  {rides.map((ride) => (
                    <button
                      type="button"
                      key={ride._id}
                      className={`route-option ${
                        activeRide._id === ride._id ? "active" : ""
                      }`}
                      onClick={() => setActiveRide(ride)}
                    >
                      <div className="route-option-top">
                        <span>STATUS: {ride.status.toUpperCase()}</span>

                        {activeRide._id === ride._id && (
                          <span className="selected-route">SELECTED</span>
                        )}
                      </div>

                      <strong>{ride.title}</strong>

                      <div className="route-option-stats">
                        <span>{ride.distanceKm ? `${ride.distanceKm} KM` : ""}</span>
                        <span>{ride.durationDays ? `${ride.durationDays} Days` : ""}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default JourneyIntelligence;