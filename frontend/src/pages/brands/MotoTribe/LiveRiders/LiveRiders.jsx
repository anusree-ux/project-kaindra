import { useMemo, useState } from "react";
import "./LiveRiders.css";

const riders = [
  {
    id: 1,
    name: "ARJUN",
    initials: "AR",
    experience: "ADVANCED",
    motorcycle: "ROYAL ENFIELD HIMALAYAN",
    distance: "2.4 KM",
    location: "Bengaluru",
    route: "Nandi Hills Loop",
    rideType: "ADVENTURE",
    status: "RIDING",
    online: true,
    trust: 96,
    rides: 84,
    distanceRidden: "18.6K",
    regions: 12,
    avatar:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 2,
    name: "MEERA",
    initials: "ME",
    experience: "EXPERIENCED",
    motorcycle: "BMW G 310 GS",
    distance: "5.8 KM",
    location: "Bengaluru",
    route: "Coastal Explorer",
    rideType: "TOURING",
    status: "RIDING",
    online: true,
    trust: 94,
    rides: 61,
    distanceRidden: "12.2K",
    regions: 9,
    avatar:
      "https://images.unsplash.com/photo-1558980664-10ea3a1b4d7a?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 3,
    name: "KARTHIK",
    initials: "KA",
    experience: "ADVANCED",
    motorcycle: "KTM 390 ADVENTURE",
    distance: "8.1 KM",
    location: "Bengaluru",
    route: "Western Ghats",
    rideType: "ADVENTURE",
    status: "ONLINE",
    online: true,
    trust: 91,
    rides: 73,
    distanceRidden: "15.8K",
    regions: 15,
    avatar:
      "https://images.unsplash.com/photo-1558980394-0c0c0f6e2f7a?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 4,
    name: "RIYA",
    initials: "RI",
    experience: "INTERMEDIATE",
    motorcycle: "TRIUMPH SPEED 400",
    distance: "11.5 KM",
    location: "Bengaluru",
    route: "City Escape",
    rideType: "TOURING",
    status: "ONLINE",
    online: true,
    trust: 88,
    rides: 42,
    distanceRidden: "8.4K",
    regions: 7,
    avatar:
      "https://images.unsplash.com/photo-1558981033-0f0309284409?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 5,
    name: "VIKRAM",
    initials: "VI",
    experience: "EXPERT",
    motorcycle: "KAWASAKI VERSYS 650",
    distance: "18.3 KM",
    location: "Bengaluru",
    route: "Mysore Highway",
    rideType: "LONG DISTANCE",
    status: "RIDING",
    online: true,
    trust: 98,
    rides: 126,
    distanceRidden: "31.4K",
    regions: 24,
    avatar:
      "https://images.unsplash.com/photo-1558981420-87aa9dad1c42?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 6,
    name: "ADITYA",
    initials: "AD",
    experience: "INTERMEDIATE",
    motorcycle: "YAMAHA MT-15",
    distance: "22.7 KM",
    location: "Bengaluru",
    route: "Outer Ring Route",
    rideType: "COMMUTE",
    status: "ONLINE",
    online: true,
    trust: 86,
    rides: 37,
    distanceRidden: "6.1K",
    regions: 5,
    avatar:
      "https://images.unsplash.com/photo-1558981359-219d6364f9c8?auto=format&fit=crop&w=500&q=80",
  },
];

const filters = ["ALL", "RIDING NOW", "NEARBY", "ADVENTURE", "TOURING"];

