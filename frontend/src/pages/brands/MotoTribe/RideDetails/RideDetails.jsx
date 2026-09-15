import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./RideDetails.css";

const demoRides = [
  {
    id: "ride-001",
    title: "Araku Valley Adventure",
    route: "Visakhapatnam → Araku Valley",
    date: "20 Sep 2026",
    type: "ADVENTURE",
    difficulty: "INTERMEDIATE",
    distance: 340,
    duration: "2 Days",
    budget: 4500,
    status: "UPCOMING",
    organizer: "Arjun",
    capacity: 12,
    description:
      "A scenic motorcycle journey through mountain roads, viewpoints and forest routes.",
    stops: [
      "Lambasingi",
      "Borra Caves",
      "Araku Valley",
    ],
    requirements: [
      "Valid driving license",
      "Registered motorcycle",
      "Helmet and riding gear",
      "Basic emergency kit",
    ],
    participants: [
      {
        id: "r1",
        name: "Arjun",
        role: "ORGANIZER",
        confirmed: true,
      },
      {
        id: "r2",
        name: "Rahul",
        role: "RIDER",
        confirmed: true,
      },
      {
        id: "r3",
        name: "Sneha",
        role: "RIDER",
        confirmed: true,
      },
    ],
  },
  {
    id: "ride-002",
    title: "Coastal Sunrise Ride",
    route: "Kakinada → Yanam",
    date: "27 Sep 2026",
    type: "TOURING",
    difficulty: "BEGINNER",
    distance: 180,
    duration: "1 Day",
    budget: 2200,
    status: "UPCOMING",
    organizer: "Vikram",
    capacity: 10,
    description:
      "A relaxed coastal ride focused on sunrise views, local food and community riding.",
    stops: [
      "Kakinada Beach",
      "Yanam",
      "Coringa",
    ],
    requirements: [
      "Valid driving license",
      "Helmet",
      "Registered motorcycle",
    ],
    participants: [
      {
        id: "r4",
        name: "Vikram",
        role: "ORGANIZER",
        confirmed: true,
      },
      {
        id: "r5",
        name: "Kiran",
        role: "RIDER",
        confirmed: true,
      },
    ],
  },
];

function RideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const [ride, setRide] = useState(() => demoRides.find((item) => item.id === rideId) || null);
  const [participants, setParticipants] = useState(() => {
    const selectedRide = demoRides.find((item) => item.id === rideId);
    try {
      const savedParticipants = localStorage.getItem(`mototribeParticipants_${rideId}`);
      if (savedParticipants) {
        return JSON.parse(savedParticipants);
      }
    } catch (err) {
      console.error(err);
    }
    return selectedRide ? selectedRide.participants : [];
  });
  const [joinStatus, setJoinStatus] = useState("NOT_JOINED");
  const [requests, setRequests] = useState(() => {
    try {
      const savedRequests = localStorage.getItem(`mototribeRequests_${rideId}`);
      if (savedRequests) {
        return JSON.parse(savedRequests);
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  });
  const [message, setMessage] = useState("");

  const saveParticipants = (updatedParticipants) => {
    setParticipants(updatedParticipants);

    localStorage.setItem(
      `mototribeParticipants_${rideId}`,
      JSON.stringify(updatedParticipants)
    );
  };

  const saveRequests = (updatedRequests) => {
    setRequests(updatedRequests);

    localStorage.setItem(
      `mototribeRequests_${rideId}`,
      JSON.stringify(updatedRequests)
    );
  };

  const handleJoinRide = () => {
    if (!ride) return;

    if (participants.length >= ride.capacity) {
      setMessage("This ride is currently full.");
      return;
    }

    const currentRider = {
      id: "current-user",
      name: "You",
      role: "RIDER",
      confirmed: true,
    };

    const alreadyJoined = participants.some(
      (participant) => participant.id === "current-user"
    );

    if (alreadyJoined) {
      setJoinStatus("JOINED");
      setMessage("You are already part of this ride.");
      return;
    }

    const updatedParticipants = [
      ...participants,
      currentRider,
    ];

    saveParticipants(updatedParticipants);

    setJoinStatus("JOINED");
    setMessage("You successfully joined the ride.");
  };

  const handleRequestJoin = () => {
    const alreadyRequested = requests.some(
      (request) => request.id === "current-user"
    );

    if (alreadyRequested) {
      setJoinStatus("REQUESTED");
      setMessage("Your join request is already pending.");
      return;
    }

    const request = {
      id: "current-user",
      name: "You",
      requestedAt: new Date().toLocaleString(),
    };

    const updatedRequests = [...requests, request];

    saveRequests(updatedRequests);

    setJoinStatus("REQUESTED");
    setMessage("Join request sent to the organizer.");
  };

  const handleLeaveRide = () => {
    const updatedParticipants = participants.filter(
      (participant) => participant.id !== "current-user"
    );

    saveParticipants(updatedParticipants);

    setJoinStatus("NOT_JOINED");
    setMessage("You left this ride.");
  };

  const handleConfirmRequest = (request) => {
    if (participants.length >= ride.capacity) {
      setMessage("Ride capacity is full.");
      return;
    }

    const newParticipant = {
      id: request.id,
      name: request.name,
      role: "RIDER",
      confirmed: true,
    };

    saveParticipants([...participants, newParticipant]);

    const updatedRequests = requests.filter(
      (item) => item.id !== request.id
    );

    saveRequests(updatedRequests);

    setMessage(`${request.name} has been added to the ride.`);
  };

  const updateRideStatus = (status) => {
    const updatedRide = {
      ...ride,
      status,
    };

    setRide(updatedRide);

    localStorage.setItem(
      `mototribeRide_${rideId}`,
      JSON.stringify(updatedRide)
    );

    setMessage(`Ride status changed to ${status}.`);
  };

  if (!ride) {
    return (
      <section className="ride-details-page">
        <div className="ride-not-found">
          <h2>Ride Not Found</h2>
          <button onClick={() => navigate("/businesses/mototribe")}>
            BACK TO MOTOTRIBE
          </button>
        </div>
      </section>
    );
  }

  const isOrganizer = ride.organizer === "You";

  const progress =
    (participants.length / ride.capacity) * 100;

  return (
    <section className="ride-details-page">
      <div className="ride-details-container">

        <button
          className="ride-back-btn"
          onClick={() => navigate(-1)}
        >
          ← BACK
        </button>

        <div className="ride-details-hero">

          <div>
            <span className="ride-type">
              {ride.type}
            </span>

            <h1>{ride.title}</h1>

            <p className="ride-route">
              {ride.route}
            </p>

            <p className="ride-description">
              {ride.description}
            </p>
          </div>

          <div className="ride-status-card">
            <span>RIDE STATUS</span>
            <strong>{ride.status}</strong>
          </div>

        </div>

        <div className="ride-info-grid">

          <div className="ride-info-box">
            <span>DATE</span>
            <strong>{ride.date}</strong>
          </div>

          <div className="ride-info-box">
            <span>DISTANCE</span>
            <strong>{ride.distance} KM</strong>
          </div>

          <div className="ride-info-box">
            <span>DURATION</span>
            <strong>{ride.duration}</strong>
          </div>

          <div className="ride-info-box">
            <span>BUDGET</span>
            <strong>₹{ride.budget}</strong>
          </div>

          <div className="ride-info-box">
            <span>DIFFICULTY</span>
            <strong>{ride.difficulty}</strong>
          </div>

          <div className="ride-info-box">
            <span>ORGANIZER</span>
            <strong>{ride.organizer}</strong>
          </div>

        </div>

        <div className="ride-action-panel">

          <div>
            <span className="panel-label">
              YOUR PARTICIPATION
            </span>

            <h3>
              {joinStatus === "JOINED"
                ? "YOU ARE JOINED"
                : joinStatus === "REQUESTED"
                ? "REQUEST PENDING"
                : "JOIN THIS RIDE"}
            </h3>

            {message && (
              <p className="ride-message">
                {message}
              </p>
            )}
          </div>

          <div className="ride-actions">

            {joinStatus === "NOT_JOINED" && (
              <>
                <button
                  className="primary-ride-btn"
                  onClick={handleJoinRide}
                >
                  JOIN RIDE
                </button>

                <button
                  className="secondary-ride-btn"
                  onClick={handleRequestJoin}
                >
                  REQUEST TO JOIN
                </button>
              </>
            )}

            {joinStatus === "JOINED" && (
              <button
                className="secondary-ride-btn"
                onClick={handleLeaveRide}
              >
                LEAVE RIDE
              </button>
            )}

            {joinStatus === "REQUESTED" && (
              <button
                className="secondary-ride-btn"
                disabled
              >
                REQUEST PENDING
              </button>
            )}

          </div>
        </div>

        <div className="ride-content-grid">

          <div className="ride-main-column">

            <div className="ride-section">
              <div className="section-heading">
                <span>01</span>
                <h2>ROUTE & STOPS</h2>
              </div>

              <div className="route-line">
                <div className="route-point start">
                  <span></span>
                  <div>
                    <small>START</small>
                    <strong>
                      {ride.route.split(" → ")[0]}
                    </strong>
                  </div>
                </div>

                {ride.stops.map((stop, index) => (
                  <div
                    className="route-point"
                    key={stop}
                  >
                    <span></span>

                    <div>
                      <small>STOP {index + 1}</small>
                      <strong>{stop}</strong>
                    </div>
                  </div>
                ))}

                <div className="route-point destination">
                  <span></span>

                  <div>
                    <small>DESTINATION</small>
                    <strong>
                      {ride.route.split(" → ")[1]}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="ride-section">

              <div className="section-heading">
                <span>02</span>
                <h2>RIDE REQUIREMENTS</h2>
              </div>

              <div className="requirements-list">
                {ride.requirements.map((requirement) => (
                  <div
                    className="requirement"
                    key={requirement}
                  >
                    <span>✓</span>
                    {requirement}
                  </div>
                ))}
              </div>

            </div>

          </div>

          <aside className="ride-side-column">

            <div className="ride-section participants-section">

              <div className="section-heading">
                <span>03</span>
                <h2>RIDERS</h2>
              </div>

              <div className="capacity-info">
                <div>
                  <strong>
                    {participants.length}
                  </strong>
                  <span>
                    / {ride.capacity} RIDERS
                  </span>
                </div>

                <span>
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="capacity-bar">
                <div
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                  }}
                ></div>
              </div>

              <div className="participants-list">

                {participants.map((participant) => (
                  <div
                    className="participant"
                    key={participant.id}
                  >
                    <div className="participant-avatar">
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
                      <span className="confirmed">
                        ✓
                      </span>
                    )}
                  </div>
                ))}

              </div>

            </div>

            {isOrganizer && requests.length > 0 && (
              <div className="ride-section">

                <div className="section-heading">
                  <span>04</span>
                  <h2>JOIN REQUESTS</h2>
                </div>

                {requests.map((request) => (
                  <div
                    className="join-request"
                    key={request.id}
                  >
                    <div>
                      <strong>{request.name}</strong>
                      <small>{request.requestedAt}</small>
                    </div>

                    <button
                      onClick={() =>
                        handleConfirmRequest(request)
                      }
                    >
                      CONFIRM
                    </button>
                  </div>
                ))}

              </div>
            )}

          </aside>

        </div>

        <div className="organizer-panel">

          <div>
            <span>ORGANIZER CONTROLS</span>
            <h2>RIDE LIFECYCLE</h2>
          </div>

          <div className="lifecycle-buttons">

            <button
              className={ride.status === "UPCOMING" ? "selected" : ""}
              onClick={() =>
                updateRideStatus("UPCOMING")
              }
            >
              UPCOMING
            </button>

            <button
              className={ride.status === "STARTING" ? "selected" : ""}
              onClick={() =>
                updateRideStatus("STARTING")
              }
            >
              STARTING
            </button>

            <button
              className={ride.status === "LIVE" ? "selected" : ""}
              onClick={() =>
                updateRideStatus("LIVE")
              }
            >
              START RIDE
            </button>

            <button
              className={ride.status === "COMPLETED" ? "selected" : ""}
              onClick={() =>
                updateRideStatus("COMPLETED")
              }
            >
              COMPLETE
            </button>

            <button
              className={ride.status === "CANCELLED" ? "selected danger" : "danger"}
              onClick={() =>
                updateRideStatus("CANCELLED")
              }
            >
              CANCEL
            </button>

          </div>

          <p>
            Demo organizer controls — backend authorization
            will be connected later.
          </p>

        </div>

      </div>
    </section>
  );
}

export default RideDetails;