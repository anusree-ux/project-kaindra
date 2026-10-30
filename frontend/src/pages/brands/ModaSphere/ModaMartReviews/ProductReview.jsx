import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  ImagePlus,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";
import "./ProductReview.css";

function ProductReview({ productId, productName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");
  const [submittedReview, setSubmittedReview] = useState(null);

  const fileInputRef = useRef(null);

  /*
    Remove temporary image URLs when component is removed.
  */
  useEffect(() => {
    return () => {
      images.forEach((image) => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, [images]);

  const toggleReviewForm = () => {
    setIsOpen((current) => !current);
    setMessage("");
  };

  const handleStarClick = (value) => {
    setRating(value);
    setMessage("");
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (selectedFiles.length === 0) {
      return;
    }

    const imageFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length !== selectedFiles.length) {
      setMessage("Please select image files only.");
    } else {
      setMessage("");
    }

    /*
      Maximum 5 review images.
    */
    const availableSlots = 5 - images.length;

    if (availableSlots <= 0) {
      setMessage(
        "You can upload a maximum of 5 images."
      );
      event.target.value = "";
      return;
    }

    const filesToAdd = imageFiles.slice(
      0,
      availableSlots
    );

    const newImages = filesToAdd.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((current) => [
      ...current,
      ...newImages,
    ]);

    if (imageFiles.length > availableSlots) {
      setMessage(
        "You can upload a maximum of 5 images."
      );
    }

    /*
      Reset input so the same image can be selected again
      after removing it.
    */
    event.target.value = "";
  };

  const removeImage = (imageId) => {
    setImages((current) => {
      const imageToRemove = current.find(
        (image) => image.id === imageId
      );

      if (imageToRemove) {
        URL.revokeObjectURL(
          imageToRemove.preview
        );
      }

      return current.filter(
        (image) => image.id !== imageId
      );
    });

    setMessage("");
  };

  const clearForm = () => {
    images.forEach((image) => {
      URL.revokeObjectURL(image.preview);
    });

    setRating(0);
    setHoverRating(0);
    setReviewText("");
    setImages([]);
    setMessage("");
  };

  const handleCancel = () => {
    clearForm();
    setIsOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (rating === 0) {
      setMessage(
        "Please select a star rating."
      );
      return;
    }

    if (!reviewText.trim()) {
      setMessage(
        "Please write your review before submitting."
      );
      return;
    }

    /*
      FRONTEND ONLY.

      Later your backend teammate can replace this section
      with the actual review API request.

      Example data that would be sent:
      {
        productId,
        rating,
        reviewText,
        images
      }
    */

    setSubmittedReview({
      productId,
      rating,
      text: reviewText.trim(),
      images: images.map(
        (image) => image.preview
      ),
    });

    setMessage("");

    /*
      Don't revoke image URLs here because they are being
      displayed in the submitted-review preview below.
    */

    setRating(0);
    setHoverRating(0);
    setReviewText("");
    setImages([]);
    setIsOpen(false);
  };

  const ratingText = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  return (
    <div className="product-review">

      {/* =====================================
          REVIEW PRODUCT BUTTON
      ===================================== */}

      <button
        type="button"
        className={`product-review-trigger ${
          isOpen ? "open" : ""
        }`}
        onClick={toggleReviewForm}
        aria-expanded={isOpen}
      >
        <span className="review-trigger-left">
          <span className="review-trigger-icon">
            <Star size={17} />
          </span>

          <span>
            <strong>Review Product</strong>

            <small>
              Share your experience with this product
            </small>
          </span>
        </span>

        <ChevronDown
          size={19}
          className="review-trigger-arrow"
        />
      </button>


      {/* =====================================
          REVIEW FORM
      ===================================== */}

      {isOpen && (
        <form
          className="product-review-form"
          onSubmit={handleSubmit}
        >

          {/* HEADER */}

          <div className="review-form-header">
            <div>
              <span>YOUR REVIEW</span>

              <h3>
                How was your experience?
              </h3>

              {productName && (
                <p>{productName}</p>
              )}
            </div>

            <button
              type="button"
              className="review-form-close"
              onClick={() =>
                setIsOpen(false)
              }
              aria-label="Close review form"
            >
              <X size={18} />
            </button>
          </div>


          {/* =================================
              STAR RATING
          ================================= */}

          <div className="review-field">
            <label>
              Your Rating
              <span>*</span>
            </label>

            <div className="review-rating-row">

              <div
                className="review-stars"
                onMouseLeave={() =>
                  setHoverRating(0)
                }
              >
                {[1, 2, 3, 4, 5].map(
                  (star) => {
                    const isActive =
                      star <=
                      (hoverRating || rating);

                    return (
                      <button
                        key={star}
                        type="button"
                        className={
                          isActive
                            ? "review-star active"
                            : "review-star"
                        }
                        onClick={() =>
                          handleStarClick(
                            star
                          )
                        }
                        onMouseEnter={() =>
                          setHoverRating(
                            star
                          )
                        }
                        aria-label={`${star} star${
                          star > 1
                            ? "s"
                            : ""
                        }`}
                      >
                        <Star
                          size={27}
                          fill={
                            isActive
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    );
                  }
                )}
              </div>

              {(hoverRating > 0 ||
                rating > 0) && (
                <span className="review-rating-text">
                  {
                    ratingText[
                      hoverRating ||
                        rating
                    ]
                  }
                </span>
              )}

            </div>
          </div>


          {/* =================================
              REVIEW TEXT
          ================================= */}

          <div className="review-field">

            <div className="review-label-row">
              <label htmlFor="product-review-text">
                Write Your Review
                <span>*</span>
              </label>

              <span>
                {reviewText.length}/500
              </span>
            </div>

            <textarea
              id="product-review-text"
              value={reviewText}
              onChange={(event) =>
                setReviewText(
                  event.target.value
                )
              }
              maxLength={500}
              placeholder="What did you like about this product? Share your experience, quality, fit, style or anything that could help other shoppers."
              rows={5}
            />

          </div>


          {/* =================================
              IMAGE UPLOAD
          ================================= */}

          <div className="review-field">

            <label>
              Add Photos
              <small> Optional</small>
            </label>

            <p className="review-upload-description">
              Add up to 5 photos of the
              product.
            </p>

            <div className="review-images">

              {/* EXISTING IMAGE PREVIEWS */}

              {images.map((image) => (
                <div
                  className="review-image-preview"
                  key={image.id}
                >
                  <img
                    src={image.preview}
                    alt="Review upload preview"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeImage(
                        image.id
                      )
                    }
                    aria-label="Remove image"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}


              {/* ADD IMAGE */}

              {images.length < 5 && (
                <button
                  type="button"
                  className="review-image-upload"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  <span>
                    <ImagePlus size={22} />
                  </span>

                  <strong>
                    Add Photo
                  </strong>

                  <small>
                    {images.length}/5
                  </small>
                </button>
              )}

            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="review-file-input"
              onChange={handleImageChange}
            />

          </div>


          {/* =================================
              MESSAGE
          ================================= */}

          {message && (
            <div className="review-message">
              {message}
            </div>
          )}


          {/* =================================
              ACTIONS
          ================================= */}

          <div className="review-form-actions">

            <button
              type="button"
              className="review-cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="review-submit-button"
            >
              <Send size={16} />
              Submit Review
            </button>

          </div>

        </form>
      )}


      {/* =====================================
          FRONTEND SUBMITTED REVIEW PREVIEW
      ===================================== */}

      {submittedReview && (
        <div className="submitted-review">

          <div className="submitted-review-top">

            <div>
              <span>
                YOUR REVIEW
              </span>

              <div className="submitted-review-stars">
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={
                        star <=
                        submittedReview.rating
                          ? "currentColor"
                          : "none"
                      }
                    />
                  )
                )}
              </div>
            </div>

            <span className="review-submitted-badge">
              Submitted
            </span>

          </div>

          <p>
            {submittedReview.text}
          </p>

          {submittedReview.images.length >
            0 && (
            <div className="submitted-review-images">

              {submittedReview.images.map(
                (image, index) => (
                  <img
                    key={`${image}-${index}`}
                    src={image}
                    alt={`Review ${index + 1}`}
                  />
                )
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default ProductReview;