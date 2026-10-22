import { useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import QuoteForm from "./QuoteForm";

const RequestDetail = () => {
  const { requestId } = useParams();

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>{requestId}</h1>
          <p>Production request details.</p>
        </div>

        <StatusBadge status="quoted" />
      </div>

      <div className="dashboard-two-column">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Request information</h2>
          </div>

          <div className="dashboard-card-body">
            <p>
              <strong>Product:</strong>{" "}
              Premium Cotton Tee
            </p>

            <p>
              <strong>Quantity:</strong> 500
            </p>

            <p>
              <strong>Material:</strong>{" "}
              Premium cotton
            </p>

            <p>
              <strong>Required by:</strong>{" "}
              30 November 2026
            </p>
          </div>
        </div>

        <QuoteForm />
      </div>
    </div>
  );
};

export default RequestDetail;