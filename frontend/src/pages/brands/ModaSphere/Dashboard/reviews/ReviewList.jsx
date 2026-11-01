import { useState, useEffect } from "react";
import { Star, Loader2, MessageSquare } from "lucide-react";
import DataTable from "../components/DataTable";
import { getSellerReviews } from "../services/dashboardApi";

const ReviewList = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getSellerReviews()
      .then((rawReviews) => {
        if (!isMounted) return;
        const formatted = (rawReviews || []).map((rev) => ({
          id: rev._id,
          customer: rev.userId?.name || "Customer",
          product: rev.productId?.name || "Product",
          rating: rev.rating,
          review: rev.comment || rev.review || "-",
          images: (rev.images || []).map((img) => (typeof img === "object" ? img.url : img)),
          date: rev.createdAt
            ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Recent",
        }));
        setReviews(formatted);
      })
      .catch((err) => {
        console.error("Failed to load seller reviews:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const columns = [
    { key: "customer", label: "Customer" },
    { key: "product", label: "Product" },
    {
      key: "rating",
      label: "Rating",
      render: (rating) => (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Star size={14} fill="currentColor" style={{ color: "#f59e0b" }} />
          {rating}
        </span>
      ),
    },
    { key: "review", label: "Review" },
    {
      key: "images",
      label: "Photos",
      render: (imgs) =>
        imgs && imgs.length > 0 ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {imgs.slice(0, 3).map((img, i) => (
              <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                <img
                  src={img}
                  alt="Review"
                  style={{
                    width: 34,
                    height: 34,
                    objectFit: "cover",
                    borderRadius: 4,
                    border: "1px solid #e5e5e5",
                    cursor: "pointer",
                  }}
                />
              </a>
            ))}
            {imgs.length > 3 && (
              <span style={{ fontSize: 11, color: "#888" }}>+{imgs.length - 3}</span>
            )}
          </div>
        ) : (
          <span style={{ color: "#aaa", fontSize: 13 }}>-</span>
        ),
    },
    { key: "date", label: "Date" },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>Reviews</h1>
          <p>
            See what customers are saying about your products.
          </p>
        </div>
      </div>

      <div className="dashboard-card">
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 10, fontSize: 14 }}>Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#666" }}>
            <MessageSquare size={36} style={{ color: "#9ca3af", marginBottom: 12 }} />
            <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>No customer reviews yet</p>
            <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
              Feedback and ratings from verified buyers will appear here.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={reviews}
          />
        )}
      </div>
    </div>
  );
};

export default ReviewList;