import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./RideAssistant.css";

function RideAssistant() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeOption, setActiveOption] = useState("route");

  const [completedChecks, setCompletedChecks] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeAssistantChecks") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [assistantMode, setAssistantMode] = useState("READY");

  // Fetch active or planned ride from backend API
  const fetchActiveRide = useCallback(async () => {
    if (!isAuthenticated) {
      setActiveRide(null);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get("/api/mototribe/rides");
      const fetchedRides = res.data?.data?.rides || [];

      // Sort & find ongoing first, or earliest planning ride
      const ongoing = fetchedRides.find((r) => r.status === "ongoing");
      const planning = fetchedRides.find((r) => r.status === "planning");
      const selected = ongoing || planning || (fetchedRides.length > 0 ? fetchedRides[0] : null);

      setActiveRide(selected);
    } catch (err) {
      console.error("Error fetching active ride for assistant:", err);
      setActiveRide(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchActiveRide();

    const handleRideCreated = () => {
      fetchActiveRide();
    };

    window.addEventListener("mototribe:ride-created", handleRideCreated);
    return () => {
      window.removeEventListener("mototribe:ride-created", handleRideCreated);
    };
  }, [fetchActiveRide]);

  useEffect(() => {
    localStorage.setItem(
      "mototribeAssistantChecks",
      JSON.stringify(completedChecks)
    );
  }, [completedChecks]);

  // Compute dynamic AI guidance options based on active ride
  const assistantOptions = useMemo(() => {
    const origin = typeof activeRide?.origin === "object" ? activeRide.origin.name : activeRide?.origin || "Origin";
    const destination = typeof activeRide?.destination === "object" ? activeRide.destination.name : activeRide?.destination || "Destination";
    const dist = activeRide?.distanceKm || 250;
    const budget = activeRide?.budget || 3500;
    const estFuelLitres = Math.ceil(dist / 35);

    return [
      {
        id: "route",
        number: "01",
        title: "ROUTE ASSIST",
        shortTitle: "Route",
        icon: "↗",
        description: activeRide
          ? `Live route guidance for ${activeRide.title || `${origin} → ${destination}`}`
          : "Get guidance for planning and managing your active riding route.",
        tips: activeRide
          ? [
              `Review turn-by-turn route intelligence from ${origin} to ${destination} (${dist} KM).`,
              `Identify mandatory rest stops along the ${destination} highway section.`,
              `Ensure offline maps are cached for remote stretches between ${origin} and ${destination}.`,
              `Share your live trip progress link with your trusted emergency contacts.`,
            ]
          : [
              "Check the route before starting your ride.",
              "Identify fuel and rest stops in advance.",
              "Keep an alternate route available for unexpected road conditions.",
              "Share your planned route with a trusted contact.",
            ],
      },
      {
        id: "fuel",
        number: "02",
        title: "FUEL CHECK",
        shortTitle: "Fuel",
        icon: "◉",
        description: activeRide
          ? `Fuel intelligence for your ${dist} KM journey`
          : "Keep your motorcycle ready by planning fuel stops before the journey.",
        tips: activeRide
          ? [
              `Plan ~${estFuelLitres} Litres of fuel for your ${dist} KM journey to ${destination}.`,
              `Refuel at major verified pumps in ${origin} before hitting rural highways.`,
              `Budget set: ₹${budget} (allocated for fuel & roadside expenses).`,
              `Maintain a minimum 3 Litre fuel reserve for unexpected detours.`,
            ]
          : [
              "Refuel before entering long remote sections.",
              "Do not rely on the last available fuel station.",
              "Monitor your motorcycle's average mileage.",
              "Keep enough fuel reserve for unexpected detours.",
            ],
      },
      {
        id: "service",
        number: "03",
        title: "SERVICE HELP",
        shortTitle: "Service",
        icon: "⚙",
        description: activeRide
          ? `Pre-ride maintenance check for ${activeRide.title || destination}`
          : "Prepare for common motorcycle service requirements during a ride.",
        tips: activeRide
          ? [
              `Inspect front & rear tyre pressures before leaving ${origin}.`,
              `Lube and check chain slack for the ${dist} KM highway run.`,
              `Verify engine oil level and brake fluid responsiveness.`,
              `Check nearby repair shops on the map for emergency roadside service.`,
            ]
          : [
              "Check tyre pressure before departure.",
              "Inspect chain condition and lubrication.",
              "Check engine oil and coolant levels.",
              "Know the nearest service points on long routes.",
            ],
      },
      {
        id: "safety",
        number: "04",
        title: "SAFETY CHECK",
        shortTitle: "Safety",
        icon: "✦",
        description: activeRide
          ? `Safety protocol for active ride ${activeRide.title}`
          : "Run through a simple safety checklist before getting on the road.",
        tips: activeRide
          ? [
              `Fasten certified helmet visor and full body protective armor.`,
              `Verify emergency contact broadcast is enabled in Safety SOS.`,
              `Carry digital & physical DL, RC, and Insurance documents.`,
              `Schedule 15-minute rest breaks every 90 minutes of continuous riding.`,
            ]
          : [
              "Wear a certified helmet and protective gear.",
              "Carry your driving and vehicle documents.",
              "Keep emergency contacts accessible.",
              "Avoid riding when excessively tired.",
            ],
      },
    ];
  }, [activeRide]);

  const selectedOption = useMemo(
    () => assistantOptions.find((option) => option.id === activeOption) || assistantOptions[0],
    [assistantOptions, activeOption]
  );

  const toggleCheck = (index) => {
    const checkId = `${activeOption}-${index}`;
    setCompletedChecks((current) =>
      current.includes(checkId)
        ? current.filter((item) => item !== checkId)
        : [...current, checkId]
    );
  };

  const getCheckId = (index) => `${activeOption}-${index}`;

  const completedForCurrent =
    selectedOption?.tips.filter((_, index) =>
      completedChecks.includes(getCheckId(index))
    ).length || 0;

  const resetChecks = () => {
    setCompletedChecks((current) =>
      current.filter((item) => !item.startsWith(`${activeOption}-`))
    );
  };

  return (
    <section className="ride-assistant-section" id="ride-assistant">
      <div className="ride-assistant-container">

        {/* HEADER */}
        <div className="ride-assistant-header">
          <div className="assistant-heading">
            <span className="assistant-eyebrow">
              MOTOTRIBE / RIDE ASSISTANT
            </span>

            <h2>
              Your ride.
              <br />
              Your co-pilot.
            </h2>

            <p>
              Practical AI guidance for every stage of your journey — from route preparation to the road ahead.
            </p>
          </div>

          <div className="assistant-status">
            <span className="assistant-status-label">
              ASSISTANT STATUS
            </span>

            <button
              className={`assistant-status-button ${assistantMode.toLowerCase()}`}
              onClick={() =>
                setAssistantMode(
                  assistantMode === "READY" ? "ACTIVE" : "READY"
                )
              }
            >
              <span className="status-dot"></span>
              {activeRide ? `ACTIVE: ${activeRide.title?.substring(0, 15) || "RIDE"}` : assistantMode}
            </button>
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
              Please log in to activate your AI Ride Assistant co-pilot, receive live route checklists, and monitor active ride telemetry.
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
                letterSpacing: "1.5px",
                fontSize: "12px",
              }}
            >
              LOGIN / SIGN UP TO UNLOCK
            </button>
          </div>
        ) : (
          <>
            {/* ACTIVE RIDE BANNER */}
            {!loading && activeRide && (
              <div
                style={{
                  marginTop: "25px",
                  padding: "16px 24px",
                  background: "rgba(201, 164, 93, 0.08)",
                  border: "1px solid rgba(201, 164, 93, 0.3)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",

                  flexWrap: "wrap",
                  gap: "15px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "20px" }}>🏍️</span>
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "1.5px", color: "#c9a45d" }}>
                      ACTIVE RIDE CO-PILOT LINKED
                    </span>
                    <h4 style={{ margin: "2px 0 0", fontSize: "16px", color: "#fff", fontWeight: "800" }}>
                      {activeRide.title || `${activeRide.origin} to ${activeRide.destination}`}
                    </h4>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "20px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: "800" }}>DISTANCE</span>
                    <strong style={{ color: "#fff" }}>{activeRide.distanceKm || 150} KM</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: "800" }}>STATUS</span>
                    <strong style={{ color: "#c9a45d" }}>{(activeRide.status || "PLANNING").toUpperCase()}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ASSISTANT NAV */}
            <div className="assistant-navigation">
              {assistantOptions.map((option) => (
                <button
                  key={option.id}
                  className={`assistant-nav-item ${
                    activeOption === option.id ? "active" : ""
                  }`}
                  onClick={() => setActiveOption(option.id)}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span className="assistant-nav-number">{option.number}</span>
                    <span className="assistant-nav-icon">{option.icon}</span>
                    <span className="assistant-nav-title">{option.shortTitle}</span>
                  </div>
                  <span className="assistant-nav-arrow">→</span>
                </button>
              ))}
            </div>

            {/* MAIN ASSISTANT PANEL */}
            <div className="assistant-main-panel">
              {/* LEFT */}
              <div className="assistant-panel-intro">
                <div>
                  <span className="assistant-panel-label">
                    ACTIVE ASSISTANCE / {selectedOption?.number}
                  </span>

                  <div className="assistant-large-icon">
                    {selectedOption?.icon}
                  </div>

                  <h3>{selectedOption?.title}</h3>

                  <p>{selectedOption?.description}</p>
                </div>

                <div>
                  <div className="assistant-progress">
                    <div className="assistant-progress-header">
                      <span>CHECKLIST PROGRESS</span>
                      <strong>
                        {completedForCurrent}/{selectedOption?.tips.length}
                      </strong>
                    </div>

                    <div className="assistant-progress-bar">
                      <span
                        style={{
                          width: `${
                            selectedOption?.tips.length
                              ? (completedForCurrent / selectedOption.tips.length) * 100
                              : 0
                          }%`,
                        }}
                      ></span>
                    </div>
                  </div>

                  <button className="assistant-reset" onClick={resetChecks}>
                    RESET CHECKLIST
                  </button>
                </div>
              </div>

              {/* RIGHT CHECKLIST */}
              <div className="assistant-checklist">
                <div className="checklist-heading">
                  <span>RECOMMENDED ACTIONS</span>
                  <span>
                    {selectedOption?.tips.length.toString().padStart(2, "0")}
                  </span>
                </div>

                {selectedOption?.tips.map((tip, index) => {
                  const checkId = getCheckId(index);
                  const isComplete = completedChecks.includes(checkId);

                  return (
                    <button
                      key={tip}
                      className={`assistant-check-item ${
                        isComplete ? "completed" : ""
                      }`}
                      onClick={() => toggleCheck(index)}
                    >
                      <span className="check-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="check-box">
                        {isComplete ? "✓" : ""}
                      </span>

                      <span className="check-text">{tip}</span>

                      <span className="check-arrow">→</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUICK ASSISTANCE */}
            <div className="quick-assistance">
              <div className="quick-assistance-heading">
                <span>QUICK ASSISTANCE</span>
                <h3>
                  Before you
                  <br />
                  ride.
                </h3>
              </div>

              <div className="quick-assistance-grid">
                <div className="quick-card">
                  <span>01</span>
                  <strong>DOCUMENTS</strong>
                  <p>
                    Keep your license, registration and insurance documents accessible.
                  </p>
                </div>

                <div className="quick-card">
                  <span>02</span>
                  <strong>GEAR</strong>
                  <p>
                    Helmet, gloves, riding jacket and protective equipment ready.
                  </p>
                </div>

                <div className="quick-card">
                  <span>03</span>
                  <strong>MOTORCYCLE</strong>
                  <p>
                    Inspect tyres, brakes, lights, chain and fluid levels.
                  </p>
                </div>

                <div className="quick-card">
                  <span>04</span>
                  <strong>CONTACT</strong>
                  <p>
                    Inform trusted contacts of your planned route and arrival time.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="assistant-footer">
              <span>MOTOTRIBE RIDE ASSISTANT</span>
              <p>Ride prepared. Ride aware. Ride together.</p>
            </div>
          </>
        )}

      </div>
    </section>
  );
}

export default RideAssistant;