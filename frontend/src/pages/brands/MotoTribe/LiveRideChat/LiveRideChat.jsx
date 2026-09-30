import { useEffect, useRef, useState } from "react";
import "./LiveRideChat.css";

const getStorageKey = (rideId) =>
  `mototribe_live_ride_chat_${rideId}`;

const createInitialMessages = (ride) => [
  {
    id: `system-${ride.id}`,
    type: "SYSTEM",
    sender: "MotoTribe",
    text: `Live ride channel opened for ${ride.name}.`,
    timestamp: new Date().toISOString(),
  },
  {
    id: `organizer-${ride.id}`,
    type: "ORGANIZER",
    sender: ride.organizer || "Ride Organizer",
    text: "Stay together, follow the route, and share important updates here.",
    timestamp: new Date(
      Date.now() - 20 * 60 * 1000
    ).toISOString(),
  },
  {
    id: `rider-${ride.id}`,
    type: "RIDER",
    sender: "Arjun",
    text: "All good from my side. Riding with the group.",
    timestamp: new Date(
      Date.now() - 8 * 60 * 1000
    ).toISOString(),
  },
];

const loadMessages = (rideId, ride) => {
  try {
    const savedMessages = localStorage.getItem(
      getStorageKey(rideId)
    );

    if (!savedMessages) {
      return createInitialMessages(ride);
    }

    const parsedMessages = JSON.parse(savedMessages);

    if (!Array.isArray(parsedMessages)) {
      return createInitialMessages(ride);
    }

    return parsedMessages;
  } catch {
    return createInitialMessages(ride);
  }
};

function LiveRideChat({ ride }) {
  const [messages, setMessages] = useState(() =>
    loadMessages(ride.id, ride)
  );

  const [messageText, setMessageText] = useState("");
  const [chatNotice, setChatNotice] = useState("");

  // Must be inside the React component
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        getStorageKey(ride.id),
        JSON.stringify(messages)
      );
    } catch {
      // Ignore localStorage errors in prototype mode.
    }
  }, [messages, ride.id]);

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sendMessage = () => {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage) {
      return;
    }

    const newMessage = {
      id: `you-${Date.now()}`,
      type: "YOU",
      sender: "You",
      text: trimmedMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      newMessage,
    ]);

    setMessageText("");
    setChatNotice("");

    setTimeout(() => {
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `system-${Date.now()}`,
          type: "SYSTEM",
          sender: "MotoTribe",
          text: "Message delivered to the live ride channel.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 500);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    const shouldReset = window.confirm(
      "Reset the live ride chat?"
    );

    if (!shouldReset) {
      return;
    }

    const initialMessages = createInitialMessages(ride);

    setMessages(initialMessages);
    setMessageText("");
    setChatNotice("Chat reset successfully.");
  };

  return (
    <section className="live-ride-chat-card">
      <div className="live-ride-chat-header">
        <div className="live-ride-chat-heading">
          <span className="live-ride-chat-eyebrow">
            LIVE RIDE / GROUP CHAT
          </span>

          <h2>RIDER CHANNEL</h2>

          <p>
            Stay connected with everyone during the journey.
          </p>
        </div>

        <div className="live-ride-chat-status">
          <span />
          <strong>LIVE</strong>
          <small>Riders online</small>
        </div>
      </div>

      <div className="live-ride-chat-messages">
        {messages.length === 0 ? (
          <div className="live-ride-chat-empty">
            No messages yet.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`live-ride-chat-message ${message.type.toLowerCase()}`}
            >
              {message.type !== "SYSTEM" && (
                <div className="live-ride-chat-avatar">
                  {message.sender
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <div className="live-ride-chat-message-body">
                {message.type !== "SYSTEM" && (
                  <div className="live-ride-chat-message-meta">
                    <strong>{message.sender}</strong>

                    <span>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                )}

                {message.type === "SYSTEM" ? (
                  <div className="live-ride-chat-system-message">
                    <span>✦</span>

                    <p>{message.text}</p>

                    <small>
                      {formatTime(message.timestamp)}
                    </small>
                  </div>
                ) : (
                  <div className="live-ride-chat-bubble">
                    {message.text}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Scroll target for newest message */}
        <div ref={messagesEndRef} />
      </div>

      {chatNotice && (
        <div className="live-ride-chat-notice">
          {chatNotice}
        </div>
      )}

      <div className="live-ride-chat-composer">
        <textarea
          value={messageText}
          onChange={(event) =>
            setMessageText(event.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Send an update to the riding group..."
          rows={2}
        />

        <div className="live-ride-chat-composer-actions">
          <button
            type="button"
            className="live-ride-chat-reset"
            onClick={resetChat}
          >
            RESET
          </button>

          <button
            type="button"
            className="live-ride-chat-send"
            onClick={sendMessage}
            disabled={!messageText.trim()}
          >
            SEND MESSAGE
          </button>
        </div>
      </div>
    </section>
  );
}

export default LiveRideChat;