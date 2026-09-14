const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const {
  createExpenseValidator,
  updateExpenseValidator,
  validate,
} = require("../../validators/expenseValidator");
const {
  createExpense,
  getRideExpenses,
  getRideExpenseSummary,
  updateExpense,
  deleteExpense,
} = require("../../controllers/mototribe/expenseController");

const router = express.Router();

router.use(protect);

router.post("/rides/:id/expenses", createExpenseValidator, validate, createExpense);
router.get("/rides/:id/expenses", getRideExpenses);
router.get("/rides/:id/expenses/summary", getRideExpenseSummary);

router.patch("/rides/:id/expenses/:expenseId", updateExpenseValidator, validate, updateExpense);
router.delete("/rides/:id/expenses/:expenseId", deleteExpense);

module.exports = router;
