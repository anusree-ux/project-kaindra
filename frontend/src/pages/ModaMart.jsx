import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";

import products from "../data/products";
import "./ModaMart.css";

function ModaMart() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState(() => {
  return JSON.parse(localStorage.getItem("modamartCart") || "[]");
});
  const categories = [
    "All",
    "Men",
    "Women",
    "Streetwear",
    "Ethnic",
    "Accessories",
    "Footwear",
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.brand.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || product.category === category;

      return matchesSearch && matchesCategory;
    });
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
    const existingProduct = currentCart.find(
      (item) => String(item.id) === String(product.id)
    );

    let updatedCart;

    if (existingProduct) {
      updatedCart = currentCart.map((item) =>
        String(item.id) === String(product.id)
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
          ...product,
          quantity: 1,
        },
      ];
    }

    localStorage.setItem(
      "modamartCart",
      JSON.stringify(updatedCart)
    );

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

            <h1>Discover Fashion.<br />Shop Without Limits.</h1>

            <p>
              Explore fashion from designers, brands and creators
              across the ModaSphere ecosystem.
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

              <Link
  to="/businesses/modamart/cart"
  className="modamart-cart"
>
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
                  className={
                    category === item ? "active-category" : ""
                  }
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCTS */}
          <div className="modamart-result">
            <p>
              {filteredProducts.length} products available
            </p>
          </div>

          <div className="modamart-products">
            {filteredProducts.map((product) => (
              <article
                className="modamart-product-card"
                key={product.id}
              >
                <div className="product-image-wrapper">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                  />

                  <button
                    className="product-wishlist"
                    onClick={() =>
                      toggleWishlist(product.id)
                    }
                  >
                    <Heart
                      size={19}
                      fill={
                        wishlist.includes(product.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>

                <div className="product-info">
                  <span>{product.brand}</span>

                  <h3>
  <Link
    to={`/businesses/modamart/product/${product.id}`}
    className="product-name-link"
  >
    {product.name}
  </Link>
</h3>

                  <p className="product-category">
                    {product.category}
                  </p>

                  <div className="product-bottom">
                    <strong>
                      ₹{product.price.toLocaleString("en-IN")}
                    </strong>

                    <button
                      onClick={() => addToCart(product)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredProducts.length === 0 && (
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