import { useMemo, useState } from "react";
import "./NearbyServices.css";

const services = [
  {
    id: 1,
    type: "FUEL",
    icon: "◉",
    name: "Highway Fuel Point",
    location: "NH 44 · 2.4 KM",
    distance: 2.4,
    rating: "4.6",
    status: "OPEN",
    detail: "Fuel, air pressure and basic rider refreshments.",
  },
  {
    id: 2,
    type: "SERVICE",
    icon: "⚙",
    name: "MotoCare Garage",
    location: "Industrial Road · 4.8 KM",
    distance: 4.8,
    rating: "4.7",
    status: "OPEN",
    detail: "Motorcycle inspection, chain service, oil and brake checks.",
  },
  {
    id: 3,
    type: "TYRE",
    icon: "◌",
    name: "RoadGrip Tyres",
    location: "Main Highway · 6.2 KM",
    distance: 6.2,
    rating: "4.5",
    status: "OPEN",
    detail: "Tyre puncture repair, replacement and wheel balancing.",
  },
  {
    id: 4,
    type: "HOSPITAL",
    icon: "+",
    name: "City Emergency Care",
    location: "Central Road · 7.5 KM",
    distance: 7.5,
    rating: "4.8",
    status: "24/7",
    detail: "Emergency medical assistance and ambulance support.",
  },
  {
    id: 5,
    type: "FOOD",
    icon: "◇",
    name: "Rider's Junction",
    location: "Old Highway · 9.1 KM",
    distance: 9.1,
    rating: "4.4",
    status: "OPEN",
    detail: "Quick meals, beverages and a comfortable rider rest area.",
  },
  {
    id: 6,
    type: "STAY",
    icon: "⌂",
    name: "Highway Rest Inn",
    location: "Bypass Road · 11.3 KM",
    distance: 11.3,
    rating: "4.3",
    status: "OPEN",
    detail: "Basic accommodation with motorcycle parking.",
  },
  {
    id: 7,
    type: "FUEL",
    icon: "◉",
    name: "Mountain Fuel Station",
    location: "Leh Road · 14.6 KM",
    distance: 14.6,
    rating: "4.5",
    status: "OPEN",
    detail: "Petrol, diesel and basic vehicle assistance.",
  },
  {
    id: 8,
    type: "SERVICE",
    icon: "⚙",
    name: "RiderFix Workshop",
    location: "Service Lane · 18.2 KM",
    distance: 18.2,
    rating: "4.6",
    status: "OPEN",
    detail: "Emergency motorcycle repairs and roadside support.",
  },
];

const serviceFilters = [
  "ALL",
  "FUEL",
  "SERVICE",
  "TYRE",
  "HOSPITAL",
  "FOOD",
  "STAY",
];

