import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Factory,
  FileText,
  Hash,
  Package,
  RefreshCw,
  XCircle,
} from "lucide-react";
import "./ManufactureTracking.css";

function ManufactureTracking() {
  const { id } = useParams();

  const [request, setRequest] = useState(() => {
    try {
      const requests = JSON.parse(
        localStorage.getItem("modaManufactureRequests") || "[]"
      );

      return (
        requests.find(
          (item) => String(item.id) === String(id)
        ) || null
      );
    } catch {
      return null;
    }
  });

  const loadRequest = useCallback(() => {
    try {
      const requests = JSON.parse(
        localStorage.getItem("modaManufactureRequests") || "[]"
      );

      const currentRequest = requests.find(
        (item) => String(item.id) === String(id)
      );

      setRequest(currentRequest || null);
    } catch {
      setRequest(null);
    }
  }, [id]);

  useEffect(() => {
    window.addEventListener(
      "modaManufactureRequestsUpdated",
      loadRequest
    );

    window.addEventListener("storage", loadRequest);

    const interval = setInterval(() => {
      loadRequest();
    }, 1500);

    return () => {
      window.removeEventListener(
        "modaManufactureRequestsUpdated",
        loadRequest
      );

      window.removeEventListener(
        "storage",
        loadRequest
      );

      clearInterval(interval);
    };
  }, [loadRequest]);

  if (!request) {
    return (
      <main className="tracking-page">
        <section className="tracking-not-found">
          <Package size={42} />

          <h1>Request not found</h1>

          <p>
            We could not find a production request with
            this tracking ID.
          </p>

          <Link
            to="/businesses/modamanufacture"
            className="tracking-button"
          >
            Back to ModaManufacture
          </Link>
        </section>
      </main>
    );
  }

  const status = request.status || "New";

  const steps = [
    {
      key: "New",
      label: "Request Submitted",
      description:
        "Your production request has been received.",
      icon: FileText,
    },
    {
      key: "Processing",
      label: "Processing",
      description:
        "The production request is being reviewed.",
      icon: Clock,
    },
    {
      key: "Completed",
      label: "Completed",
      description:
        "Your production request has been completed.",
      icon: CheckCircle2,
    },
  ];

  const statusIndex =
    status === "New"
      ? 0
      : status === "Processing"
      ? 1
      : status === "Completed"
      ? 2
      : -1;

  return (
    <main className="tracking-page">
      <section className="tracking-hero">
        <div className="tracking-container">
          <Link
            to="/businesses/modamanufacture"
            className="tracking-back"
          >
            <ArrowLeft size={16} />
            ModaManufacture
          </Link>

          <span className="tracking-eyebrow">
            PRODUCTION TRACKING
          </span>

          <h1>Track your production request.</h1>

          <p>
            Monitor the latest status of your
            manufacturing request.
          </p>

          <div className="tracking-id">
            <Hash size={16} />
            <span>{request.id}</span>
          </div>
        </div>
      </section>

      <section className="tracking-content">
        <div className="tracking-container">

          <div className="tracking-status-card">
            <div>
              <span className="tracking-label">
                CURRENT STATUS
              </span>

              <h2>{status}</h2>
            </div>

            <RefreshCw
              size={24}
              className="tracking-refresh-icon"
            />
          </div>

          {status === "Rejected" ? (
            <div className="tracking-rejected">
              <XCircle size={25} />

              <div>
                <h3>Request Rejected</h3>

                <p>
                  Your production request was not
                  approved by the administrator.
                </p>
              </div>
            </div>
          ) : (
            <div className="tracking-progress">
              {steps.map((step, index) => {
                const StepIcon = step.icon;

                const completed =
                  index <= statusIndex;

                const active =
                  index === statusIndex;

                return (
                  <div
                    className={`tracking-step ${
                      completed ? "completed" : ""
                    } ${active ? "active" : ""}`}
                    key={step.key}
                  >
                    <div className="tracking-step-icon">
                      {completed ? (
                        index < statusIndex ? (
                          <Check size={17} />
                        ) : (
                          <StepIcon size={17} />
                        )
                      ) : (
                        <StepIcon size={17} />
                      )}
                    </div>

                    <div className="tracking-step-content">
                      <h3>{step.label}</h3>

                      <p>{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="tracking-details">

            <div className="tracking-section-heading">
              <Factory size={20} />

              <div>
                <span>REQUEST DETAILS</span>
                <h2>Production information</h2>
              </div>
            </div>

            <div className="tracking-details-grid">

              <div className="tracking-detail">
                <span>PRODUCT</span>
                <strong>{request.product}</strong>
              </div>

              <div className="tracking-detail">
                <span>QUANTITY</span>
                <strong>{request.quantity}</strong>
              </div>

              <div className="tracking-detail">
                <span>CATEGORY</span>
                <strong>{request.category}</strong>
              </div>

              <div className="tracking-detail">
                <span>MANUFACTURER</span>
                <strong>{request.manufacturer}</strong>
              </div>

              <div className="tracking-detail">
                <span>DEADLINE</span>
                <strong>
                  <CalendarDays size={14} />
                  {request.deadline || "Not specified"}
                </strong>
              </div>

              <div className="tracking-detail">
                <span>SUBMITTED</span>
                <strong>{request.submittedAt}</strong>
              </div>

            </div>

            {request.message && (
              <div className="tracking-message">
                <span>MESSAGE</span>
                <p>{request.message}</p>
              </div>
            )}

          </div>

          <div className="tracking-actions">
            <Link
              to="/businesses/modamanufacture"
              className="tracking-button secondary"
            >
              <ArrowLeft size={16} />
              Back
            </Link>

            <Link
              to="/businesses"
              className="tracking-button"
            >
              Explore Businesses
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}

export default ManufactureTracking;