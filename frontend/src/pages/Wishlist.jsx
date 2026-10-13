import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, ArrowLeft, Loader2, Sparkles, Trash2 } from "lucide-react";
import apiClient from "../services/apiClient";
import "./Wishlist.css";

function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem("modamartCart") || "[]");
  });

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/api/modasphere/wishlist");
      setWishlistItems(res.data?.data?.wishlist || []);
    } catch (err) {
      console.error("Failed to load wishlist:", err);
      setError("Unable to load your saved favorites. Please log in or try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (productId) => {
    // Optimistically remove from state
    setWishlistItems((prev) => prev.filter((p) => (p._id || p.id) !== productId));

    try {
      await apiClient.delete(`/api/modasphere/wishlist/${productId}`);
    } catch (err) {
      console.error("Failed to remove item from wishlist:", err);
      // Refresh to sync if failed
      fetchWishlist();
    }
  };

  const addToCart = (product) => {
    setCart((currentCart) => {
      const productId = product._id || product.id;
      const existingProduct = currentCart.find(
        (item) => String(item.id || item._id) === String(productId)
      );

      const productImage =
        product.images?.[0]?.url ||
        (typeof product.images?.[0] === "string" ? product.images[0] : "") ||
        product.image ||
        "";

      const brandName =
        product.sellerId?.name || product.brand || "ModaSphere Studio";

      let updatedCart;

      if (existingProduct) {
        updatedCart = currentCart.map((item) =>
          String(item.id || item._id) === String(productId)
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      } else {
        updatedCart = [
          ...currentCart,
          {
            id: productId,
            _id: productId,
            name: product.name,
            price: product.price,
            category: product.category,
            brand: brandName,
            image: productImage,
            images: product.images,
            quantity: 1,
          },
        ];
      }

      localStorage.setItem("modamartCart", JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  return (
    <main className="wishlist-page">
      {/* HEADER SECTION */}
      <section className="wishlist-hero">
        <div className="wishlist-container">
          <Link to="/businesses/modamart" className="wishlist-back-link">
            <ArrowLeft size={16} /> Back to ModaMart
          </Link>

          <div className="wishlist-header-content">
            <div className="wishlist-badge">
              <Sparkles size={14} /> MY FAVORITES
            </div>
            <h1>Saved Wishlist</h1>
            <p>
              Your curated collection of saved fashion styles, accessories, and runway essentials.
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="wishlist-content-section">
        <div className="wishlist-container">
          <div className="wishlist-bar">
            <h2>
              Saved Items ({wishlistItems.length})
            </h2>

            <Link to="/businesses/modamart/cart" className="wishlist-cart-link">
              <ShoppingBag size={18} />
              <span>Cart ({cart.reduce((total, item) => total + item.quantity, 0)})</span>
            </Link>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="wishlist-loading-state">
              <Loader2 className="spinner" size={32} />
              <p>Loading your saved fashion pieces...</p>
            </div>
          )}

          {/* ERROR STATE */}
          {!loading && error && (
            <div className="wishlist-empty-card">
              <Heart size={42} className="empty-icon" />
              <h3>Sign in to view your wishlist</h3>
              <p>{error}</p>
              <div className="empty-actions">
                <Link to="/login" className="wishlist-primary-btn">
                  Sign In
                </Link>
                <Link to="/businesses/modamart" className="wishlist-secondary-btn">
                  Explore Marketplace
                </Link>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && !error && wishlistItems.length === 0 && (
            <div className="wishlist-empty-card">
              <Heart size={44} className="empty-icon" />
              <h3>Your wishlist is currently empty</h3>
              <p>
                Browse through ModaMart and tap the heart icon on any design to save it here for later.
              </p>
              <Link to="/businesses/modamart" className="wishlist-primary-btn">
                Discover ModaMart
              </Link>
            </div>
          )}

          {/* PRODUCT GRID */}
          {!loading && !error && wishlistItems.length > 0 && (
            <div className="wishlist-products-grid">
              {wishlistItems.map((product) => {
                const productId = product._id || product.id;
                const imageUrl =
                  product.images?.[0]?.url ||
                  (typeof product.images?.[0] === "string"
                    ? product.images[0]
                    : "") ||
                  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80";

                const brandName =
                  product.sellerId?.name || product.brand || "ModaSphere Studio";

                return (
                  <article className="wishlist-product-card" key={productId}>
                    <div className="wishlist-image-wrapper">
                      <Link to={`/businesses/modamart/product/${productId}`}>
                        <img
                          src={imageUrl}
                          alt={product.name}
                          loading="lazy"
                        />
                      </Link>

                      <button
                        className="wishlist-remove-btn"
                        onClick={() => removeFromWishlist(productId)}
                        title="Remove from wishlist"
                      >
                        <Heart size={18} fill="currentColor" />
                      </button>
                    </div>

                    <div className="wishlist-product-info">
                      <span className="product-brand">{brandName}</span>

                      <h3>
                        <Link
                          to={`/businesses/modamart/product/${productId}`}
                          className="product-title-link"
                        >
                          {product.name}
                        </Link>
                      </h3>

                      <p className="product-category-tag">
                        {product.category}
                      </p>

                      <div className="wishlist-card-bottom">
                        <strong className="product-price">
                          ₹{product.price?.toLocaleString("en-IN")}
                        </strong>

                        <button
                          className="wishlist-add-cart-btn"
                          onClick={() => addToCart(product)}
                        >
                          <ShoppingBag size={15} /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Wishlist;
