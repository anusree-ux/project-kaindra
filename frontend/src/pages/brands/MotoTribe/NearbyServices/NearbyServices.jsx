import { useState } from "react";
import "./NearbyServices.css";

function NearbyServices() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedService, setSelectedService] = useState(null);

  const filters = ["ALL", "FUEL", "SERVICE", "CAFE", "EMERGENCY"];

  const services = [
    {
      id: 1,
      type: "FUEL",
      name: "SHELL FUEL STATION",
      location: "HEBBAL",
      distance: "2.4 KM",
      status: "OPEN",
      detail: "Fuel, air pressure and basic rider essentials.",
      hours: "OPEN 24 HOURS",
    },
    {
      id: 2,
      type: "SERVICE",
      name: "MOTOCARE GARAGE",
      location: "YELAHANKA",
      distance: "4.8 KM",
      status: "OPEN",
      detail: "Motorcycle service, tyre check and quick repairs.",
      hours: "08:00 — 20:00",
    },
    {
      id: 3,
      type: "CAFE",
      name: "RIDERS STOP",
      location: "NANDI ROAD",
      distance: "7.2 KM",
      status: "OPEN",
      detail: "Rider-friendly café with parking and rest area.",
      hours: "07:00 — 22:00",
    },
    {
      id: 4,
      type: "EMERGENCY",
      name: "ROAD ASSIST",
      location: "NORTH BANGALORE",
      distance: "8.5 KM",
      status: "AVAILABLE",
      detail: "Emergency roadside assistance and towing support.",
      hours: "24 / 7",
    },
    {
      id: 5,
      type: "FUEL",
      name: "INDIANOIL OUTLET",
      location: "DEVANAHALLI",
      distance: "12.6 KM",
      status: "OPEN",
      detail: "Fuel station with convenience store.",
      hours: "OPEN 24 HOURS",
    },
    {
      id: 6,
      type: "SERVICE",
      name: "RIDER TECH GARAGE",
      location: "JAKKUR",
      distance: "13.4 KM",
      status: "OPEN",
      detail: "Diagnostics, maintenance and motorcycle repairs.",
      hours: "09:00 — 19:00",
    },
  ];

  const filteredServices =
    activeFilter === "ALL"
      ? services
      : services.filter((service) => service.type === activeFilter);

  const handleNavigate = (service) => {
    setSelectedService(service);

    alert(
      `Navigation started to ${service.name} — ${service.distance} away.`
    );
  };

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
              Find essential services around your route.
              Fuel, repairs, rest stops and emergency
              assistance — exactly when you need them.
            </p>
          </div>
        </div>

        <div className="nearby-layout">

          <div className="services-panel">

            <div className="services-toolbar">
              <div className="services-count">
                <strong>{filteredServices.length}</strong>
                <span>SERVICES FOUND</span>
              </div>

              <div className="service-filters">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    className={
                      activeFilter === filter ? "active" : ""
                    }
                    onClick={() => {
                      setActiveFilter(filter);
                      setSelectedService(null);
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="service-list">
              {filteredServices.map((service, index) => (
                <div
                  key={service.id}
                  className={
                    selectedService?.id === service.id
                      ? "service-row selected"
                      : "service-row"
                  }
                  onClick={() => setSelectedService(service)}
                >
                  <div className="service-index">
                    0{index + 1}
                  </div>

                  <div className="service-icon">
                    {service.type === "FUEL" && "F"}
                    {service.type === "SERVICE" && "M"}
                    {service.type === "CAFE" && "C"}
                    {service.type === "EMERGENCY" && "!"}
                  </div>

                  <div className="service-info">
                    <span>{service.type}</span>
                    <strong>{service.name}</strong>
                    <small>{service.location}</small>
                  </div>

                  <div className="service-distance">
                    <strong>{service.distance}</strong>
                    <small>{service.status}</small>
                  </div>

                  <button
                    className="service-arrow"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleNavigate(service);
                    }}
                  >
                    →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="service-detail">

            {!selectedService ? (
              <div className="detail-empty">
                <div className="radar">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <span>SELECT A SERVICE</span>

                <p>
                  Choose a service from the list to
                  view details and navigation options.
                </p>
              </div>
            ) : (
              <>
                <div className="detail-heading">
                  <span>{selectedService.type}</span>
                  <strong>0{selectedService.id}</strong>
                </div>

                <div className="selected-icon">
                  {selectedService.type === "EMERGENCY"
                    ? "!"
                    : selectedService.type.charAt(0)}
                </div>

                <h3>{selectedService.name}</h3>

                <div className="selected-location">
                  <span>LOCATION</span>
                  <strong>{selectedService.location}</strong>
                </div>

                <p className="selected-description">
                  {selectedService.detail}
                </p>

                <div className="selected-meta">
                  <div>
                    <span>DISTANCE</span>
                    <strong>{selectedService.distance}</strong>
                  </div>

                  <div>
                    <span>STATUS</span>
                    <strong>{selectedService.status}</strong>
                  </div>

                  <div>
                    <span>HOURS</span>
                    <strong>{selectedService.hours}</strong>
                  </div>
                </div>

                <button
                  className="navigate-button"
                  onClick={() => handleNavigate(selectedService)}
                >
                  START NAVIGATION
                  <span>→</span>
                </button>
              </>
            )}

          </div>
        </div>

        <div className="nearby-footer">
          <div>
            <span>LIVE SERVICE NETWORK</span>
            <strong>DEMO LOCATION DATA</strong>
          </div>

          <p>
            Connect live maps and location services later
            to display real-time nearby results.
          </p>
        </div>

      </div>
    </section>
  );
}

export default NearbyServices;