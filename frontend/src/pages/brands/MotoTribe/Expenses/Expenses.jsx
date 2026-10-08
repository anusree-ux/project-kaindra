import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./Expenses.css";

const EXPENSE_CATEGORIES = [
  "fuel",
  "food",
  "accommodation",
  "maintenance",
  "toll",
  "other",
];

const CATEGORY_LABELS = {
  fuel: "Fuel",
  food: "Food",
  accommodation: "Stay",
  maintenance: "Service",
  toll: "Toll",
  other: "Other",
};

const CATEGORY_ICONS = {
  fuel: "⛽",
  food: "🍲",
  accommodation: "🏨",
  maintenance: "🔧",
  toll: "🛣️",
  other: "💵",
};

function createEmptyForm() {
  return {
    category: "fuel",
    description: "",
    amount: "",
  };
}

function Expenses() {
  const { rideId } = useParams();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [form, setForm] = useState(createEmptyForm);
  const [activeTab, setActiveTab] = useState("ALL");

  const fetchExpenses = useCallback(async () => {
    if (!rideId || !isAuthenticated) return;
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.allSettled([
        apiClient.get(`/api/mototribe/rides/${rideId}/expenses`),
        apiClient.get(`/api/mototribe/rides/${rideId}/expenses/summary`),
      ]);

      if (listRes.status === "fulfilled" && listRes.value.data?.data?.expenses) {
        setExpenses(listRes.value.data.data.expenses);
      }
      if (summaryRes.status === "fulfilled" && summaryRes.value.data?.data?.summary) {
        setSummary(summaryRes.value.data.data.summary);
      }
    } catch (err) {
      console.error("Failed to load expenses from DB:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, rideId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddExpense = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const cleanAmount = Number(form.amount);
    if (!cleanAmount || cleanAmount <= 0) return;

    if (rideId) {
      try {
        await apiClient.post(`/api/mototribe/rides/${rideId}/expenses`, {
          category: form.category,
          amount: cleanAmount,
          note: form.description.trim() || undefined,
        });
        setForm(createEmptyForm());
        await fetchExpenses();
      } catch (err) {
        console.error("Failed to post expense to DB:", err);
      }
    } else {
      // Local fallback if no rideId selected
      const newEntry = {
        _id: `exp-${Date.now()}`,
        category: form.category,
        amount: cleanAmount,
        note: form.description.trim(),
        createdAt: new Date().toISOString(),
      };
      setExpenses((prev) => [newEntry, ...prev]);
      setForm(createEmptyForm());
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (rideId && isAuthenticated) {
      try {
        await apiClient.delete(`/api/mototribe/rides/${rideId}/expenses/${expenseId}`);
        await fetchExpenses();
      } catch (err) {
        console.error("Failed to delete expense:", err);
      }
    } else {
      setExpenses((prev) => prev.filter((e) => (e._id || e.id) !== expenseId));
    }
  };

  const totalSpent = useMemo(() => {
    if (summary?.totalSpent !== undefined) return summary.totalSpent;
    return expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expenses, summary]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      if (filter === "ALL") return true;
      return (item.category || "").toLowerCase() === filter.toLowerCase();
    });
  }, [expenses, filter]);

  return (
    <section className="expenses-section">
      <div className="expenses-container">
        <div className="expenses-header">
          <div>
            <span className="expenses-eyebrow">RIDE LOGISTICS</span>
            <h2>Expense Management</h2>
            <p>Log fuel stops, meals, tolls, and maintenance costs with automatic database synchronization.</p>
          </div>

          <div className="expenses-total-card">
            <span>TOTAL EXPENDITURE</span>
            <strong>₹{totalSpent.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="expenses-layout">
          {/* LOG FORM */}
          <div className="expense-form-card">
            <h3>LOG AN EXPENSE</h3>
            <form onSubmit={handleAddExpense}>
              <div className="form-field">
                <label>CATEGORY</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>AMOUNT (₹)</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="1"
                  required
                />
              </div>

              <div className="form-field">
                <label>DESCRIPTION / NOTE</label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="e.g. Highway Petrol Pump"
                />
              </div>

              <button type="submit" className="submit-expense-btn">
                ADD EXPENSE
              </button>
            </form>
          </div>

          {/* LIST */}
          <div className="expenses-list-card">
            <div className="expenses-filters">
              {["ALL", ...EXPENSE_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  className={`filter-btn ${filter === cat ? "active" : ""}`}
                  onClick={() => setFilter(cat)}
                >
                  {cat === "ALL" ? "ALL" : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            <div className="expense-items">
              {loading ? (
                <div className="expense-empty">Loading expenses...</div>
              ) : filteredExpenses.length > 0 ? (
                filteredExpenses.map((item) => (
                  <div className="expense-item" key={item._id || item.id}>
                    <div className="expense-icon">
                      {CATEGORY_ICONS[item.category] || "💵"}
                    </div>
                    <div className="expense-info">
                      <h4>{item.note || item.description || CATEGORY_LABELS[item.category] || "Expense"}</h4>
                      <small>{new Date(item.createdAt).toLocaleDateString("en-IN")}</small>
                    </div>
                    <div className="expense-amount">
                      <strong>₹{Number(item.amount).toLocaleString("en-IN")}</strong>
                      <button
                        type="button"
                        className="delete-exp-btn"
                        onClick={() => handleDeleteExpense(item._id || item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="expense-empty">No expenses logged yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Expenses;
