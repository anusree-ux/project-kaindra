import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  MapPin,
  Package,
  RotateCcw,
  Clock,
  ShieldCheck,
  ArrowRight,
  Search,
  CheckCircle2,
} from "lucide-react";
import "./ModaLogix.css";

function ModaLogix() {
  const [trackingId, setTrackingId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);

  // Load real ModaManufacture requests
  const [manufactureRequests, setManufactureRequests] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("modaManufactureRequests") || "[]"
      );
    } catch {
      return [];
    }
  });

  // Load requests from localStorage
  const loadManufactureRequests = useCallback(() => {
    try {
      const requests = JSON.parse(
        localStorage.getItem("modaManufactureRequests") || "[]"
      );

      setManufactureRequests(requests);

      // Update currently tracked request automatically
      if (trackingId.trim()) {
        const currentRequest = requests.find(
          (request) =>
            String(request.id).toLowerCase() ===
            trackingId.trim().toLowerCase()
        );

        if (currentRequest) {
          setTrackedOrder(currentRequest);
        }
      }
    } catch {
      setManufactureRequests([]);
    }
  }, [trackingId]);

  // Listen for changes from ModaManufacture/Admin
  useEffect(() => {
    window.addEventListener(
      "modaManufactureRequestsUpdated",
      loadManufactureRequests
    );

    window.addEventListener(
      "storage",
      loadManufactureRequests
    );

    return () => {
      window.removeEventListener(
        "modaManufactureRequestsUpdated",
        loadManufactureRequests
      );

      window.removeEventListener(
        "storage",
        loadManufactureRequests
      );
    };
  }, [loadManufactureRequests]);

  // Track actual manufacture request
  const handleTracking = (event) => {
    event.preventDefault();

    const enteredId = trackingId.trim();

    if (!enteredId) {
      setTrackedOrder("not-found");
      return;
    }

    const request = manufactureRequests.find(
      (item) =>
        String(item.id).toLowerCase() ===
        enteredId.toLowerCase()
    );

    if (request) {
      setTrackedOrder(request);
    } else {
      setTrackedOrder("not-found");
    }
  };

  // Calculate progress from actual request status
  const getProgress = (status) => {
    switch (status) {
      case "New":
        return 25;

      case "Processing":
        return 65;

      case "Completed":
        return 100;

      case "Rejected":
        return 100;

      default:
        return 25;
    }
  };

  return (
    <main className="modalogix-page">

      {/* HERO */}
      <section className="modalogix-hero">
        <div className="modalogix-container">

          <span className="modalogix-eyebrow">
            MODASPHERE / MODALOGIX
          </span>

          <h1>
            Move fashion.
            <br />
            Move it smarter.
          </h1>

          <p>
            Smart logistics and fulfillment connecting
            fashion businesses, manufacturers and
            customers across the world.
          </p>

          <div className="modalogix-hero-actions">
            <a
              href="#tracking"
              className="modalogix-primary-button"
            >
              Track Shipment
              <ArrowRight size={16} />
            </a>

            <a
              href="#services"
              className="modalogix-secondary-button"
            >
              Explore Logistics
            </a>
          </div>

        </div>
      </section>

      {/* SERVICES */}
      <section
        id="services"
        className="modalogix-services"
      >
        <div className="modalogix-container">

          <div className="modalogix-section-heading">
            <span>LOGISTICS SOLUTIONS</span>

            <h2>
              Everything your fashion business needs
              to move.
            </h2>
          </div>

          <div className="modalogix-service-grid">

            <div className="modalogix-service-card">
              <div className="modalogix-icon">
                <Truck size={22} />
              </div>

              <h3>Delivery</h3>

              <p>
                Reliable delivery solutions for fashion
                orders across multiple destinations.
              </p>
            </div>

            <div className="modalogix-service-card">
              <div className="modalogix-icon">
                <Package size={22} />
              </div>

              <h3>Fulfillment</h3>

              <p>
                Manage storage, packing and order
                fulfillment from one connected system.
              </p>
            </div>

            <div className="modalogix-service-card">
              <div className="modalogix-icon">
                <RotateCcw size={22} />
              </div>

              <h3>Returns</h3>

              <p>
                Simplify returns and reverse logistics
                for customers and brands.
              </p>
            </div>

            <div className="modalogix-service-card">
              <div className="modalogix-icon">
                <MapPin size={22} />
              </div>

              <h3>Shipment Tracking</h3>

              <p>
                Track orders from dispatch to final
                delivery with real-time visibility.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* TRACKING */}
      <section
        id="tracking"
        className="modalogix-tracking"
      >
        <div className="modalogix-container">

          <div className="modalogix-tracking-box">

            <div className="modalogix-tracking-content">

              <span>TRACK YOUR ORDER</span>

              <h2>
                Know where your order is.
              </h2>

              <p>
                Enter the Request ID generated from
                ModaManufacture to check your production
                status.
              </p>

              <form onSubmit={handleTracking}>

                <div className="modalogix-search">

                  <Search size={18} />

                  <input
                    type="text"
                    placeholder="Enter production request ID"
                    value={trackingId}
                    onChange={(event) =>
                      setTrackingId(event.target.value)
                    }
                  />

                  <button type="submit">
                    Track
                  </button>

                </div>

              </form>

              <small>
                Enter the Request ID generated after
                submitting a production request.
              </small>

            </div>

            <div className="modalogix-tracking-visual">
              <Truck
                size={80}
                strokeWidth={1}
              />
            </div>

          </div>

          {/* NOT FOUND */}
          {trackedOrder === "not-found" && (
            <div className="modalogix-track-error">
              Tracking ID not found. Please enter a valid
              ModaManufacture Request ID.
            </div>
          )}

          {/* TRACKED REQUEST */}
          {trackedOrder &&
            trackedOrder !== "not-found" && (
              <div className="modalogix-order">

                {/* HEADER */}
                <div className="modalogix-order-header">

                  <div>
                    <span>REQUEST ID</span>

                    <h3>
                      {trackedOrder.id}
                    </h3>
                  </div>

                  <strong>
                    {trackedOrder.status || "New"}
                  </strong>

                </div>

                {/* REQUEST INFORMATION */}
                <div className="modalogix-order-info">

                  <div>
                    <span>PRODUCT</span>

                    <strong>
                      {trackedOrder.product ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>QUANTITY</span>

                    <strong>
                      {trackedOrder.quantity ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>CATEGORY</span>

                    <strong>
                      {trackedOrder.category ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>MANUFACTURER</span>

                    <strong>
                      {trackedOrder.manufacturer ||
                        "Open to manufacturers"}
                    </strong>
                  </div>

                  <div>
                    <span>DEADLINE</span>

                    <strong>
                      {trackedOrder.deadline ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>SUBMITTED</span>

                    <strong>
                      {trackedOrder.submittedAt ||
                        "Not available"}
                    </strong>
                  </div>

                </div>
<Link
  to={`/businesses/modapay?requestId=${trackedOrder.id}`}
  className="modalogix-payment-button"
>
  Make Payment
  <ArrowRight size={16} />
</Link>
                {/* PROGRESS */}
                <div className="modalogix-progress">

                  <div
                    className="modalogix-progress-bar"
                    style={{
                      width: `${getProgress(
                        trackedOrder.status
                      )}%`,
                    }}
                  />

                </div>

                {/* STATUS STEPS */}
                <div className="modalogix-progress-labels">

                  <span>
                    <CheckCircle2 size={14} />

                    Request Submitted
                  </span>

                  <span>
                    <Package size={14} />

                    Processing
                  </span>

                  <span>
                    <Truck size={14} />

                    Manufacturing
                  </span>

                  <span>
                    <MapPin size={14} />

                    Completed
                  </span>

                </div>

                {/* MESSAGE */}
                {trackedOrder.message && (
                  <div className="modalogix-request-message">

                    <span>
                      REQUEST MESSAGE
                    </span>

                    <p>
                      {trackedOrder.message}
                    </p>

                  </div>
                )}

              </div>
            )}

        </div>
      </section>

      {/* PROCESS */}
      <section className="modalogix-process">

        <div className="modalogix-container">

          <div className="modalogix-section-heading">

            <span>HOW IT WORKS</span>

            <h2>
              From warehouse to doorstep.
            </h2>

          </div>

          <div className="modalogix-process-grid">

            <div className="modalogix-process-item">

              <b>01</b>

              <Clock size={22} />

              <h3>Order Received</h3>

              <p>
                Orders are received and prepared for
                fulfillment.
              </p>

            </div>

            <div className="modalogix-process-item">

              <b>02</b>

              <Package size={22} />

              <h3>Pack & Dispatch</h3>

              <p>
                Products are packed and handed over
                for delivery.
              </p>

            </div>

            <div className="modalogix-process-item">

              <b>03</b>

              <Truck size={22} />

              <h3>Move</h3>

              <p>
                Shipments move through the logistics
                network.
              </p>

            </div>

            <div className="modalogix-process-item">

              <b>04</b>

              <MapPin size={22} />

              <h3>Delivered</h3>

              <p>
                Orders reach the customer safely and
                efficiently.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* FEATURES */}
      <section className="modalogix-features">

        <div className="modalogix-container">

          <div className="modalogix-feature-content">

            <span>BUILT FOR MODASPHERE</span>

            <h2>
              Logistics connected to the entire
              fashion ecosystem.
            </h2>

            <p>
              ModaLogix connects marketplaces,
              manufacturers, brands, creators and
              customers through one logistics layer.
            </p>

            <div className="modalogix-feature-list">

              <div>
                <ShieldCheck size={19} />
                <span>
                  Reliable shipment handling
                </span>
              </div>

              <div>
                <Clock size={19} />
                <span>
                  Faster fulfillment
                </span>
              </div>

              <div>
                <MapPin size={19} />
                <span>
                  Shipment visibility
                </span>
              </div>

              <div>
                <RotateCcw size={19} />
                <span>
                  Simple returns
                </span>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="modalogix-cta">

        <div className="modalogix-container">

          <span>MODALOGIX</span>

          <h2>
            Ready to move your fashion business?
          </h2>

          <p>
            Build a smarter logistics experience
            with ModaSphere.
          </p>

          <a href="#tracking">
            Track a Shipment
            <ArrowRight size={16} />
          </a>

        </div>

      </section>

    </main>
  );
}

export default ModaLogix;