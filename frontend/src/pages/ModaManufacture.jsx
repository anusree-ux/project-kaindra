import { useMemo, useState, useEffect } from "react";
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
  Store,
  Loader2,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import apiClient from "../services/apiClient";
import "./ModaManufacture.css";

function ModaManufacture() {
  const [partners, setPartners] = useState([]);
  const [capabilities, setCapabilities] = useState(["All"]);
  const [activePartnerType, setActivePartnerType] = useState("all");
  const [counts, setCounts] = useState({
    total: 0,
    manufacturerCount: 0,
    sellerCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [activeCapability, setActiveCapability] = useState("All");
  const [saved, setSaved] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showRFQ, setShowRFQ] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [selectedProfilePartner, setSelectedProfilePartner] = useState(null);

  const [submittedRequest, setSubmittedRequest] = useState(() => {
    try {
      const latestId = localStorage.getItem("latestManufactureRequestId");
      if (!latestId) return null;
      const requests = JSON.parse(
        localStorage.getItem("modaManufactureRequests") || "[]"
      );
      return (
        requests.find((request) => String(request.id) === String(latestId)) ||
        null
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

  // Fetch real partners (both manufacturers and sellers) from database
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    apiClient
      .get("/api/modasphere/directory/partners")
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.data || {};
        setPartners(data.partners || []);
        setCapabilities(data.capabilities || ["All"]);
        setCounts({
          total: data.total || 0,
          manufacturerCount: data.manufacturerCount || 0,
          sellerCount: data.sellerCount || 0,
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load directory partners:", err);
        setError("Failed to load verified partners from database.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      // Filter by type tab (all, manufacturer, seller)
      if (
        activePartnerType !== "all" &&
        partner.partnerType !== activePartnerType
      ) {
        return false;
      }

      const searchValue = search.trim().toLowerCase();
      const matchesSearch =
        !searchValue ||
        partner.name.toLowerCase().includes(searchValue) ||
        partner.location.toLowerCase().includes(searchValue) ||
        partner.specialty.toLowerCase().includes(searchValue) ||
        (partner.description &&
          partner.description.toLowerCase().includes(searchValue));

      const matchesCapability =
        activeCapability === "All" ||
        partner.capabilities.some(
          (c) => c.toLowerCase() === activeCapability.toLowerCase()
        );

      return matchesSearch && matchesCapability;
    });
  }, [partners, activePartnerType, search, activeCapability]);

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
            <strong>{counts.manufacturerCount}</strong>
            <span>Verified manufacturers</span>
          </div>

          <div>
            <strong>{counts.sellerCount}</strong>
            <span>Active sellers & brands</span>
          </div>

          <div>
            <strong>{capabilities.filter((c) => c !== "All").length}</strong>
            <span>Production capabilities</span>
          </div>

          <div>
            <strong>{counts.total}</strong>
            <span>Network partners in DB</span>
          </div>

        </div>

      </section>


      {/* =====================================================
          MANUFACTURERS & SELLERS DIRECTORY
      ===================================================== */}

      <section
        className="manufacturers-section"
        id="manufacturers"
      >

        <div className="manufacture-container">

          <div className="manufacturers-heading">

            <div>
              <span>PRODUCTION & BRAND PARTNERS</span>

              <h2>
                Directory
              </h2>
            </div>

            <p>
              {filteredPartners.length} partner{filteredPartners.length === 1 ? "" : "s"} available
            </p>

          </div>

          {/* Partner Type Filter Tabs */}
          <div className="partner-type-filter-bar">
            <button
              type="button"
              className={`partner-tab-btn ${activePartnerType === "all" ? "active" : ""}`}
              onClick={() => setActivePartnerType("all")}
            >
              <Building2 size={15} />
              All Partners ({counts.total})
            </button>
            <button
              type="button"
              className={`partner-tab-btn ${activePartnerType === "manufacturer" ? "active" : ""}`}
              onClick={() => setActivePartnerType("manufacturer")}
            >
              <Factory size={15} />
              Manufacturers ({counts.manufacturerCount})
            </button>
            <button
              type="button"
              className={`partner-tab-btn ${activePartnerType === "seller" ? "active" : ""}`}
              onClick={() => setActivePartnerType("seller")}
            >
              <Store size={15} />
              Sellers & Brands ({counts.sellerCount})
            </button>
          </div>

          {loading ? (
            <div className="manufacture-loading">
              <Loader2 className="spinning" size={36} />
              <p>Loading verified partners from database...</p>
            </div>
          ) : error ? (
            <div className="manufacture-empty">
              <p>{error}</p>
            </div>
          ) : (
            <div className="manufacturer-grid">

              {filteredPartners.map((partner) => (

                <article
                  className="manufacturer-card"
                  key={partner.id}
                >

                  <div className="manufacturer-image">

                    <img
                      src={partner.image}
                      alt={partner.name}
                    />

                    {partner.partnerType === "manufacturer" ? (
                      <span className="verified-badge">
                        <Factory size={13} />
                        Verified Manufacturer
                      </span>
                    ) : (
                      <span className="verified-badge seller-badge">
                        <Store size={13} />
                        Registered Brand / Seller
                      </span>
                    )}

                    <button
                      type="button"
                      className={
                        saved.includes(partner.id)
                          ? "save-button saved"
                          : "save-button"
                      }
                      onClick={() =>
                        toggleSaved(partner.id)
                      }
                    >
                      <Heart
                        size={17}
                        fill={
                          saved.includes(partner.id)
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
                          {partner.name}
                        </h3>

                        <p>
                          <MapPin size={13} />
                          {partner.location}
                        </p>
                      </div>

                      <div className="manufacturer-rating">
                        <Star
                          size={14}
                          fill="currentColor"
                        />

                        {partner.rating}
                      </div>

                    </div>


                    <span className="manufacturer-specialty">
                      {partner.specialty}
                    </span>


                    <div className="manufacturer-capabilities">

                      {partner.capabilities.map(
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
                          {partner.minimum}
                        </strong>
                      </div>

                      <div>
                        <small>LEAD TIME</small>
                        <strong>
                          {partner.leadTime}
                        </strong>
                      </div>

                      <div>
                        <small>CAPACITY</small>
                        <strong>
                          {partner.capacity}
                        </strong>
                      </div>

                    </div>


                    <div className="manufacturer-actions">

                      <button
                        type="button"
                        className="view-manufacturer"
                        onClick={() => setSelectedProfilePartner(partner)}
                      >
                        View Profile
                        <ArrowUpRightIcon />
                      </button>

                      <button
                        type="button"
                        className="request-button"
                        onClick={() =>
                          openRFQ(partner)
                        }
                      >
                        {partner.partnerType === "manufacturer" ? "Request Production" : "Inquire / Collaborate"}
                        <ArrowRight size={16} />
                      </button>

                    </div>

                  </div>

                </article>

              ))}

            </div>
          )}


          {!loading && filteredPartners.length === 0 && (
            <div className="manufacture-empty">

              <Factory size={35} />

              <h3>
                No partners found
              </h3>

              <p>
                Try selecting another partner type, search query, or capability filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCapability("All");
                  setActivePartnerType("all");
                }}
              >
                Clear all filters
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
          PARTNER PROFILE MODAL
      ===================================================== */}
      {selectedProfilePartner && (
        <div
          className="rfq-modal-backdrop"
          onMouseDown={() => setSelectedProfilePartner(null)}
        >
          <div
            className="rfq-modal partner-profile-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="rfq-modal-header">
              <div>
                <span className="profile-type-badge">
                  {selectedProfilePartner.partnerType === "manufacturer"
                    ? "VERIFIED MANUFACTURER"
                    : "REGISTERED BRAND / SELLER"}
                </span>
                <h2>{selectedProfilePartner.name}</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProfilePartner(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="profile-modal-body">
              <div className="profile-modal-hero">
                <img
                  src={selectedProfilePartner.image}
                  alt={selectedProfilePartner.name}
                  className="profile-modal-img"
                />
                <div className="profile-modal-meta">
                  <div className="profile-meta-tags">
                    <span className="profile-meta-tag">
                      <MapPin size={13} /> {selectedProfilePartner.location}
                    </span>
                    <span className="profile-meta-tag rating-tag">
                      <Star size={13} fill="currentColor" /> {selectedProfilePartner.rating}
                    </span>
                    <span className="profile-meta-tag verified-tag">
                      <ShieldCheck size={13} /> Verified in DB
                    </span>
                  </div>

                  <p className="profile-description">
                    {selectedProfilePartner.description ||
                      "Established partner operating within the ModaSphere ecosystem offering reliable fashion design, sourcing, and manufacturing capabilities."}
                  </p>
                </div>
              </div>

              <div className="profile-details-grid">
                <div className="profile-detail-card">
                  <small>SPECIALTY</small>
                  <strong>{selectedProfilePartner.specialty}</strong>
                </div>
                <div className="profile-detail-card">
                  <small>MINIMUM ORDER</small>
                  <strong>{selectedProfilePartner.minimum}</strong>
                </div>
                <div className="profile-detail-card">
                  <small>LEAD TIME</small>
                  <strong>{selectedProfilePartner.leadTime}</strong>
                </div>
                <div className="profile-detail-card">
                  <small>CAPACITY</small>
                  <strong>{selectedProfilePartner.capacity}</strong>
                </div>
              </div>

              <div className="profile-capabilities-section">
                <h4>CAPABILITIES & EXPERTISE</h4>
                <div className="profile-capabilities-list">
                  {selectedProfilePartner.capabilities?.map((cap) => (
                    <span key={cap} className="profile-cap-tag">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-contact-btn"
                  onClick={() => {
                    const partner = selectedProfilePartner;
                    setSelectedProfilePartner(null);
                    openRFQ(partner);
                  }}
                >
                  {selectedProfilePartner.partnerType === "manufacturer"
                    ? "Request Production Brief (RFQ)"
                    : "Send Sourcing Inquiry"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
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