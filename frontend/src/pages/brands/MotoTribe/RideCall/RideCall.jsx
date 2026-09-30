import { useEffect, useState } from "react";
import "./RideCall.css";

const DEMO_PARTICIPANTS = [
  {
    id: "rider-01",
    name: "Arjun",
    role: "Organizer",
    initials: "A",
    online: true,
    muted: false,
  },
  {
    id: "rider-02",
    name: "Rahul",
    role: "Rider",
    initials: "R",
    online: true,
    muted: true,
  },
  {
    id: "rider-03",
    name: "Priya",
    role: "Rider",
    initials: "P",
    online: true,
    muted: false,
  },
  {
    id: "rider-04",
    name: "Vikram",
    role: "Rider",
    initials: "V",
    online: false,
    muted: false,
  },
];

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function RideCall({ ride }) {
  const [callType, setCallType] = useState(null);
  const [callState, setCallState] = useState("IDLE");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [participants, setParticipants] = useState(
    DEMO_PARTICIPANTS
  );
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (callState !== "CONNECTED") {
      return;
    }

    const timer = setInterval(() => {
      setDuration((previousDuration) => previousDuration + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callState]);

  const startCall = (type) => {
    setCallType(type);
    setCallState("CONNECTING");
    setDuration(0);
    setNotice("");

    setTimeout(() => {
      setCallState("CONNECTED");
    }, 1200);
  };

  const endCall = () => {
    setCallState("IDLE");
    setCallType(null);
    setDuration(0);
    setIsMuted(false);
    setIsCameraOn(true);
    setIsSpeakerOn(true);
    setNotice("Call ended.");
  };

  const toggleMute = () => {
    setIsMuted((previousState) => !previousState);

    setNotice(
      isMuted
        ? "Microphone enabled."
        : "Microphone muted."
    );
  };

  const toggleCamera = () => {
    setIsCameraOn((previousState) => !previousState);

    setNotice(
      isCameraOn
        ? "Camera turned off."
        : "Camera turned on."
    );
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn((previousState) => !previousState);

    setNotice(
      isSpeakerOn
        ? "Speaker turned off."
        : "Speaker turned on."
    );
  };

  const toggleParticipantMute = (participantId) => {
    setParticipants((previousParticipants) =>
      previousParticipants.map((participant) =>
        participant.id === participantId
          ? {
              ...participant,
              muted: !participant.muted,
            }
          : participant
      )
    );
  };

  const callStateLabel = {
    IDLE: "READY",
    CONNECTING: "CONNECTING",
    CONNECTED: "LIVE CALL",
  }[callState];

  return (
    <section className="mototribe-ride-call">
      <div className="mototribe-ride-call-header">
        <div>
          <span className="mototribe-ride-call-eyebrow">
            LIVE RIDE / COMMUNICATION
          </span>

          <h2>VOICE & VIDEO CALL</h2>

          <p>
            Stay connected with riders during the active
            journey.
          </p>
        </div>

        <div
          className={`mototribe-ride-call-status ${
            callState.toLowerCase()
          }`}
        >
          <span />

          {callStateLabel}
        </div>
      </div>

      {callState === "IDLE" && (
        <div className="mototribe-ride-call-start">
          <div className="mototribe-ride-call-start-icon">
            ◉
          </div>

          <div className="mototribe-ride-call-start-content">
            <span>RIDE COMMUNICATION</span>

            <strong>
              Connect with your riding group
            </strong>

            <p>
              Start a voice or video call with riders
              currently participating in this journey.
            </p>
          </div>

          <div className="mototribe-ride-call-start-actions">
            <button
              type="button"
              className="voice"
              onClick={() => startCall("VOICE")}
            >
              <span>☎</span>
              VOICE CALL
            </button>

            <button
              type="button"
              className="video"
              onClick={() => startCall("VIDEO")}
            >
              <span>▣</span>
              VIDEO CALL
            </button>
          </div>
        </div>
      )}

      {callState === "CONNECTING" && (
        <div className="mototribe-ride-call-connecting">
          <div className="mototribe-ride-call-loader">
            <span />
            <span />
            <span />
          </div>

          <span>
            {callType === "VIDEO"
              ? "VIDEO CALL"
              : "VOICE CALL"}
          </span>

          <strong>
            Connecting to the riding group...
          </strong>

          <p>
            Preparing the live communication channel.
          </p>

          <button
            type="button"
            onClick={endCall}
          >
            CANCEL
          </button>
        </div>
      )}

      {callState === "CONNECTED" && (
        <div className="mototribe-ride-call-active">
          <div className="mototribe-ride-call-stage">
            <div className="mototribe-ride-call-stage-top">
              <div>
                <span>
                  {callType === "VIDEO"
                    ? "VIDEO CALL"
                    : "VOICE CALL"}
                </span>

                <strong>
                  {formatDuration(duration)}
                </strong>
              </div>

              <div className="mototribe-ride-call-stage-live">
                <span />
                LIVE
              </div>
            </div>

            {callType === "VIDEO" ? (
              <div className="mototribe-ride-call-video">
                <div className="mototribe-ride-call-video-main">
                  <div className="mototribe-ride-call-video-avatar">
                    A
                  </div>

                  <span>
                    Arjun · Organizer
                  </span>
                </div>

                <div className="mototribe-ride-call-video-self">
                  {isCameraOn ? (
                    <>
                      <div className="mototribe-ride-call-video-self-avatar">
                        Y
                      </div>

                      <span>You</span>
                    </>
                  ) : (
                    <>
                      <strong>
                        CAMERA OFF
                      </strong>

                      <span>You</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="mototribe-ride-call-voice">
                <div className="mototribe-ride-call-voice-avatar">
                  A
                </div>

                <strong>
                  MotoTribe Ride Group
                </strong>

                <span>
                  {participants.filter(
                    (participant) =>
                      participant.online
                  ).length + 1}{" "}
                  participants connected
                </span>

                <div className="mototribe-ride-call-wave">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div className="mototribe-ride-call-controls">
              <button
                type="button"
                className={isMuted ? "active" : ""}
                onClick={toggleMute}
              >
                <span>
                  {isMuted ? "×" : "♪"}
                </span>

                {isMuted
                  ? "UNMUTE"
                  : "MUTE"}
              </button>

              {callType === "VIDEO" && (
                <button
                  type="button"
                  className={
                    !isCameraOn ? "active" : ""
                  }
                  onClick={toggleCamera}
                >
                  <span>▣</span>

                  {isCameraOn
                    ? "CAMERA"
                    : "CAM OFF"}
                </button>
              )}

              <button
                type="button"
                className={
                  !isSpeakerOn ? "active" : ""
                }
                onClick={toggleSpeaker}
              >
                <span>
                  {isSpeakerOn ? "◉" : "×"}
                </span>

                SPEAKER
              </button>

              <button
                type="button"
                className="end"
                onClick={endCall}
              >
                <span>×</span>
                END CALL
              </button>
            </div>
          </div>

          <div className="mototribe-ride-call-participants">
            <div className="mototribe-ride-call-participants-heading">
              <div>
                <span>01</span>

                <h3>CALL PARTICIPANTS</h3>
              </div>

              <small>
                {participants.length + 1} TOTAL
              </small>
            </div>

            <div className="mototribe-ride-call-participant-list">
              <div className="mototribe-ride-call-participant you">
                <div className="mototribe-ride-call-participant-avatar">
                  Y
                </div>

                <div>
                  <strong>You</strong>

                  <span>
                    {isMuted
                      ? "Microphone muted"
                      : "Microphone active"}
                  </span>
                </div>

                <small>
                  {isMuted ? "MUTED" : "YOU"}
                </small>
              </div>

              {participants.map(
                (participant) => (
                  <div
                    className={`mototribe-ride-call-participant ${
                      participant.online
                        ? "online"
                        : "offline"
                    }`}
                    key={participant.id}
                  >
                    <div className="mototribe-ride-call-participant-avatar">
                      {participant.initials}
                    </div>

                    <div>
                      <strong>
                        {participant.name}
                      </strong>

                      <span>
                        {participant.role}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        toggleParticipantMute(
                          participant.id
                        )
                      }
                      disabled={
                        !participant.online
                      }
                    >
                      {participant.online
                        ? participant.muted
                          ? "MUTED"
                          : "LIVE"
                        : "OFFLINE"}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="mototribe-ride-call-notice">
          <span>✦</span>

          <p>{notice}</p>
        </div>
      )}

      <div className="mototribe-ride-call-footer">
        <span>
          {ride?.name
            ? `RIDE: ${ride.name}`
            : "MOTOTRIBE LIVE RIDE"}
        </span>

        <p>
          Voice and video communication is currently
          running in frontend demo mode.
        </p>
      </div>
    </section>
  );
}

export default RideCall;