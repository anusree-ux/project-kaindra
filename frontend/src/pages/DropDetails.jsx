import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import "./DropDetails.css";

function DropDetails() {
  const { dropId } = useParams();
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

  useEffect(() => {
    const fetchDrop = async () => {
      try {
        setLoadingDrop(true);
        setError("");
        setDrop(null);

        const response = await fetch(`/api/modasphere/drops/${dropId}`);
        const result = await response.json();
        if (!response.ok || result.status !== "success") {
          throw new Error(result.message || "Failed to fetch ModaDrop event.");
        }

        const event = result.data?.drop;
        setDrop(event || null);
        setSelectedProductId(
          event?.productIds?.find((product) => product?.status === "active")
            ?._id || ""
        );
      } catch (fetchError) {
        console.error("Unable to load ModaDrop event:", fetchError);
        setError(fetchError.message || "Failed to load ModaDrop event.");
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
    if (!selectedProduct?.isDrop || !isSoldOut) {
      return;
    }

    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      return;
    }

    const fetchWaitlistPosition = async () => {
      try {
        const response = await fetch(
          `/api/modasphere/drops/products/${selectedProduct._id}/waitlist/position`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const result = await response.json();
        if (response.ok && result.status === "success") {
          setWaitlistJoined(true);
          setWaitlistPosition(result.data?.position ?? null);
        } else if (response.status !== 404) {
          throw new Error(result.message || "Failed to fetch waitlist position.");
        }
      } catch (fetchError) {
        console.error("Unable to check ModaDrop waitlist position:", fetchError);
      }
    };

    fetchWaitlistPosition();
  }, [selectedProduct, isSoldOut]);

  const handleAddToCart = async () => {
    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      alert("Please log in to add this drop to your cart.");
      return;
    }

    try {
      const response = await fetch("/api/modasphere/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId: selectedProduct._id,
          quantity,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to add the drop to your cart.");
      }
      alert("Drop added to your cart.");
    } catch (requestError) {
      console.error("Unable to add ModaDrop to cart:", requestError);
      alert(requestError.message || "Failed to add the drop to your cart.");
    }
  };

  const handleJoinWaitlist = async () => {
    if (!selectedProduct || !isSoldOut) {
      return;
    }

    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      alert("Please log in to join the waitlist.");
      return;
    }

    try {
      setJoiningWaitlist(true);
      const response = await fetch(
        `/api/modasphere/drops/products/${selectedProduct._id}/waitlist`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to join the waitlist.");
      }

      setWaitlistJoined(true);
      const positionResponse = await fetch(
        `/api/modasphere/drops/products/${selectedProduct._id}/waitlist/position`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const positionResult = await positionResponse.json();
      if (!positionResponse.ok || positionResult.status !== "success") {
        throw new Error(
          positionResult.message || "Joined, but could not fetch waitlist position."
        );
      }
      setWaitlistPosition(positionResult.data?.position ?? null);
    } catch (requestError) {
      console.error("Unable to join ModaDrop waitlist:", requestError);
      alert(requestError.message || "Failed to join the waitlist.");
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const handleEventWaitlist = async () => {
    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      alert("Please log in to join the event waitlist.");
      return;
    }

    try {
      setJoiningEventWaitlist(true);
      const response = await fetch(
        `/api/modasphere/drops/${drop._id}/waitlist`,
        {
          method: eventWaitlistJoined ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to update event waitlist.");
      }
      setEventWaitlistJoined(!eventWaitlistJoined);
    } catch (requestError) {
      console.error("Unable to update event waitlist:", requestError);
      alert(requestError.message || "Failed to update event waitlist.");
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