function LiveRiders() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedRider, setSelectedRider] = useState(riders[0]);
  const [connected, setConnected] = useState([]);
  const [invited, setInvited] = useState(false);

  const filteredRiders = useMemo(() => {
    if (activeFilter === "ALL") {
      return riders;
    }

    if (activeFilter === "RIDING NOW") {
      return riders.filter((rider) => rider.status === "RIDING");
    }

    if (activeFilter === "NEARBY") {
      return riders.filter((rider) => parseFloat(rider.distance) <= 10);
    }

    if (activeFilter === "ADVENTURE") {
      return riders.filter((rider) => rider.rideType === "ADVENTURE");
    }

    if (activeFilter === "TOURING") {
      return riders.filter((rider) => rider.rideType === "TOURING");
    }

    return riders;
  }, [activeFilter]);

  const handleConnect = () => {
    if (connected.includes(selectedRider.id)) {
      setConnected((previous) =>
        previous.filter((id) => id !== selectedRider.id)
      );
    } else {
      setConnected((previous) => [...previous, selectedRider.id]);
    }
  };

  const handleInvite = () => {
    setInvited(true);

    setTimeout(() => {
      setInvited(false);
    }, 2200);
  };

  return (
    <section id="live-riders" className="live-riders">
      <div className="live-riders-container">
        <div className="live-riders-heading">
          <div>
            <span className="live-riders-eyebrow">
              <span />
              CONNECT • RIDER NETWORK
            </span>

            <h2>
              NEVER RIDE
              <span>ALONE.</span>
            </h2>

            <p>
              Find riders around you, discover who is riding nearby and build
              trusted connections around real riding experience.
            </p>
          </div>

          <div className="live-network-status">
            <div className="network-ring">
              <span />
            </div>

            <div>
              <strong>LIVE RIDER NETWORK</strong>
              <small>LOCATION SHARING CONTROLLED BY RIDERS</small>
            </div>
          </div>
        </div>

        <div className="live-riders-layout">
          <div className="rider-discovery">
            <div className="rider-discovery-top">
              <div>
                <span>FIND YOUR TRIBE</span>
                <h3>RIDERS NEARBY</h3>
              </div>

              <div className="rider-count">
                <strong>{filteredRiders.length}</strong>
                <span>RIDERS</span>
              </div>
            </div>

            <div className="rider-filters">
              {filters.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={activeFilter === filter ? "active" : ""}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="rider-grid">
              {filteredRiders.map((rider) => (
                <button
                  type="button"
                  key={rider.id}
                  className={`rider-card ${
                    selectedRider.id === rider.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedRider(rider);
                    setInvited(false);
                  }}
                >
                  <div className="rider-card-image">
                    <img src={rider.avatar} alt={rider.name} />

                    <div className="rider-card-gradient" />

                    <div className="rider-online">
                      <span className={rider.online ? "online" : ""} />
                      {rider.status}
                    </div>

                    <div className="rider-distance">
                      {rider.distance}
                    </div>

                    <div className="rider-initials">
                      {rider.initials}
                    </div>
                  </div>

                  <div className="rider-card-body">
                    <div className="rider-card-name">
                      <div>
                        <strong>{rider.name}</strong>
                        <span>{rider.experience}</span>
                      </div>

                      <b>{rider.trust}</b>
                    </div>

                    <div className="rider-bike">
                      {rider.motorcycle}
                    </div>

                    <div className="rider-card-footer">
                      <span>{rider.rideType}</span>
                      <span>{rider.rides} RIDES</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside className="rider-profile-panel">
            <div className="profile-panel-top">
              <span>RIDER PROFILE</span>

              <div className="profile-location">
                <span />
                {selectedRider.distance}
              </div>
            </div>

            <div className="profile-hero">
              <img
                src={selectedRider.avatar}
                alt={selectedRider.name}
              />

              <div className="profile-hero-overlay" />

              <div className="profile-hero-content">
                <div className="profile-status">
                  <span />
                  {selectedRider.status}
                </div>

                <h3>{selectedRider.name}</h3>

                <p>{selectedRider.motorcycle}</p>
              </div>
            </div>

            <div className="profile-experience">
              <div>
                <span>EXPERIENCE</span>
                <strong>{selectedRider.experience}</strong>
              </div>

              <div className="trust-score">
                <span>TRUST SCORE</span>
                <strong>{selectedRider.trust}</strong>
                <small>/100</small>
              </div>
            </div>

            <div className="profile-route">
              <div className="route-status-line">
                <span className="route-live-dot" />
                CURRENT JOURNEY
              </div>

              <strong>{selectedRider.route}</strong>

              <div className="route-location">
                <span>●</span>
                {selectedRider.location}
              </div>
            </div>

            <div className="profile-stats">
              <div>
                <strong>{selectedRider.rides}</strong>
                <span>RIDES</span>
              </div>

              <div>
                <strong>{selectedRider.distanceRidden}</strong>
                <span>KM RIDDEN</span>
              </div>

              <div>
                <strong>{selectedRider.regions}</strong>
                <span>REGIONS</span>
              </div>
            </div>

            <div className="profile-actions">
              <button
                type="button"
                className="connect-button"
                onClick={handleConnect}
              >
                {connected.includes(selectedRider.id)
                  ? "CONNECTED ✓"
                  : "CONNECT RIDER"}
                <span>→</span>
              </button>

              <button
                type="button"
                className="invite-button"
                onClick={handleInvite}
              >
                {invited ? "INVITATION SENT ✓" : "INVITE TO RIDE"}
              </button>
            </div>

            <div className="privacy-note">
              <span>◉</span>

              <p>
                Exact rider location is protected. Riders control who can see
                their live position.
              </p>
            </div>
          </aside>
        </div>

        <div className="connect-banner">
          <div className="connect-banner-mark">M</div>

          <div>
            <span>THE MOTOTRIBE PRINCIPLE</span>
            <strong>
              THE BEST PERSON TO GUIDE A RIDER IS SOMEONE WHO HAS ALREADY
              TAKEN THE RIDE.
            </strong>
          </div>

          <button
            type="button"
            onClick={() => {
              const section = document.getElementById("ride-planner");

              if (section) {
                section.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }}
          >
            PLAN WITH THE TRIBE
            <span>↗</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default LiveRiders;