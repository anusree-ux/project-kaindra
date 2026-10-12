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
    const stats = {
      ridesCompleted: totalRides,
      totalDistanceKm: totalDistance,
      regionsExplored: profile?.regionsExplored?.length || 0,
      rideGroupsJoined: profile?.rideGroupsJoined || 0,
    };

    earnedBadges.forEach((b) => {
      const curVal = stats[b.criteriaType] ?? b.criteriaValue;
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
      const curVal = stats[b.criteriaType] ?? 0;
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
  }, [earnedBadges, unearnedBadges, totalRides, totalDistance, profile]);

  useEffect(() => {
    if (allBadges.length > 0 && !selectedKey) {
      setSelectedKey(allBadges[0].key);
    }
  }, [allBadges, selectedKey]);

  const selectedBadge = allBadges.find((b) => b.key === selectedKey) || allBadges[0] || null;
  const selectedIndex = allBadges.findIndex((b) => b.key === selectedKey);

  const riderLevel =
    totalRides > 10
      ? "VETERAN RIDER"
      : totalRides > 3
      ? "EXPLORER"
      : totalRides >= 1
      ? "ACTIVE RIDER"
      : "ROOKIE RIDER";

  const nextTierTarget = totalRides < 5 ? 5 : totalRides < 10 ? 10 : 25;
  const progressPercent = Math.min(100, Math.round((totalRides / nextTierTarget) * 100));

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

        {/* TOP CREDENTIALS GRID */}
        <div className="passport-grid">
          {/* PASSPORT CARD */}
          <div className="passport-card">
            {/* CARD HEADER CHIP */}
            <div className="passport-card-header">
              <div className="passport-chip">
                <span className="chip-icon">✦</span>
                <span className="chip-text">MOTO TRIBE VERIFIED CREDENTIAL</span>
              </div>
              <span className="passport-id">
                MT-2026-{(user?._id || "F3A40C").slice(-6).toUpperCase()}
              </span>
            </div>

            {/* RIDER HERO SECTION */}
            <div className="passport-rider-hero">
              <div className="passport-rider-main">
                <span className="passport-eyebrow-mini">OFFICIAL RIDER IDENTITY</span>
                <h3 className="passport-rider-name">
                  {user?.name || "MOTOTRIBE RIDER"}
                </h3>
                <div className="passport-tier-badge">
                  <span className="tier-star">★</span>
                  <span className="tier-label">
                    {profile?.preferredRideType?.toUpperCase() || riderLevel}
                  </span>
                  <span className="tier-dot" />
                </div>
              </div>

              {/* ROTATED EMBOSSED VERIFIED SEAL */}
              <div className="passport-stamp-seal">
                <div className="stamp-seal-border">
                  <span className="stamp-sub">MOTO TRIBE</span>
                  <strong className="stamp-count">{totalRides}</strong>
                  <span className="stamp-unit">{totalRides === 1 ? "JOURNEY" : "JOURNEYS"}</span>
                  <span className="stamp-status">VERIFIED ✓</span>
                </div>
              </div>
            </div>

            {/* LEVEL PROGRESSION BAR */}
            <div className="passport-level-tracker">
              <div className="tracker-labels">
                <span>RANK PROGRESSION • {riderLevel}</span>
                <strong>{totalRides} / {nextTierTarget} RIDES TO NEXT TIER</strong>
              </div>
              <div className="tracker-bar">
                <div
                  className="tracker-fill"
                  style={{ width: `${Math.max(15, progressPercent)}%` }}
                />
              </div>
            </div>

            {/* STRUCTURED 4-CELL METRICS GRID */}
            <div className="passport-card-metrics">
              <div className="metric-cell">
                <span className="metric-label">RIDES</span>
                <strong className="metric-value">{totalRides}</strong>
                <span className="metric-hint">VERIFIED</span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">DISTANCE</span>
                <strong className="metric-value">
                  {totalDistance.toLocaleString()} <small>KM</small>
                </strong>
                <span className="metric-hint">LIFETIME</span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">BADGES</span>
                <strong className="metric-value">
                  {earnedBadges.length} <small>/ {allBadges.length}</small>
                </strong>
                <span className="metric-hint">UNLOCKED</span>
              </div>
              <div className="metric-cell status-cell">
                <span className="metric-label">STATUS</span>
                <strong className="metric-value status-badge">
                  {isAuthenticated ? "VERIFIED ✓" : "GUEST"}
                </strong>
                <span className="metric-hint">DB SYNCED</span>
              </div>
            </div>
          </div>

          {/* 4 STAT DISPLAY GRID */}
          <div className="passport-stats">
            <div className="passport-stat">
              <div className="stat-header">
                <div className="stat-index-badge">
                  <span className="stat-index">01</span>
                  <span className="stat-label-mini">RIDES</span>
                </div>
                <span className="stat-icon-wrap">🛣</span>
              </div>
              <div className="stat-content">
                <span className="stat-title">RECORDED RIDES</span>
                <div className="stat-value-display">
                  <span className="stat-big-number">{totalRides ?? 0}</span>
                  <span className="stat-value-tag">VERIFIED</span>
                </div>
                <span className="stat-caption">DATABASE VERIFIED JOURNEYS</span>
              </div>
            </div>

            <div className="passport-stat">
              <div className="stat-header">
                <div className="stat-index-badge">
                  <span className="stat-index">02</span>
                  <span className="stat-label-mini">DISTANCE</span>
                </div>
                <span className="stat-icon-wrap">⚡</span>
              </div>
              <div className="stat-content">
                <span className="stat-title">TOTAL DISTANCE</span>
                <div className="stat-value-display">
                  <span className="stat-big-number">
                    {Number(totalDistance || 0).toLocaleString()}
                  </span>
                  <span className="stat-unit-gold">KM</span>
                </div>
                <span className="stat-caption">LIFETIME ROAD KILOMETRES</span>
              </div>
            </div>

            <div className="passport-stat">
              <div className="stat-header">
                <div className="stat-index-badge">
                  <span className="stat-index">03</span>
                  <span className="stat-label-mini">BADGES</span>
                </div>
                <span className="stat-icon-wrap">🎖</span>
              </div>
              <div className="stat-content">
                <span className="stat-title">EARNED BADGES</span>
                <div className="stat-value-display">
                  <span className="stat-big-number">{earnedBadges?.length || 0}</span>
                  <span className="stat-fraction-gold">/ {allBadges?.length || 6}</span>
                </div>
                <span className="stat-caption">ACHIEVEMENT SEALS</span>
              </div>
            </div>

            <div className="passport-stat">
              <div className="stat-header">
                <div className="stat-index-badge">
                  <span className="stat-index">04</span>
                  <span className="stat-label-mini">STATUS</span>
                </div>
                <span className="stat-icon-wrap">🛡</span>
              </div>
              <div className="stat-content">
                <span className="stat-title">EXPLORER RANK</span>
                <div className="stat-value-display">
                  <span className="stat-big-number stat-rank-text">{riderLevel || "ROOKIE RIDER"}</span>
                </div>
                <span className="stat-caption">COMMUNITY TIER</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACHIEVEMENTS / BADGES REGISTRY */}
        <div className="achievement-section">
          <div className="achievement-heading">
            <div className="heading-left">
              <span className="heading-eyebrow">ACHIEVEMENT REGISTRY</span>
              <h3>DATABASE RIDER BADGES & MILESTONES</h3>
              <p>Official milestones unlocked in real-time as you complete journeys across the road.</p>
            </div>
            <div className="heading-summary-pill">
              <div className="pill-metric">
                <strong>{earnedBadges.length}</strong>
                <span>OF {allBadges.length} BADGES UNLOCKED</span>
              </div>
              <div className="pill-track">
                <div
                  className="pill-fill"
                  style={{
                    width: `${Math.round(
                      (earnedBadges.length / (allBadges.length || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="achievement-layout">
            {/* BADGES LIST */}
            <div className="achievement-list">
              {allBadges.map((badge, idx) => {
                const isSelected = selectedBadge?.key === badge.key;
                const percent = badge.isEarned
                  ? 100
                  : Math.min(
                      100,
                      Math.round(
                        ((badge.currentValue || 0) / (badge.criteriaValue || 1)) *
                          100
                      )
                    );

                return (
                  <button
                    key={badge.key}
                    type="button"
                    className={`achievement-item ${
                      isSelected ? "active" : ""
                    } ${badge.isEarned ? "earned" : "locked"}`}
                    onClick={() => setSelectedKey(badge.key)}
                  >
                    <span className="achievement-number">
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    <div
                      className={`achievement-badge-icon ${
                        badge.isEarned ? "unlocked" : "locked"
                      }`}
                    >
                      {badge.isEarned ? "★" : "🔒"}
                    </div>

                    <div className="achievement-info">
                      <span className="badge-tag">
                        {badge.criteriaType
                          .replace(/([A-Z])/g, " $1")
                          .toUpperCase()}
                      </span>
                      <strong className="badge-title">{badge.name}</strong>
                      <div className="badge-mini-bar">
                        <div
                          className="badge-mini-fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="achievement-badge-right">
                      {badge.isEarned ? (
                        <span className="earned-badge-chip">EARNED ✓</span>
                      ) : (
                        <span className="progress-badge-chip">
                          {badge.currentValue.toLocaleString()} /{" "}
                          {badge.criteriaValue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* BADGE DETAIL SHOWCASE */}
            {selectedBadge ? (
              <div className="achievement-detail">
                <div className="detail-top-row">
                  <span className="detail-category">
                    {selectedBadge.criteriaType
                      .replace(/([A-Z])/g, " $1")
                      .toUpperCase()}
                  </span>
                  <span className="detail-number">
                    MILESTONE 0{selectedIndex >= 0 ? selectedIndex + 1 : 1}
                  </span>
                </div>

                {/* LARGE BADGE GLOW */}
                <div
                  className={`showcase-medal ${
                    selectedBadge.isEarned ? "unlocked" : "locked"
                  }`}
                >
                  <div className="medal-glow" />
                  <div className="medal-rings">
                    <span className="medal-symbol">
                      {selectedBadge.isEarned ? "★" : "🔒"}
                    </span>
                  </div>
                </div>

                <h3 className="showcase-title">{selectedBadge.name}</h3>
                <p className="showcase-description">
                  {selectedBadge.description}
                </p>

                {/* PROGRESS CARD */}
                <div className="showcase-progress-card">
                  <div className="progress-card-header">
                    <span>CRITERIA REQUIREMENT</span>
                    <strong>
                      {selectedBadge.isEarned
                        ? "100% COMPLETED"
                        : `${Math.min(
                            100,
                            Math.round(
                              ((selectedBadge.currentValue || 0) /
                                (selectedBadge.criteriaValue || 1)) *
                                100
                            )
                          )}% COMPLETED`}
                    </strong>
                  </div>
                  <div className="progress-card-bar">
                    <div
                      className="progress-card-fill"
                      style={{
                        width: selectedBadge.isEarned
                          ? "100%"
                          : `${Math.min(
                              100,
                              Math.round(
                                ((selectedBadge.currentValue || 0) /
                                  (selectedBadge.criteriaValue || 1)) *
                                  100
                              )
                            )}%`,
                      }}
                    />
                  </div>
                  <div className="progress-card-counts">
                    <span>
                      CURRENT:{" "}
                      <strong>
                        {selectedBadge.currentValue.toLocaleString()}
                      </strong>
                    </span>
                    <span>
                      REQUIRED:{" "}
                      <strong>
                        {selectedBadge.criteriaValue.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* STATUS FOOTER BANNER */}
                <div
                  className={`showcase-status-banner ${
                    selectedBadge.isEarned ? "unlocked" : "locked"
                  }`}
                >
                  <span className="banner-icon">
                    {selectedBadge.isEarned ? "✓" : "⏳"}
                  </span>
                  <div className="banner-details">
                    <strong>
                      {selectedBadge.isEarned
                        ? "ACHIEVEMENT EARNED & VERIFIED"
                        : "MILESTONE IN PROGRESS"}
                    </strong>
                    <small>
                      {selectedBadge.isEarned
                        ? `Certified in database ${
                            selectedBadge.earnedAt
                              ? "• " +
                                new Date(
                                  selectedBadge.earnedAt
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : ""
                          }`
                        : `Complete ${Math.max(
                            0,
                            selectedBadge.criteriaValue -
                              selectedBadge.currentValue
                          ).toLocaleString()} more to unlock this achievement.`}
                    </small>
                  </div>
                </div>
              </div>
            ) : (
              <div className="achievement-detail empty">
                <p>Select an achievement from the registry to inspect unlock criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="passport-footer">
          <div className="footer-brand">
            <span>DIGITAL IDENTITY</span>
            <strong>MOTOTRIBE PASSPORT</strong>
          </div>
          <div className="footer-level">
            <span className="level-badge">LVL {Math.floor(totalRides / 3) + 1}</span>
            <div className="level-bar-track">
              <span
                style={{
                  width: `${Math.min(100, (totalRides % 3) * 33.3 + 25)}%`,
                }}
              />
            </div>
            <span className="level-badge">LVL {Math.floor(totalRides / 3) + 2}</span>
          </div>
          <p className="footer-note">
            Badges and ride statistics are automatically validated and awarded upon completion of each journey.
          </p>
        </footer>

      </div>
    </section>
  );
}

export default RidePassport;
