import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ModaMartSlideshow from "./brands/ModaSphere/ModaMartSlideshow/ModaMartSlideshow";
import {
  Heart,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  MODAMART_CATEGORIES,
  getCategoryValue,
  getCategoryLabel,
} from "../constants/categories";
import "./ModaMart.css";

function ModaMart() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { cartCount, addToCart: addToCartContext } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [wishlist, setWishlist] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const categories = MODAMART_CATEGORIES;

  // Fetch real products from backend
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (search.trim()) {
          params.search = search.trim();
        }
        if (category !== "All") {
          const catVal = getCategoryValue(category);
          if (catVal) {
            params.category = catVal;
          }
        }
        if (sort) {
          params.sort = sort;
        }

        const response = await apiClient.get("/api/modasphere/products", { params });
        if (isMounted) {
          const fetchedList = response.data?.data?.products || [];
          setProducts(fetchedList);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching ModaMart products:", err);
          setError("Failed to load products. Please try again.");
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [search, category, sort]);

  // Fetch user wishlist on mount
  useEffect(() => {
    let isMounted = true;
    const fetchUserWishlist = async () => {
      try {
        const res = await apiClient.get("/api/modasphere/wishlist");
        if (isMounted) {
          const items = res.data?.data?.wishlist || [];
          const ids = items.map((p) => p._id || p.id).filter(Boolean);
          setWishlist(ids);
        }
      } catch (err) {
        // If not logged in or error, silent fail
        console.debug("User not logged in or wishlist fetch skipped", err);
      }
    };

    fetchUserWishlist();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleWishlist = async (productId) => {
    if (!productId) return;
    const isCurrentlyWishlisted = wishlist.includes(productId);

    // Optimistic UI update
    setWishlist((current) =>
      isCurrentlyWishlisted
        ? current.filter((item) => item !== productId)
        : [...current, productId]
    );

    try {
      if (isCurrentlyWishlisted) {
        await apiClient.delete(`/api/modasphere/wishlist/${productId}`);
      } else {
        await apiClient.post(`/api/modasphere/wishlist/${productId}`);
      }
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      // Revert optimistic update on failure
      setWishlist((current) =>
        isCurrentlyWishlisted
          ? [...current, productId]
          : current.filter((item) => item !== productId)
      );
    }
  };

  const addToCart = async (product) => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    const productId = product._id || product.id;
    setAddingId(productId);
    setToastMessage("");

    const result = await addToCartContext(productId, 1);
    setAddingId(null);

    if (result.success) {
      setToastMessage(`${product.name} added to cart!`);
      setTimeout(() => setToastMessage(""), 3000);
    } else {
      setToastMessage(result.message || "Failed to add to cart.");
      setTimeout(() => setToastMessage(""), 4000);
    }
  };

  return (
    <main className="modamart-page">
      {/* MODAMART FASHION SLIDESHOW */}
    <ModaMartSlideshow />
      {/* HERO */}
      <section className="modamart-hero">
        <div className="modamart-container">
          <div className="modamart-hero-content">
            <span>MODAMART</span>

            <h1>
              Discover Fashion.
              <br />
              Shop Without Limits.
            </h1>

            <p>
              Explore fashion from designers, brands and creators across the
              ModaSphere ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* SHOP HEADER */}
      <section className="modamart-shop">
        <div className="modamart-container">
          {toastMessage && (
            <div
              style={{
                background: "#111",
                color: "#fff",
                padding: "12px 20px",
                borderRadius: "6px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "14px",
                fontWeight: 500,
                borderLeft: "4px solid #c9964a",
              }}
            >
              <span>{toastMessage}</span>
              <button
                onClick={() => setToastMessage("")}
                style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          )}

          <div className="modamart-shop-top">
            <div>
              <span className="modamart-label">SHOP MODASPHERE</span>
              <h2>Fashion Marketplace</h2>
            </div>

            <div className="modamart-shop-actions">
              <div className="modamart-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search fashion..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Link to="/businesses/modamart/cart" className="modamart-cart">
                <ShoppingBag size={19} />
                <span>{cartCount}</span>
              </Link>

              <Link
                to="/businesses/modamart/wishlist"
                className="modamart-wishlist"
                title="View Saved Wishlist"
              >
                <Heart size={19} />
                <span>{wishlist.length}</span>
              </Link>
            </div>
          </div>

          {/* FILTERS */}
          <div className="modamart-filters">
            <div className="filter-title">
              <SlidersHorizontal size={17} />
              Categories
            </div>

            <div className="category-buttons">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "active-category" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* RESULT COUNT & SORT */}
          <div className="modamart-result" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p>
              {loading
                ? "Loading products..."
                : `${products.length} product${products.length === 1 ? "" : "s"} available`}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ArrowUpDown size={15} style={{ color: "#777" }} />
              <label htmlFor="modamart-sort" style={{ fontSize: "13px", color: "#666", fontWeight: 500 }}>
                Sort:
              </label>
              <select
                id="modamart-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d8d5ce",
                  backgroundColor: "#fff",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  color: "#111",
                  outline: "none",
                }}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* LOADING SKELETON */}
          {loading && (
            <div className="modamart-products">
              {[1, 2, 3, 4, 5, 6].map((sk) => (
                <article
                  className="modamart-product-card skeleton-card"
                  key={sk}
                >
                  <div
                    className="product-image-wrapper"
                    style={{
                      background:
                        "linear-gradient(90deg, #ece9e2 25%, #f6f4ee 50%, #ece9e2 75%)",
                      backgroundSize: "200% 100%",
                      animation: "skeletonShimmer 1.5s infinite",
                    }}
                  />
                  <div className="product-info">
                    <div
                      style={{
                        height: 12,
                        width: "40%",
                        background: "#e4e1da",
                        marginBottom: 10,
                        borderRadius: 3,
                      }}
                    />
                    <div
                      style={{
                        height: 20,
                        width: "80%",
                        background: "#e4e1da",
                        marginBottom: 10,
                        borderRadius: 3,
                      }}
                    />
                    <div
                      style={{
                        height: 14,
                        width: "50%",
                        background: "#e4e1da",
                        marginBottom: 20,
                        borderRadius: 3,
                      }}
                    />
                    <div
                      style={{
                        height: 24,
                        width: "30%",
                        background: "#e4e1da",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* ERROR STATE */}
          {!loading && error && (
            <div className="no-products">
              <h3>Unable to load products</h3>
              <p>{error}</p>
            </div>
          )}

          {/* PRODUCTS LIST */}
          {!loading && !error && (
            <div className="modamart-products">
              {products.map((product) => {
                const productId = product._id || product.id;
                const imageUrl =
                  product.images?.[0]?.url ||
                  (typeof product.images?.[0] === "string"
                    ? product.images[0]
                    : "") ||
                  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80";

                const brandName =
                  product.sellerId?.businessName ||
                  product.sellerId?.shopName ||
                  product.brand ||
                  product.shopName ||
                  product.sellerId?.name ||
                  "ModaSphere Studio";

                return (
                  <article className="modamart-product-card" key={productId}>
                    <div className="product-image-wrapper">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                      />

                      {product.isDrop && (
                        <span
                          style={{
                            position: "absolute",
                            top: "15px",
                            left: "15px",
                            backgroundColor: "#111",
                            color: "#c9964a",
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            borderRadius: "4px",
                            textTransform: "uppercase",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                            zIndex: 2,
                          }}
                        >
                          ModaDrop
                        </span>
                      )}

                      <button
                        className="product-wishlist"
                        onClick={() => toggleWishlist(productId)}
                      >
                        <Heart
                          size={19}
                          fill={
                            wishlist.includes(productId)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>

                    <div className="product-info">
                      <span>{brandName}</span>

                      <h3>
                        <Link
                          to={`/businesses/modamart/product/${productId}`}
                          className="product-name-link"
                        >
                          {product.name}
                        </Link>
                      </h3>

                      <p className="product-category" style={{ textTransform: "capitalize" }}>
                        {getCategoryLabel(product.category)}
                      </p>

                      <div className="product-bottom">
                        <strong>
                          ₹{product.price?.toLocaleString("en-IN")}
                        </strong>

                        <button
                          onClick={() => addToCart(product)}
                          disabled={addingId === productId}
                        >
                          {addingId === productId ? "Adding..." : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && !error && products.length === 0 && (
            <div className="no-products">
              <Search size={35} />
              <h3>No products found</h3>
              <p>
                Try another search or select a different category.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default ModaMart;