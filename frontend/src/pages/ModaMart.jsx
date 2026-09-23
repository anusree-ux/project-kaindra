import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import apiClient from "../services/apiClient";
import "./ModaMart.css";

function ModaMart() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem("modamartCart") || "[]");
  });

  const categories = [
    "All",
    "Apparel",
    "Ethnic",
    "Accessories",
    "Footwear",
    "Men",
    "Women",
    "Streetwear",
  ];

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
          const catLower = category.toLowerCase();
          // If category is a standard DB category
          if (["apparel", "ethnic", "accessories", "footwear", "beauty", "jewelry", "home", "other"].includes(catLower)) {
            params.category = catLower;
          } else {
            // Otherwise filter by tag (e.g. men, women, streetwear)
            params.tag = catLower;
          }
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
  }, [search, category]);

  const toggleWishlist = (id) => {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
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
    <main className="modamart-page">
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
                <span>
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              </Link>

              <button className="modamart-wishlist">
                <Heart size={19} />
                <span>{wishlist.length}</span>
              </button>
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

          {/* RESULT COUNT */}
          <div className="modamart-result">
            <p>
              {loading
                ? "Loading products..."
                : `${products.length} product${products.length === 1 ? "" : "s"} available`}
            </p>
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
                  product.sellerId?.name || product.brand || "ModaSphere Studio";

                return (
                  <article className="modamart-product-card" key={productId}>
                    <div className="product-image-wrapper">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                      />

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
                        {product.category}
                      </p>

                      <div className="product-bottom">
                        <strong>
                          ₹{product.price?.toLocaleString("en-IN")}
                        </strong>

                        <button onClick={() => addToCart(product)}>
                          Add to Cart
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