import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Package, ShoppingBag } from "lucide-react";
import { useState } from "react";
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

  const drop = drops.find(
    (item) => String(item.id) === String(dropId)
  );

  const [quantity, setQuantity] = useState(1);
  const [preOrdered, setPreOrdered] = useState(false);
  const [preOrderNumber, setPreOrderNumber] = useState("");
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

  const increaseQuantity = () => {
    setQuantity((current) => current + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((current) =>
      current > 1 ? current - 1 : 1
    );
  };

  const handlePreOrder = () => {
  if (drop.status !== "Pre-order Open") {
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
              src={drop.image}
              alt={drop.name}
            />

            <span
              className={`drop-product-status ${
                drop.status === "Pre-order Open"
                  ? "open"
                  : ""
              }`}
            >
              {drop.status}
            </span>
          </div>

          <div className="drop-product-content">

            <p className="drop-label">
              {drop.category}
            </p>

            <h1>{drop.name}</h1>

            <p className="drop-description">
              {drop.details}
            </p>

            <div className="drop-price">
              ₹{drop.price}
            </div>

            <div className="drop-availability">
              <Clock size={18} />

              <div>
                <span>DROP AVAILABILITY</span>

                <strong>
                  {drop.available}
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

            {drop.status === "Pre-order Open" ? (
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
                  Pre-order Now
                  <ArrowLeft
                    size={18}
                    className="arrow-right"
                  />
                </button>
              </>
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