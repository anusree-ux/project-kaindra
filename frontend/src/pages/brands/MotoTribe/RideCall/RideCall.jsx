import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { io } from "socket.io-client";
import apiClient, { getAccessToken } from "../../../../services/apiClient";
import { useAuth } from "../../../../context/AuthContext";
import { buildParticipantUidMap, getRiderNameForUid } from "../../../../utils/agoraUidMapper";
import "./RideCall.css";

// Configure Agora SDK log level to warn only for clean production console
AgoraRTC.setLogLevel(2);

function formatCallDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Subcomponent to render a remote participant's video/voice tile
 */
function RemoteVideoTile({ remoteItem, riderName }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && remoteItem.user?.videoTrack && remoteItem.hasVideo) {
      try {
        remoteItem.user.videoTrack.play(containerRef.current);
      } catch (err) {
        console.warn("Could not play remote video track:", err);
      }
    }
  }, [remoteItem.hasVideo, remoteItem.user?.videoTrack]);

  return (
    <div className="agora-video-tile">
      <div
        ref={containerRef}
        className={`agora-video-canvas ${!remoteItem.hasVideo ? "hidden" : ""}`}
      />
      {!remoteItem.hasVideo && (
        <div className="agora-avatar-placeholder">
          <div className="agora-avatar-circle">
            {riderName.slice(0, 2).toUpperCase()}
          </div>
          <span className="agora-audio-indicator">AUDIO ONLY</span>
        </div>
      )}
      <div className="agora-tile-meta">
        <strong>{riderName}</strong>
        <div className="agora-tile-badges">
          {!remoteItem.hasAudio && <span className="agora-muted-badge">MUTED 🔇</span>}
          {!remoteItem.hasVideo && <span className="agora-camoff-badge">CAM OFF 🚫</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * Subcomponent to render local user's self preview tile
 */
function LocalVideoTile({ isCameraOn, isMuted, selfName, localVideoTrack }) {
  const selfContainerRef = useRef(null);

  useEffect(() => {
    if (selfContainerRef.current && localVideoTrack && isCameraOn) {
      try {
        if (!localVideoTrack.isPlaying) {
          localVideoTrack.play(selfContainerRef.current);
        }
      } catch (err) {
        console.warn("Could not play local video track:", err);
      }
    }
  }, [localVideoTrack, isCameraOn]);

  return (
    <div className="agora-video-tile agora-self-tile">
      <div
        ref={selfContainerRef}
        className={`agora-video-canvas agora-self-canvas ${!isCameraOn ? "hidden" : ""}`}
      />
      {!isCameraOn && (
        <div className="agora-avatar-placeholder">
          <div className="agora-avatar-circle">
            {selfName.slice(0, 2).toUpperCase()}
          </div>
          <span className="agora-audio-indicator">AUDIO ONLY</span>
        </div>
      )}
      <div className="agora-tile-meta">
        <strong>{selfName} (You)</strong>
        <div className="agora-tile-badges">
          {isMuted && <span className="agora-muted-badge">MUTED 🔇</span>}
          {!isCameraOn && <span className="agora-camoff-badge">CAM OFF 🚫</span>}
        </div>
      </div>
    </div>
  );
}

function RideCall({ ride, currentStatus }) {
  const { user } = useAuth();
  const rideId = ride?._id || ride?.id;

  // Call connection states: "IDLE" | "CONNECTING" | "CONNECTED" | "RECONNECTING" | "ERROR"
  const [callState, setCallState] = useState("IDLE");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [participantsList, setParticipantsList] = useState([]);
  const [tokenRenewalFailed, setTokenRenewalFailed] = useState(false);

  // Group Call Signaling & Active Call state
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [liveRiderMap, setLiveRiderMap] = useState({});

  // Local Media Track state for clean reactive rendering
  const [localVideoTrack, setLocalVideoTrack] = useState(null);

  // References for Agora Client, Local Media Tracks, Socket and DOM
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const callContainerRef = useRef(null);
  const isJoiningOrJoinedRef = useRef(false);
  const socketRef = useRef(null);
  const callStateRef = useRef("IDLE");
  callStateRef.current = callState;

  const currentUserId = user?._id || user?.id;

  // Load participant list for UID-to-name mapping
  useEffect(() => {
    let isMounted = true;
    if (!rideId) return;

    apiClient
      .get(`/api/mototribe/rides/${rideId}/participants`)
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data?.participants || [];
        setParticipantsList(list);
      })
      .catch(() => {});

    // Check active call on mount via REST fallback
    apiClient
      .get(`/api/mototribe/rides/${rideId}/call-status`)
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.data;
        if (data?.active && data?.call) {
          setActiveCall(data.call);
          if (data.call.riders) {
            setLiveRiderMap((prev) => ({ ...prev, ...data.call.riders }));
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [rideId]);

  // Determine if user is organizer or participant
  const isOrganizer = useMemo(() => {
    if (ride?.isOrganizer) return true;
    const orgId = ride?.organizerId?._id || ride?.organizerId;
    return Boolean(currentUserId && orgId && String(orgId) === String(currentUserId));
  }, [ride, currentUserId]);

  const isConfirmedParticipant = useMemo(() => {
    if (!currentUserId || !participantsList.length) return false;
    return participantsList.some(
      (p) =>
        String(p.userId?._id || p.userId || p.id) === String(currentUserId) &&
        p.status !== "left"
    );
  }, [currentUserId, participantsList]);

  // Allow organizer or any confirmed participant to start/join
  const isAllowedToCall = isOrganizer || isConfirmedParticipant || Boolean(ride);

  // Socket.IO real-time call signaling connection
  useEffect(() => {
    if (!rideId) return;

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
      socket.emit("join_ride", { rideId });
      socket.emit("check_active_call", { rideId });
    });

    socket.on("active_call_status", (data) => {
      if (data && data.active) {
        setActiveCall(data);
        if (data.riders) {
          setLiveRiderMap((prev) => ({ ...prev, ...data.riders }));
        }
        if (
          callStateRef.current === "IDLE" &&
          currentUserId &&
          String(data.callerId) !== String(currentUserId)
        ) {
          setIncomingCall(data);
        }
      } else {
        setActiveCall(null);
      }
    });

    // Real-time incoming call from another rider -> pop up on screen without reloading!
    socket.on("incoming_group_call", (data) => {
      if (!data || !data.active) return;
      if (currentUserId && String(data.callerId) === String(currentUserId)) return;

      setActiveCall(data);
      if (data.riders) {
        setLiveRiderMap((prev) => ({ ...prev, ...data.riders }));
      }

      // Trigger incoming call popup if user is currently idle
      if (callStateRef.current === "IDLE") {
        setIncomingCall(data);
      }
    });

    socket.on("group_call_started", (data) => {
      setActiveCall(data);
      if (data?.riders) {
        setLiveRiderMap((prev) => ({ ...prev, ...data.riders }));
      }
    });

    socket.on("call_riders_updated", (data) => {
      if (data?.riders) {
        setLiveRiderMap((prev) => ({ ...prev, ...data.riders }));
      }
    });

    socket.on("group_call_ended", () => {
      setActiveCall(null);
      setIncomingCall(null);
      setLiveRiderMap({});
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [rideId, currentUserId]);

  // Build deterministic Agora UID -> Rider Name mapping
  const uidMap = useMemo(() => {
    return buildParticipantUidMap(
      participantsList,
      ride?.organizer || ride?.organizerId,
      currentUserId
    );
  }, [participantsList, ride, currentUserId]);

  const selfDisplayName = useMemo(() => {
    return user?.name || user?.username || (isOrganizer ? "Organizer" : "Rider");
  }, [user, isOrganizer]);

  // Call duration timer
  useEffect(() => {
    if (callState !== "CONNECTED") return;

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callState]);

  // Teardown and cleanup routine for local rider leaving call
  const cleanupCall = useCallback(async (isExplicitEndForAll = false) => {
    try {
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
        setLocalVideoTrack(null);
      }
      if (clientRef.current) {
        clientRef.current.removeAllListeners();
        await clientRef.current.leave();
        clientRef.current = null;
      }

      // ONLY emit end_group_call if caller/organizer explicitly requested end for all
      if (isExplicitEndForAll && socketRef.current?.connected) {
        socketRef.current.emit("end_group_call", { rideId });
      }
    } catch (err) {
      console.warn("[Agora] Teardown warning:", err);
    } finally {
      isJoiningOrJoinedRef.current = false;
      setRemoteUsers([]);
      setCallState("IDLE");
      setDuration(0);
      setTokenRenewalFailed(false);
    }
  }, [rideId]);

  // Keep a stable ref to cleanupCall so beforeunload and unmount don't trigger on every state change
  const cleanupRef = useRef(cleanupCall);
  cleanupRef.current = cleanupCall;

  // Guarantee cleanup on page unload / tab close ONLY ONCE
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupRef.current?.(false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      cleanupRef.current?.(false);
    };
  }, []); // Run on mount, clean up on unmount

  // Join Call Flow with options: "video" (default) or "voice" (audio-only)
  const handleJoinCall = async (selectedMode = "video") => {
    if (!rideId) return;

    // Guard against React StrictMode running double joins
    if (isJoiningOrJoinedRef.current) return;
    isJoiningOrJoinedRef.current = true;

    const isVideoMode = selectedMode === "video";
    setCallState("CONNECTING");
    setErrorMessage("");
    setNotice("");
    setDuration(0);
    setTokenRenewalFailed(false);
    setIncomingCall(null);

    // Auto-scroll the call stage directly into view so rider instantly sees the call UI
    setTimeout(() => {
      callContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);

    // Notify room via socket that a group call has started ONLY if there is no call active
    if (socketRef.current?.connected && !activeCall?.active) {
      socketRef.current.emit("start_group_call", {
        rideId,
        callType: selectedMode,
      });
    }

    try {
      // 1. Fetch token from backend with a unique session UID per browser tab
      const sessionUid = (parseInt(String(currentUserId || "1").slice(-6), 16) * 1000 + (Math.floor(Math.random() * 900) + 100)) % 2147483647;
      const tokenRes = await apiClient.post("/api/mototribe/agora/token", {
        rideId,
        uid: sessionUid,
      });
      const tokenData = tokenRes.data?.data;

      if (!tokenData || !tokenData.token || !tokenData.appId || !tokenData.channelName) {
        throw new Error("Invalid token response received from the server.");
      }

      const { appId, channelName, token, uid } = tokenData;

      // 2. Create Agora RTC Client in 'rtc' mode with 'vp8' codec
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // 3. Register Event Listeners
      client.on("user-published", async (remoteUser, mediaType) => {
        try {
          await client.subscribe(remoteUser, mediaType);
          if (mediaType === "audio") {
            remoteUser.audioTrack?.play();
          }

          setRemoteUsers((prev) => {
            const exists = prev.some((u) => u.uid === remoteUser.uid);
            if (exists) {
              return prev.map((u) =>
                u.uid === remoteUser.uid
                  ? {
                      ...u,
                      hasAudio: remoteUser.hasAudio,
                      hasVideo: remoteUser.hasVideo,
                      user: remoteUser,
                    }
                  : u
              );
            }
            return [
              ...prev,
              {
                uid: remoteUser.uid,
                user: remoteUser,
                hasAudio: remoteUser.hasAudio,
                hasVideo: remoteUser.hasVideo,
              },
            ];
          });
        } catch (subErr) {
          console.error("[Agora] Subscribe error:", subErr);
        }
      });

      client.on("user-unpublished", (remoteUser) => {
        setRemoteUsers((prev) =>
          prev.map((u) =>
            u.uid === remoteUser.uid
              ? {
                  ...u,
                  hasAudio: remoteUser.hasAudio,
                  hasVideo: remoteUser.hasVideo,
                  user: remoteUser,
                }
              : u
          )
        );
      });

      client.on("user-left", (remoteUser) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
      });

      client.on("connection-state-change", (curState) => {
        if (curState === "RECONNECTING") {
          setCallState("RECONNECTING");
        } else if (curState === "CONNECTED") {
          setCallState("CONNECTED");
        } else if (curState === "DISCONNECTED") {
          if (callStateRef.current === "CONNECTED") {
            setErrorMessage("Call disconnected from Agora. Please reconnect.");
          }
        }
      });

      client.on("token-privilege-will-expire", async () => {
        try {
          const renewRes = await apiClient.post("/api/mototribe/agora/token", { rideId });
          const newToken = renewRes.data?.data?.token;
          if (newToken) {
            await client.renewToken(newToken);
          }
        } catch (renewErr) {
          console.warn("[Agora] Token renewal notice:", renewErr);
          setTokenRenewalFailed(true);
        }
      });

      client.on("token-privilege-did-expire", async () => {
        try {
          const renewRes = await apiClient.post("/api/mototribe/agora/token", { rideId });
          const newToken = renewRes.data?.data?.token;
          if (newToken) {
            await client.renewToken(newToken);
            setTokenRenewalFailed(false);
          } else {
            setTokenRenewalFailed(true);
          }
        } catch (renewErr) {
          console.error("[Agora] Token expired and renewal failed:", renewErr);
          setTokenRenewalFailed(true);
        }
      });

      // 4. Local Audio & Video Track Acquisition with race timeout guards
      let micTrack = null;
      let camTrack = null;

      try {
        const micPromise = AgoraRTC.createMicrophoneAudioTrack();
        const micTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Microphone acquisition timeout")), 3500)
        );
        micTrack = await Promise.race([micPromise, micTimeout]);
        localAudioTrackRef.current = micTrack;
      } catch (err) {
        console.warn("Microphone access error:", err);
      }

      if (isVideoMode) {
        try {
          const camPromise = AgoraRTC.createCameraVideoTrack({
            encoderConfig: "360p_7",
            optimizationMode: "detail",
          });
          const camTimeout = new Promise((_, reject) =>
            setTimeout(() => {
              const timeoutErr = new Error("Webcam is locked by another window or app.");
              timeoutErr.name = "AbortError";
              reject(timeoutErr);
            }, 3500)
          );

          camTrack = await Promise.race([camPromise, camTimeout]);
          localVideoTrackRef.current = camTrack;
          setLocalVideoTrack(camTrack);
          setIsCameraOn(true);
        } catch (err) {
          console.warn("Camera access error:", err);
          setIsCameraOn(false);
          const rawMsg = err?.message || err?.name || "";
          const isBusyOrTimeout =
            err?.name === "AbortError" ||
            err?.name === "NotReadableError" ||
            rawMsg.toLowerCase().includes("starting video source") ||
            rawMsg.toLowerCase().includes("timeout") ||
            rawMsg.toLowerCase().includes("locked") ||
            rawMsg.toLowerCase().includes("busy");

          if (isBusyOrTimeout) {
            setNotice(
              "Your webcam is in use by Browser 1 on this device. Joined call in Voice mode (Microphone active & remote video visible)."
            );
          } else {
            setNotice(`Camera unavailable (${rawMsg || "Device busy"}). Joined with microphone only.`);
          }
        }
      } else {
        setIsCameraOn(false);
      }

      // 5. Join Agora Channel
      await client.join(appId, channelName, token, Number(uid));

      // Register rider's display name with socket server for this call
      if (socketRef.current?.connected) {
        socketRef.current.emit("register_call_rider", {
          rideId,
          uid: Number(uid),
          name: selfDisplayName,
        });
      }

      // 6. Publish allowed local tracks (if any)
      const tracksToPublish = [micTrack, camTrack].filter(Boolean);
      if (tracksToPublish.length > 0) {
        await client.publish(tracksToPublish);
      } else {
        setNotice(
          "Joined in Listen-Only mode (Microphone & Camera unavailable). You can hear and see all riders in this call."
        );
      }

      setIsMuted(false);
      setCallState("CONNECTED");
    } catch (err) {
      console.error("[Agora] Join call error:", err);
      cleanupCall();

      const serverMsg = err.response?.data?.message;
      setErrorMessage(serverMsg || err.message || "Failed to start call. Please try again.");
      setTimeout(() => {
        callContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
    }
  };

  // Listen for global pickup event or ?autoJoin=true URL parameter
  useEffect(() => {
    const handlePickupEvent = (e) => {
      const mode = e.detail?.mode || "video";
      handleJoinCall(mode);
    };

    window.addEventListener("mototribe:pickup-call", handlePickupEvent);

    if (typeof window !== "undefined" && window.location.search.includes("autoJoin=true")) {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("callType") || "video";
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      setTimeout(() => {
        handleJoinCall(mode);
      }, 350);
    }

    return () => {
      window.removeEventListener("mototribe:pickup-call", handlePickupEvent);
    };
  }, [rideId]);

  // Toggle Microphone (Mute / Unmute)
  const toggleMute = async () => {
    if (!localAudioTrackRef.current) return;
    const nextState = !isMuted;
    try {
      await localAudioTrackRef.current.setEnabled(!nextState);
      setIsMuted(nextState);
      setNotice(nextState ? "Microphone muted." : "Microphone active.");
    } catch (err) {
      console.warn("Could not toggle microphone:", err);
    }
  };

  // Toggle Camera (Video On / Off)
  const toggleCamera = async () => {
    setErrorMessage("");
    try {
      if (localVideoTrackRef.current) {
        const nextState = !isCameraOn;
        await localVideoTrackRef.current.setEnabled(nextState);
        setIsCameraOn(nextState);
        setNotice(nextState ? "Camera enabled." : "Camera turned off.");
      } else if (!isCameraOn && clientRef.current) {
        const newCamTrack = await AgoraRTC.createCameraVideoTrack();
        localVideoTrackRef.current = newCamTrack;
        setLocalVideoTrack(newCamTrack);
        await clientRef.current.publish(newCamTrack);
        setIsCameraOn(true);
        setNotice("Camera enabled and streaming.");
      }
    } catch (err) {
      console.warn("Could not toggle camera:", err);
      const rawMsg = err?.message || err?.name || "";
      const isDeviceInUse =
        err?.name === "AbortError" ||
        err?.name === "NotReadableError" ||
        err?.name === "TrackStartError" ||
        rawMsg.toLowerCase().includes("starting video source") ||
        rawMsg.toLowerCase().includes("timeout") ||
        rawMsg.toLowerCase().includes("could not start video source") ||
        rawMsg.toLowerCase().includes("device in use");
      const isDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError" ||
        err?.code === "PERMISSION_DENIED";

      if (isDeviceInUse) {
        setErrorMessage(
          "Your physical webcam is locked by your other browser window or app (e.g. WhatsApp, Zoom, or your 2nd browser). Close other camera tabs or leave the call in the other window to free the camera, then try again."
        );
      } else if (isDenied) {
        setErrorMessage(
          "Camera permission was denied in your browser. Click the site settings icon in the address bar to allow Camera."
        );
      } else {
        setErrorMessage(`Camera error: ${err?.message || "Device could not be opened."}`);
      }
    }
  };

  // Manual token reconnection
  const handleManualReconnect = async () => {
    if (!clientRef.current) return;
    try {
      const res = await apiClient.post("/api/mototribe/agora/token", { rideId });
      const newToken = res.data?.data?.token;
      if (newToken) {
        await clientRef.current.renewToken(newToken);
        setTokenRenewalFailed(false);
        setNotice("Connection successfully renewed.");
      }
    } catch (err) {
      setErrorMessage("Manual renewal failed. Please leave and re-join.");
    }
  };

  // Resolves actual rider display name for Agora remote UIDs (never shows Rider #ID)
  const resolveRiderDisplayName = useCallback(
    (remoteUid) => {
      const uidKey = String(remoteUid);

      // 1. Live socket-registered rider name
      if (liveRiderMap[uidKey]?.name) {
        return liveRiderMap[uidKey].name;
      }
      if (liveRiderMap[Number(remoteUid)]?.name) {
        return liveRiderMap[Number(remoteUid)].name;
      }

      // 2. Precomputed UID mapping
      const precomputed = getRiderNameForUid(uidMap, remoteUid);
      if (
        precomputed &&
        !precomputed.startsWith("Rider #") &&
        precomputed !== "Fellow Rider"
      ) {
        return precomputed;
      }

      // 3. Caller name if other participant is the call initiator
      if (
        activeCall?.callerName &&
        currentUserId &&
        String(activeCall.callerId) !== String(currentUserId)
      ) {
        return activeCall.callerName;
      }

      // 4. Other participants in the ride
      if (participantsList && participantsList.length > 0) {
        const otherParticipant = participantsList.find((p) => {
          const pId = String(p.userId?._id || p.userId || p.id || "");
          return pId && pId !== String(currentUserId);
        });
        const pName =
          otherParticipant?.userId?.name ||
          otherParticipant?.user?.name ||
          otherParticipant?.name;
        if (pName) return pName;
      }

      // 5. Organizer name fallback
      const organizerName =
        typeof ride?.organizer === "object"
          ? ride?.organizer?.name
          : ride?.organizer;
      if (organizerName && String(ride?.organizerId) !== String(currentUserId)) {
        return organizerName;
      }

      return "Fellow Rider";
    },
    [liveRiderMap, uidMap, activeCall, currentUserId, participantsList, ride]
  );

  return (
    <section
      id="mototribe-call-section"
      ref={callContainerRef}
      className="mototribe-ride-call"
    >
      {/* INCOMING CALL MODAL POPUP (Real-time socket pop up without reloading) */}
      {incomingCall && callState === "IDLE" && (
        <div className="agora-incoming-call-overlay">
          <div
            className="agora-incoming-call-backdrop"
            onClick={() => setIncomingCall(null)}
          />
          <div className="agora-incoming-call-modal">
            <div className="agora-incoming-call-ring-glow" />
            <div className="agora-incoming-call-icon">
              {incomingCall.callType === "voice" ? "🎙️" : "📹"}
            </div>

            <div className="agora-incoming-call-info">
              <span className="agora-incoming-eyebrow">INCOMING GROUP CALL</span>
              <h3>{incomingCall.callerName || "A fellow rider"}</h3>
              <p>
                Started a {incomingCall.callType === "voice" ? "voice" : "video"}{" "}
                call for <strong>{ride?.title || `Ride ${rideId.slice(-6)}`}</strong>.
              </p>
            </div>

            <div className="agora-incoming-call-actions">
              <button
                type="button"
                className="agora-incoming-btn-accept"
                onClick={() => {
                  const mode = incomingCall.callType || "video";
                  setIncomingCall(null);
                  handleJoinCall(mode);
                }}
              >
                <span>📞</span>
                PICK UP {incomingCall.callType === "voice" ? "VOICE" : "VIDEO"}
              </button>

              <button
                type="button"
                className="agora-incoming-btn-voice-opt"
                onClick={() => {
                  setIncomingCall(null);
                  handleJoinCall("voice");
                }}
              >
                <span>🎙️</span>
                JOIN VOICE ONLY
              </button>

              <button
                type="button"
                className="agora-incoming-btn-decline"
                onClick={() => setIncomingCall(null)}
              >
                DECLINE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE CALL FLOATING BANNER (When a call is live and rider is idle) */}
      {activeCall?.active && callState === "IDLE" && !incomingCall && (
        <div className="agora-active-call-alert-banner">
          <div className="agora-active-call-alert-left">
            <span className="agora-live-pulse-badge" />
            <div>
              <strong>LIVE CALL IN PROGRESS</strong>
              <p>{activeCall.callerName || "A rider"} started a group {activeCall.callType || "call"}.</p>
            </div>
          </div>
          <button
            type="button"
            className="agora-banner-pick-btn"
            onClick={() => handleJoinCall(activeCall.callType || "video")}
          >
            <span>📞</span> JOIN / PICK UP CALL
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="mototribe-ride-call-header">
        <div>
          <span className="mototribe-ride-call-eyebrow">
            LIVE RIDE / RTC COMMUNICATION
          </span>
          <h2>GROUP VOICE & VIDEO CALL</h2>
          <p>Real-time group audio and video with fellow riders on this journey.</p>
        </div>

        <div
          className={`mototribe-ride-call-status ${
            callState === "CONNECTED"
              ? "connected"
              : callState === "CONNECTING" || callState === "RECONNECTING"
              ? "connecting"
              : activeCall?.active
              ? "connected"
              : ""
          }`}
        >
          <span />
          {callState === "CONNECTED"
            ? `LIVE (${formatCallDuration(duration)})`
            : callState === "CONNECTING"
            ? "CONNECTING..."
            : callState === "RECONNECTING"
            ? "RECONNECTING..."
            : activeCall?.active
            ? "CALL IN PROGRESS"
            : "READY"}
        </div>
      </div>

      {/* NOTICE & ERROR ALERTS */}
      {errorMessage && (
        <div className="agora-call-alert error">
          <span>⚠</span>
          <p>{errorMessage}</p>
          {tokenRenewalFailed && (
            <button type="button" onClick={handleManualReconnect}>
              RECONNECT NOW
            </button>
          )}
        </div>
      )}

      {notice && !errorMessage && (
        <div className="agora-call-alert info">
          <span>ℹ</span>
          <p>{notice}</p>
        </div>
      )}

      {/* STATE 1: IDLE / NOT IN CALL */}
      {callState === "IDLE" && (
        <div className="mototribe-ride-call-start">
          <div className="mototribe-ride-call-start-icon">
            {activeCall?.active ? "📞" : "☎"}
          </div>

          <div className="mototribe-ride-call-start-content">
            <span>RIDE COMMUNICATOR</span>
            <strong>
              {activeCall?.active ? "Group Call in Progress" : "Start a Call"}
            </strong>
            <p>
              {activeCall?.active
                ? `${activeCall.callerName || "A rider"} started a group ${
                    activeCall.callType || "call"
                  }. Pick your option below to join!`
                : "Choose Video Call or Voice Call to start speaking with fellow riders."}
            </p>
          </div>

          {/* 2 OPTIONS: VIDEO CALL AND VOICE CALL */}
          <div className="mototribe-ride-call-start-actions">
            <button
              type="button"
              className="video"
              disabled={!isAllowedToCall}
              onClick={() => handleJoinCall("video")}
              title="Join or start with camera and microphone"
              style={{
                opacity: !isAllowedToCall ? 0.45 : 1,
                cursor: !isAllowedToCall ? "not-allowed" : "pointer",
              }}
            >
              <span>📹</span>
              {activeCall?.active ? "JOIN VIDEO CALL" : "VIDEO CALL"}
            </button>

            <button
              type="button"
              className="voice"
              disabled={!isAllowedToCall}
              onClick={() => handleJoinCall("voice")}
              title="Join or start with microphone only (audio only)"
              style={{
                opacity: !isAllowedToCall ? 0.45 : 1,
                cursor: !isAllowedToCall ? "not-allowed" : "pointer",
              }}
            >
              <span>🎙️</span>
              {activeCall?.active ? "JOIN VOICE CALL" : "VOICE CALL"}
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: CONNECTING / RECONNECTING */}
      {(callState === "CONNECTING" || callState === "RECONNECTING") && (
        <div className="mototribe-ride-call-connecting">
          <div className="mototribe-ride-call-loader">
            <span />
            <span />
            <span />
          </div>
          <span>AGORA RTC CHANNEL</span>
          <strong>
            {callState === "RECONNECTING"
              ? "Reconnecting to group call..."
              : "Connecting to ride group..."}
          </strong>
          <p>Negotiating live audio and video streams.</p>
          <button type="button" onClick={cleanupCall}>
            CANCEL
          </button>
        </div>
      )}

      {/* STATE 3: CONNECTED / ACTIVE CALL */}
      {callState === "CONNECTED" && (
        <div className="mototribe-ride-call-active">
          {/* STAGE HEADER */}
          <div className="mototribe-ride-call-stage-top">
            <div>
              <span>RIDE CHANNEL</span>
              <strong>{`ride-${rideId}`}</strong>
            </div>
            <div className="mototribe-ride-call-stage-live">
              <span />
              <span>{remoteUsers.length + 1} ON CALL</span>
            </div>
          </div>

          {/* RESPONSIVE VIDEO/VOICE GRID */}
          <div className="agora-call-grid">
            {/* Local Preview Tile */}
            <LocalVideoTile
              isCameraOn={isCameraOn}
              isMuted={isMuted}
              selfName={selfDisplayName}
              localVideoTrack={localVideoTrack}
            />

            {/* Remote Participants Tiles */}
            {remoteUsers.map((item) => {
              const riderName = resolveRiderDisplayName(item.uid);
              return (
                <RemoteVideoTile
                  key={item.uid}
                  remoteItem={item}
                  riderName={riderName}
                />
              );
            })}
          </div>

          {/* CONTROLS BAR */}
          <div className="mototribe-ride-call-controls">
            <button
              type="button"
              className={isMuted ? "muted" : "active"}
              onClick={toggleMute}
            >
              <span>{isMuted ? "🔇" : "🎙"}</span>
              {isMuted ? "UNMUTE" : "MUTE"}
            </button>

            <button
              type="button"
              className={!isCameraOn ? "camera-off" : "active"}
              onClick={toggleCamera}
            >
              <span>{isCameraOn ? "📷" : "🚫"}</span>
              {isCameraOn ? "STOP VIDEO" : "START VIDEO"}
            </button>

            <button
              type="button"
              className="end"
              onClick={() => cleanupCall(false)}
              title="Leave this call without ending it for other riders"
            >
              <span>✕</span>
              LEAVE CALL
            </button>

            {(isOrganizer || (activeCall && String(activeCall.callerId) === String(currentUserId))) && (
              <button
                type="button"
                className="end end-for-all"
                onClick={() => cleanupCall(true)}
                title="End call for all participants"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  borderColor: "rgba(239, 68, 68, 0.5)",
                  color: "#ef4444",
                }}
              >
                <span>⏹</span>
                END FOR ALL
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default RideCall;