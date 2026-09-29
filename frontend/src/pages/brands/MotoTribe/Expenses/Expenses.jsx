import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "./Expenses.css";

const EXPENSE_CATEGORIES = [
  "FUEL",
  "FOOD",
  "STAY",
  "SERVICE",
  "TOLL",
  "OTHER",
];

const CATEGORY_LABELS = {
  FUEL: "Fuel",
  FOOD: "Food",
  STAY: "Stay",
  SERVICE: "Service",
  TOLL: "Toll",
  OTHER: "Other",
};

const CATEGORY_ICONS = {
  FUEL: "⛽",
  FOOD: "🍴",
  STAY: "⌂",
  SERVICE: "⚙",
  TOLL: "▣",
  OTHER: "₹",
};

const DEFAULT_EXPENSES = [
  {
    id: "expense-demo-1",
    category: "FUEL",
    description: "Fuel refill",
    amount: 1250,
    createdAt: new Date().toISOString(),
  },
  {
    id: "expense-demo-2",
    category: "FOOD",
    description: "Roadside meal",
    amount: 450,
    createdAt: new Date().toISOString(),
  },
  {
    id: "expense-demo-3",
    category: "STAY",
    description: "Hotel stay",
    amount: 1800,
    createdAt: new Date().toISOString(),
  },
];

function createEmptyForm() {
  return {
    category: "FUEL",
    description: "",
    amount: "",
  };
}

function getSafeExpenses(storageKey) {
  try {
    const storedExpenses = localStorage.getItem(storageKey);

    if (!storedExpenses) {
      return DEFAULT_EXPENSES;
    }

    const parsedExpenses = JSON.parse(storedExpenses);

    if (!Array.isArray(parsedExpenses)) {
      return DEFAULT_EXPENSES;
    }

    return parsedExpenses.filter(
      (expense) =>
        expense &&
        typeof expense === "object" &&
        typeof expense.id === "string" &&
        typeof expense.category === "string" &&
        EXPENSE_CATEGORIES.includes(expense.category) &&
        typeof expense.amount === "number" &&
        Number.isFinite(expense.amount) &&
        expense.amount >= 0
    );
  } catch {
    return DEFAULT_EXPENSES;
  }
}