function NearbyServices() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedService, setSelectedService] = useState(null);
  const [sortMode, setSortMode] = useState("DISTANCE");

  const filteredServices = useMemo(() => {
    let result =
      activeFilter === "ALL"
        ? [...services]
        : services.filter(
            (service) => service.type === activeFilter
          );

    if (sortMode === "DISTANCE") {
      result.sort((a, b) => a.distance - b.distance);
    }

    if (sortMode === "RATING") {
      result.sort(
        (a, b) =>
          Number(b.rating) - Number(a.rating)
      );
    }

    return result;
  }, [activeFilter, sortMode]);

  const handleNavigate = (service) => {
    const searchQuery = encodeURIComponent(
      `${service.name} ${service.location}`
    );

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${searchQuery}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <section
      className="nearby-services-section"
      id="nearby-services"
    >
      <div className="nearby-services-container">

        {/* HEADER */}

        <div className="nearby-services-header">

          <div>
            <span className="nearby-eyebrow">
              MOTOTRIBE / NEARBY SERVICES
            </span>

            <h2>
              Support
              <br />
              along the way.
            </h2>

            <p>
              Find essential services around your
              route and keep your journey moving.
            </p>
          </div>

          <div className="nearby-location-status">
            <span className="location-indicator"></span>

            <div>
              <small>RIDER LOCATION</small>
              <strong>ROUTE AREA ACTIVE</strong>
            </div>
          </div>

        </div>

        {/* FILTER BAR */}

        <div className="service-toolbar">

          <div className="service-filters">
            {serviceFilters.map((filter) => (
              <button
                key={filter}
                className={
                  activeFilter === filter
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveFilter(filter)
                }
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="service-sort">

            <span>SORT</span>

            <select
              value={sortMode}
              onChange={(event) =>
                setSortMode(event.target.value)
              }
            >
              <option value="DISTANCE">
                DISTANCE
              </option>
              <option value="RATING">
                RATING
              </option>
            </select>

          </div>

        </div>

        {/* CONTENT */}

        <div className="nearby-services-layout">

          {/* SERVICE LIST */}

          <div className="service-list">

            <div className="service-list-header">
              <span>
                AVAILABLE SERVICES
              </span>

              <strong>
                {String(
                  filteredServices.length
                ).padStart(2, "0")}
              </strong>
            </div>

            {filteredServices.map((service) => (
              <button
                key={service.id}
                className={`service-card ${
                  selectedService?.id === service.id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSelectedService(service)
                }
              >

                <div className="service-icon">
                  {service.icon}
                </div>

                <div className="service-main">

                  <div className="service-card-top">

                    <span className="service-type">
                      {service.type}
                    </span>

                    <span
                      className={`service-status ${
                        service.status === "24/7"
                          ? "always-open"
                          : ""
                      }`}
                    >
                      {service.status}
                    </span>

                  </div>

                  <h3>{service.name}</h3>

                  <p>{service.location}</p>

                </div>

                <div className="service-card-meta">

                  <span>
                    {service.distance} KM
                  </span>

                  <strong>
                    ★ {service.rating}
                  </strong>

                  <span className="service-arrow">
                    →
                  </span>

                </div>

              </button>
            ))}

            {filteredServices.length === 0 && (
              <div className="service-empty">
                No services available in this category.
              </div>
            )}

          </div>

          {/* DETAIL PANEL */}

          <aside className="service-detail-panel">

            {selectedService ? (
              <>
                <span className="detail-eyebrow">
                  SELECTED SERVICE
                </span>

                <div className="detail-service-icon">
                  {selectedService.icon}
                </div>

                <span className="detail-service-type">
                  {selectedService.type}
                </span>

                <h3>
                  {selectedService.name}
                </h3>

                <p className="detail-location">
                  {selectedService.location}
                </p>

                <div className="detail-rating">
                  <strong>
                    ★ {selectedService.rating}
                  </strong>

                  <span>
                    Rider community rating
                  </span>
                </div>

                <p className="detail-description">
                  {selectedService.detail}
                </p>

                <div className="detail-information">

                  <div>
                    <span>DISTANCE</span>
                    <strong>
                      {selectedService.distance} KM
                    </strong>
                  </div>

                  <div>
                    <span>STATUS</span>
                    <strong>
                      {selectedService.status}
                    </strong>
                  </div>

                </div>

                <button
                  className="open-map-button"
                  onClick={() =>
                    handleNavigate(selectedService)
                  }
                >
                  OPEN IN MAP
                  <span>↗</span>
                </button>

                <button
                  className="close-detail-button"
                  onClick={() =>
                    setSelectedService(null)
                  }
                >
                  CLOSE DETAILS
                </button>
              </>
            ) : (
              <div className="service-detail-empty">

                <div className="empty-detail-icon">
                  +
                </div>

                <span>
                  SELECT A SERVICE
                </span>

                <p>
                  Choose a service from the list
                  to view details and navigation.
                </p>

              </div>
            )}

          </aside>

        </div>

        {/* FOOTER STRIP */}

        <div className="services-footer">

          <div>
            <span>FIELD SUPPORT</span>
            <strong>
              SERVICES DISCOVERED THROUGH THE
              RIDER NETWORK
            </strong>
          </div>

          <p>
            Always verify road conditions and
            service availability before travelling.
          </p>

        </div>

      </div>
    </section>
  );
}

export default NearbyServices;