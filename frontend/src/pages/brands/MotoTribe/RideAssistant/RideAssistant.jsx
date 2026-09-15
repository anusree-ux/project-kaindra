import { useState } from "react";
import "./RideAssistant.css";

function RideAssistant() {
  const [messages, setMessages] = useState([
    {
      type: "assistant",
      text: "Welcome back, rider. Where are we heading today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const quickActions = [
    "PLAN A RIDE",
    "CHECK WEATHER",
    "FIND SERVICES",
    "SAFETY CHECK",
  ];

  const responses = {
    "PLAN A RIDE":
      "I can help you plan a ride. Try destinations like Nandi Hills, Coorg or Sakleshpur.",
    "CHECK WEATHER":
      "Current demo conditions are ideal for riding: clear skies, moderate temperature and low rain probability.",
    "FIND SERVICES":
      "Nearby demo services include fuel stations, motorcycle service centres, cafés and emergency support.",
    "SAFETY CHECK":
      "Safety check complete. Helmet, riding gear, fuel level and emergency contacts should be verified before departure.",
  };

  const sendMessage = (message = input) => {
    const cleanMessage = message.trim();

    if (!cleanMessage || isThinking) return;

    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: cleanMessage,
      },
    ]);

    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      const normalized = cleanMessage.toUpperCase();

      let response =
        "I'm ready to help. You can ask me to plan a ride, check weather, find services or run a safety check.";

      if (responses[normalized]) {
        response = responses[normalized];
      } else if (normalized.includes("WEATHER")) {
        response =
          "Demo forecast: clear conditions with a comfortable riding window. Always verify live weather before departure.";
      } else if (
        normalized.includes("RIDE") ||
        normalized.includes("ROUTE")
      ) {
        response =
          "For a scenic ride, I recommend the Western Ghats route. You can open RIDE PLANNER to configure your journey.";
      } else if (
        normalized.includes("SERVICE") ||
        normalized.includes("FUEL")
      ) {
        response =
          "I can help locate fuel stations, service centres and rider-friendly stops along your route.";
      } else if (
        normalized.includes("SAFE") ||
        normalized.includes("EMERGENCY")
      ) {
        response =
          "For emergencies, move to a safe location first and contact local emergency services. MotoTribe can keep your emergency contacts accessible.";
      }

      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          text: response,
        },
      ]);

      setIsThinking(false);
    }, 900);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <section id="ride-assistant" className="ride-assistant">
      <div className="assistant-container">

        <div className="assistant-header">
          <div>
            <div className="assistant-eyebrow">
              <span></span>
              MOTO AI / RIDE ASSISTANT
            </div>

            <h2>
              YOUR RIDE.
              <br />
              <span>INTELLIGENTLY GUIDED.</span>
            </h2>
          </div>

          <div className="assistant-intro">
            <p>
              From route planning to safety and roadside support,
              your intelligent riding companion is always ready.
            </p>
          </div>
        </div>

        <div className="assistant-grid">

          <div className="assistant-chat">

            <div className="chat-topbar">
              <div className="assistant-status">
                <span className="status-dot"></span>
                MOTO AI ONLINE
              </div>

              <div className="assistant-version">
                ASSISTANT / 01
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`chat-message ${message.type}`}
                >
                  <div className="message-label">
                    {message.type === "assistant"
                      ? "MOTO AI"
                      : "YOU"}
                  </div>

                  <div className="message-bubble">
                    {message.text}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="chat-message assistant">
                  <div className="message-label">MOTO AI</div>

                  <div className="message-bubble thinking">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>

            <form
              className="assistant-input-area"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="ASK YOUR RIDE ASSISTANT..."
              />

              <button type="submit">
                SEND
                <span>→</span>
              </button>
            </form>
          </div>

          <div className="assistant-tools">

            <div className="tools-heading">
              <span>QUICK ACTIONS</span>
              <small>SELECT AN OPTION</small>
            </div>

            <div className="quick-actions">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => sendMessage(action)}
                >
                  <span className="action-number">
                    0{quickActions.indexOf(action) + 1}
                  </span>

                  <span>{action}</span>

                  <strong>↗</strong>
                </button>
              ))}
            </div>

            <div className="assistant-card">

              <div className="card-icon">AI</div>

              <div className="card-content">
                <span>JOURNEY AWARENESS</span>

                <strong>
                  SMART
                  <br />
                  ASSISTANCE
                </strong>

                <p>
                  Context-aware guidance for every stage
                  of your journey.
                </p>
              </div>

              <div className="card-orbit"></div>
            </div>
          </div>
        </div>

        <div className="assistant-features">

          <div className="assistant-feature">
            <span>01</span>
            <strong>ROUTE INTELLIGENCE</strong>
            <p>
              Discover routes based on distance,
              terrain and riding style.
            </p>
          </div>

          <div className="assistant-feature">
            <span>02</span>
            <strong>LIVE AWARENESS</strong>
            <p>
              Stay informed about weather,
              road conditions and nearby services.
            </p>
          </div>

          <div className="assistant-feature">
            <span>03</span>
            <strong>SAFETY SUPPORT</strong>
            <p>
              Keep essential safety information
              accessible throughout your ride.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}

export default RideAssistant;