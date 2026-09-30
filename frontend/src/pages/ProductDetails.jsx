import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";
import products from "../data/products";
import "./ProductDetails.css";

function ProductDetails() {
  const { productId } = useParams();

  const product = products.find(
    (item) => String(item.id) === String(productId)
  );

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!product) {
    return (
      <main className="product-details-page">
        <div className="product-not-found">
          <h1>Product Not Found</h1>
          <p>
            The product you are looking for does not exist.
          </p>

          <Link
            to="/businesses/modamart/shop"
            className="back-to-shop"
          >
            <ArrowLeft size={18} />
            Back to ModaMart
          </Link>
        </div>
      </main>
    );
  }

  // Increase quantity
  const increaseQuantity = () => {
    setQuantity((current) => current + 1);
  };

  // Decrease quantity
  const decreaseQuantity = () => {
    setQuantity((current) =>
      current > 1 ? current - 1 : 1
    );
  };

  // Add product to cart
  const addToCart = () => {
    const existingCart = JSON.parse(
      localStorage.getItem("modamartCart") || "[]"
    );

    const existingProduct = existingCart.find(
      (item) => String(item.id) === String(product.id)
    );

    let updatedCart;

    if (existingProduct) {
      updatedCart = existingCart.map((item) =>
        String(item.id) === String(product.id)
          ? {
              ...item,
              image: item.image || product.images[0],
              images: product.images,
              quantity: item.quantity + quantity,
            }
          : item
      );
    } else {
      updatedCart = [
        ...existingCart,
        {
          ...product,

          // Cart uses this image
          image: product.images[0],

          // Keep all product images too
          images: product.images,

          quantity,
        },
      ];
    }

    localStorage.setItem(
      "modamartCart",
      JSON.stringify(updatedCart)
    );

    alert(`${product.name} added to cart`);
  };

  return (
    <main className="product-details-page">
      <div className="product-details-container">

        {/* BACK */}
        <Link
          to="/businesses/modamart/shop"
          className="product-back-link"
        >
          <ArrowLeft size={18} />
          Back to ModaMart
        </Link>

        <section className="product-details">

          {/* ================= IMAGE GALLERY ================= */}

          <div className="product-gallery">

            {/* THUMBNAILS */}
            <div className="product-thumbnails">
              {product.images.map((image, index) => (
                <button
                  type="button"
                  key={`${product.id}-${index}`}
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
                src={
                  product.images[selectedImage] ||
                  product.images[0]
                }
                alt={product.name}
              />
            </div>

          </div>

          {/* ================= PRODUCT INFORMATION ================= */}

          <div className="product-info">

            <p className="product-category">
              {product.category}
            </p>

            <h1>{product.name}</h1>

            <p className="product-brand">
              {product.brand}
            </p>

            <div className="product-price">
              ₹{product.price}
            </div>

            <div className="product-divider" />

            <p className="product-description">
              Discover the {product.name}, designed with
              contemporary fashion, quality materials, and
              ModaSphere's modern design philosophy.
            </p>

            {/* PRODUCT META */}
            <div className="product-meta">

              <div>
                <span>Category</span>
                <strong>{product.category}</strong>
              </div>

              <div>
                <span>Brand</span>
                <strong>{product.brand}</strong>
              </div>

              <div>
                <span>Availability</span>
                <strong>In Stock</strong>
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
              >
                <ShoppingBag size={19} />
                Add to Cart
              </button>

              <button
                type="button"
                className={`wishlist-button ${
                  isWishlisted ? "active" : ""
                }`}
                onClick={() =>
                  setIsWishlisted((current) => !current)
                }
                aria-label="Add to wishlist"
              >
                <Heart
                  size={20}
                  fill={
                    isWishlisted
                      ? "currentColor"
                      : "none"
                  }
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