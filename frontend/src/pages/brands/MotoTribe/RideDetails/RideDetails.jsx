import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getMotoRideById,
  getMotoRideStatus,
  getMotoRideCountdown,
} from "../../../../data/motoRides";

import "./RideDetails.css";

/* --------------------------------------------------
   LOCAL STORAGE HELPERS
-------------------------------------------------- */

const getStoredArray = (key) => {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setStoredArray = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors in demo mode.
  }
};

/* --------------------------------------------------
   CHAT HELPERS
-------------------------------------------------- */

const getChatStorageKey = (rideId) =>
  `mototribe_ride_chat_${rideId}`;

const createInitialMessages = (ride) => {
  if (!ride) {
    return [];
  }

  return [
    {
      id: `system-${ride.id}`,
      type: "SYSTEM",
      sender: "MotoTribe",
      text: `Ride group created for ${ride.name}.`,
      timestamp: new Date().toISOString(),
    },
    {
      id: `organizer-${ride.id}`,
      type: "ORGANIZER",
      sender: ride.organizer || "Ride Organizer",
      text: "Welcome riders. Please check the route and planned stops before departure.",
      timestamp: new Date(
        Date.now() - 45 * 60 * 1000
      ).toISOString(),
    },
    {
      id: `demo-${ride.id}`,
      type: "RIDER",
      sender: "Arjun",
      text: "Looking forward to the ride. See you all at the start point.",
      timestamp: new Date(
        Date.now() - 25 * 60 * 1000
      ).toISOString(),
    },
  ];
};

const loadChatMessages = (rideId, ride) => {
  try {
    const stored = localStorage.getItem(
      getChatStorageKey(rideId)
    );

    if (!stored) {
      return createInitialMessages(ride);
    }

    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return createInitialMessages(ride);
  } catch {
    return createInitialMessages(ride);
  }
};

/* --------------------------------------------------
   FORMATTERS
-------------------------------------------------- */

const formatChatTime = (timestamp) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* --------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------- */

function RideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  return (
    <RideDetailsContent
      key={rideId}
      rideId={rideId}
      navigate={navigate}
    />
  );
}

/* --------------------------------------------------
   RIDE DETAILS CONTENT
-------------------------------------------------- */

