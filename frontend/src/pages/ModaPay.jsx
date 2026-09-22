import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CreditCard,
  Smartphone,
  Building2,
  ShieldCheck,
  LockKeyhole,
  ArrowRight,
  CheckCircle2,
  WalletCards,
} from "lucide-react";
import "./ModaPay.css";

function ModaPay() {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [productionRequest] = useState(() => {
  try {
    const requests = JSON.parse(
      localStorage.getItem("modaManufactureRequests") || "[]"
    );

    return (
      requests.find(
        (request) => request.id === requestId
      ) || null
    );
  } catch {
    return null;
  }
});
const [searchParams] = useSearchParams();
const requestId = searchParams.get("requestId") || "";
  const handlePayment = (event) => {
    event.preventDefault();

    if (!amount || Number(amount) <= 0) {
      setPaymentStatus("error");
      return;
    }

    const transactionId = `MP-${Date.now()}`;

    const payment = {
  id: transactionId,
  amount: Number(amount),
  method: paymentMethod,
  status: "Successful",
  createdAt: new Date().toLocaleString(),
};

    const existingPayments = JSON.parse(
      localStorage.getItem("modaPayments") || "[]"
    );

    localStorage.setItem(
      "modaPayments",
      JSON.stringify([payment, ...existingPayments])
    );
    window.dispatchEvent(
  new Event("modaPaymentsUpdated")
);

    setPaymentStatus(payment);
    setAmount("");
  };

  return (
    <main className="modapay-page">

      {/* HERO */}
      <section className="modapay-hero">
        <div className="modapay-container">

          <span className="modapay-eyebrow">
            MODASPHERE / MODAPAY
          </span>

          <h1>
            Pay fashion.
            <br />
            Move business.
          </h1>

          <p>
            A connected payment layer for fashion brands,
            creators, manufacturers, retailers and customers.
          </p>

          <div className="modapay-hero-actions">
            <a
              href="#payment"
              className="modapay-primary-button"
            >
              Make a Payment
              <ArrowRight size={16} />
            </a>

            <a
              href="#features"
              className="modapay-secondary-button"
            >
              Explore ModaPay
            </a>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="modapay-features"
      >
        <div className="modapay-container">

          <div className="modapay-section-heading">
            <span>PAYMENT SOLUTIONS</span>

            <h2>
              One payment layer for the fashion ecosystem.
            </h2>
          </div>

          <div className="modapay-feature-grid">

            <div className="modapay-feature-card">
              <div className="modapay-icon">
                <CreditCard size={22} />
              </div>

              <h3>Card Payments</h3>

              <p>
                Support secure card-based payments for
                fashion purchases and business transactions.
              </p>
            </div>

            <div className="modapay-feature-card">
              <div className="modapay-icon">
                <Smartphone size={22} />
              </div>

              <h3>Digital Payments</h3>

              <p>
                Enable convenient digital payment experiences
                across connected fashion platforms.
              </p>
            </div>

            <div className="modapay-feature-card">
              <div className="modapay-icon">
                <Building2 size={22} />
              </div>

              <h3>Business Payments</h3>

              <p>
                Support transactions between brands,
                manufacturers, suppliers and partners.
              </p>
            </div>

            <div className="modapay-feature-card">
              <div className="modapay-icon">
                <ShieldCheck size={22} />
              </div>

              <h3>Secure Transactions</h3>

              <p>
                Keep payment experiences protected with
                secure transaction handling.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* PAYMENT */}
      <section
        id="payment"
        className="modapay-payment"
      >
        <div className="modapay-container">

          <div className="modapay-payment-layout">

            {/* LEFT */}
            <div className="modapay-payment-intro">

              <span>MODAPAY CHECKOUT</span>

              <h2>
                Simple payments.
                <br />
                Connected ecosystem.
              </h2>

              <p>
                Use this connected ModaPay interface to
                create a payment transaction inside the
                ModaSphere ecosystem.
              </p>

              <div className="modapay-security">

                <div>
                  <LockKeyhole size={18} />
                  <span>Secure payment handling</span>
                </div>

                <div>
                  <ShieldCheck size={18} />
                  <span>Protected transaction flow</span>
                </div>

                <div>
                  <WalletCards size={18} />
                  <span>Multiple payment methods</span>
                </div>

              </div>

            </div>

            {/* PAYMENT CARD */}
            <div className="modapay-card">
                {productionRequest && (
  <div className="modapay-production-request">
    <span>PRODUCTION REQUEST</span>

    <strong>{productionRequest.id}</strong>

    <div className="modapay-production-details">
      <div>
        <small>PRODUCT</small>
        <p>
          {productionRequest.product || "Not specified"}
        </p>
      </div>

      <div>
        <small>QUANTITY</small>
        <p>
          {productionRequest.quantity || "Not specified"}
        </p>
      </div>

      <div>
        <small>CATEGORY</small>
        <p>
          {productionRequest.category || "Not specified"}
        </p>
      </div>

      <div>
        <small>MANUFACTURER</small>
        <p>
          {productionRequest.manufacturer ||
            "Open to manufacturers"}
        </p>
      </div>
    </div>
  </div>
)}

              <div className="modapay-card-header">
                <span>PAY WITH MODAPAY</span>

                <WalletCards size={22} />
              </div>

              <form onSubmit={handlePayment}>

                <label>
                  Amount
                </label>

                <div className="modapay-amount">
                  <span>₹</span>

                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      setPaymentStatus(null);
                    }}
                  />
                </div>

                <label>
                  Payment Method
                </label>

                <div className="modapay-methods">

                  <button
                    type="button"
                    className={
                      paymentMethod === "card"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setPaymentMethod("card")
                    }
                  >
                    <CreditCard size={18} />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    className={
                      paymentMethod === "upi"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setPaymentMethod("upi")
                    }
                  >
                    <Smartphone size={18} />
                    <span>UPI</span>
                  </button>

                  <button
                    type="button"
                    className={
                      paymentMethod === "bank"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setPaymentMethod("bank")
                    }
                  >
                    <Building2 size={18} />
                    <span>Bank</span>
                  </button>

                </div>

                {paymentMethod === "card" && (
                  <div className="modapay-extra-fields">

                    <label>
                      Card Number
                    </label>

                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                    />

                    <div className="modapay-field-row">

                      <div>
                        <label>
                          Expiry
                        </label>

                        <input
                          type="text"
                          placeholder="MM/YY"
                        />
                      </div>

                      <div>
                        <label>
                          CVV
                        </label>

                        <input
                          type="password"
                          placeholder="•••"
                          maxLength="4"
                        />
                      </div>

                    </div>

                  </div>
                )}

                {paymentMethod === "upi" && (
                  <div className="modapay-extra-fields">

                    <label>
                      UPI ID
                    </label>

                    <input
                      type="text"
                      placeholder="example@upi"
                    />

                  </div>
                )}

                {paymentMethod === "bank" && (
                  <div className="modapay-extra-fields">

                    <label>
                      Bank Account
                    </label>

                    <input
                      type="text"
                      placeholder="Enter account number"
                    />

                  </div>
                )}

                <button
                  type="submit"
                  className="modapay-pay-button"
                >
                  Pay with ModaPay
                  <ArrowRight size={16} />
                </button>

              </form>

              {paymentStatus === "error" && (
                <div className="modapay-payment-error">
                  Please enter a valid payment amount.
                </div>
              )}

              {paymentStatus &&
                paymentStatus !== "error" && (
                  <div className="modapay-success">

                    <CheckCircle2 size={22} />

                    <div>
                      <strong>
                        Payment Successful
                      </strong>

                      <span>
                        Transaction ID:{" "}
                        {paymentStatus.id}
                      </span>

                      <span>
                        Amount: ₹
                        {paymentStatus.amount}
                      </span>
                    </div>

                  </div>
                )}

            </div>

          </div>

        </div>
      </section>

      {/* PROCESS */}
      <section className="modapay-process">

        <div className="modapay-container">

          <div className="modapay-section-heading">
            <span>HOW IT WORKS</span>

            <h2>
              A connected payment journey.
            </h2>
          </div>

          <div className="modapay-process-grid">

            <div className="modapay-process-item">
              <b>01</b>
              <Smartphone size={22} />

              <h3>
                Choose
              </h3>

              <p>
                Select the payment method that works
                for your transaction.
              </p>
            </div>

            <div className="modapay-process-item">
              <b>02</b>
              <WalletCards size={22} />

              <h3>
                Pay
              </h3>

              <p>
                Enter your payment information and
                submit the transaction.
              </p>
            </div>

            <div className="modapay-process-item">
              <b>03</b>
              <ShieldCheck size={22} />

              <h3>
                Secure
              </h3>

              <p>
                The payment transaction moves through
                the secure ModaPay flow.
              </p>
            </div>

            <div className="modapay-process-item">
              <b>04</b>
              <CheckCircle2 size={22} />

              <h3>
                Confirm
              </h3>

              <p>
                Receive a transaction confirmation after
                successful processing.
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="modapay-cta">

        <div className="modapay-container">

          <span>MODAPAY</span>

          <h2>
            Payments built for the future of fashion.
          </h2>

          <p>
            Connect customers, brands, manufacturers
            and partners through ModaSphere.
          </p>


        </div>

      </section>

    </main>
  );
}

export default ModaPay;