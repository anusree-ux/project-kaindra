import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./RidePassport.css";

function RidePassport() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [passportData, setPassportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);

  const fetchPassport = useCallback(async () => {
    if (!isAuthenticated) {
      setPassportData(null);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get("/api/mototribe/rider-profile/me/passport");
      if (res.data?.data) {
        setPassportData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load passport & achievements from DB:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  const profile = passportData?.profile;
  const earnedBadges = useMemo(() => passportData?.earnedBadges || [], [passportData]);
  const unearnedBadges = useMemo(() => passportData?.unearnedBadges || [], [passportData]);

  const totalRides = profile?.totalRidesCompleted || 0;
  const totalDistance = profile?.totalDistanceKm || 0;

  // Combine and format all badges from DB
  const allBadges = useMemo(() => {
    const list = [];

    earnedBadges.forEach((b) => {
      let curVal = b.criteriaValue;
      if (b.criteriaType === "ridesCompleted") curVal = totalRides;
      if (b.criteriaType === "totalDistanceKm") curVal = totalDistance;

      list.push({
        key: b.key,
        name: b.name,
        description: b.description,
        criteriaType: b.criteriaType,
        criteriaValue: b.criteriaValue,
        currentValue: Math.max(curVal, b.criteriaValue),
        isEarned: true,
        earnedAt: b.earnedAt,
      });
    });

    unearnedBadges.forEach((b) => {
      let curVal = 0;
      if (b.criteriaType === "ridesCompleted") curVal = totalRides;
      if (b.criteriaType === "totalDistanceKm") curVal = totalDistance;

      list.push({
        key: b.key,
        name: b.name,
        description: b.description,
        criteriaType: b.criteriaType,
        criteriaValue: b.criteriaValue,
        currentValue: curVal,
        isEarned: false,
      });
    });

    return list;
  }, [earnedBadges, unearnedBadges, totalRides, totalDistance]);

  useEffect(() => {
    if (allBadges.length > 0 && !selectedKey) {
      setSelectedKey(allBadges[0].key);
    }
  }, [allBadges, selectedKey]);

  const selectedBadge = allBadges.find((b) => b.key === selectedKey) || allBadges[0] || null;
  const selectedIndex = allBadges.findIndex((b) => b.key === selectedKey);

  const riderLevel = totalRides > 10 ? "VETERAN RIDER" : totalRides > 3 ? "EXPLORER" : "ROOKIE RIDER";
  const progressPercent = Math.min(100, Math.max(15, (totalRides % 5) * 20 + 20));

  return (
    <section className="ride-passport" id="passport">
      <div className="passport-container">

        {/* HEADER */}
        <header className="passport-header">
          <div>
            <div className="passport-eyebrow">
              <span /> RIDER IDENTITY & ACHIEVEMENTS
            </div>
            <h2>
              RIDE. RECORD.<br />
              <span>REMEMBER.</span>
            </h2>
          </div>
          <div className="passport-intro">
            <p>
              Your verified motorcycle ride passport and earned database achievement seals directly synced with your rider profile.
            </p>
          </div>
        </header>

        {/* GRID */}
        <div className="passport-grid">
          {/* PASSPORT CARD */}
          <div className="passport-card">
            <div className="passport-card-top">
              <div className="passport-rider-info">
                <span className="rider-id-label">
                  RIDER ID / MT-2026-{(user?._id || "0000").slice(-6).toUpperCase()}
                </span>
                <div className="passport-rider-name">
                  <h3>{user?.name || "MOTOTRIBE RIDER"}</h3>
                </div>
                <span className="rider-level">
                  {profile?.preferredRideType?.toUpperCase() || riderLevel}
                </span>
                <div className="level-bar">
                  <span style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <div className="passport-stamp">
                <span>VERIFIED</span>
                <strong>{totalRides} RIDES</strong>
              </div>
            </div>

            <div className="passport-card-bottom">
              <div>
                <span>RIDES</span>
                <strong>{totalRides}</strong>
              </div>
              <div>
                <span>DISTANCE</span>
                <strong>{totalDistance.toLocaleString()} KM</strong>
              </div>
              <div>
                <span>BADGES</span>
                <strong>{earnedBadges.length}</strong>
              </div>
              <div>
                <span>STATUS</span>
                <strong>{isAuthenticated ? "VERIFIED" : "GUEST"}</strong>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="passport-stats">
            <div className="passport-stat">
              <span>01 / RECORDED RIDES</span>
              <strong>{totalRides}</strong>
              <small>DATABASE VERIFIED JOURNEYS</small>
            </div>
            <div className="passport-stat">
              <span>02 / TOTAL DISTANCE</span>
              <strong>{totalDistance.toLocaleString()}</strong>
              <small>LIFETIME KILOMETRES</small>
            </div>
            <div className="passport-stat">
              <span>03 / EARNED BADGES</span>
              <strong>{earnedBadges.length}</strong>
              <small>ACHIEVEMENT SEALS</small>
            </div>
            <div className="passport-stat">
              <span>04 / EXPLORER RANK</span>
              <strong>{riderLevel}</strong>
              <small>COMMUNITY TIER</small>
            </div>
          </div>
        </div>

        {/* ACHIEVEMENTS / BADGES */}
        <div className="achievement-section">
          <div className="achievement-heading">
            <div>
              <span>ACHIEVEMENT REGISTRY</span>
              <strong>DATABASE RIDER BADGES & MILESTONES</strong>
            </div>
            <small>{earnedBadges.length} OF {allBadges.length} BADGES UNLOCKED</small>
          </div>

          <div className="achievement-layout">
            {/* BADGES LIST */}
            <div className="achievement-list">
              {allBadges.map((badge, idx) => {
                const isSelected = selectedBadge?.key === badge.key;
                return (
                  <button
                    key={badge.key}
                    type="button"
                    className={`achievement-item ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedKey(badge.key)}
                  >
                    <span className="achievement-number">
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    <div className={`achievement-badge ${badge.isEarned ? "unlocked" : ""}`}>
                      {badge.isEarned ? "★" : "○"}
                    </div>

                    <div className="achievement-info">
                      <small>{badge.criteriaType.replace(/([A-Z])/g, " $1").toUpperCase()}</small>
                      <strong>{badge.name}</strong>
                    </div>

                    <span className="achievement-progress">
                      {badge.isEarned ? "EARNED" : `${badge.currentValue}/${badge.criteriaValue}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* BADGE DETAIL */}
            {selectedBadge ? (
              <div className="achievement-detail">
                <span className="detail-number">
                  0{selectedIndex >= 0 ? selectedIndex + 1 : 1}
                </span>

                <div className={`large-badge ${selectedBadge.isEarned ? "unlocked" : ""}`}>
                  {selectedBadge.isEarned ? "★" : "🔒"}
                </div>

                <span className="detail-category">
                  {selectedBadge.criteriaType.replace(/([A-Z])/g, " $1").toUpperCase()}
                </span>

                <h3>{selectedBadge.name}</h3>
                <p>{selectedBadge.description}</p>

                <div className="achievement-progress-detail">
                  <div className="progress-label">
                    <span>PROGRESS</span>
                    <strong>
                      {selectedBadge.isEarned
                        ? "100%"
                        : `${Math.min(100, Math.round((selectedBadge.currentValue / selectedBadge.criteriaValue) * 100))}%`}
                    </strong>
                  </div>
                  <div className="progress-track">
                    <span
                      style={{
                        width: selectedBadge.isEarned
                          ? "100%"
                          : `${Math.min(100, Math.round((selectedBadge.currentValue / selectedBadge.criteriaValue) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="achievement-status">
                  <span>ACHIEVEMENT STATUS</span>
                  <strong>
                    {selectedBadge.isEarned
                      ? `UNLOCKED ${selectedBadge.earnedAt ? "• " + new Date(selectedBadge.earnedAt).toLocaleDateString() : ""}`
                      : `IN PROGRESS (${selectedBadge.currentValue} / ${selectedBadge.criteriaValue})`}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="achievement-detail">
                <p>Select a badge to view unlock criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="passport-footer">
          <div>
            <span>DIGITAL IDENTITY</span>
            <strong>MOTOTRIBE PASSPORT</strong>
          </div>
          <div className="rank-progress">
            <span>LVL {Math.floor(totalRides / 3) + 1}</span>
            <div>
              <span style={{ width: `${Math.min(100, (totalRides % 3) * 33.3 + 20)}%` }} />
            </div>
            <span>LVL {Math.floor(totalRides / 3) + 2}</span>
          </div>
          <p>
            Badges and achievements are automatically verified and awarded by Mongoose database triggers upon journey completion.
          </p>
        </div>

      </div>
    </section>
  );
}

export default RidePassport;
