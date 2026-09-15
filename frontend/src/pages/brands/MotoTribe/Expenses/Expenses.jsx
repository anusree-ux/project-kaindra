import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "./Expenses.css";

const defaultExpenses = [
  {
    id: 1,
    category: "FUEL",
    description: "Fuel refill",
    amount: 1250,
    date: "20 Sep 2026",
  },
  {
    id: 2,
    category: "FOOD",
    description: "Lunch stop",
    amount: 450,
    date: "20 Sep 2026",
  },
  {
    id: 3,
    category: "STAY",
    description: "Hotel",
    amount: 1800,
    date: "20 Sep 2026",
  },
];

function Expenses() {
  const { rideId } = useParams();

  const storageKey = `mototribeExpenses_${rideId}`;

  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    category: "FUEL",
    description: "",
    amount: "",
  });

  useEffect(() => {
    const savedExpenses = localStorage.getItem(storageKey);

    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    } else {
      setExpenses(defaultExpenses);
    }
  }, [storageKey]);

  const saveExpenses = (updatedExpenses) => {
    setExpenses(updatedExpenses);

    localStorage.setItem(
      storageKey,
      JSON.stringify(updatedExpenses)
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const addExpense = (event) => {
    event.preventDefault();

    if (!form.description.trim() || !form.amount) {
      return;
    }

    const newExpense = {
      id: Date.now(),
      category: form.category,
      description: form.description,
      amount: Number(form.amount),
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    saveExpenses([newExpense, ...expenses]);

    setForm({
      category: "FUEL",
      description: "",
      amount: "",
    });

    setShowForm(false);
  };

  const deleteExpense = (id) => {
    const updatedExpenses = expenses.filter(
      (expense) => expense.id !== id
    );

    saveExpenses(updatedExpenses);
  };

  const totalExpense = useMemo(() => {
    return expenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0
    );
  }, [expenses]);

  const fuelTotal = useMemo(() => {
    return expenses
      .filter((expense) => expense.category === "FUEL")
      .reduce(
        (total, expense) => total + Number(expense.amount),
        0
      );
  }, [expenses]);

  const foodTotal = useMemo(() => {
    return expenses
      .filter((expense) => expense.category === "FOOD")
      .reduce(
        (total, expense) => total + Number(expense.amount),
        0
      );
  }, [expenses]);

  const stayTotal = useMemo(() => {
    return expenses
      .filter((expense) => expense.category === "STAY")
      .reduce(
        (total, expense) => total + Number(expense.amount),
        0
      );
  }, [expenses]);

  const serviceTotal = useMemo(() => {
    return expenses
      .filter((expense) => expense.category === "SERVICE")
      .reduce(
        (total, expense) => total + Number(expense.amount),
        0
      );
  }, [expenses]);

  return (
    <section className="moto-expenses">

      <div className="expenses-container">

        <div className="expenses-header">
          <div>
            <span>RIDE JOURNAL</span>

            <h1>RIDE EXPENSES</h1>

            <p>
              Track fuel, food, accommodation and service
              expenses for every journey.
            </p>
          </div>

          <button
            className="add-expense-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "CLOSE" : "+ ADD EXPENSE"}
          </button>
        </div>

        {showForm && (
          <form
            className="expense-form"
            onSubmit={addExpense}
          >

            <div className="form-field">
              <label>CATEGORY</label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="FUEL">FUEL</option>
                <option value="FOOD">FOOD</option>
                <option value="STAY">STAY</option>
                <option value="SERVICE">SERVICE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div className="form-field">
              <label>DESCRIPTION</label>

              <input
                type="text"
                name="description"
                placeholder="Example: Petrol refill"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>AMOUNT</label>

              <input
                type="number"
                name="amount"
                placeholder="₹ Amount"
                min="1"
                value={form.amount}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="save-expense-button"
            >
              SAVE EXPENSE
            </button>

          </form>
        )}

        <div className="expense-summary">

          <div className="summary-card total">
            <span>TOTAL EXPENSE</span>
            <strong>₹{totalExpense.toLocaleString("en-IN")}</strong>
          </div>

          <div className="summary-card">
            <span>FUEL</span>
            <strong>₹{fuelTotal.toLocaleString("en-IN")}</strong>
          </div>

          <div className="summary-card">
            <span>FOOD</span>
            <strong>₹{foodTotal.toLocaleString("en-IN")}</strong>
          </div>

          <div className="summary-card">
            <span>STAY</span>
            <strong>₹{stayTotal.toLocaleString("en-IN")}</strong>
          </div>

          <div className="summary-card">
            <span>SERVICE</span>
            <strong>₹{serviceTotal.toLocaleString("en-IN")}</strong>
          </div>

        </div>

        <div className="expenses-content">

          <div className="expenses-list-section">

            <div className="section-title">
              <span>01</span>
              <h2>EXPENSE HISTORY</h2>
            </div>

            {expenses.length === 0 ? (
              <div className="empty-expenses">
                <h3>NO EXPENSES RECORDED</h3>
                <p>
                  Add your first expense to start building
                  this ride's financial record.
                </p>
              </div>
            ) : (
              <div className="expenses-list">

                {expenses.map((expense) => (
                  <div
                    className="expense-row"
                    key={expense.id}
                  >

                    <div className="expense-icon">
                      {expense.category.charAt(0)}
                    </div>

                    <div className="expense-info">
                      <strong>
                        {expense.description}
                      </strong>

                      <span>
                        {expense.category} · {expense.date}
                      </span>
                    </div>

                    <strong className="expense-amount">
                      ₹{Number(expense.amount).toLocaleString("en-IN")}
                    </strong>

                    <button
                      className="delete-expense"
                      onClick={() =>
                        deleteExpense(expense.id)
                      }
                    >
                      ×
                    </button>

                  </div>
                ))}

              </div>
            )}

          </div>

          <aside className="expense-breakdown">

            <div className="section-title">
              <span>02</span>
              <h2>BREAKDOWN</h2>
            </div>

            <div className="breakdown-item">
              <div>
                <span>FUEL</span>
                <strong>₹{fuelTotal}</strong>
              </div>

              <div className="breakdown-bar">
                <div
                  style={{
                    width:
                      totalExpense > 0
                        ? `${(fuelTotal / totalExpense) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            <div className="breakdown-item">
              <div>
                <span>FOOD</span>
                <strong>₹{foodTotal}</strong>
              </div>

              <div className="breakdown-bar">
                <div
                  style={{
                    width:
                      totalExpense > 0
                        ? `${(foodTotal / totalExpense) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            <div className="breakdown-item">
              <div>
                <span>STAY</span>
                <strong>₹{stayTotal}</strong>
              </div>

              <div className="breakdown-bar">
                <div
                  style={{
                    width:
                      totalExpense > 0
                        ? `${(stayTotal / totalExpense) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            <div className="breakdown-item">
              <div>
                <span>SERVICE</span>
                <strong>₹{serviceTotal}</strong>
              </div>

              <div className="breakdown-bar">
                <div
                  style={{
                    width:
                      totalExpense > 0
                        ? `${(serviceTotal / totalExpense) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

          </aside>

        </div>

        <div className="expense-note">
          <span>DEMO MODE</span>
          <p>
            Expenses are currently stored locally in the
            browser. Backend synchronization will be added
            later.
          </p>
        </div>

      </div>

    </section>
  );
}

export default Expenses;