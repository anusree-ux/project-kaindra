import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./NearbyServices.css";

const CATEGORIES = [
  { label: "FUEL", key: "fuel" },
  { label: "REPAIR", key: "repair_shop" },
  { label: "HOSPITAL", key: "hospital" },
  { label: "FOOD", key: "food" },
  { label: "HOTEL", key: "hotel" },
  { label: "REST", key: "rest_stop" },
  { label: "SCENIC", key: "scenic_spot" },
];

function NearbyServices() {
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState("fuel");
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noCoordsError, setNoCoordsError] = useState(false);

  // 1. Determine location coordinates (Active Ride Origin > Browser Geolocation)
  const resolveLocation = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setNoCoordsError(false);

      // Check active user rides
      const res = await apiClient.get("/api/mototribe/rides");
      const rides = res.data?.data?.rides || [];

      const activeRide =
        rides.find((r) => r.status === "ongoing") ||
        rides.find((r) => r.status === "planning");

      if (activeRide?.originLat && activeRide?.originLng) {
        setCoords({ lat: activeRide.originLat, lng: activeRide.originLng });
        return;
      }

      // Try browser geolocation fallback
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          return;
        } catch {
          // Geolocation unavailable
        }
      }

      // Default fallback if no coordinates found
      setCoords(null);
      setNoCoordsError(true);
    } catch {
      setCoords(null);
      setNoCoordsError(true);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    resolveLocation();
  }, [resolveLocation]);

  // 2. Fetch nearby places when category or coords change
  useEffect(() => {
    if (!coords?.lat || !coords?.lng) return;

    const fetchPlaces = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(
          `/api/mototribe/nearby-services?lat=${coords.lat}&lng=${coords.lng}&category=${activeCategory}`
        );
        const fetchedPlaces = res.data?.data?.places || [];
        setPlaces(fetchedPlaces);
        setSelectedPlace(fetchedPlaces[0] || null);
      } catch {
        setPlaces([]);
        setSelectedPlace(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [coords, activeCategory]);

  return (
    <section id="nearby-services" className="nearby-services">
      <div className="nearby-container">
        <div className="nearby-header">
          <div>
            <div className="nearby-eyebrow">
              <span></span>
              RIDE SUPPORT / NEARBY SERVICES
            </div>

            <h2>
              EVERYTHING
              <br />
              <span>ALONG THE WAY.</span>
            </h2>
          </div>

          <div className="nearby-intro">
            <p>
              Find essential services around your route using live location data.
              Fuel, repairs, rest stops and medical assistance — exactly when you need them.
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="nearby-empty-card">
            <h3>AUTHENTICATION REQUIRED</h3>
            <p>Please log in to search nearby services along your route.</p>
          </div>
        ) : noCoordsError ? (
          <div className="nearby-empty-card">
            <div className="empty-icon">🗺️</div>
            <h3>NO ROUTE COORDINATES AVAILABLE YET</h3>
            <p>
              No location coordinates available for this route yet. Compute route in the Ride Planner to view nearby services!
            </p>
          </div>
        ) : (
          <div className="nearby-layout">
            <div className="services-panel">
              <div className="services-toolbar">
                <div className="services-count">
                  <strong>{places.length}</strong>
                  <span>SERVICES FOUND</span>
                </div>

                <div className="service-filters">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      className={activeCategory === cat.key ? "active" : ""}
                      onClick={() => {
                        setActiveCategory(cat.key);
                        setSelectedPlace(null);
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="nearby-loading-state">
                  <div className="empty-spinner"></div>
                  <span>SEARCHING NEARBY SERVICES...</span>
                </div>
              ) : places.length === 0 ? (
                <div className="nearby-empty-card">
                  <p>No nearby services found for category '{activeCategory.toUpperCase()}' within 5 KM.</p>
                </div>
              ) : (
                <div className="service-list">
                  {places.map((place, index) => (
                    <div
                      key={place.place_id || index}
                      className={
                        selectedPlace?.place_id === place.place_id
                          ? "service-row selected"
                          : "service-row"
                      }
                      onClick={() => setSelectedPlace(place)}
                    >
                      <div className="service-index">0{index + 1}</div>

                      <div className="service-icon">
                        {activeCategory === "fuel" && "⛽"}
                        {activeCategory === "repair_shop" && "🔧"}
                        {activeCategory === "hospital" && "🏥"}
                        {activeCategory === "food" && "☕"}
                        {activeCategory === "hotel" && "🏨"}
                        {activeCategory === "rest_stop" && "🅿️"}
                        {activeCategory === "scenic_spot" && "🌲"}
                      </div>

                      <div className="service-info">
                        <span>{activeCategory.toUpperCase()}</span>
                        <strong>{place.name}</strong>
                        <small>{place.vicinity || place.formatted_address || "Nearby"}</small>
                      </div>

                      <div className="service-distance">
                        <strong>{place.rating ? `★ ${place.rating}` : "OPEN"}</strong>
                        <small>{place.business_status || "OPERATIONAL"}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="service-detail">
              {!selectedPlace ? (
                <div className="detail-empty">
                  <div className="radar">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  <span>SELECT A SERVICE</span>
                  <p>Choose a service from the list to view location details.</p>
                </div>
              ) : (
                <>
                  <div className="detail-heading">
                    <span>{activeCategory.toUpperCase()}</span>
                    <strong>SELECTED</strong>
                  </div>

                  <h3>{selectedPlace.name}</h3>

                  <div className="selected-location">
                    <span>ADDRESS</span>
                    <strong>{selectedPlace.vicinity || selectedPlace.formatted_address || "Nearby"}</strong>
                  </div>

                  <div className="selected-meta">
                    <div>
                      <span>RATING</span>
                      <strong>{selectedPlace.rating ? `★ ${selectedPlace.rating}` : "N/A"}</strong>
                    </div>

                    <div>
                      <span>STATUS</span>
                      <strong>{selectedPlace.business_status || "OPERATIONAL"}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default NearbyServices;