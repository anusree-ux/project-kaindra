import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../../../../context/AuthContext";
import apiClient, { getAccessToken } from "../../../../services/apiClient";
import "./LiveRideChat.css";

const QUICK_CHIPS = [
  "🏍️ On the way",
  "⛽ Taking fuel stop",
  "☕ Rest break",
  "⚠️ Caution on road",
  "✅ Reached checkpoint",
];

function LiveRideChat({ ride }) {
  const { user } = useAuth();
  const rideId = ride?._id || ride?.id;

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [chatNotice, setChatNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const chatContainerRef = useRef(null);
  const socketRef = useRef(null);
  const isInitialScrollDone = useRef(false);

  const currentUserId = user?._id || user?.id;
  const currentUserName = (user?.name || user?.fullName || "").trim().toLowerCase();

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Internal-only scroll: scrolls ONLY the chat message container, NEVER the window/webpage
  const scrollChatToBottom = (behavior = "smooth") => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    }
  };

  // Check if the user is already scrolled near the bottom of the chat box
  const isNearChatBottom = () => {
    const container = chatContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 120;
  };

  // Fetch real chat history from the database
  const fetchChatHistory = async (silent = false) => {
    if (!rideId) return;

    try {
      if (!silent) setIsLoading(true);
      const res = await apiClient.get(`/api/mototribe/rides/${rideId}/chat/history`);
      const backendMessages = res.data?.data?.messages || [];

      setMessages((prev) => {
        const formatted = backendMessages.map((m) => {
          const uId = m.userId ? String(m.userId) : "";
          const sName = m.userName || "Rider";

          return {
            id: String(m.id || m._id),
            sender: sName,
            text: m.message,
            timestamp: m.createdAt,
            userId: uId,
          };
        });

        // If lengths and IDs are identical, do not mutate state reference
        if (
          prev.length === formatted.length &&
          prev.every((item, idx) => item.id === formatted[idx]?.id)
        ) {
          return prev;
        }

        const map = new Map();
        formatted.forEach((item) => map.set(item.id, item));
        prev.forEach((item) => {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          }
        });

        const sorted = Array.from(map.values()).sort(
          (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
        );

        if (
          prev.length === sorted.length &&
          prev.every((item, idx) => item.id === sorted[idx]?.id)
        ) {
          return prev;
        }

        return sorted;
      });

      setPermissionDenied(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setPermissionDenied(true);
      } else if (!silent) {
        console.warn("Could not fetch chat history:", err.message);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Socket.io real-time connection & background sync
  useEffect(() => {
    if (!rideId) {
      setIsLoading(false);
      return;
    }

    isInitialScrollDone.current = false;

    // Initial history fetch
    fetchChatHistory(false);

    // Connect directly to backend to avoid dev server websocket proxy issues
    const token = getAccessToken();
    const socketUrl =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000"
        : window.location.origin;

    const socket = io(socketUrl, {
      auth: { token: token ? `Bearer ${token}` : "" },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsSocketConnected(true);
      socket.emit("join_ride", { rideId });
    });

    socket.on("disconnect", () => {
      setIsSocketConnected(false);
    });

    // Handle real-time incoming messages
    socket.on("chat_message_received", (msg) => {
      if (msg.rideId && String(msg.rideId) !== String(rideId)) return;

      const incomingId = String(msg.id || msg._id || `socket-${Date.now()}`);

      setMessages((prev) => {
        if (prev.some((m) => String(m.id) === incomingId)) {
          return prev;
        }

        return [
          ...prev,
          {
            id: incomingId,
            sender: msg.userName || "Rider",
            text: msg.message,
            timestamp: msg.createdAt || new Date().toISOString(),
            userId: msg.userId ? String(msg.userId) : "",
          },
        ];
      });

      // Only auto-scroll inside the chat container if the user is already near bottom
      if (isNearChatBottom()) {
        setTimeout(() => scrollChatToBottom("smooth"), 50);
      }
    });

    socket.on("rate_limit_exceeded", (errData) => {
      setChatNotice(errData?.message || "Rate limit: 1 message per second.");
      setTimeout(() => setChatNotice(""), 3000);
    });

    // Fallback background polling every 4 seconds to guarantee updates even if disconnected
    const pollInterval = setInterval(() => {
      fetchChatHistory(true);
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [rideId]);

  // Initial scroll to bottom once when messages load
  useEffect(() => {
    if (!isLoading && messages.length > 0 && !isInitialScrollDone.current) {
      isInitialScrollDone.current = true;
      setTimeout(() => scrollChatToBottom("auto"), 50);
    }
  }, [isLoading, messages.length]);

  // Send message: sends ONCE (via Socket if connected, otherwise via REST API fallback)
  const sendMessage = async (customText = null) => {
    const textToSend = typeof customText === "string" ? customText.trim() : messageText.trim();

    if (!textToSend || !rideId || isSending) {
      return;
    }

    setIsSending(true);
    setMessageText("");
    setChatNotice("");

    // If socket is connected, emit real-time chat_message (server saves & broadcasts once)
    if (socketRef.current?.connected) {
      socketRef.current.emit("chat_message", {
        rideId,
        message: textToSend,
      });
      setIsSending(false);
      setTimeout(() => scrollChatToBottom("smooth"), 50);
      return;
    }

    // Fallback: If socket is not connected, use REST endpoint
    try {
      const res = await apiClient.post(`/api/mototribe/rides/${rideId}/chat`, {
        message: textToSend,
      });

      const savedMsg = res.data?.data?.message;
      if (savedMsg) {
        const savedId = String(savedMsg.id || savedMsg._id);
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === savedId)) return prev;
          return [
            ...prev,
            {
              id: savedId,
              sender: user?.name || "You",
              text: savedMsg.message,
              timestamp: savedMsg.createdAt,
              userId: currentUserId ? String(currentUserId) : "",
            },
          ];
        });
        setTimeout(() => scrollChatToBottom("smooth"), 50);
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Could not send message. Ensure you are confirmed for this ride.";
      setChatNotice(errMsg);
      setTimeout(() => setChatNotice(""), 4500);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <section id="ride-group-chat" className="live-ride-chat-card">
      <div className="live-ride-chat-header">
        <div className="live-ride-chat-heading">
          <span className="live-ride-chat-eyebrow">
            LIVE RIDE / GROUP CHAT
          </span>

          <h2>RIDER CHANNEL</h2>

          <p>
            Real-time chat with confirmed riders and organizer. No refresh needed.
          </p>
        </div>

        <div className="live-ride-chat-status">
          <span style={{ background: isSocketConnected ? "#4ade80" : "#c9a45d" }} />
          <strong>{isSocketConnected ? "CONNECTED" : "LIVE"}</strong>
          <small>{isSocketConnected ? "Realtime sync" : "Syncing"}</small>
        </div>
      </div>

      <div className="live-ride-chat-messages" ref={chatContainerRef}>
        {isLoading ? (
          <div className="live-ride-chat-empty" style={{ color: "rgba(255,255,255,0.5)" }}>
            Loading group chat...
          </div>
        ) : permissionDenied ? (
          <div className="live-ride-chat-empty" style={{ color: "#c9a45d" }}>
            🔒 <strong>LOCKED CHANNEL</strong>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
              Only confirmed participants and the organizer can view and participate in this chat.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="live-ride-chat-empty" style={{ color: "rgba(255,255,255,0.5)" }}>
            💬 <strong>NO MESSAGES YET</strong>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
              Start the conversation with your riding group!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            // Dynamically check if the message is from the logged-in user
            const isYou =
              (currentUserId && message.userId && String(message.userId) === String(currentUserId)) ||
              (currentUserName && String(message.sender || "").trim().toLowerCase() === currentUserName) ||
              message.type === "YOU";

            return (
              <div
                key={message.id}
                className={`live-ride-chat-message ${isYou ? "you" : "other"}`}
              >
                <div className="live-ride-chat-avatar">
                  {message.sender
                    ? message.sender.charAt(0).toUpperCase()
                    : "R"}
                </div>

                <div className="live-ride-chat-message-body">
                  <div className="live-ride-chat-message-meta">
                    <strong>{isYou ? `${message.sender} (You)` : message.sender}</strong>
                    <span>{formatTime(message.timestamp)}</span>
                  </div>

                  <div className="live-ride-chat-bubble">
                    {message.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {chatNotice && (
        <div className="live-ride-chat-notice" style={{ color: "#ef4444" }}>
          {chatNotice}
        </div>
      )}

      {/* QUICK STATUS CHIPS */}
      {!permissionDenied && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            padding: "10px 20px 4px",
            background: "#0e0f0e",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => sendMessage(chip)}
              disabled={isSending}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "14px",
                color: "rgba(255, 255, 255, 0.75)",
                fontSize: "10px",
                padding: "4px 10px",
                cursor: isSending ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <div className="live-ride-chat-composer">
        <textarea
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            permissionDenied
              ? "Join this ride to participate in the chat..."
              : "Send an update to the riding group (Enter to send)..."
          }
          rows={2}
          disabled={permissionDenied || isSending}
        />

        <div className="live-ride-chat-composer-actions">
          <button
            type="button"
            className="live-ride-chat-reset"
            onClick={() => fetchChatHistory(false)}
            title="Refresh messages from server"
          >
            SYNC
          </button>

          <button
            type="button"
            className="live-ride-chat-send"
            onClick={() => sendMessage()}
            disabled={!messageText.trim() || permissionDenied || isSending}
          >
            {isSending ? "SENDING..." : "SEND MESSAGE"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default LiveRideChat;