function Expenses() {
  const { rideId } = useParams();

  const storageKey = `mototribeExpenses_${
    rideId || "default"
  }`;

  const [expenses, setExpenses] = useState(() =>
    getSafeExpenses(storageKey)
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(createEmptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalExpense = useMemo(() => {
    return expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount || 0),
      0
    );
  }, [expenses]);

  const categoryTotals = useMemo(() => {
    const totals = {};

    EXPENSE_CATEGORIES.forEach((category) => {
      totals[category] = 0;
    });

    expenses.forEach((expense) => {
      if (totals[expense.category] !== undefined) {
        totals[expense.category] += Number(
          expense.amount || 0
        );
      }
    });

    return totals;
  }, [expenses]);

  const saveExpenses = (updatedExpenses) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(updatedExpenses)
      );

      setExpenses(updatedExpenses);

      return true;
    } catch {
      setError(
        "Unable to save expenses. Please try again."
      );

      return false;
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleAddExpense = (event) => {
    event.preventDefault();

    const description = form.description.trim();
    const amount = Number(form.amount);

    if (!description) {
      setError("Please enter an expense description.");
      return;
    }

    if (!form.amount || Number.isNaN(amount)) {
      setError("Please enter a valid amount.");
      return;
    }

    if (amount <= 0) {
      setError(
        "Expense amount must be greater than zero."
      );
      return;
    }

    if (amount > 1000000) {
      setError(
        "Please enter an amount below ₹10,00,000."
      );
      return;
    }

    const newExpense = {
      id: `expense-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      category: form.category,
      description,
      amount,
      createdAt: new Date().toISOString(),
    };

    const updatedExpenses = [
      newExpense,
      ...expenses,
    ];

    const saved = saveExpenses(updatedExpenses);

    if (!saved) {
      return;
    }

    setForm(createEmptyForm());
    setShowForm(false);
    setSuccess("Expense added successfully.");
  };

  const handleDeleteExpense = (expenseId) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!shouldDelete) {
      return;
    }

    const updatedExpenses = expenses.filter(
      (expense) => expense.id !== expenseId
    );

    const saved = saveExpenses(updatedExpenses);

    if (!saved) {
      return;
    }

    setSuccess("Expense deleted successfully.");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return "Unknown date";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryPercentage = (category) => {
    if (!totalExpense) {
      return 0;
    }

    return Math.round(
      (categoryTotals[category] / totalExpense) * 100
    );
  };

  const handleToggleForm = () => {
    setShowForm((current) => !current);
    setError("");
    setSuccess("");
  };

  return (
    <section className="moto-expenses">
      <div className="moto-expenses-container">
        {/* HEADER */}
        <header className="moto-expenses-header">
          <div>
            <span className="moto-expenses-eyebrow">
              MOTOTRIBE / RIDE EXPENSES
            </span>

            <h1>RIDE EXPENSES</h1>

            <p>
              Track fuel, food, stays, services, tolls,
              and other ride-related expenses.
            </p>
          </div>

          <button
            type="button"
            className="moto-expenses-add-button"
            onClick={handleToggleForm}
          >
            {showForm ? "CLOSE FORM" : "+ ADD EXPENSE"}
          </button>
        </header>

        {/* MESSAGES */}
        {error && (
          <div
            className="moto-expenses-message error"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="moto-expenses-message success"
            role="status"
          >
            {success}
          </div>
        )}

        {/* ADD FORM */}
        {showForm && (
          <div className="moto-expenses-form-card">
            <div className="moto-expenses-form-header">
              <span>NEW EXPENSE</span>

              <p>
                Add the expense details for this ride.
              </p>
            </div>

            <form onSubmit={handleAddExpense}>
              <div className="moto-expenses-form-grid">
                <div className="moto-expenses-field">
                  <label htmlFor="category">
                    CATEGORY
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleInputChange}
                  >
                    {EXPENSE_CATEGORIES.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {CATEGORY_LABELS[category]}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="moto-expenses-field">
                  <label htmlFor="description">
                    DESCRIPTION
                  </label>

                  <input
                    id="description"
                    name="description"
                    type="text"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Example: Fuel refill"
                    maxLength={100}
                    autoComplete="off"
                  />
                </div>

                <div className="moto-expenses-field">
                  <label htmlFor="amount">
                    AMOUNT
                  </label>

                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    value={form.amount}
                    onChange={handleInputChange}
                    placeholder="₹ 0"
                    min="1"
                    max="1000000"
                    step="1"
                    inputMode="numeric"
                  />
                </div>

                <div className="moto-expenses-form-action">
                  <button type="submit">
                    SAVE EXPENSE
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* SUMMARY */}
        <div className="moto-expenses-summary">
          <div className="moto-expenses-summary-card primary">
            <span>TOTAL EXPENSE</span>

            <strong>
              {formatCurrency(totalExpense)}
            </strong>

            <small>
              {expenses.length} expense
              {expenses.length === 1 ? "" : "s"} recorded
            </small>
          </div>

          <div className="moto-expenses-summary-card">
            <span>FUEL</span>

            <strong>
              {formatCurrency(categoryTotals.FUEL)}
            </strong>
          </div>

          <div className="moto-expenses-summary-card">
            <span>FOOD</span>

            <strong>
              {formatCurrency(categoryTotals.FOOD)}
            </strong>
          </div>

          <div className="moto-expenses-summary-card">
            <span>STAY</span>

            <strong>
              {formatCurrency(categoryTotals.STAY)}
            </strong>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="moto-expenses-content">
          {/* EXPENSE LIST */}
          <div className="moto-expenses-list-section">
            <div className="moto-expenses-section-heading">
              <div>
                <span>TRANSACTION HISTORY</span>
                <h2>EXPENSES</h2>
              </div>
            </div>

            {expenses.length === 0 ? (
              <div className="moto-expenses-empty">
                <div className="moto-expenses-empty-icon">
                  ₹
                </div>

                <h3>No expenses recorded</h3>

                <p>
                  Add your first ride expense to start
                  tracking your trip spending.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(true);
                    setError("");
                    setSuccess("");
                  }}
                >
                  ADD FIRST EXPENSE
                </button>
              </div>
            ) : (
              <div className="moto-expenses-list">
                {expenses.map((expense) => (
                  <article
                    className="moto-expense-item"
                    key={expense.id}
                  >
                    <div className="moto-expense-icon">
                      {CATEGORY_ICONS[
                        expense.category
                      ] || "₹"}
                    </div>

                    <div className="moto-expense-info">
                      <div className="moto-expense-topline">
                        <span className="moto-expense-category">
                          {
                            CATEGORY_LABELS[
                              expense.category
                            ]
                          }
                        </span>

                        <span className="moto-expense-date">
                          {formatDate(
                            expense.createdAt
                          )}
                        </span>
                      </div>

                      <h3>
                        {expense.description ||
                          "Ride expense"}
                      </h3>
                    </div>

                    <div className="moto-expense-amount">
                      <strong>
                        {formatCurrency(
                          expense.amount
                        )}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteExpense(
                            expense.id
                          )
                        }
                        aria-label={`Delete ${
                          expense.description ||
                          "expense"
                        }`}
                      >
                        DELETE
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* BREAKDOWN */}
          <aside className="moto-expenses-breakdown">
            <div className="moto-expenses-section-heading">
              <div>
                <span>SPENDING ANALYSIS</span>
                <h2>BREAKDOWN</h2>
              </div>
            </div>

            <div className="moto-expenses-breakdown-list">
              {EXPENSE_CATEGORIES.map((category) => {
                const amount =
                  categoryTotals[category];

                const percentage =
                  getCategoryPercentage(category);

                return (
                  <div
                    className="moto-expense-breakdown-item"
                    key={category}
                  >
                    <div className="moto-expense-breakdown-top">
                      <span>
                        {CATEGORY_LABELS[category]}
                      </span>

                      <strong>
                        {formatCurrency(amount)}
                      </strong>
                    </div>

                    <div
                      className="moto-expense-progress"
                      aria-label={`${CATEGORY_LABELS[category]} ${
                        percentage
                      } percent of total`}
                    >
                      <span
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <small>
                      {percentage}% of total
                    </small>
                  </div>
                );
              })}
            </div>

            <div className="moto-expenses-total">
              <span>TOTAL</span>

              <strong>
                {formatCurrency(totalExpense)}
              </strong>
            </div>

            <div className="moto-expenses-note">
              <span>RIDE ID</span>

              <strong>
                {rideId || "DEFAULT"}
              </strong>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default Expenses;