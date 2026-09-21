import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./RidePassport.css";

function RidePassport() {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [selectedAchievement, setSelectedAchievement] = useState(0);
  const [passportData, setPassportData] = useState(null);
  const [achievements, setAchievements] = useState([]);

  // 1. Fetch live passport data from backend for logged in user
  const fetchPassportData = useCallback(async () => {
    if (!isAuthenticated) {
      setPassportData(null);
      setAchievements([]);
      return;
    }
    try {
      const res = await apiClient.get("/api/mototribe/rider-profile/me/passport");
      const { profile, earnedBadges = [] } = res.data?.data || {};

      setPassportData(profile || null);

      // Map earned badges from backend or display default milestones for logged in user
      const combined = [];
      let idx = 1;

      if (earnedBadges.length > 0) {
        earnedBadges.forEach((b) => {
          combined.push({
            number: String(idx++).padStart(2, "0"),
            title: (b.name || b.key || "ACHIEVEMENT").toUpperCase(),
            category: b.criteriaType ? b.criteriaType.toUpperCase() : "MILESTONE",
            description: b.description || "Earned MotoTribe achievement badge.",
            progress: 100,
            requirement: "COMPLETED ✓",
            unlocked: true,
          });
        });
      } else {
        const defaultBadges = [
          { title: "FIRST RIDE", category: "JOURNEY", description: "Complete your first recorded ride on MotoTribe.", progress: profile?.totalRidesCompleted ? 100 : 0, requirement: "1 RIDE COMPLETED", unlocked: (profile?.totalRidesCompleted || 0) >= 1 },
          { title: "CENTURION", category: "DISTANCE", description: "Cover 100+ kilometres in total riding distance.", progress: Math.min(100, Math.round(((profile?.totalDistanceKm || 0) / 100) * 100)), requirement: "100 KM COVERED", unlocked: (profile?.totalDistanceKm || 0) >= 100 },
          { title: "TRIBE EXPLORER", category: "COMMUNITY", description: "Join and participate in your first group ride.", progress: (profile?.rideGroupsJoined || 0) >= 1 ? 100 : 0, requirement: "1 GROUP RIDE", unlocked: (profile?.rideGroupsJoined || 0) >= 1 },
          { title: "IRON BUTT", category: "MILESTONE", description: "Complete a 500+ KM long distance endurance journey.", progress: Math.min(100, Math.round(((profile?.totalDistanceKm || 0) / 500) * 100)), requirement: "500 KM COVERED", unlocked: (profile?.totalDistanceKm || 0) >= 500 },
        ];
        defaultBadges.forEach((b) => {
          combined.push({
            number: String(idx++).padStart(2, "0"),
            ...b,
          });
        });
      }

      setAchievements(combined);
    } catch (err) {
      console.error("Error fetching RidePassport data:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPassportData();
  }, [fetchPassportData]);

  const currentAchievement = achievements[selectedAchievement] || achievements[0] || null;

  const totalRides = passportData?.totalRidesCompleted || 0;
  const totalDist = passportData?.totalDistanceKm || 0;
  const totalDistFormatted = totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)}K` : `${totalDist}`;
  const tribeRides = passportData?.rideGroupsJoined || 0;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  let riderLevelTitle = "ROOKIE";
  let riderLevelNum = "LEVEL 01";
  if (totalRides >= 20 || totalDist >= 5000) {
    riderLevelTitle = "PRO";
    riderLevelNum = "LEVEL 10";
  } else if (totalRides >= 10 || totalDist >= 2000) {
    riderLevelTitle = "EXPLORER";
    riderLevelNum = "LEVEL 07";
  } else if (totalRides >= 3 || totalDist >= 500) {
    riderLevelTitle = "ADVENTURER";
    riderLevelNum = "LEVEL 04";
  }

  const riderDisplayName = user?.name
    ? user.name.toUpperCase()
    : user?.email
    ? user.email.split("@")[0].toUpperCase()
    : "MOTOTRIBE RIDER";

  const riderInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "MT";

  return (
    <section id="ride-passport" className="ride-passport">
      <div className="passport-container">

        <div className="passport-header">
          <div>
            <div className="passport-eyebrow">
              <span></span>
              RIDER IDENTITY / RIDE PASSPORT
            </div>

            <h2>
              YOUR ROADS.
              <br />
              <span>YOUR STORY.</span>
            </h2>
          </div>

          <div className="passport-intro">
            <p>
              Every journey adds to your rider identity.
              Build your passport, unlock milestones and
              become part of the Tribe.
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px dashed rgba(212, 160, 62, 0.3)",
              borderRadius: "12px",
              margin: "40px 0",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>🔒</div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "2px", color: "#d4a03e", marginBottom: "8px" }}>
              AUTHENTICATION REQUIRED
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", maxWidth: "480px", margin: "0 auto 20px" }}>
              Please log in to view your personalized Rider Identity, Ride Passport, level progression, total ride distance, and unlocked achievements.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              style={{
                padding: "12px 28px",
                background: "linear-gradient(135deg, #d4a03e 0%, #b88328 100%)",
                color: "#07080a",
                fontWeight: "800",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                letterSpacing: "1px",
              }}
            >
              LOG IN TO UNLOCK PASSPORT
            </button>
          </div>
        ) : (
          <>
            <div className="passport-grid">

              <div className="passport-card">

                <div className="passport-card-top">
                  <span>MOTOTRIBE</span>
                  <strong>{riderDisplayName}</strong>
                </div>

                <div className="passport-emblem">
                  <div className="emblem-ring">
                    <span>{riderInitials}</span>
                  </div>
                </div>

                <div className="rider-level">
                  <span>RIDER LEVEL</span>
                  <strong>{riderLevelTitle}</strong>
                  <small>{riderLevelNum}</small>
                </div>

                <div className="level-progress">
                  <div>
                    <span>{totalDist} KM</span>
                    <span>5,000 KM</span>
                  </div>

                  <div className="level-bar">
                    <span style={{ width: `${Math.min(100, (totalDist / 5000) * 100)}%` }}></span>
                  </div>
                </div>

                <div className="passport-stamp">
                  <span>ACTIVE RIDER</span>
                  <strong>2026</strong>
                </div>
              </div>

              <div className="passport-stats">

                <div className="passport-stat">
                  <span>TOTAL RIDES</span>
                  <strong>{totalRides}</strong>
                  <small>JOURNEYS</small>
                </div>

                <div className="passport-stat">
                  <span>TOTAL DISTANCE</span>
                  <strong>{totalDistFormatted}</strong>
                  <small>KILOMETRES</small>
                </div>

                <div className="passport-stat">
                  <span>TRIBE RIDES</span>
                  <strong>{tribeRides}</strong>
                  <small>GROUP RIDES</small>
                </div>

                <div className="passport-stat">
                  <span>ACHIEVEMENTS</span>
                  <strong>{String(unlockedCount).padStart(2, "0")}</strong>
                  <small>UNLOCKED</small>
                </div>

              </div>
            </div>

            {achievements.length > 0 ? (
              <div className="achievement-section">

                <div className="achievement-heading">
                  <div>
                    <span>RIDER PROGRESSION</span>
                    <strong>ACHIEVEMENTS</strong>
                  </div>

                  <small>
                    SELECT A MILESTONE TO EXPLORE
                  </small>
                </div>

                <div className="achievement-layout">

                  <div className="achievement-list">

                    {achievements.map((achievement, index) => (
                      <button
                        key={achievement.title}
                        className={
                          selectedAchievement === index
                            ? "achievement-item active"
                            : "achievement-item"
                        }
                        onClick={() =>
                          setSelectedAchievement(index)
                        }
                      >
                        <span className="achievement-number">
                          {achievement.number}
                        </span>

                        <span
                          className={
                            achievement.unlocked
                              ? "achievement-badge unlocked"
                              : "achievement-badge"
                          }
                        >
                          {achievement.unlocked ? "✓" : "○"}
                        </span>

                        <span className="achievement-info">
                          <small>{achievement.category}</small>
                          <strong>{achievement.title}</strong>
                        </span>

                        <span className="achievement-progress">
                          {achievement.progress}%
                        </span>
                      </button>
                    ))}

                  </div>

                  {currentAchievement && (
                    <div className="achievement-detail">

                      <div className="detail-number">
                        {currentAchievement.number}
                      </div>

                      <div
                        className={
                          currentAchievement.unlocked
                            ? "large-badge unlocked"
                            : "large-badge"
                        }
                      >
                        {currentAchievement.unlocked ? "✓" : riderInitials}
                      </div>

                      <span className="detail-category">
                        {currentAchievement.category}
                      </span>

                      <h3>{currentAchievement.title}</h3>

                      <p>{currentAchievement.description}</p>

                      <div className="achievement-progress-detail">

                        <div className="progress-label">
                          <span>PROGRESS</span>
                          <strong>
                            {currentAchievement.requirement}
                          </strong>
                        </div>

                        <div className="progress-track">
                          <span
                            style={{
                              width: `${currentAchievement.progress}%`,
                            }}
                          ></span>
                        </div>

                      </div>

                      <div className="achievement-status">
                        <span>
                          {currentAchievement.unlocked
                            ? "ACHIEVEMENT UNLOCKED"
                            : "ACHIEVEMENT IN PROGRESS"}
                        </span>

                        <strong>
                          {currentAchievement.unlocked
                            ? "✓ COMPLETE"
                            : `${currentAchievement.progress}%`}
                        </strong>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="passport-footer">

              <div>
                <span>NEXT RANK</span>
                <strong>{riderLevelTitle === "PRO" ? "MASTER" : riderLevelTitle === "EXPLORER" ? "PRO" : "EXPLORER"}</strong>
              </div>

              <div className="rank-progress">
                <span>{totalDist} XP</span>
                <div>
                  <span style={{ width: `${Math.min(100, (totalDist / 5000) * 100)}%` }}></span>
                </div>
                <span>5,000 XP</span>
              </div>

              <p>
                Keep riding to unlock new experiences,
                achievements and Tribe privileges.
              </p>

            </div>
          </>
        )}

      </div>
    </section>
  );
}

export default RidePassport;