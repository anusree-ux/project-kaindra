import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import apiClient from "../services/apiClient";
import "./ProductDetails.css";

function ProductDetails() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProductDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/api/modasphere/products/${productId}`);
        if (isMounted) {
          setProduct(res.data?.data?.product || null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading product detail:", err);
          setError("Product not found or unavailable.");
          setProduct(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (productId) {
      fetchProductDetail();
    }
    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Increase quantity
  const increaseQuantity = () => {
    if (product?.stock && quantity >= product.stock) return;
    setQuantity((current) => current + 1);
  };

  // Decrease quantity
  const decreaseQuantity = () => {
    setQuantity((current) => (current > 1 ? current - 1 : 1));
  };

  // Add product to cart
  const addToCart = () => {
    if (!product) return;

    const existingCart = JSON.parse(
      localStorage.getItem("modamartCart") || "[]"
    );

    const prodId = product._id || product.id;
    const existingProduct = existingCart.find(
      (item) => String(item.id || item._id) === String(prodId)
    );

    const primaryImage =
      product.images?.[0]?.url ||
      (typeof product.images?.[0] === "string" ? product.images[0] : "") ||
      product.image ||
      "";

    const brandName =
      product.sellerId?.name || product.brand || "ModaSphere Studio";

    let updatedCart;

    if (existingProduct) {
      updatedCart = existingCart.map((item) =>
        String(item.id || item._id) === String(prodId)
          ? {
              ...item,
              quantity: item.quantity + quantity,
            }
          : item
      );
    } else {
      updatedCart = [
        ...existingCart,
        {
          id: prodId,
          _id: prodId,
          name: product.name,
          price: product.price,
          category: product.category,
          brand: brandName,
          image: primaryImage,
          images: product.images,
          quantity,
        },
      ];
    }

    localStorage.setItem("modamartCart", JSON.stringify(updatedCart));
    alert(`${product.name} added to cart`);
  };

  if (loading) {
    return (
      <main className="product-details-page">
        <div className="product-details-container" style={{ textAlign: "center", padding: "100px 0" }}>
          <Loader2 size={40} className="animate-spin" style={{ margin: "0 auto 16px", color: "#b89552", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#777", fontSize: 16 }}>Loading product details...</p>
        </div>
      </main>
    );
  }

  if (!product || error) {
    return (
      <main className="product-details-page">
        <div className="product-not-found">
          <h1>Product Not Found</h1>
          <p>
            {error || "The product you are looking for does not exist or has been removed."}
          </p>

          <Link to="/businesses/modamart/shop" className="back-to-shop">
            <ArrowLeft size={18} />
            Back to ModaMart
          </Link>
        </div>
      </main>
    );
  }

  const rawImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map((img) => (typeof img === "object" ? img.url : img))
    : [product.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"];

  const currentImageUrl = rawImages[selectedImage] || rawImages[0];
  const brandName = product.sellerId?.name || product.brand || "ModaSphere Studio";

  return (
    <main className="product-details-page">
      <div className="product-details-container">
        {/* BACK */}
        <Link to="/businesses/modamart/shop" className="product-back-link">
          <ArrowLeft size={18} />
          Back to ModaMart
        </Link>

        <section className="product-details">
          {/* ================= IMAGE GALLERY ================= */}
          <div className="product-gallery">
            {/* THUMBNAILS */}
            <div className="product-thumbnails">
              {rawImages.map((image, index) => (
                <button
                  type="button"
                  key={`${product._id || product.id}-${index}`}
                  className={`product-thumbnail ${
                    selectedImage === index ? "active" : ""
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                  />
                </button>
              ))}
            </div>

            {/* MAIN IMAGE */}
            <div className="product-main-image">
              <img
                src={currentImageUrl}
                alt={product.name}
              />
            </div>
          </div>

          {/* ================= PRODUCT INFORMATION ================= */}
          <div className="product-info">
            <p className="product-category" style={{ textTransform: "capitalize" }}>
              {product.category}
            </p>

            <h1>{product.name}</h1>

            <p className="product-brand">{brandName}</p>

            <div className="product-price">
              ₹{product.price?.toLocaleString("en-IN")}
            </div>

            <div className="product-divider" />

            <p className="product-description">
              {product.description ||
                `Discover the ${product.name}, designed with contemporary fashion, quality materials, and ModaSphere's modern design philosophy.`}
            </p>

            {/* PRODUCT META */}
            <div className="product-meta">
              <div>
                <span>Category</span>
                <strong style={{ textTransform: "capitalize" }}>{product.category}</strong>
              </div>

              <div>
                <span>Brand</span>
                <strong>{brandName}</strong>
              </div>

              <div>
                <span>Availability</span>
                <strong>{product.stock > 0 ? `In Stock (${product.stock} left)` : "Out of Stock"}</strong>
              </div>
            </div>

            {/* ================= QUANTITY ================= */}
            <div className="product-quantity">
              <span>Quantity</span>

              <div className="quantity-controls">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>

                <strong>{quantity}</strong>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  aria-label="Increase quantity"
                  disabled={product.stock <= quantity}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* ================= ACTIONS ================= */}
            <div className="product-actions">
              <button
                type="button"
                className="add-to-cart-button"
                onClick={addToCart}
                disabled={product.stock <= 0}
              >
                <ShoppingBag size={19} />
                {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
              </button>

              <button
                type="button"
                className={`wishlist-button ${
                  isWishlisted ? "active" : ""
                }`}
                onClick={() => setIsWishlisted((current) => !current)}
                aria-label="Add to wishlist"
              >
                <Heart
                  size={20}
                  fill={isWishlisted ? "currentColor" : "none"}
                />
              </button>
            </div>

            <div className="product-note">
              Free shipping on orders above ₹5,000
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ProductDetails;