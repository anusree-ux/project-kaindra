import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import "./DropDetails.css";

const drops = [
  {
    id: "1",
    name: "Urban Future",
    category: "Streetwear",
    description:
      "Limited streetwear pieces designed for the next generation.",
    image:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1400&q=85",
    status: "Coming Soon",
    price: 2499,
    available: "September 25, 2026",
    details:
      "A limited streetwear collection combining relaxed silhouettes, contemporary details, and urban styling.",
  },
  {
    id: "2",
    name: "Heritage Reimagined",
    category: "Ethnic & Cultural",
    description:
      "Traditional craftsmanship redesigned for modern fashion.",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=85",
    status: "Pre-order Open",
    price: 3499,
    available: "Pre-order available",
    details:
      "A contemporary interpretation of traditional craftsmanship, created for modern wardrobes while retaining cultural character.",
  },
  {
    id: "3",
    name: "Future Form",
    category: "Avant-Garde",
    description:
      "Experimental silhouettes combining technology and fashion.",
    image:
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1400&q=85",
    status: "Coming Soon",
    price: 4999,
    available: "October 5, 2026",
    details:
      "Experimental fashion built around unconventional silhouettes and futuristic design language.",
  },
];

function DropDetails() {
 const { dropId } = useParams();

  const [apiDrop, setApiDrop] = useState(null);
  const [loadingDrop, setLoadingDrop] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [preOrdered, setPreOrdered] = useState(false);
  const [preOrderNumber, setPreOrderNumber] = useState("");

  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState(null);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  const placeholderDrop = drops.find(
    (item) => String(item.id) === String(dropId)
  );

  const drop = apiDrop || placeholderDrop;

  const isRealDrop = Boolean(apiDrop);

  useEffect(() => {
    const fetchDrop = async () => {
      try {
        setLoadingDrop(true);

        const [upcomingResponse, liveResponse] =
          await Promise.all([
            fetch("/api/modasphere/drops/products/upcoming"),
            fetch("/api/modasphere/drops/products/live"),
          ]);

        const upcomingResult = await upcomingResponse.json();
        const liveResult = await liveResponse.json();

        if (
          !upcomingResponse.ok ||
          upcomingResult.status !== "success"
        ) {
          throw new Error(
            upcomingResult.message ||
              "Failed to fetch upcoming drops"
          );
        }

        if (
          !liveResponse.ok ||
          liveResult.status !== "success"
        ) {
          throw new Error(
            liveResult.message ||
              "Failed to fetch live drops"
          );
        }

        const upcoming =
          upcomingResult.data?.products || [];

        const live =
          liveResult.data?.products || [];

        const products = [...upcoming, ...live];

        const matchedProduct = products.find(
          (product) =>
            String(product._id) === String(dropId)
        );

        setApiDrop(matchedProduct || null);
      } catch (error) {
        console.error(
          "Unable to load ModaDrop details:",
          error
        );

        setApiDrop(null);
      } finally {
        setLoadingDrop(false);
      }
    };

    fetchDrop();
  }, [dropId]);

  useEffect(() => {
    if (!apiDrop || !apiDrop.isDrop || apiDrop.dropStock > 0) {
      return;
    }

    const accessToken = localStorage.getItem("token");

    if (!accessToken) {
      return;
    }

    const fetchWaitlistPosition = async () => {
      try {
        const response = await fetch(
          `/api/modasphere/drops/products/${apiDrop._id}/waitlist/position`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const result = await response.json();

        if (
          response.ok &&
          result.status === "success"
        ) {
          setWaitlistJoined(true);
          setWaitlistPosition(
            result.data?.position ?? null
          );
        }
      } catch (error) {
        console.error(
          "Unable to check ModaDrop waitlist position:",
          error
        );
      }
    };

    fetchWaitlistPosition();
  }, [apiDrop]);


  if (loadingDrop) {
    return (
      <main className="drop-details-page">
        <div className="drop-not-found">
          <h1>Loading Drop...</h1>
          <p>
            Please wait while we load the drop details.
          </p>
        </div>
      </main>
    );
  }

  if (!drop) {
    return (
      <main className="drop-details-page">
        <div className="drop-not-found">
          <h1>Drop Not Found</h1>

          <p>
            The fashion drop you're looking for doesn't exist.
          </p>

          <Link
            to="/businesses/modadrop"
            className="drop-back-button"
          >
            <ArrowLeft size={18} />
            Back to ModaDrop
          </Link>
        </div>
      </main>
    );
  }

  const isUpcoming =
  isRealDrop &&
  drop.dropReleaseAt &&
  new Date(drop.dropReleaseAt) > new Date();

  const isSoldOut =
    isRealDrop &&
    drop.dropStock <= 0;

  const dropStatus = isRealDrop
    ? isUpcoming
      ? "Coming Soon"
      : isSoldOut
      ? "Sold Out"
      : "Pre-order Open"
    : drop?.status;

  const increaseQuantity = () => {
    setQuantity((current) => {
      if (isRealDrop) {
        return Math.min(current + 1, drop.dropStock);
      }

      return current + 1;
    });
  };

  const decreaseQuantity = () => {
    setQuantity((current) =>
      current > 1 ? current - 1 : 1
    );
  };

  const handlePreOrder = async () => {
    if (isRealDrop) {
      try {
        const accessToken = localStorage.getItem("token");

        if (!accessToken) {
          alert("Please log in to add this drop to your cart.");
          return;
        }

        const response = await fetch("/api/modasphere/cart/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productId: drop._id,
            quantity,
          }),
        });

        const result = await response.json();

        if (!response.ok || result.status !== "success") {
          throw new Error(
            result.message || "Failed to add the drop to your cart."
          );
        }

        alert("Drop added to your cart.");
      } catch (error) {
        console.error("Unable to add ModaDrop to cart:", error);
        alert(error.message || "Failed to add the drop to your cart.");
      }

      return;
    }

    if (dropStatus !== "Pre-order Open") {
      return;
    }

    const existingOrders = JSON.parse(
      localStorage.getItem("modadropOrders") || "[]"
    );

    const orderNumber = `DROP-${1001 + existingOrders.length}`;

    const newOrder = {
      orderNumber,
      dropId: drop.id,
      dropName: drop.name,
      category: drop.category,
      description: drop.description,
      image: drop.image,
      price: drop.price,
      quantity,
      total: drop.price * quantity,
      status: "Pre-order Placed",
    };

    localStorage.setItem(
      "modadropOrders",
      JSON.stringify([
        ...existingOrders,
        newOrder,
      ])
    );

    setPreOrderNumber(orderNumber);
    setPreOrdered(true);
  };
  const handleJoinWaitlist = async () => {
    if (!isRealDrop || !isSoldOut) {
      return;
    }

    try {
      const accessToken = localStorage.getItem("token");

      if (!accessToken) {
        alert("Please log in to join the waitlist.");
        return;
      }

      setJoiningWaitlist(true);

      const response = await fetch(
        `/api/modasphere/drops/products/${drop._id}/waitlist`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(
          result.message || "Failed to join the waitlist."
        );
      }

      setWaitlistJoined(true);

      // Fetch the user's position after successfully joining.
      const positionResponse = await fetch(
        `/api/modasphere/drops/products/${drop._id}/waitlist/position`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const positionResult = await positionResponse.json();

      if (
        positionResponse.ok &&
        positionResult.status === "success"
      ) {
        setWaitlistPosition(positionResult.data?.position ?? null);
      }
    } catch (error) {
      console.error(
        "Unable to join ModaDrop waitlist:",
        error
      );

      alert(
        error.message || "Failed to join the waitlist."
      );
    } finally {
      setJoiningWaitlist(false);
    }
  };

  if (preOrdered) {
    return (
      <main className="drop-details-page">
        <section className="drop-success">
          <div className="drop-success-icon">
            <Package size={35} />
          </div>

          <p className="drop-label">MODADROP</p>

          <h1>Pre-order Confirmed</h1>

          <p>
            Your pre-order for{" "}
            <strong>{drop.name}</strong> has been
            successfully placed.
          </p>

          <div className="drop-success-info">
            <div>
              <span>Order Number</span>
              <strong>{preOrderNumber}</strong>
            </div>

            <div>
              <span>Quantity</span>
              <strong>{quantity}</strong>
            </div>

            <div>
              <span>Total</span>
              <strong>
                ₹{drop.price * quantity}
              </strong>
            </div>
          </div>

          <div className="drop-success-actions">
            <Link
              to="/businesses/modadrop"
              className="drop-primary-button"
            >
              Back to ModaDrop
            </Link>

            <Link
              to="/businesses/modadrop/orders"
              className="drop-secondary-button"
            >
              View Pre-orders
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="drop-details-page">
      <div className="drop-details-container">

        <Link
          to="/businesses/modadrop"
          className="drop-back-link"
        >
          <ArrowLeft size={18} />
          Back to ModaDrop
        </Link>

        <section className="drop-product">

          <div className="drop-product-image">
            <img
              src={drop.images?.[0] || drop.image}
              alt={drop.name}
            />

            <span
              className={`drop-product-status ${
                dropStatus === "Pre-order Open"
                  ? "open"
                  : ""
              }`}
            >
              {dropStatus}
            </span>
          </div>

          <div className="drop-product-content">

            <p className="drop-label">
              {drop.category}
            </p>

            <h1>{drop.name}</h1>

            <p className="drop-description">
              {drop.details || drop.description}
            </p>

            <div className="drop-price">
              ₹{drop.price}
            </div>

            <div className="drop-availability">
              <Clock size={18} />

              <div>
                <span>DROP AVAILABILITY</span>

                <strong>
                  {isRealDrop
                    ? isUpcoming
                      ? `Releases ${new Date(
                          drop.dropReleaseAt
                        ).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}`
                      : isSoldOut
                      ? "Currently sold out"
                      : `${drop.dropStock} available`
                    : drop.available}
                </strong>
              </div>
            </div>

            <div className="drop-features">
              <div>
                <Package size={18} />

                <span>
                  Limited production
                </span>
              </div>

              <div>
                <ShoppingBag size={18} />

                <span>
                  Direct from creators
                </span>
              </div>
            </div>

            {dropStatus === "Pre-order Open" ? (
              <>
                <div className="drop-quantity">
                  <span>Quantity</span>

                  <div className="quantity-controls">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                    >
                      −
                    </button>

                    <strong>{quantity}</strong>

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      disabled={
                        isRealDrop &&
                        quantity >= drop.dropStock
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="drop-preorder-button"
                  onClick={handlePreOrder}
                >
                  {isRealDrop
                    ? "Add to Cart"
                    : "Pre-order Now"}

                  <ArrowLeft
                    size={18}
                    className="arrow-right"
                  />
                </button>
              </>
            ) : dropStatus === "Sold Out" && isRealDrop ? (
              waitlistJoined ? (
                <div className="drop-coming-soon">
                  <Package size={19} />

                  <div>
                    <strong>You're on the waitlist</strong>

                    {waitlistPosition !== null && (
                      <span>
                        Your position: #{waitlistPosition}
                      </span>
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
                    {joiningWaitlist
                      ? "Joining Waitlist..."
                      : "Join Waitlist"}

                    <ArrowLeft
                      size={18}
                      className="arrow-right"
                    />
                  </button>
                </div>
              )
            ) : (
              <div className="drop-coming-soon">
                <Clock size={19} />
                Pre-orders will open soon
              </div>
            )}

          </div>
        </section>
      </div>
    </main>
  );
}

export default DropDetails;