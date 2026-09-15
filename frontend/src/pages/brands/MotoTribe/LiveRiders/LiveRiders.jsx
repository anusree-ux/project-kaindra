import { useMemo, useState } from "react";
import "./LiveRiders.css";

const riders = [
  {
    id: 1,
    name: "Arjun",
    location: "Delhi",
    distance: "2.4 KM",
    bike: "Royal Enfield Himalayan",
    style: "ADVENTURE",
    status: "ONLINE",
    experience: "ADVANCED",
    rides: 42,
  },
  {
    id: 2,
    name: "Rahul",
    location: "Chandigarh",
    distance: "5.8 KM",
    bike: "KTM Adventure 390",
    style: "ADVENTURE",
    status: "ONLINE",
    experience: "INTERMEDIATE",
    rides: 27,
  },
  {
    id: 3,
    name: "Meera",
    location: "Bengaluru",
    distance: "8.2 KM",
    bike: "Yamaha MT-15",
    style: "TOURING",
    status: "RIDING",
    experience: "INTERMEDIATE",
    rides: 31,
  },
  {
    id: 4,
    name: "Vikram",
    location: "Visakhapatnam",
    distance: "11.5 KM",
    bike: "Royal Enfield Classic 350",
    style: "CRUISER",
    status: "ONLINE",
    experience: "ADVANCED",
    rides: 56,
  },
  {
    id: 5,
    name: "Kiran",
    location: "Hyderabad",
    distance: "14.1 KM",
    bike: "Bajaj Dominar 400",
    style: "TOURING",
    status: "ONLINE",
    experience: "INTERMEDIATE",
    rides: 19,
  },
  {
    id: 6,
    name: "Aditya",
    location: "Mysuru",
    distance: "18.7 KM",
    bike: "KTM Duke 390",
    style: "SPORT",
    status: "RIDING",
    experience: "ADVANCED",
    rides: 38,
  },
];

function LiveRiders() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [connectedRiders, setConnectedRiders] = useState([]);

  const filteredRiders = useMemo(() => {
    return riders.filter((rider) => {
      const matchesSearch =
        rider.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        rider.location
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        rider.bike
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "ALL" || rider.style === filter;

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const toggleConnection = (riderId) => {
    setConnectedRiders((current) =>
      current.includes(riderId)
        ? current.filter((id) => id !== riderId)
        : [...current, riderId]
    );
  };

  const onlineCount = riders.filter(
    (rider) => rider.status === "ONLINE"
  ).length;

  const ridingCount = riders.filter(
    (rider) => rider.status === "RIDING"
  ).length;

  return (
    <section className="live-riders-section" id="live-riders">
      <div className="live-riders-container">

        {/* HEADER */}

        <div className="live-riders-header">

          <div>
            <span className="live-riders-eyebrow">
              MOTOTRIBE / RIDER NETWORK
            </span>

            <h2>Riders in motion.</h2>

            <p>
              Discover riders nearby, connect with your tribe
              and find people who ride like you.
            </p>
          </div>

          <div className="live-riders-stats">

            <div>
              <strong>{onlineCount}</strong>
              <span>ONLINE</span>
            </div>

            <div>
              <strong>{ridingCount}</strong>
              <span>RIDING NOW</span>
            </div>

            <div>
              <strong>{riders.length}</strong>
              <span>NEARBY</span>
            </div>

          </div>

        </div>

        {/* CONTROLS */}

        <div className="live-riders-controls">

          <div className="rider-search">
            <input
              type="text"
              placeholder="Search riders, cities or motorcycles..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="rider-filters">

            {[
              "ALL",
              "ADVENTURE",
              "TOURING",
              "CRUISER",
              "SPORT",
            ].map((item) => (
              <button
                key={item}
                className={
                  filter === item
                    ? "active"
                    : ""
                }
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}

          </div>

        </div>

        {/* RIDER GRID */}

        <div className="live-riders-grid">

          {filteredRiders.length > 0 ? (
            filteredRiders.map((rider) => {

              const isConnected =
                connectedRiders.includes(rider.id);

              return (
                <article
                  className="live-rider-profile"
                  key={rider.id}
                >

                  <div className="rider-profile-top">

                    <div className="rider-profile-avatar">
                      {rider.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div
                      className={`rider-status rider-status-${rider.status.toLowerCase()}`}
                    >
                      <span></span>
                      {rider.status}
                    </div>

                  </div>

                  <div className="rider-profile-content">

                    <span className="rider-style">
                      {rider.style}
                    </span>

                    <h3>{rider.name}</h3>

                    <p className="rider-location">
                      {rider.location}
                      <span>•</span>
                      {rider.distance}
                    </p>

                    <div className="rider-bike">
                      <span>MOTORCYCLE</span>
                      <strong>{rider.bike}</strong>
                    </div>

                    <div className="rider-profile-meta">

                      <div>
                        <span>EXPERIENCE</span>
                        <strong>
                          {rider.experience}
                        </strong>
                      </div>

                      <div>
                        <span>RIDES</span>
                        <strong>
                          {rider.rides}
                        </strong>
                      </div>

                    </div>

                  </div>

                  <button
                    className={`connect-rider-button ${
                      isConnected ? "connected" : ""
                    }`}
                    onClick={() =>
                      toggleConnection(rider.id)
                    }
                  >
                    {isConnected
                      ? "CONNECTED ✓"
                      : "CONNECT RIDER"}
                  </button>

                </article>
              );
            })
          ) : (
            <div className="no-riders-found">
              <span>NO RIDERS FOUND</span>
              <h3>
                Try another search or riding style.
              </h3>
            </div>
          )}

        </div>

        {/* FOOTER */}

        <div className="live-riders-footer">

          <span>
            MOTOTRIBE COMMUNITY NETWORK
          </span>

          <p>
            Rider availability and location are
            approximate and may change in real time.
          </p>

        </div>

      </div>
    </section>
  );
}

export default LiveRiders;