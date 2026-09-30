import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "./RideChat.css";

const CURRENT_USER = {
  id: "current-user",
  name: "You",
  role: "RIDER",
  online: true,
};

const DEMO_MESSAGES = [
  {
    id: "msg-001",
    senderId: "system",
    senderName: "MotoTribe",
    type: "system",
    text: "Ride group created successfully.",
    timestamp: "09:00",
  },
  {
    id: "msg-002",
    senderId: "organizer-001",
    senderName: "Arjun",
    role: "ORGANIZER",
    type: "message",
    text: "Welcome everyone. Please be ready 15 minutes before departure.",
    timestamp: "09:05",
    online: true,
  },
  {
    id: "msg-003",
    senderId: "rider-002",
    senderName: "Rahul",
    role: "RIDER",
    type: "message",
    text: "Noted. I will join at the starting point.",
    timestamp: "09:08",
    online: true,
  },
  {
    id: "msg-004",
    senderId: "rider-003",
    senderName: "Meera",
    role: "RIDER",
    type: "message",
    text: "Is the first fuel stop confirmed?",
    timestamp: "09:12",
    online: true,
  },
  {
    id: "msg-005",
    senderId: "organizer-001",
    senderName: "Arjun",
    role: "ORGANIZER",
    type: "message",
    text: "Yes. It is included in the planned route.",
    timestamp: "09:14",
    online: true,
  },
];

const getStorageKey = (rideId) =>
  `mototribe_ride_chat_${rideId || "unknown"}`;

