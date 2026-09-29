import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./PostRideSummaryPage.css";

import PostRideSummary from "../PostRideSummary/PostRideSummary";
import { getMotoRideById } from "../../../../data/motoRides";

function PostRideSummaryPage() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const ride = useMemo(
    () => getMotoRideById(rideId),
    [rideId]
  );

  if (!ride) {
    return (
      <main className="post-ride-page">
        <div className="post-ride-page-error">
          <span className="post-ride-page-eyebrow">
            MOTOTRIBE / RIDE
          </span>

          <h1>RIDE NOT FOUND</h1>

          <p>
            The selected ride could not be found.
            Please return to MotoTribe and select
            a valid ride.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/businesses/mototribe"
              )
            }
          >
            BACK TO MOTOTRIBE
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="post-ride-page">
      <PostRideSummary ride={ride} />
    </main>
  );
}

export default PostRideSummaryPage;