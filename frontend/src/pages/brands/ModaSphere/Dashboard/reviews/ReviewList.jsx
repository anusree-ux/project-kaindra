import { useState, useEffect } from "react";
import { Star, Loader2, MessageSquare } from "lucide-react";
import DataTable from "../components/DataTable";
import apiClient from "../../../../../services/apiClient";
import { getSellerProducts } from "../services/dashboardApi";

const ReviewList = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getSellerProducts()
      .then(async (products) => {
        if (!isMounted) return;
        const allReviews = [];
        const productList = products || [];

        // Fetch reviews for up to first 5 products
        for (const product of productList.slice(0, 5)) {
          const id = product._id || product.id;
          try {
            const res = await apiClient.get(`/api/modasphere/products/${id}/reviews`);
            const prodReviews = res.data?.data?.reviews || res.data?.reviews || [];
            prodReviews.forEach((rev) => {
              allReviews.push({
                id: rev._id,
                customer: rev.userId?.name || "Customer",
                product: product.name,
                rating: rev.rating,
                review: rev.comment || rev.review || "-",
                date: rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recent",
              });
            });
          } catch {
            // Ignore individual product review fetch errors
          }
        }

        if (isMounted) {
          setReviews(allReviews);
        }
      })
      .catch((err) => {
        console.error("Failed to load reviews:", err);
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