import { useState, useEffect, useCallback } from "react";
import apiClient from "../../../../services/apiClient";
import "./TrustedTribe.css";

function TrustedTribe() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedRider, setSelectedRider] = useState(0);
  const [following, setFollowing] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch live riders from backend
  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        "/api/mototribe/riders-nearby?lat=12.9716&lng=77.5946&radius=1000000&filter=all"
      );
      const rawList = res.data.data?.riders || [];
      const formatted = rawList.map((r) => {
        const riderName = r.name || "Rider";
        const initials = riderName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();
        const trustRating = (r.trustScore / 20).toFixed(1);

        let expLabel = "Rookie";
        if (r.totalRidesCompleted > 20) expLabel = "PRO";
        else if (r.totalRidesCompleted > 10) expLabel = "ADVANCED";
        else if (r.totalRidesCompleted > 3) expLabel = "INTERMEDIATE";

        return {
          id: r.userId,
          name: riderName.toUpperCase(),
          tag: `@${riderName.toLowerCase().replace(/\s+/g, "")}`,
          level: expLabel.toUpperCase(),
          location: r.distanceKm ? `${r.distanceKm} KM AWAY` : "NEARBY",
          status: r.status ? r.status.toUpperCase() : "ONLINE",
          rides: r.totalRidesCompleted || 0,
          distance: r.totalDistanceKm ? (r.totalDistanceKm >= 1000 ? `${(r.totalDistanceKm / 1000).toFixed(1)}K` : `${r.totalDistanceKm}`) : "0",
          terrain: r.preferredRideType ? r.preferredRideType.toUpperCase() : "TOURING",
          experience: `${r.totalRidesCompleted || 1} JOURNEYS`,
          rating: trustRating,
          followers: `${r.trustScore || 100}`,
          initials: initials,
          category: r.distanceKm && r.distanceKm < 50 ? "NEARBY" : "TOP RIDER",
        };
      });
      setRiders(formatted);
    } catch (err) {
      console.error("Error fetching TrustedTribe riders:", err);
      setRiders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

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

  const currentRider = riders[selectedRider] || riders[0] || null;

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
            <strong>{loading ? "..." : `${riders.length} ${riders.length === 1 ? "RIDER" : "RIDERS"}`}</strong>
          </div>
        </div>

        <div className="trusted-layout">

          <div className="rider-list">
            {filteredRiders.length === 0 ? (
              <div className="empty-riders">
                <span>NO RIDERS FOUND</span>
                <p>
                  Join rides and explore nearby routes to connect with live riders in your network.
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

          {currentRider && (
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
          )}
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