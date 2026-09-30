import { useEffect, useState } from "react";
import {
  CreditCard,
  Eye,
  X,
  CheckCircle2,
  Package,
  IndianRupee,
  Search,
} from "lucide-react";
import "./AdminPayments.css";

function AdminPayments() {
  // Load payments directly during initial state creation
  const [payments, setPayments] = useState(() => {
    try {
      const storedPayments = JSON.parse(
        localStorage.getItem("modaPayments") || "[]"
      );

      return Array.isArray(storedPayments)
        ? storedPayments
        : [];
    } catch {
      return [];
    }
  });

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Listen for payment changes
  useEffect(() => {
    const handlePaymentsUpdated = () => {
      try {
        const storedPayments = JSON.parse(
          localStorage.getItem("modaPayments") || "[]"
        );

        setPayments(
          Array.isArray(storedPayments)
            ? storedPayments
            : []
        );
      } catch {
        setPayments([]);
      }
    };

    window.addEventListener(
      "modaPaymentsUpdated",
      handlePaymentsUpdated
    );

    window.addEventListener(
      "storage",
      handlePaymentsUpdated
    );

    return () => {
      window.removeEventListener(
        "modaPaymentsUpdated",
        handlePaymentsUpdated
      );

      window.removeEventListener(
        "storage",
        handlePaymentsUpdated
      );
    };
  }, []);

  // Search
  const filteredPayments = payments.filter(
    (payment) => {
      const search = searchTerm
        .trim()
        .toLowerCase();

      if (!search) {
        return true;
      }

      return (
        String(payment.id || "")
          .toLowerCase()
          .includes(search) ||
        String(payment.requestId || "")
          .toLowerCase()
          .includes(search) ||
        String(payment.method || "")
          .toLowerCase()
          .includes(search)
      );
    }
  );

  // Total amount
  const totalAmount = payments.reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0
  );

  // Successful payments
  const successfulPayments = payments.filter(
    (payment) =>
      payment.status === "Successful"
  );

  return (
    <div className="admin-payments-page">

      {/* HEADER */}
      <div className="admin-payments-header">
        <span className="admin-payments-eyebrow">
          MODAPAY / ADMIN
        </span>

        <h1>Payment Management</h1>

        <p>
          View ModaPay transactions connected to
          ModaManufacture production requests.
        </p>
      </div>

      {/* STATS */}
      <div className="admin-payments-stats">

        <div className="admin-payment-stat">
          <div className="admin-payment-stat-icon">
            <CreditCard size={20} />
          </div>

          <div>
            <span>Total Payments</span>
            <strong>
              {payments.length}
            </strong>
          </div>
        </div>

        <div className="admin-payment-stat">
          <div className="admin-payment-stat-icon">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Successful</span>
            <strong>
              {successfulPayments.length}
            </strong>
          </div>
        </div>

        <div className="admin-payment-stat">
          <div className="admin-payment-stat-icon">
            <IndianRupee size={20} />
          </div>

          <div>
            <span>Total Value</span>

            <strong>
              ₹
              {totalAmount.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>
        </div>

      </div>

      {/* TRANSACTIONS */}
      <div className="admin-payments-card">

        <div className="admin-payments-toolbar">

          <div>
            <h2>Transactions</h2>

            <span>
              {filteredPayments.length} payment
              {filteredPayments.length !== 1
                ? "s"
                : ""}
            </span>
          </div>

          <div className="admin-payments-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search transaction or request ID"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

        </div>

        {/* EMPTY */}
        {filteredPayments.length === 0 ? (

          <div className="admin-payments-empty">

            <CreditCard size={42} />

            <h3>
              No payments found
            </h3>

            <p>
              Successful ModaPay transactions
              will appear here.
            </p>

          </div>

        ) : (

          <div className="admin-payments-table-wrapper">

            <table className="admin-payments-table">

              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Request ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredPayments.map(
                  (payment) => (

                    <tr key={payment.id}>

                      {/* TRANSACTION */}
                      <td>
                        <div className="admin-payment-transaction">

                          <div className="admin-payment-small-icon">
                            <CreditCard size={15} />
                          </div>

                          <strong>
                            {payment.id}
                          </strong>

                        </div>
                      </td>

                      {/* REQUEST ID */}
                      <td>
                        <span className="admin-request-id">
                          {payment.requestId ||
                            "Not linked"}
                        </span>
                      </td>

                      {/* AMOUNT */}
                      <td>
                        <strong>
                          ₹
                          {Number(
                            payment.amount || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </td>

                      {/* METHOD */}
                      <td>
                        <span className="admin-payment-method">
                          {String(
                            payment.method ||
                              "Unknown"
                          ).toUpperCase()}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className={`admin-payment-status ${
                            payment.status ===
                            "Successful"
                              ? "success"
                              : "pending"
                          }`}
                        >
                          {payment.status ||
                            "Pending"}
                        </span>
                      </td>

                      {/* DATE */}
                      <td>
                        <span className="admin-payment-date">
                          {payment.createdAt ||
                            "Not available"}
                        </span>
                      </td>

                      {/* VIEW */}
                      <td>
                        <button
                          type="button"
                          className="admin-payment-view-button"
                          onClick={() =>
                            setSelectedPayment(
                              payment
                            )
                          }
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* PAYMENT DETAILS MODAL */}
      {selectedPayment && (

        <div
          className="admin-payment-modal-overlay"
          onClick={() =>
            setSelectedPayment(null)
          }
        >

          <div
            className="admin-payment-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}
            <div className="admin-payment-modal-header">

              <div>

                <span>
                  PAYMENT DETAILS
                </span>

                <h2>
                  {selectedPayment.id}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPayment(null)
                }
              >
                <X size={19} />
              </button>

            </div>

            {/* STATUS */}
            <div className="admin-payment-modal-status">

              <CheckCircle2 size={18} />

              <strong>
                {selectedPayment.status ||
                  "Pending"}
              </strong>

            </div>

            {/* DETAILS */}
            <div className="admin-payment-details-grid">

              <div>
                <span>
                  TRANSACTION ID
                </span>

                <strong>
                  {selectedPayment.id}
                </strong>
              </div>

              <div>
                <span>
                  PRODUCTION REQUEST
                </span>

                <strong>
                  {selectedPayment.requestId ||
                    "Not linked"}
                </strong>
              </div>

              <div>
                <span>AMOUNT</span>

                <strong>
                  ₹
                  {Number(
                    selectedPayment.amount || 0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div>
                <span>
                  PAYMENT METHOD
                </span>

                <strong>
                  {String(
                    selectedPayment.method ||
                      "Unknown"
                  ).toUpperCase()}
                </strong>
              </div>

              <div>
                <span>
                  PAYMENT STATUS
                </span>

                <strong>
                  {selectedPayment.status ||
                    "Pending"}
                </strong>
              </div>

              <div>
                <span>DATE</span>

                <strong>
                  {selectedPayment.createdAt ||
                    "Not available"}
                </strong>
              </div>

            </div>

            {/* LINKED REQUEST */}
            {selectedPayment.requestId && (

              <div className="admin-linked-request">

                <Package size={18} />

                <div>

                  <span>
                    LINKED MODAMANUFACTURE REQUEST
                  </span>

                  <strong>
                    {selectedPayment.requestId}
                  </strong>

                  <p>
                    This payment is connected
                    to the production request
                    through its Request ID.
                  </p>

                </div>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminPayments;