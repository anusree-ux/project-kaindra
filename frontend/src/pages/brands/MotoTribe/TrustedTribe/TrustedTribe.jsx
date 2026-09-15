import { useState } from "react";
import "./TrustedTribe.css";

function TrustedTribe() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedRider, setSelectedRider] = useState(0);
  const [following, setFollowing] = useState([]);

  const riders = [
    {
      name: "ARJUN",
      tag: "@arjun.rides",
      level: "TRAIL SEEKER",
      location: "BENGALURU",
      status: "ONLINE",
      rides: 86,
      distance: "24.8K",
      terrain: "MOUNTAIN",
      experience: "7 YEARS",
      rating: "4.9",
      followers: "1.8K",
      initials: "AR",
      category: "TOP RIDER",
    },
    {
      name: "MEERA",
      tag: "@meera.moto",
      level: "ROAD EXPLORER",
      location: "HYDERABAD",
      status: "RIDING",
      rides: 64,
      distance: "18.4K",
      terrain: "HIGHWAY",
      experience: "5 YEARS",
      rating: "4.8",
      followers: "1.2K",
      initials: "ME",
      category: "NEARBY",
    },
    {
      name: "KARTHIK",
      tag: "@karthik.trails",
      level: "ADVENTURER",
      location: "CHENNAI",
      status: "ONLINE",
      rides: 112,
      distance: "31.7K",
      terrain: "MIXED",
      experience: "9 YEARS",
      rating: "5.0",
      followers: "2.4K",
      initials: "KA",
      category: "TOP RIDER",
    },
    {
      name: "RIYA",
      tag: "@riya.rides",
      level: "CITY RIDER",
      location: "MUMBAI",
      status: "OFFLINE",
      rides: 39,
      distance: "9.6K",
      terrain: "URBAN",
      experience: "3 YEARS",
      rating: "4.7",
      followers: "842",
      initials: "RI",
      category: "NEARBY",
    },
    {
      name: "VIKRAM",
      tag: "@vikram.road",
      level: "LONG HAUL",
      location: "PUNE",
      status: "ONLINE",
      rides: 143,
      distance: "42.1K",
      terrain: "HIGHWAY",
      experience: "11 YEARS",
      rating: "4.9",
      followers: "3.1K",
      initials: "VI",
      category: "TOP RIDER",
    },
  ];

  const filters = ["ALL", "NEARBY", "TOP RIDERS", "FOLLOWING"];

  const filteredRiders = riders.filter((rider) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "NEARBY") return rider.category === "NEARBY";
    if (activeFilter === "TOP RIDERS") return rider.category === "TOP RIDER";
    if (activeFilter === "FOLLOWING") {
      return following.includes(rider.tag);
    }
    return true;
  });

  const currentRider = riders[selectedRider];

  const toggleFollow = (tag) => {
    setFollowing((previous) =>
      previous.includes(tag)
        ? previous.filter((item) => item !== tag)
        : [...previous, tag]
    );
  };

  return (
    <section id="trusted-tribe" className="trusted-tribe">
      <div className="trusted-container">

        <div className="trusted-header">
          <div>
            <div className="trusted-eyebrow">
              <span></span>
              COMMUNITY / TRUSTED TRIBE
            </div>

            <h2>
              RIDE WITH
              <br />
              <span>YOUR TRIBE.</span>
            </h2>
          </div>

          <div className="trusted-intro">
            <p>
              Discover riders who share your passion for the road.
              Connect, follow and build your trusted riding network.
            </p>
          </div>
        </div>

        <div className="tribe-controls">
          <div className="tribe-filters">
            {filters.map((filter) => (
              <button
                key={filter}
                className={
                  activeFilter === filter
                    ? "tribe-filter active"
                    : "tribe-filter"
                }
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="tribe-count">
            <span>ACTIVE NETWORK</span>
            <strong>2,481 RIDERS</strong>
          </div>
        </div>

        <div className="trusted-layout">

          <div className="rider-list">
            {filteredRiders.length === 0 ? (
              <div className="empty-riders">
                <span>NO RIDERS FOUND</span>
                <p>
                  Follow riders to build your trusted network.
                </p>
              </div>
            ) : (
              filteredRiders.map((rider) => {
                const originalIndex = riders.findIndex(
                  (item) => item.tag === rider.tag
                );

                const isFollowing = following.includes(rider.tag);

                return (
                  <button
                    key={rider.tag}
                    className={
                      selectedRider === originalIndex
                        ? "rider-card active"
                        : "rider-card"
                    }
                    onClick={() => setSelectedRider(originalIndex)}
                  >
                    <div className="rider-avatar">
                      {rider.initials}
                    </div>

                    <div className="rider-card-info">
                      <div className="rider-name-row">
                        <strong>{rider.name}</strong>

                        <span
                          className={`rider-status ${rider.status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          <i></i>
                          {rider.status}
                        </span>
                      </div>

                      <span className="rider-tag">
                        {rider.tag}
                      </span>

                      <small>
                        {rider.level} / {rider.location}
                      </small>
                    </div>

                    <span
                      className={
                        isFollowing
                          ? "follow-indicator following"
                          : "follow-indicator"
                      }
                    >
                      {isFollowing ? "✓" : "+"}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="rider-profile">

            <div className="profile-top">
              <div className="profile-avatar">
                {currentRider.initials}
              </div>

              <div className="profile-identity">
                <span>TRUSTED RIDER PROFILE</span>
                <h3>{currentRider.name}</h3>
                <p>{currentRider.tag}</p>
              </div>

              <div
                className={`profile-status ${currentRider.status
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                <i></i>
                {currentRider.status}
              </div>
            </div>

            <div className="profile-location">
              <span>CURRENT BASE</span>
              <strong>{currentRider.location}</strong>
            </div>

            <div className="profile-stats">
              <div>
                <span>RIDES</span>
                <strong>{currentRider.rides}</strong>
              </div>

              <div>
                <span>DISTANCE</span>
                <strong>{currentRider.distance}</strong>
                <small>KM</small>
              </div>

              <div>
                <span>RATING</span>
                <strong>{currentRider.rating}</strong>
              </div>

              <div>
                <span>FOLLOWERS</span>
                <strong>{currentRider.followers}</strong>
              </div>
            </div>

            <div className="profile-details">
              <div>
                <span>RIDING STYLE</span>
                <strong>{currentRider.terrain}</strong>
              </div>

              <div>
                <span>EXPERIENCE</span>
                <strong>{currentRider.experience}</strong>
              </div>

              <div>
                <span>RIDER LEVEL</span>
                <strong>{currentRider.level}</strong>
              </div>
            </div>

            <div className="profile-actions">
              <button
                className={
                  following.includes(currentRider.tag)
                    ? "profile-follow following"
                    : "profile-follow"
                }
                onClick={() => toggleFollow(currentRider.tag)}
              >
                {following.includes(currentRider.tag)
                  ? "FOLLOWING ✓"
                  : "FOLLOW RIDER +"}
              </button>

              <button
                className="profile-invite"
                onClick={() =>
                  alert(
                    `Ride invite sent to ${currentRider.name}`
                  )
                }
              >
                INVITE TO RIDE
              </button>
            </div>

            <div className="trust-note">
              <span>TRUST SIGNAL</span>
              <p>
                Rider activity, community ratings and ride history
                help you identify reliable members of the Tribe.
              </p>
            </div>

          </div>
        </div>

        <div className="trusted-footer">
          <div>
            <span>TRIBE PRINCIPLE</span>
            <strong>TRUST THE RIDER. TRUST THE ROAD.</strong>
          </div>

          <p>
            Connect with people who make every journey better,
            safer and more memorable.
          </p>
        </div>

      </div>
    </section>
  );
}

export default TrustedTribe;