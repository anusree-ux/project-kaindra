import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  Factory,
  MapPin,
  Star,
  CheckCircle2,
  Package,
  ArrowRight,
  Plus,
  X,
  Heart,
  Send,
  FileText,
  Truck,
} from "lucide-react";

import "./ModaManufacture.css";

const manufacturers = [
  {
    id: 1,
    name: "Aurelia Textiles",
    location: "Mumbai, India",
    specialty: "Luxury & Premium",
    capabilities: [
      "Cut & Sew",
      "Embroidery",
      "Private Label",
    ],
    rating: 4.9,
    orders: 128,
    minimum: "100 units",
    leadTime: "18–25 days",
    capacity: "High",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=85",
  },

  {
    id: 2,
    name: "Urban Stitch Works",
    location: "Bengaluru, India",
    specialty: "Streetwear",
    capabilities: [
      "Cut & Sew",
      "Screen Printing",
      "Dyeing",
    ],
    rating: 4.8,
    orders: 94,
    minimum: "50 units",
    leadTime: "12–20 days",
    capacity: "High",
    image:
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=900&q=85",
  },

  {
    id: 3,
    name: "Heritage Looms",
    location: "Hyderabad, India",
    specialty: "Ethnic & Cultural",
    capabilities: [
      "Handloom",
      "Embroidery",
      "Weaving",
    ],
    rating: 4.9,
    orders: 76,
    minimum: "30 units",
    leadTime: "25–40 days",
    capacity: "Medium",
    image:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85",
  },

  {
    id: 4,
    name: "Future Fabric Labs",
    location: "Delhi, India",
    specialty: "Technical Apparel",
    capabilities: [
      "Performance Wear",
      "Smart Textiles",
      "Cut & Sew",
    ],
    rating: 4.7,
    orders: 61,
    minimum: "100 units",
    leadTime: "20–35 days",
    capacity: "Medium",
    image:
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85",
  },

  {
    id: 5,
    name: "Nova Garments",
    location: "Tiruppur, India",
    specialty: "Mass Production",
    capabilities: [
      "Cut & Sew",
      "Knitting",
      "Dyeing",
    ],
    rating: 4.6,
    orders: 215,
    minimum: "500 units",
    leadTime: "20–30 days",
    capacity: "Very High",
    image:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85",
  },

  {
    id: 6,
    name: "Atelier Form",
    location: "Jaipur, India",
    specialty: "Designer Wear",
    capabilities: [
      "Custom Tailoring",
      "Embroidery",
      "Hand Finishing",
    ],
    rating: 4.9,
    orders: 48,
    minimum: "20 units",
    leadTime: "30–45 days",
    capacity: "Low",
    image:
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85",
  },
];

const capabilities = [
  "All",
  "Cut & Sew",
  "Embroidery",
  "Knitting",
  "Handloom",
  "Smart Textiles",
  "Private Label",
];

function ModaManufacture() {
  const [search, setSearch] = useState("");
  const [activeCapability, setActiveCapability] = useState("All");
  const [saved, setSaved] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showRFQ, setShowRFQ] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] =
    useState(null);
  const [submittedRequest, setSubmittedRequest] = useState(() => {
  try {
    const latestId = localStorage.getItem(
      "latestManufactureRequestId"
    );

    if (!latestId) return null;

    const requests = JSON.parse(
      localStorage.getItem("modaManufactureRequests") || "[]"
    );

    return (
      requests.find(
        (request) => String(request.id) === String(latestId)
      ) || null
    );
  } catch {
    return null;
  }
});
  const [rfqData, setRfqData] = useState({
    product: "",
    quantity: "",
    category: "",
    deadline: "",
    message: "",
  });

  const filteredManufacturers = useMemo(() => {
    return manufacturers.filter((manufacturer) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        manufacturer.name.toLowerCase().includes(searchValue) ||
        manufacturer.location.toLowerCase().includes(searchValue) ||
        manufacturer.specialty.toLowerCase().includes(searchValue);

      const matchesCapability =
        activeCapability === "All" ||
        manufacturer.capabilities.includes(activeCapability);

      return matchesSearch && matchesCapability;
    });
  }, [search, activeCapability]);

  const toggleSaved = (id) => {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const openRFQ = (manufacturer = null) => {
    setSelectedManufacturer(manufacturer);
    setShowRFQ(true);
  };

  const handleRFQSubmit = (event) => {
  event.preventDefault();

  try {
    const existingRequests = JSON.parse(
      localStorage.getItem("modaManufactureRequests") || "[]"
    );

    // Permanent tracking ID
    const requestId = `MM-${Date.now()}`;

    const newRequest = {
      id: requestId,

      manufacturer:
        selectedManufacturer?.name || "Open to manufacturers",

      product: rfqData.product,
      quantity: rfqData.quantity,
      category: rfqData.category,
      deadline: rfqData.deadline,
      message: rfqData.message,

      status: "New",

      submittedAt: new Date().toLocaleString(),
    };

    const updatedRequests = [
      newRequest,
      ...existingRequests,
    ];

    // Save all requests
    localStorage.setItem(
      "modaManufactureRequests",
      JSON.stringify(updatedRequests)
    );

    // Save latest tracking ID separately
    localStorage.setItem(
      "latestManufactureRequestId",
      newRequest.id
    );

    // Notify admin/tracking page
    window.dispatchEvent(
      new Event("modaManufactureRequestsUpdated")
    );

    // Show request on current page
    setSubmittedRequest(newRequest);

    // Clear form
    setRfqData({
      product: "",
      quantity: "",
      category: "",
      deadline: "",
      message: "",
    });

    setSelectedManufacturer(null);
    setShowRFQ(false);
  } catch (error) {
    console.error(
      "Failed to submit production request:",
      error
    );

    alert(
      "Something went wrong while submitting your request."
    );
  }
};

  return (
    <main className="manufacture-page">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <header className="manufacture-header">

        <div className="manufacture-container manufacture-header-inner">

          <div className="manufacture-brand">
            <span>MODASPHERE</span>
            <strong>MODAMANUFACTURE</strong>
          </div>

          <nav className="manufacture-nav">
            <a href="#manufacturers">Manufacturers</a>
            <a href="#process">How it works</a>
            <a href="#requests">My Requests</a>
          </nav>

          <button
            type="button"
            className="manufacture-rfq-button"
            onClick={() => openRFQ()}
          >
            <Plus size={17} />
            Create RFQ
          </button>

        </div>

      </header>


      {/* =====================================================
          HERO / SEARCH
      ===================================================== */}

      <section className="manufacture-dashboard-hero">

        <div className="manufacture-container">

          <div className="manufacture-dashboard-heading">

            <div>
              <span className="manufacture-eyebrow">
                PRODUCTION NETWORK
              </span>

              <h1>
                Find the right
                <br />
                <em>manufacturer.</em>
              </h1>
            </div>

            <p>
              Discover verified production partners,
              compare capabilities and send production
              requests directly through ModaManufacture.
            </p>

          </div>


          <div className="manufacture-search">

            <Search size={20} />

            <input
              type="text"
              placeholder="Search manufacturers, locations or specialties..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <button
              type="button"
              onClick={() =>
                setShowFilters(!showFilters)
              }
            >
              <SlidersHorizontal size={18} />
              Filters
            </button>

          </div>


          {showFilters && (
            <div className="manufacture-filter-panel">

              <div>
                <span>CAPABILITY</span>

                <div className="manufacture-filter-options">

                  {capabilities.map((capability) => (
                    <button
                      key={capability}
                      type="button"
                      className={
                        activeCapability === capability
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setActiveCapability(capability)
                      }
                    >
                      {capability}
                    </button>
                  ))}

                </div>
              </div>

            </div>
          )}

        </div>

      </section>


      {/* =====================================================
          QUICK STATS
      ===================================================== */}

      <section className="manufacture-stats">

        <div className="manufacture-container manufacture-stats-grid">

          <div>
            <strong>240+</strong>
            <span>Verified manufacturers</span>
          </div>

          <div>
            <strong>18</strong>
            <span>Production capabilities</span>
          </div>

          <div>
            <strong>12</strong>
            <span>Fashion categories</span>
          </div>

          <div>
            <strong>24/7</strong>
            <span>Request management</span>
          </div>

        </div>

      </section>


      {/* =====================================================
          MANUFACTURERS
      ===================================================== */}

      <section
        className="manufacturers-section"
        id="manufacturers"
      >

        <div className="manufacture-container">

          <div className="manufacturers-heading">

            <div>
              <span>PRODUCTION PARTNERS</span>

              <h2>
                Manufacturers
              </h2>
            </div>

            <p>
              {filteredManufacturers.length} manufacturers
              available
            </p>

          </div>


          <div className="manufacturer-grid">

            {filteredManufacturers.map((manufacturer) => (

              <article
                className="manufacturer-card"
                key={manufacturer.id}
              >

                <div className="manufacturer-image">

                  <img
                    src={manufacturer.image}
                    alt={manufacturer.name}
                  />

                  <span className="verified-badge">
                    <CheckCircle2 size={13} />
                    Verified
                  </span>

                  <button
                    type="button"
                    className={
                      saved.includes(manufacturer.id)
                        ? "save-button saved"
                        : "save-button"
                    }
                    onClick={() =>
                      toggleSaved(manufacturer.id)
                    }
                  >
                    <Heart
                      size={17}
                      fill={
                        saved.includes(manufacturer.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                </div>


                <div className="manufacturer-card-content">

                  <div className="manufacturer-name-row">

                    <div>
                      <h3>
                        {manufacturer.name}
                      </h3>

                      <p>
                        <MapPin size={13} />
                        {manufacturer.location}
                      </p>
                    </div>

                    <div className="manufacturer-rating">
                      <Star
                        size={14}
                        fill="currentColor"
                      />

                      {manufacturer.rating}
                    </div>

                  </div>


                  <span className="manufacturer-specialty">
                    {manufacturer.specialty}
                  </span>


                  <div className="manufacturer-capabilities">

                    {manufacturer.capabilities.map(
                      (capability) => (
                        <span key={capability}>
                          {capability}
                        </span>
                      )
                    )}

                  </div>


                  <div className="manufacturer-details">

                    <div>
                      <small>MINIMUM</small>
                      <strong>
                        {manufacturer.minimum}
                      </strong>
                    </div>

                    <div>
                      <small>LEAD TIME</small>
                      <strong>
                        {manufacturer.leadTime}
                      </strong>
                    </div>

                    <div>
                      <small>CAPACITY</small>
                      <strong>
                        {manufacturer.capacity}
                      </strong>
                    </div>

                  </div>


                  <div className="manufacturer-actions">

                    <button
                      type="button"
                      className="view-manufacturer"
                      onClick={() =>
                        alert(
                          `${manufacturer.name}\n\nLocation: ${manufacturer.location}\nSpecialty: ${manufacturer.specialty}\nRating: ${manufacturer.rating}`
                        )
                      }
                    >
                      View Profile
                      <ArrowUpRightIcon />
                    </button>

                    <button
                      type="button"
                      className="request-button"
                      onClick={() =>
                        openRFQ(manufacturer)
                      }
                    >
                      Request Production
                      <ArrowRight size={16} />
                    </button>

                  </div>

                </div>

              </article>

            ))}

          </div>


          {filteredManufacturers.length === 0 && (
            <div className="manufacture-empty">

              <Factory size={35} />

              <h3>
                No manufacturers found
              </h3>

              <p>
                Try another search or capability.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCapability("All");
                }}
              >
                Clear filters
              </button>

            </div>
          )}

        </div>

      </section>


      {/* =====================================================
          PRODUCTION WORKFLOW
      ===================================================== */}

      <section
        className="manufacture-process"
        id="process"
      >

        <div className="manufacture-container">

          <div className="manufacture-process-heading">

            <span>
              PRODUCTION WORKFLOW
            </span>

            <h2>
              From idea
              <br />
              to production.
            </h2>

          </div>


          <div className="manufacture-process-grid">

            <div className="manufacture-process-card">
              <span>01</span>
              <FileText size={22} />

              <h3>
                Submit brief
              </h3>

              <p>
                Tell manufacturers what you want
                to produce.
              </p>
            </div>


            <div className="manufacture-process-card">
              <span>02</span>
              <Search size={22} />

              <h3>
                Compare partners
              </h3>

              <p>
                Review capabilities, minimums,
                ratings and lead times.
              </p>
            </div>


            <div className="manufacture-process-card">
              <span>03</span>
              <Package size={22} />

              <h3>
                Request samples
              </h3>

              <p>
                Validate materials, quality and
                construction before production.
              </p>
            </div>


            <div className="manufacture-process-card">
              <span>04</span>
              <Truck size={22} />

              <h3>
                Start production
              </h3>

              <p>
                Move the approved project into
                manufacturing.
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          REQUESTS
      ===================================================== */}

      <section
        className="manufacture-request-section"
        id="requests"
      >

        <div className="manufacture-container">

          <div className="manufacture-request-box">

            <div>

              <span>
                READY TO PRODUCE?
              </span>

              <h2>
                Send your production
                <br />
                request.
              </h2>

              <p>
                Create one RFQ and connect with
                manufacturers that match your requirements.
              </p>

            </div>

            <button
              type="button"
              onClick={() => openRFQ()}
            >
              Create Production Request
              <Send size={17} />
            </button>

          </div>

        </div>

      </section>
      {submittedRequest && (
  <section className="request-success-section">
    <div className="manufacture-container">
      <div className="request-success">
        <div className="request-success-content">
          <span>PRODUCTION REQUEST</span>

          <h3>Your request has been submitted.</h3>

          <p>
            Keep your tracking ID to check the latest
            production status anytime.
          </p>

          <div className="tracking-id-box">
            <small>TRACKING ID</small>

            <strong>
              {submittedRequest.id}
            </strong>
          </div>

          <div className="tracking-status">
            <span>Current Status</span>

            <strong className={`
              status-${submittedRequest.status
                .toLowerCase()
                .replace(/\s+/g, "-")}
            `}>
              {submittedRequest.status}
            </strong>
          </div>
        </div>

        <Link
          to={`/businesses/modamanufacture/track/${submittedRequest.id}`}
          className="request-success-link"
        >
          Track Request
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  </section>
)}


      {/* =====================================================
          RFQ MODAL
      ===================================================== */}

      {showRFQ && (
        <div
          className="rfq-modal-backdrop"
          onMouseDown={() => setShowRFQ(false)}
        >

          <div
            className="rfq-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="rfq-modal-header">

              <div>
                <span>
                  PRODUCTION REQUEST
                </span>

                <h2>
                  Create RFQ
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowRFQ(false)}
              >
                <X size={20} />
              </button>

            </div>


            {selectedManufacturer && (
              <div className="selected-manufacturer">

                <Factory size={18} />

                <div>
                  <small>
                    REQUESTING FROM
                  </small>

                  <strong>
                    {selectedManufacturer.name}
                  </strong>
                </div>

              </div>
            )}


            <form onSubmit={handleRFQSubmit}>

              <div className="rfq-field">

                <label>
                  PRODUCT / COLLECTION
                </label>

                <input
                  type="text"
                  placeholder="e.g. Oversized cotton t-shirts"
                  value={rfqData.product}
                  required
                  onChange={(event) =>
                    setRfqData({
                      ...rfqData,
                      product: event.target.value,
                    })
                  }
                />

              </div>


              <div className="rfq-form-grid">

                <div className="rfq-field">

                  <label>
                    QUANTITY
                  </label>

                  <input
                    type="number"
                    min="1"
                    placeholder="500"
                    value={rfqData.quantity}
                    required
                    onChange={(event) =>
                      setRfqData({
                        ...rfqData,
                        quantity: event.target.value,
                      })
                    }
                  />

                </div>


                <div className="rfq-field">

                  <label>
                    CATEGORY
                  </label>

                  <select
                    value={rfqData.category}
                    required
                    onChange={(event) =>
                      setRfqData({
                        ...rfqData,
                        category: event.target.value,
                      })
                    }
                  >
                    <option value="">
                      Select category
                    </option>

                    <option value="Streetwear">
                      Streetwear
                    </option>

                    <option value="Luxury">
                      Luxury
                    </option>

                    <option value="Ethnic">
                      Ethnic / Cultural
                    </option>

                    <option value="Activewear">
                      Activewear
                    </option>

                    <option value="Accessories">
                      Accessories
                    </option>

                  </select>

                </div>

              </div>


              <div className="rfq-field">

                <label>
                  REQUIRED BY
                </label>

                <input
                  type="date"
                  value={rfqData.deadline}
                  required
                  onChange={(event) =>
                    setRfqData({
                      ...rfqData,
                      deadline: event.target.value,
                    })
                  }
                />

              </div>


              <div className="rfq-field">

                <label>
                  PROJECT DETAILS
                </label>

                <textarea
                  rows="4"
                  placeholder="Describe materials, quantity, quality requirements, packaging, etc."
                  value={rfqData.message}
                  onChange={(event) =>
                    setRfqData({
                      ...rfqData,
                      message: event.target.value,
                    })
                  }
                />

              </div>


              <button
                type="submit"
                className="submit-rfq-button"
              >
                Submit Production Request
                <Send size={17} />
              </button>

            </form>

          </div>

        </div>
      )}
      {/* =====================================================
          REQUEST SUCCESS
      ===================================================== */}

      {submittedRequest && (
        <section className="request-success-section">
          <div className="manufacture-container">
            <div className="request-success">
              <div className="request-success-content">
                <span>REQUEST SUBMITTED</span>

                <h3>Production request received.</h3>

                <p>
                  Your production request has been successfully
                  submitted and is now waiting for review.
                </p>

                <strong>
                  Request ID: {submittedRequest.id}
                </strong>
              </div>

              <Link
                to={`/businesses/modamanufacture/track/${submittedRequest.id}`}
                className="request-success-link"
              >
                Track Request
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}


/* Small reusable icon component */

function ArrowUpRightIcon() {
  return (
    <ArrowRight
      size={16}
      style={{
        transform: "rotate(-45deg)",
      }}
    />
  );
}

export default ModaManufacture;