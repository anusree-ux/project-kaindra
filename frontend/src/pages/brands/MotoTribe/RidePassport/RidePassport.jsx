import { useState } from "react";
import "./RidePassport.css";

function RidePassport() {
  const [selectedAchievement, setSelectedAchievement] = useState(0);

  const achievements = [
    {
      number: "01",
      title: "FIRST JOURNEY",
      category: "MILESTONE",
      description:
        "Complete your first recorded MotoTribe journey.",
      progress: 100,
      requirement: "1 / 1 RIDE",
      unlocked: true,
    },
    {
      number: "02",
      title: "ROAD EXPLORER",
      category: "DISTANCE",
      description:
        "Travel more than 1,000 kilometres across your journeys.",
      progress: 100,
      requirement: "1,000 / 1,000 KM",
      unlocked: true,
    },
    {
      number: "03",
      title: "MOUNTAIN SEEKER",
      category: "TERRAIN",
      description:
        "Complete five mountain or hill rides.",
      progress: 80,
      requirement: "4 / 5 RIDES",
      unlocked: false,
    },
    {
      number: "04",
      title: "LONG HAUL",
      category: "ENDURANCE",
      description:
        "Complete a single journey longer than 500 kilometres.",
      progress: 62,
      requirement: "310 / 500 KM",
      unlocked: false,
    },
    {
      number: "05",
      title: "TRIBE LEADER",
      category: "COMMUNITY",
      description:
        "Join or organise ten group riding experiences.",
      progress: 40,
      requirement: "4 / 10 RIDES",
      unlocked: false,
    },
  ];

  const currentAchievement =
    achievements[selectedAchievement];

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

        <div className="passport-grid">

          <div className="passport-card">

            <div className="passport-card-top">
              <span>MOTOTRIBE</span>
              <strong>RIDER / 001</strong>
            </div>

            <div className="passport-emblem">
              <div className="emblem-ring">
                <span>MT</span>
              </div>
            </div>

            <div className="rider-level">
              <span>RIDER LEVEL</span>
              <strong>EXPLORER</strong>
              <small>LEVEL 07</small>
            </div>

            <div className="level-progress">
              <div>
                <span>2,840 XP</span>
                <span>4,000 XP</span>
              </div>

              <div className="level-bar">
                <span></span>
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
              <strong>47</strong>
              <small>JOURNEYS</small>
            </div>

            <div className="passport-stat">
              <span>TOTAL DISTANCE</span>
              <strong>12.8K</strong>
              <small>KILOMETRES</small>
            </div>

            <div className="passport-stat">
              <span>TRIBE RIDES</span>
              <strong>18</strong>
              <small>GROUP RIDES</small>
            </div>

            <div className="passport-stat">
              <span>ACHIEVEMENTS</span>
              <strong>06</strong>
              <small>UNLOCKED</small>
            </div>

          </div>
        </div>

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
                {currentAchievement.unlocked ? "✓" : "MT"}
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
          </div>
        </div>

        <div className="passport-footer">

          <div>
            <span>NEXT RANK</span>
            <strong>ADVENTURER</strong>
          </div>

          <div className="rank-progress">
            <span>2,840 XP</span>
            <div>
              <span></span>
            </div>
            <span>4,000 XP</span>
          </div>

          <p>
            Keep riding to unlock new experiences,
            achievements and Tribe privileges.
          </p>

        </div>

      </div>
    </section>
  );
}

export default RidePassport;