function RideDetailsContent({ rideId, navigate }) {
  const ride = getMotoRideById(rideId);

  /* --------------------------------------------------
     INITIAL PARTICIPANTS
  -------------------------------------------------- */

  const getInitialParticipants = () => {
    if (!ride) {
      return [];
    }

    const savedParticipants = localStorage.getItem(
      `mototribeParticipants_${rideId}`
    );

    if (!savedParticipants) {
      return ride.participants || [];
    }

    try {
      const parsedParticipants =
        JSON.parse(savedParticipants);

      return Array.isArray(parsedParticipants)
        ? parsedParticipants
        : ride.participants || [];
    } catch {
      return ride.participants || [];
    }
  };

  /* --------------------------------------------------
     INITIAL JOIN REQUESTS
  -------------------------------------------------- */

  const getInitialJoinRequests = () => {
    const savedRequests = localStorage.getItem(
      `mototribeRequests_${rideId}`
    );

    if (!savedRequests) {
      return [];
    }

    try {
      const parsedRequests =
        JSON.parse(savedRequests);

      return Array.isArray(parsedRequests)
        ? parsedRequests
        : [];
    } catch {
      return [];
    }
  };

  /* --------------------------------------------------
     INITIAL JOIN STATUS
  -------------------------------------------------- */

  const getInitialJoinStatus = () => {
    const joinedIds = getStoredArray(
      "mototribeJoinedRides"
    );

    const requestedIds = getStoredArray(
      "mototribeRequestedRides"
    );

    if (joinedIds.includes(rideId)) {
      return "JOINED";
    }

    if (requestedIds.includes(rideId)) {
      return "REQUESTED";
    }

    return "NOT_JOINED";
  };

  /* --------------------------------------------------
     STATE
  -------------------------------------------------- */

  const [now, setNow] = useState(() => new Date());

  const [joinStatus, setJoinStatus] = useState(
    getInitialJoinStatus
  );

  const [participants, setParticipants] = useState(
    getInitialParticipants
  );

  const [joinRequests, setJoinRequests] = useState(
    getInitialJoinRequests
  );

  /*
    IMPORTANT:
    Chat messages are initialized directly with lazy
    useState instead of calling setMessages inside
    useEffect.

    This fixes:
    "Calling setState synchronously within an effect
    can trigger cascading renders"
  */
  const [messages, setMessages] = useState(() =>
    loadChatMessages(rideId, ride)
  );

  const [messageText, setMessageText] = useState("");

  const [chatNotice, setChatNotice] = useState("");

  /* --------------------------------------------------
     CLOCK
  -------------------------------------------------- */

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /* --------------------------------------------------
     PERSIST CHAT
     
     This effect is allowed because it synchronizes
     React state with an external system: localStorage.
  -------------------------------------------------- */

  useEffect(() => {
    try {
      localStorage.setItem(
        getChatStorageKey(rideId),
        JSON.stringify(messages)
      );
    } catch {
      // Ignore localStorage errors in demo mode.
    }
  }, [messages, rideId]);

  /* --------------------------------------------------
     NOT FOUND
  -------------------------------------------------- */

  if (!ride) {
    return (
      <section className="ride-details-page">
        <div className="ride-details-not-found">
          <span>404 / RIDE NOT FOUND</span>

          <h1>THIS RIDE DOES NOT EXIST</h1>

          <p>
            The requested MotoTribe ride could not be
            found.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/businesses/mototribe")
            }
          >
            BACK TO MOTOTRIBE
          </button>
        </div>
      </section>
    );
  }

  /* --------------------------------------------------
     SAVE PARTICIPANTS
  -------------------------------------------------- */

  const saveParticipants = (participantsList) => {
    setParticipants(participantsList);

    try {
      localStorage.setItem(
        `mototribeParticipants_${rideId}`,
        JSON.stringify(participantsList)
      );
    } catch {
      // Ignore storage errors.
    }
  };

  /* --------------------------------------------------
     SAVE REQUESTS
  -------------------------------------------------- */

  const saveRequests = (requestsList) => {
    setJoinRequests(requestsList);

    try {
      localStorage.setItem(
        `mototribeRequests_${rideId}`,
        JSON.stringify(requestsList)
      );
    } catch {
      // Ignore storage errors.
    }
  };

  /* --------------------------------------------------
     JOIN RIDE
  -------------------------------------------------- */

  const handleJoinRide = () => {
    if (joinStatus === "JOINED") {
      return;
    }

    const hasCurrentUser = participants.some(
      (participant) => participant.id === "current-user"
    );

    if (!hasCurrentUser) {
      saveParticipants([
        ...participants,
        {
          id: "current-user",
          name: "You",
          role: "RIDER",
          confirmed: true,
        },
      ]);
    }

    const joinedIds = getStoredArray(
      "mototribeJoinedRides"
    );

    if (!joinedIds.includes(rideId)) {
      setStoredArray("mototribeJoinedRides", [
        ...joinedIds,
        rideId,
      ]);
    }

    const requestedIds = getStoredArray(
      "mototribeRequestedRides"
    );

    setStoredArray(
      "mototribeRequestedRides",
      requestedIds.filter((id) => id !== rideId)
    );

    setJoinStatus("JOINED");
  };

  /* --------------------------------------------------
     REQUEST TO JOIN
  -------------------------------------------------- */

  const handleRequestJoin = () => {
    if (
      joinStatus === "JOINED" ||
      joinStatus === "REQUESTED"
    ) {
      return;
    }

    const hasCurrentRequest = joinRequests.some(
      (request) =>
        request.id === "current-user-request"
    );

    if (!hasCurrentRequest) {
      saveRequests([
        ...joinRequests,
        {
          id: "current-user-request",
          name: "You",
          status: "PENDING",
        },
      ]);
    }

    const requestedIds = getStoredArray(
      "mototribeRequestedRides"
    );

    if (!requestedIds.includes(rideId)) {
      setStoredArray("mototribeRequestedRides", [
        ...requestedIds,
        rideId,
      ]);
    }

    setJoinStatus("REQUESTED");
  };

  /* --------------------------------------------------
     LEAVE RIDE
  -------------------------------------------------- */

  const handleLeaveRide = () => {
    saveParticipants(
      participants.filter(
        (participant) =>
          participant.id !== "current-user"
      )
    );

    const joinedIds = getStoredArray(
      "mototribeJoinedRides"
    );

    setStoredArray(
      "mototribeJoinedRides",
      joinedIds.filter((id) => id !== rideId)
    );

    setJoinStatus("NOT_JOINED");
  };

  /* --------------------------------------------------
     CONFIRM REQUEST
  -------------------------------------------------- */

  const handleConfirmRequest = (requestId) => {
    const request = joinRequests.find(
      (item) => item.id === requestId
    );

    if (!request) {
      return;
    }

    saveRequests(
      joinRequests.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: "APPROVED",
            }
          : item
      )
    );
  };

  /* --------------------------------------------------
     SEND CHAT MESSAGE
  -------------------------------------------------- */

  const handleSendMessage = () => {
    const cleanMessage = messageText.trim();

    if (!cleanMessage) {
      return;
    }

    const newMessage = {
      id: `message-${Date.now()}`,
      type: "RIDER",
      sender: "You",
      text: cleanMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      newMessage,
    ]);

    setMessageText("");

    setChatNotice("Message sent");

    window.setTimeout(() => {
      setChatNotice("");
    }, 1800);
  };

  /* --------------------------------------------------
     CHAT KEYBOARD
  -------------------------------------------------- */

  const handleChatKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  /* --------------------------------------------------
     RESET DEMO CHAT
  -------------------------------------------------- */

  const handleResetChat = () => {
    const initialMessages =
      createInitialMessages(ride);

    setMessages(initialMessages);
    setMessageText("");
    setChatNotice("Demo chat reset");

    window.setTimeout(() => {
      setChatNotice("");
    }, 1800);
  };

  /* --------------------------------------------------
     NAVIGATION
  -------------------------------------------------- */

  const handleBack = () => {
    navigate("/businesses/mototribe");
  };

  const handleOpenExpenses = () => {
    navigate(
      `/businesses/mototribe/ride/${rideId}/expenses`
    );
  };

  const handleOpenLiveRide = () => {
    navigate(
      `/businesses/mototribe/ride/${rideId}/live`
    );
  };

  /* --------------------------------------------------
     RIDE STATUS
  -------------------------------------------------- */

  const rideStatus = getMotoRideStatus(
    ride,
    now
  );

  const countdown = getMotoRideCountdown(
    ride,
    now
  );

  /* --------------------------------------------------
     PARTICIPANT COUNT
  -------------------------------------------------- */

  const participantCount = participants.length;

  const capacityPercentage =
    ride.maxRiders > 0
      ? Math.min(
          (participantCount / ride.maxRiders) * 100,
          100
        )
      : 0;

  /* --------------------------------------------------
     DATE
  -------------------------------------------------- */

  const formattedDate = new Date(
    `${ride.date}T00:00:00`
  ).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  /* --------------------------------------------------
     RENDER
  -------------------------------------------------- */

  return (
    <section className="ride-details-page">
      <div className="ride-details-container">

        {/* BACK */}

        <button
          type="button"
          className="ride-details-back"
          onClick={handleBack}
        >
          ← BACK TO RIDES
        </button>

        {/* HERO */}

        <header className="ride-details-hero">
          <div className="ride-details-hero-content">

            <div className="ride-details-tags">
              <span>{ride.type}</span>

              <span>{ride.difficulty}</span>

              <span
                className={`ride-details-status status-${rideStatus.toLowerCase()}`}
              >
                {rideStatus}
              </span>
            </div>

            <h1>{ride.name}</h1>

            <p className="ride-details-description">
              {ride.description}
            </p>

            <div className="ride-details-organizer">
              <span>ORGANIZED BY</span>

              <strong>{ride.organizer}</strong>

              <small>
                {ride.organizerType}
              </small>
            </div>
          </div>
        </header>

        {/* COUNTDOWN */}

        <div className="ride-details-countdown-section">
          <div>
            <span>DEPARTURE</span>

            <strong>{formattedDate}</strong>

            <small>{ride.time}</small>
          </div>

          <div className="ride-details-countdown">
            {rideStatus === "LIVE" ? (
              <div className="ride-live-indicator">
                ● LIVE NOW
              </div>
            ) : rideStatus === "COMPLETED" ? (
              <div className="ride-completed-indicator">
                RIDE COMPLETED
              </div>
            ) : countdown.expired ? (
              <div>STARTING</div>
            ) : (
              <>
                <div>
                  <strong>
                    {String(
                      countdown.days
                    ).padStart(2, "0")}
                  </strong>

                  <span>DAYS</span>
                </div>

                <div>
                  <strong>
                    {String(
                      countdown.hours
                    ).padStart(2, "0")}
                  </strong>

                  <span>HRS</span>
                </div>

                <div>
                  <strong>
                    {String(
                      countdown.minutes
                    ).padStart(2, "0")}
                  </strong>

                  <span>MIN</span>
                </div>

                <div>
                  <strong>
                    {String(
                      countdown.seconds
                    ).padStart(2, "0")}
                  </strong>

                  <span>SEC</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* MAIN GRID */}

        <div className="ride-details-grid">

          <div className="ride-details-main">

            {/* ROUTE */}

            <section className="ride-info-card">
              <div className="ride-info-card-heading">
                <span>01</span>
                <h2>JOURNEY ROUTE</h2>
              </div>

              <div className="ride-route-main">
                <div className="ride-route-location">
                  <span className="ride-route-marker">
                    A
                  </span>

                  <div>
                    <small>START</small>

                    <strong>
                      {ride.start}
                    </strong>
                  </div>
                </div>

                <div className="ride-route-arrow">
                  ↓
                </div>

                <div className="ride-route-location">
                  <span className="ride-route-marker">
                    B
                  </span>

                  <div>
                    <small>DESTINATION</small>

                    <strong>
                      {ride.destination}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="ride-route-full">
                <span>FULL ROUTE</span>

                <p>{ride.route}</p>
              </div>

              <div className="ride-route-stops">
                <span>PLANNED STOPS</span>

                <div>
                  {(ride.stops || []).map(
                    (stop, index) => (
                      <span
                        key={`${stop}-${index}`}
                      >
                        <b>
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </b>

                        {stop}
                      </span>
                    )
                  )}
                </div>
              </div>
            </section>

            {/* JOURNEY INTELLIGENCE */}

            <section className="ride-info-card">
              <div className="ride-info-card-heading">
                <span>02</span>

                <h2>
                  JOURNEY INTELLIGENCE
                </h2>
              </div>

              <div className="journey-intelligence-grid">
                <div>
                  <strong>
                    {
                      ride
                        .journeyIntelligence
                        .fuelStops
                    }
                  </strong>

                  <span>FUEL STOPS</span>
                </div>

                <div>
                  <strong>
                    {
                      ride
                        .journeyIntelligence
                        .restStops
                    }
                  </strong>

                  <span>REST STOPS</span>
                </div>

                <div>
                  <strong>
                    {
                      ride
                        .journeyIntelligence
                        .serviceStops
                    }
                  </strong>

                  <span>SERVICE STOPS</span>
                </div>

                <div>
                  <strong>
                    {
                      ride
                        .journeyIntelligence
                        .accommodationStops
                    }
                  </strong>

                  <span>ACCOMMODATION</span>
                </div>

                <div>
                  <strong>
                    {
                      ride
                        .journeyIntelligence
                        .scenicStops
                    }
                  </strong>

                  <span>SCENIC STOPS</span>
                </div>
              </div>
            </section>

            {/* REQUIREMENTS */}

            <section className="ride-info-card">
              <div className="ride-info-card-heading">
                <span>03</span>

                <h2>
                  RIDE REQUIREMENTS
                </h2>
              </div>

              <ul className="ride-requirements-list">
                {(ride.requirements || []).map(
                  (requirement) => (
                    <li key={requirement}>
                      <span>✓</span>

                      {requirement}
                    </li>
                  )
                )}
              </ul>
            </section>

            {/* VEHICLE */}

            <section className="ride-info-card">
              <div className="ride-info-card-heading">
                <span>04</span>

                <h2>
                  VEHICLE INFORMATION
                </h2>
              </div>

              <div className="vehicle-details">
                <div>
                  <span>MOTORCYCLE</span>

                  <strong>
                    {ride.vehicle?.name ||
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>FUEL TYPE</span>

                  <strong>
                    {ride.vehicle?.fuelType ||
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>
                    EXPECTED MILEAGE
                  </span>

                  <strong>
                    {ride.vehicle?.mileage ||
                      "--"}{" "}
                    KM/L
                  </strong>
                </div>
              </div>
            </section>

            {/* SAFETY */}

            <section className="ride-info-card safety-card">
              <div className="ride-info-card-heading">
                <span>05</span>

                <h2>
                  SAFETY INFORMATION
                </h2>
              </div>

              <p>{ride.safety}</p>
            </section>

            {/* PARTICIPANTS */}

            <section className="ride-info-card">
              <div className="ride-info-card-heading">
                <span>06</span>

                <h2>RIDERS</h2>

                <strong className="rider-count-label">
                  {participantCount} /{" "}
                  {ride.maxRiders}
                </strong>
              </div>

              <div className="riders-capacity">
                <div className="capacity-bar">
                  <div
                    className="capacity-fill"
                    style={{
                      width: `${capacityPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div className="riders-list">
                {participants.map(
                  (participant) => (
                    <div
                      key={participant.id}
                      className="rider-item"
                    >
                      <div className="rider-avatar">
                        {participant.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {participant.name}
                        </strong>

                        <span>
                          {participant.role}
                        </span>
                      </div>

                      {participant.confirmed && (
                        <span className="rider-confirmed">
                          ✓
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            </section>

            {/* JOIN REQUESTS */}

            {joinRequests.length > 0 && (
              <section className="ride-info-card">
                <div className="ride-info-card-heading">
                  <span>07</span>

                  <h2>
                    JOIN REQUESTS
                  </h2>
                </div>

                <div className="join-requests-list">
                  {joinRequests.map(
                    (request) => (
                      <div
                        key={request.id}
                        className="join-request-item"
                      >
                        <div>
                          <strong>
                            {request.name}
                          </strong>

                          <span>
                            {request.status}
                          </span>
                        </div>

                        {request.status ===
                          "PENDING" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleConfirmRequest(
                                request.id
                              )
                            }
                          >
                            APPROVE
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* RIDE GROUP CHAT */}

            <section className="ride-info-card ride-chat-card">
              <div className="ride-info-card-heading">
                <span>08</span>

                <div className="ride-chat-heading-content">
                  <h2>RIDE GROUP CHAT</h2>

                  <small>
                    FRONTEND DEMO · REALTIME API LATER
                  </small>
                </div>

                <button
                  type="button"
                  className="ride-chat-reset"
                  onClick={handleResetChat}
                >
                  RESET
                </button>
              </div>

              <div className="ride-chat-status-row">
                <div className="ride-chat-online">
                  <span className="chat-online-dot" />
                  <strong>
                    {Math.max(
                      participants.length,
                      1
                    )}{" "}
                    RIDERS IN GROUP
                  </strong>
                </div>

                <span className="ride-chat-status-text">
                  Group messages are stored locally
                  for this frontend demo.
                </span>
              </div>

              <div className="ride-chat-messages">
                {messages.length === 0 ? (
                  <div className="ride-chat-empty">
                    <strong>
                      NO MESSAGES YET
                    </strong>

                    <span>
                      Start the conversation with
                      your riding group.
                    </span>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isYou =
                      message.sender === "You";

                    const isSystem =
                      message.type === "SYSTEM";

                    const isOrganizer =
                      message.type ===
                      "ORGANIZER";

                    return (
                      <div
                        key={message.id}
                        className={`ride-chat-message ${
                          isYou
                            ? "is-you"
                            : ""
                        } ${
                          isSystem
                            ? "is-system"
                            : ""
                        }`}
                      >
                        {!isSystem && (
                          <div className="ride-chat-avatar">
                            {message.sender
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="ride-chat-message-body">
                          {!isSystem && (
                            <div className="ride-chat-message-meta">
                              <strong>
                                {
                                  message.sender
                                }
                              </strong>

                              {isOrganizer && (
                                <span>
                                  ORGANIZER
                                </span>
                              )}

                              <small>
                                {formatChatTime(
                                  message.timestamp
                                )}
                              </small>
                            </div>
                          )}

                          <div className="ride-chat-bubble">
                            {message.text}
                          </div>

                          {isSystem && (
                            <small className="ride-chat-system-time">
                              {formatChatTime(
                                message.timestamp
                              )}
                            </small>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="ride-chat-composer">
                <textarea
                  value={messageText}
                  onChange={(event) =>
                    setMessageText(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleChatKeyDown
                  }
                  placeholder="Write a message to the riding group..."
                  rows={3}
                  maxLength={500}
                  aria-label="Ride group message"
                />

                <div className="ride-chat-composer-footer">
                  <span>
                    ENTER TO SEND · SHIFT + ENTER
                    FOR NEW LINE
                  </span>

                  <button
                    type="button"
                    onClick={
                      handleSendMessage
                    }
                    disabled={
                      !messageText.trim()
                    }
                  >
                    SEND MESSAGE →
                  </button>
                </div>
              </div>

              {chatNotice && (
                <div
                  className="ride-chat-notice"
                  role="status"
                >
                  {chatNotice}
                </div>
              )}
            </section>
          </div>

          {/* SIDEBAR */}

          <aside className="ride-details-sidebar">

            {/* OVERVIEW */}

            <div className="ride-sidebar-card">
              <span className="sidebar-label">
                RIDE OVERVIEW
              </span>

              <div className="sidebar-stats">
                <div>
                  <span>DISTANCE</span>

                  <strong>
                    {ride.distanceLabel}
                  </strong>
                </div>

                <div>
                  <span>DURATION</span>

                  <strong>
                    {ride.duration}
                  </strong>
                </div>

                <div>
                  <span>EST. BUDGET</span>

                  <strong>
                    ₹
                    {Number(
                      ride.budget || 0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {/* JOIN ACTION */}

            <div className="ride-sidebar-card ride-action-card">
              <span className="sidebar-label">
                YOUR RIDE STATUS
              </span>

              {joinStatus === "JOINED" && (
                <div className="current-ride-status joined">
                  <strong>
                    ✓ YOU ARE JOINED
                  </strong>

                  <p>
                    You are confirmed as a rider
                    for this journey.
                  </p>
                </div>
              )}

              {joinStatus === "REQUESTED" && (
                <div className="current-ride-status requested">
                  <strong>
                    ◷ REQUEST PENDING
                  </strong>

                  <p>
                    Your request has been submitted
                    and is waiting for approval.
                  </p>
                </div>
              )}

              {joinStatus === "NOT_JOINED" && (
                <div className="current-ride-status">
                  <strong>
                    NOT JOINED
                  </strong>

                  <p>
                    Join this journey to become part
                    of the riding group.
                  </p>
                </div>
              )}

              {joinStatus === "JOINED" ? (
                <>
                  <button
                    type="button"
                    className="ride-primary-action"
                    onClick={handleOpenLiveRide}
                  >
                    RIDE DASHBOARD
                  </button>

                  <button
                    type="button"
                    className="ride-secondary-action"
                    onClick={handleOpenExpenses}
                  >
                    MANAGE EXPENSES
                  </button>

                  <button
                    type="button"
                    className="ride-danger-action"
                    onClick={handleLeaveRide}
                  >
                    LEAVE RIDE
                  </button>
                </>
              ) : joinStatus === "REQUESTED" ? (
                <button
                  type="button"
                  className="ride-primary-action disabled"
                  disabled
                >
                  REQUEST PENDING
                </button>
              ) : ride.requestRequired ? (
                <button
                  type="button"
                  className="ride-primary-action"
                  onClick={handleRequestJoin}
                >
                  REQUEST TO JOIN
                </button>
              ) : (
                <button
                  type="button"
                  className="ride-primary-action"
                  onClick={handleJoinRide}
                >
                  JOIN RIDE
                </button>
              )}
            </div>

            {/* LIVE RIDE */}

            {rideStatus === "LIVE" && (
              <div className="ride-sidebar-card live-ride-card">
                <span className="sidebar-label">
                  LIVE JOURNEY
                </span>

                <h3>
                  THIS RIDE IS LIVE
                </h3>

                <p>
                  Follow the live journey and stay
                  connected with your riding group.
                </p>

                <button
                  type="button"
                  onClick={handleOpenLiveRide}
                >
                  ENTER LIVE RIDE
                </button>
              </div>
            )}

            {/* CHAT QUICK ACTION */}

            <div className="ride-sidebar-card ride-chat-sidebar-card">
              <span className="sidebar-label">
                GROUP COMMUNICATION
              </span>

              <div className="ride-chat-sidebar-icon">
                CHAT
              </div>

              <h3>
                STAY CONNECTED
              </h3>

              <p>
                Use the group chat above to share
                updates, arrival information and ride
                coordination messages.
              </p>

              <button
                type="button"
                onClick={() =>
                  document
                    .querySelector(
                      ".ride-chat-card"
                    )
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                }
              >
                OPEN GROUP CHAT ↓
              </button>
            </div>

            {/* SOURCE */}

            <div className="ride-sidebar-source">
              <span>DATA SOURCE</span>

              <strong>
                {ride.source}
              </strong>
            </div>
          </aside>
        </div>

        {/* FOOTER */}

        <footer className="ride-details-footer">
          <div>
            <span>MOTOTRIBE</span>

            <strong>
              RIDE BEYOND THE ORDINARY.
            </strong>
          </div>

          <button
            type="button"
            onClick={handleBack}
          >
            BACK TO UPCOMING RIDES ↑
          </button>
        </footer>
      </div>
    </section>
  );
}

export default RideDetails;