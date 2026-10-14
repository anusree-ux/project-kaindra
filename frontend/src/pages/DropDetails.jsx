import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./DropDetails.css";

function DropDetails() {
  const { dropId } = useParams();
  const { isAuthenticated, openAuthModal } = useAuth();
  const { addToCart: addToCartContext } = useCart();
  const [drop, setDrop] = useState(null);
  const [loadingDrop, setLoadingDrop] = useState(true);
  const [error, setError] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [eventWaitlistJoined, setEventWaitlistJoined] = useState(false);
  const [joiningEventWaitlist, setJoiningEventWaitlist] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState(null);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [addToCartError, setAddToCartError] = useState("");

  useEffect(() => {
    const fetchDrop = async () => {
      try {
        setLoadingDrop(true);
        setError("");
        setDrop(null);

        const res = await apiClient.get(`/api/modasphere/drops/${dropId}`);
        const event = res.data?.data?.drop;
        setDrop(event || null);
        setSelectedProductId(
          event?.productIds?.find((product) => product?.status === "active")
            ?._id || ""
        );
      } catch (fetchError) {
        console.error("Unable to load ModaDrop event:", fetchError);
        setError(
          fetchError.response?.data?.message ||
          fetchError.message ||
          "Failed to load ModaDrop event."
        );
      } finally {
        setLoadingDrop(false);
      }
    };

    fetchDrop();
  }, [dropId]);

  const products = (drop?.productIds || []).filter(
    (product) => product && product.status === "active"
  );
  const selectedProduct =
    products.find((product) => String(product._id) === selectedProductId) ||
    products[0];
  const isUpcoming = drop?.status === "upcoming";
  const isLive = drop?.status === "live";
  const isSoldOut = Boolean(selectedProduct && selectedProduct.dropStock <= 0);
  const dropStatus = isLive
    ? isSoldOut
      ? "Sold Out"
      : "Pre-order Open"
    : isUpcoming
      ? "Coming Soon"
      : "Ended";

  useEffect(() => {
    setQuantity(1);
    setWaitlistJoined(false);
    setWaitlistPosition(null);
  }, [selectedProduct?._id]);

  useEffect(() => {
    if (!selectedProduct?.isDrop || !isSoldOut || !isAuthenticated) {
      return;
    }

    const fetchWaitlistPosition = async () => {
      try {
        const res = await apiClient.get(
          `/api/modasphere/drops/products/${selectedProduct._id}/waitlist/position`
        );
        setWaitlistJoined(true);
        setWaitlistPosition(res.data?.data?.position ?? null);
      } catch (err) {
        // 404 means not on waitlist yet — silent
        if (err.response?.status !== 404) {
          console.error("Unable to check ModaDrop waitlist position:", err);
        }
      }
    };

    fetchWaitlistPosition();
  }, [selectedProduct, isSoldOut, isAuthenticated]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!selectedProduct) return;

    setAddToCartError("");
    try {
      const result = await addToCartContext(selectedProduct._id, quantity);
      if (!result?.success) {
        setAddToCartError(result?.message || "Failed to add to cart.");
      }
    } catch (err) {
      console.error("Unable to add ModaDrop to cart:", err);
      setAddToCartError(err.message || "Failed to add to cart.");
    }
  };

  const handleJoinWaitlist = async () => {
    if (!selectedProduct || !isSoldOut) {
      return;
    }

    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    try {
      setJoiningWaitlist(true);
      await apiClient.post(
        `/api/modasphere/drops/products/${selectedProduct._id}/waitlist`
      );

      setWaitlistJoined(true);
      try {
        const posRes = await apiClient.get(
          `/api/modasphere/drops/products/${selectedProduct._id}/waitlist/position`
        );
        setWaitlistPosition(posRes.data?.data?.position ?? null);
      } catch {
        // Position fetch is best-effort; waitlist join already succeeded
      }
    } catch (requestError) {
      console.error("Unable to join ModaDrop waitlist:", requestError);
      alert(
        requestError.response?.data?.message ||
        requestError.message ||
        "Failed to join the waitlist."
      );
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const handleEventWaitlist = async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    try {
      setJoiningEventWaitlist(true);
      await apiClient({
        method: eventWaitlistJoined ? "delete" : "post",
        url: `/api/modasphere/drops/${drop._id}/waitlist`,
      });
      setEventWaitlistJoined(!eventWaitlistJoined);
    } catch (requestError) {
      console.error("Unable to update event waitlist:", requestError);
      alert(
        requestError.response?.data?.message ||
        requestError.message ||
        "Failed to update event waitlist."
      );
    } finally {
      setJoiningEventWaitlist(false);
    }
  };

  if (loadingDrop) {
    return (
      <main className="drop-details-page">
        <div className="drop-not-found">
          <h1>Loading Drop...</h1>
          <p>Please wait while we load the drop details.</p>
        </div>
      </main>
    );
  }

  if (!drop) {
    return (
      <main className="drop-details-page">
        <div className="drop-not-found">
          <h1>{error ? "Unable to Load Drop" : "Drop Not Found"}</h1>
          <p>{error || "The fashion drop you're looking for doesn't exist."}</p>
          <Link to="/businesses/modadrop" className="drop-back-button">
            <ArrowLeft size={18} />
            Back to ModaDrop
          </Link>
        </div>
      </main>
    );
  }

  const eventSchedule = `${new Date(drop.startTime).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })}${drop.endTime ? ` – ${new Date(drop.endTime).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })}` : ""}`;

  return (
    <main className="drop-details-page">
      <div className="drop-details-container">
        <Link to="/businesses/modadrop" className="drop-back-link">
          <ArrowLeft size={18} />
          Back to ModaDrop
        </Link>

        <section className="drop-product">
          <div className="drop-product-image">
            <img
              src={selectedProduct?.images?.[0]?.url || drop.coverImage?.url}
              alt={selectedProduct?.name || drop.title}
            />
            <span
              className={`drop-product-status ${
                dropStatus === "Pre-order Open" ? "open" : ""
              }`}
            >
              {dropStatus}
            </span>
          </div>

          <div className="drop-product-content">
            <p className="drop-label">{drop.title}</p>
            <h1>{selectedProduct?.name || drop.title}</h1>
            <p className="drop-description">
              {selectedProduct?.description || drop.description}
            </p>

            {products.length > 1 && (
              <div>
                <label htmlFor="drop-product">Products in this drop</label>
                <select
                  id="drop-product"
                  value={selectedProduct?._id || ""}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                >
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} — ₹{product.price}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedProduct && (
              <div className="drop-price">₹{selectedProduct.price}</div>
            )}

            <div className="drop-availability">
              <Clock size={18} />
              <div>
                <span>DROP AVAILABILITY</span>
                <strong>
                  {isUpcoming
                    ? `Starts ${eventSchedule}`
                    : isLive
                      ? isSoldOut
                        ? `Event ends ${drop.endTime ? eventSchedule.split(" – ")[1] : "when inventory is sold out"}`
                        : `${selectedProduct.dropStock} available · Event ends ${drop.endTime ? eventSchedule.split(" – ")[1] : "as scheduled"}`
                      : `Event ended ${eventSchedule}`}
                </strong>
              </div>
            </div>

            <div className="drop-features">
              <div>
                <Package size={18} />
                <span>Limited production</span>
              </div>
              <div>
                <ShoppingBag size={18} />
                <span>Direct from creators</span>
              </div>
            </div>

            {isLive && selectedProduct && !isSoldOut ? (
              <>
                <div className="drop-quantity">
                  <span>Quantity</span>
                  <div className="quantity-controls">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((current) => Math.max(current - 1, 1))
                      }
                    >
                      −
                    </button>
                    <strong>{quantity}</strong>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((current) =>
                          Math.min(current + 1, selectedProduct.dropStock)
                        )
                      }
                      disabled={quantity >= selectedProduct.dropStock}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="drop-preorder-button"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                  <ArrowLeft size={18} className="arrow-right" />
                </button>
                {addToCartError && (
                  <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "8px" }}>
                    {addToCartError}
                  </p>
                )}
              </>
            ) : isLive && isSoldOut ? (
              waitlistJoined ? (
                <div className="drop-coming-soon">
                  <Package size={19} />
                  <div>
                    <strong>You're on the waitlist</strong>
                    {waitlistPosition !== null && (
                      <span>Your position: #{waitlistPosition}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="drop-coming-soon">
                    <Package size={19} />
                    This drop is currently sold out.
                  </div>
                  <button
                    type="button"
                    className="drop-preorder-button"
                    onClick={handleJoinWaitlist}
                    disabled={joiningWaitlist}
                  >
                    {joiningWaitlist ? "Joining Waitlist..." : "Join Waitlist"}
                    <ArrowLeft size={18} className="arrow-right" />
                  </button>
                </div>
              )
            ) : isUpcoming ? (
              <div>
                <div className="drop-coming-soon">
                  <Clock size={19} />
                  Purchases open when the event starts.
                </div>
                <button
                  type="button"
                  className="drop-preorder-button"
                  onClick={handleEventWaitlist}
                  disabled={joiningEventWaitlist}
                >
                  {joiningEventWaitlist
                    ? "Updating Waitlist..."
                    : eventWaitlistJoined
                      ? "Leave Event Waitlist"
                      : "Join Event Waitlist"}
                  <ArrowLeft size={18} className="arrow-right" />
                </button>
              </div>
            ) : (
              <div className="drop-coming-soon">
                <Clock size={19} />
                This ModaDrop event has ended.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default DropDetails;
