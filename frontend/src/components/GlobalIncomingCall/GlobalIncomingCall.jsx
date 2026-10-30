import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import { getAccessToken } from "../../services/apiClient";
import "./GlobalIncomingCall.css";

export default function GlobalIncomingCall() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [incomingCall, setIncomingCall] = useState(null);
  const socketRef = useRef(null);
  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIncomingCall(null);
      return;
    }

    const token = getAccessToken();
    const socketUrl =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000"
        : window.location.origin;

    const socket = io(socketUrl, {
      auth: { token: token ? `Bearer ${token}` : "" },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    const handleCallAlert = (data) => {
      if (!data || !data.active) return;
      // Do not ring for the caller themselves
      if (currentUserId && String(data.callerId) === String(currentUserId)) return;

      setIncomingCall(data);
    };

    const handleCallEnded = (data) => {
      setIncomingCall((prev) => {
        if (!prev) return null;
        if (!data || !data.rideId || String(prev.rideId) === String(data.rideId)) {
          return null;
        }
        return prev;
      });
    };

    socket.on("incoming_group_call", handleCallAlert);
    socket.on("mototribe:incoming_group_call", handleCallAlert);

    socket.on("group_call_ended", handleCallEnded);
    socket.on("mototribe:group_call_ended", handleCallEnded);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, currentUserId]);

  if (!incomingCall) return null;

  const handlePickUp = (mode = "video") => {
    const targetRideId = incomingCall.rideId;
    setIncomingCall(null);

    const targetPath = `/businesses/mototribe/ride/${targetRideId}`;
    const isAlreadyOnPage = location.pathname.includes(targetRideId);

    if (isAlreadyOnPage) {
      // Dispatches event so RideCall.jsx on the page immediately joins
      window.dispatchEvent(
        new CustomEvent("mototribe:pickup-call", {
          detail: { rideId: targetRideId, mode },
        })
      );
    } else {
      navigate(`${targetPath}?autoJoin=true&callType=${mode}`);
    }
  };

  const handleDecline = () => {
    setIncomingCall(null);
  };

  return (
    <div className="global-incoming-call-overlay">
      <div className="global-incoming-call-backdrop" onClick={handleDecline} />
      <div className="global-incoming-call-card">
        <div className="global-call-ring-wave" />
        <div className="global-incoming-call-icon">
          {incomingCall.callType === "voice" ? "🎙️" : "📹"}
        </div>

        <div className="global-incoming-call-meta">
          <span className="global-call-badge">INCOMING GROUP CALL</span>
          <h2 className="global-call-caller">{incomingCall.callerName || "A fellow rider"}</h2>
          <p className="global-call-desc">
            Calling all members for{" "}
            <strong>{incomingCall.rideTitle || `Ride #${incomingCall.rideId.slice(-6)}`}</strong>
          </p>
        </div>

        <div className="global-incoming-call-actions">
          <button
            type="button"
            className="global-btn-pickup"
            onClick={() => handlePickUp(incomingCall.callType || "video")}
          >
            <span>📞</span>
            PICK UP CALL
          </button>

          <button
            type="button"
            className="global-btn-voice-only"
            onClick={() => handlePickUp("voice")}
          >
            <span>🎙️</span>
            VOICE ONLY
          </button>

          <button
            type="button"
            className="global-btn-decline"
            onClick={handleDecline}
          >
            DECLINE
          </button>
        </div>
      </div>
    </div>
  );
}