const loadMessages = (rideId) => {
  if (!rideId) {
    return DEMO_MESSAGES;
  }

  try {
    const stored = localStorage.getItem(getStorageKey(rideId));

    if (!stored) {
      return DEMO_MESSAGES;
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEMO_MESSAGES;
  } catch {
    return DEMO_MESSAGES;
  }
};

const saveMessages = (rideId, messages) => {
  if (!rideId) {
    return;
  }

  try {
    localStorage.setItem(
      getStorageKey(rideId),
      JSON.stringify(messages)
    );
  } catch {
    // Ignore localStorage errors.
  }
};

const createMessageId = () =>
  `message-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const getCurrentTime = () =>
  new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

function RideChat({ rideId: rideIdProp }) {
  const params = useParams();

  const rideId = rideIdProp || params.rideId;

  /*
   * IMPORTANT:
   * Messages are initialized here instead of calling
   * setMessages() synchronously inside useEffect().
   */
  const [messages, setMessages] = useState(() =>
    loadMessages(rideId)
  );

  const [messageText, setMessageText] = useState("");

  const [isSending, setIsSending] = useState(false);

  const [showParticipants, setShowParticipants] =
    useState(false);

  const [statusMessage, setStatusMessage] = useState("");

  const [isOnline, setIsOnline] = useState(true);

  /*
   * Demo participant data.
   *
   * Later this can be replaced by backend/WebSocket data.
   */
  const participants = useMemo(
    () => [
      {
        id: "organizer-001",
        name: "Arjun",
        role: "ORGANIZER",
        online: true,
      },
      {
        id: "rider-002",
        name: "Rahul",
        role: "RIDER",
        online: true,
      },
      {
        id: "rider-003",
        name: "Meera",
        role: "RIDER",
        online: true,
      },
      {
        id: "rider-004",
        name: "Vikram",
        role: "RIDER",
        online: false,
      },
      {
        id: "rider-005",
        name: "Kiran",
        role: "RIDER",
        online: true,
      },
      CURRENT_USER,
    ],
    []
  );

  /*
   * Persist messages whenever they change.
   *
   * This effect synchronizes React state with localStorage,
   * which is an appropriate use of useEffect.
   */
  useEffect(() => {
    saveMessages(rideId, messages);
  }, [rideId, messages]);

  /*
   * Demo connection status.
   *
   * This only simulates online/offline state.
   * Backend realtime connection can replace this later.
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /*
   * Show temporary status messages.
   */
  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [statusMessage]);

  const sendMessage = () => {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    setIsSending(true);

    const newMessage = {
      id: createMessageId(),
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      role: CURRENT_USER.role,
      type: "message",
      text: trimmedMessage,
      timestamp: getCurrentTime(),
      online: true,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      newMessage,
    ]);

    setMessageText("");

    window.setTimeout(() => {
      setIsSending(false);
    }, 150);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (event) => {
    /*
     * Enter = send
     * Shift + Enter = new line
     */
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleResetDemo = () => {
    const confirmed = window.confirm(
      "Reset this ride chat to the demo messages?"
    );

    if (!confirmed) {
      return;
    }

    setMessages(DEMO_MESSAGES);

    try {
      localStorage.setItem(
        getStorageKey(rideId),
        JSON.stringify(DEMO_MESSAGES)
      );
    } catch {
      // Ignore localStorage errors.
    }

    setStatusMessage("DEMO CHAT RESET");
  };

  const handleClearChat = () => {
    const confirmed = window.confirm(
      "Clear all messages from this demo chat?"
    );

    if (!confirmed) {
      return;
    }

    setMessages([]);

    try {
      localStorage.removeItem(getStorageKey(rideId));
    } catch {
      // Ignore localStorage errors.
    }

    setStatusMessage("CHAT CLEARED");
  };

  const getInitial = (name) =>
    name?.charAt(0)?.toUpperCase() || "?";

  return (
    <section className="ride-chat-section">
      <div className="ride-chat-container">
        {/* HEADER */}
        <header className="ride-chat-header">
          <div className="ride-chat-heading">
            <div className="ride-chat-heading-number">
              08
            </div>

            <div>
              <span className="ride-chat-eyebrow">
                RIDING GROUP
              </span>

              <h2>RIDE GROUP CHAT</h2>

              <p>
                Stay connected with riders before and
                during the journey.
              </p>
            </div>
          </div>

          <div className="ride-chat-header-actions">
            <div
              className={`ride-chat-connection ${
                isOnline ? "online" : "offline"
              }`}
            >
              <span className="ride-chat-status-dot" />

              {isOnline ? "CONNECTED" : "OFFLINE"}
            </div>

            <button
              type="button"
              className="ride-chat-participants-button"
              onClick={() =>
                setShowParticipants(
                  (previous) => !previous
                )
              }
              aria-expanded={showParticipants}
            >
              RIDERS{" "}
              <strong>{participants.length}</strong>
            </button>
          </div>
        </header>

        {/* PARTICIPANTS */}
        {showParticipants && (
          <div className="ride-chat-participants-panel">
            <div className="ride-chat-participants-top">
              <div>
                <span>RIDE PARTICIPANTS</span>
                <strong>
                  {participants.length} RIDERS
                </strong>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowParticipants(false)
                }
                aria-label="Close participants"
              >
                ×
              </button>
            </div>

            <div className="ride-chat-participants-list">
              {participants.map((participant) => (
                <div
                  className="ride-chat-participant"
                  key={participant.id}
                >
                  <div className="ride-chat-participant-avatar">
                    {getInitial(participant.name)}
                  </div>

                  <div className="ride-chat-participant-info">
                    <strong>
                      {participant.name}
                    </strong>

                    <span>
                      {participant.role}
                    </span>
                  </div>

                  <div
                    className={`ride-chat-participant-status ${
                      participant.online
                        ? "online"
                        : "offline"
                    }`}
                  >
                    <span />
                    {participant.online
                      ? "ONLINE"
                      : "OFFLINE"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAT BODY */}
        <div className="ride-chat-card">
          <div className="ride-chat-toolbar">
            <div className="ride-chat-toolbar-info">
              <span className="ride-chat-live-dot" />

              <div>
                <strong>LIVE RIDE CHAT</strong>
                <small>
                  {rideId
                    ? `RIDE ID: ${rideId}`
                    : "RIDE GROUP"}
                </small>
              </div>
            </div>

            <div className="ride-chat-toolbar-actions">
              <button
                type="button"
                onClick={handleResetDemo}
              >
                RESET DEMO
              </button>

              <button
                type="button"
                onClick={handleClearChat}
              >
                CLEAR
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="ride-chat-messages">
            {messages.length === 0 ? (
              <div className="ride-chat-empty">
                <div className="ride-chat-empty-icon">
                  +
                </div>

                <strong>
                  NO MESSAGES YET
                </strong>

                <p>
                  Start the conversation with your
                  riding group.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                if (message.type === "system") {
                  return (
                    <div
                      className="ride-chat-system-message"
                      key={message.id}
                    >
                      <span>
                        {message.text}
                      </span>

                      <small>
                        {message.timestamp}
                      </small>
                    </div>
                  );
                }

                const isCurrentUser =
                  message.senderId ===
                  CURRENT_USER.id;

                return (
                  <div
                    className={`ride-chat-message-row ${
                      isCurrentUser
                        ? "current-user"
                        : ""
                    }`}
                    key={message.id}
                  >
                    {!isCurrentUser && (
                      <div className="ride-chat-message-avatar">
                        {getInitial(
                          message.senderName
                        )}
                      </div>
                    )}

                    <div className="ride-chat-message-content">
                      {!isCurrentUser && (
                        <div className="ride-chat-message-meta">
                          <strong>
                            {message.senderName}
                          </strong>

                          {message.role ===
                            "ORGANIZER" && (
                            <span className="ride-chat-organizer-badge">
                              ORGANIZER
                            </span>
                          )}

                          {message.online && (
                            <span className="ride-chat-online-label">
                              ONLINE
                            </span>
                          )}
                        </div>
                      )}

                      <div className="ride-chat-bubble">
                        <p>{message.text}</p>

                        <time>
                          {message.timestamp}
                        </time>
                      </div>
                    </div>

                    {isCurrentUser && (
                      <div className="ride-chat-message-avatar current">
                        {getInitial(
                          CURRENT_USER.name
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* COMPOSER */}
          <form
            className="ride-chat-composer"
            onSubmit={handleSubmit}
          >
            <div className="ride-chat-composer-avatar">
              Y
            </div>

            <textarea
              value={messageText}
              onChange={(event) =>
                setMessageText(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Write a message to the riding group..."
              rows={1}
              maxLength={500}
              aria-label="Ride group message"
            />

            <button
              type="submit"
              disabled={
                !messageText.trim() || isSending
              }
            >
              SEND
            </button>
          </form>

          <div className="ride-chat-composer-footer">
            <span>
              ENTER TO SEND · SHIFT + ENTER FOR NEW LINE
            </span>

            <span>
              {messageText.length}/500
            </span>
          </div>
        </div>

        {/* STATUS */}
        {statusMessage && (
          <div
            className="ride-chat-status-message"
            role="status"
          >
            {statusMessage}
          </div>
        )}

        {/* FOOTER NOTE */}
        <div className="ride-chat-note">
          <span>DEMO MODE</span>

          <p>
            Messages are currently stored locally in
            this browser. Realtime backend synchronization
            can be connected later.
          </p>
        </div>
      </div>
    </section>
  );
}

export default RideChat;