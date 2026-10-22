import { Star } from "lucide-react";
import DataTable from "../components/DataTable";

const reviews = [
  {
    id: 1,
    customer: "Meera Rao",
    product: "Classic Linen Shirt",
    rating: 5,
    review: "Excellent quality and fit.",
    date: "19 Oct 2026",
  },
  {
    id: 2,
    customer: "Arjun Reddy",
    product: "Essential Hoodie",
    rating: 4,
    review: "Comfortable and well made.",
    date: "17 Oct 2026",
  },
];

const ReviewList = () => {
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
          <Star size={14} fill="currentColor" />
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
        <DataTable
          columns={columns}
          data={reviews}
        />
      </div>
    </div>
  );
};

export default ReviewList;