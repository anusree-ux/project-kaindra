import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import products from "../data/products";
import "./Cart.css";

function Cart() {
  const [cart, setCart] = useState(() => {
  return JSON.parse(localStorage.getItem("modamartCart") || "[]");
});

  const updateCart = (id, change) => {
    const updatedCart = cart
      .map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              quantity: Math.max(1, item.quantity + change),
            }
          : item
      );

    setCart(updatedCart);
    localStorage.setItem("modamartCart", JSON.stringify(updatedCart));
  };

  const removeItem = (id) => {
    const updatedCart = cart.filter(
      (item) => String(item.id) !== String(id)
    );

    setCart(updatedCart);
    localStorage.setItem("modamartCart", JSON.stringify(updatedCart));
  };

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const delivery = subtotal > 0 ? 99 : 0;

  const total = subtotal + delivery;

  if (cart.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-empty">
          <ShoppingBag size={48} />

          <h1>Your Cart is Empty</h1>

          <p>
            Add some products from ModaMart to continue shopping.
          </p>

          <Link
            to="/businesses/modamart/shop"
            className="continue-shopping"
          >
            <ArrowLeft size={18} />
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-container">

        <Link
          to="/businesses/modamart/shop"
          className="cart-back-link"
        >
          <ArrowLeft size={18} />
          Continue Shopping
        </Link>

        <div className="cart-heading">
          <div>
            <span>MODAMART</span>
            <h1>Your Cart</h1>
          </div>

          <p>
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="cart-layout">

          {/* Cart Items */}

          <section className="cart-items">

            {cart.map((item) => (
              <article className="cart-item" key={item.id}>

               <div className="cart-item-image">
  <img
    src={
      item.image ||
      products.find(
        (product) =>
          String(product.id) === String(item.id)
      )?.images?.[0]
    }
    alt={item.image || item.images?.[0]}
    onError={(event) => {
      const product = products.find(
        (productItem) =>
          String(productItem.id) === String(item.id)
      );

      const fallbackImage = product?.images?.[0];

      if (
        fallbackImage &&
        event.currentTarget.src !== fallbackImage
      ) {
        event.currentTarget.src = fallbackImage;
      }
    }}
  />
</div>
                <div className="cart-item-info">

                  <span>{item.category}</span>

                  <h2>{item.name}</h2>

                  <p>by {item.brand}</p>

                  <strong>
                    ₹{item.price.toLocaleString("en-IN")}
                  </strong>

                  <div className="cart-item-actions">

                    <div className="cart-quantity">

                      <button
                        type="button"
                        onClick={() => updateCart(item.id, -1)}
                      >
                        <Minus size={15} />
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() => updateCart(item.id, 1)}
                      >
                        <Plus size={15} />
                      </button>

                    </div>

                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>

                  </div>

                </div>

                <div className="cart-item-total">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </div>

              </article>
            ))}

          </section>

          {/* Summary */}

          <aside className="cart-summary">

            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>
                ₹{subtotal.toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <strong>
                ₹{delivery.toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Total</span>
              <strong>
                ₹{total.toLocaleString("en-IN")}
              </strong>
            </div>

           <Link
  to="/businesses/modamart/checkout"
  className="checkout-button"
>
  Proceed to Checkout
</Link>

            <p className="secure-text">
              Secure checkout powered by ModaSphere
            </p>

          </aside>

        </div>
      </div>
    </main>
  );
}

export default Cart;