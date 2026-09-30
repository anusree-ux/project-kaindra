const RideExpense = require("../../models/mototribe/RideExpense");
const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const AppError = require("../../utils/AppError");

/**
 * Helper to check if logged-in user is organizer or confirmed participant
 */
const verifyParticipantOrOrganizer = async (ride, userId) => {
  const isOrganizer = ride.organizerId.toString() === userId.toString();
  const participant = await RideParticipant.findOne({
    rideId: ride._id,
    userId,
    status: "confirmed",
  });

  return isOrganizer || !!participant;
};

/**
 * @desc    Create an expense entry for a ride
 * @route   POST /api/mototribe/rides/:id/expenses
 * @access  Private (Organizer or Confirmed Participant)
 */
const createExpense = async (req, res, next) => {
  try {
    const rideId = req.params.id;
    const userId = req.user._id;
    const { category, amount, note } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    const isAuthorized = await verifyParticipantOrOrganizer(ride, userId);
    if (!isAuthorized) {
      return next(
        new AppError(
          "You must be an organizer or confirmed participant of this ride to log expenses.",
          403
        )
      );
    }

    const expense = await RideExpense.create({
      rideId,
      userId,
      category,
      amount,
      note,
    });

    res.status(201).json({
      status: "success",
      message: "Expense logged successfully.",
      data: {
        expense,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all expense entries for a ride
 * @route   GET /api/mototribe/rides/:id/expenses
 * @access  Private (Organizer or Confirmed Participant)
 */
const getRideExpenses = async (req, res, next) => {
  try {
    const rideId = req.params.id;
    const userId = req.user._id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    const isAuthorized = await verifyParticipantOrOrganizer(ride, userId);
    if (!isAuthorized) {
      return next(
        new AppError(
          "You must be an organizer or confirmed participant of this ride to view expenses.",
          403
        )
      );
    }

    const expenses = await RideExpense.find({ rideId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: expenses.length,
      data: {
        expenses,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get expense summary for a ride (totals, category breakdown, per-user breakdown, budget comparison)
 * @route   GET /api/mototribe/rides/:id/expenses/summary
 * @access  Private (Organizer or Confirmed Participant)
 */
const getRideExpenseSummary = async (req, res, next) => {
  try {
    const rideId = req.params.id;
    const userId = req.user._id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    const isAuthorized = await verifyParticipantOrOrganizer(ride, userId);
    if (!isAuthorized) {
      return next(
        new AppError(
          "You must be an organizer or confirmed participant of this ride to view expense summary.",
          403
        )
      );
    }

    const expenses = await RideExpense.find({ rideId }).populate("userId", "name");

    let totalSpent = 0;
    const categoryBreakdown = {
      fuel: 0,
      accommodation: 0,
      food: 0,
      toll: 0,
      maintenance: 0,
      other: 0,
    };
    const userMap = {};

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      totalSpent += amt;

      if (categoryBreakdown[exp.category] !== undefined) {
        categoryBreakdown[exp.category] += amt;
      } else {
        categoryBreakdown[exp.category] = amt;
      }

      const uIdStr = exp.userId._id.toString();
      if (!userMap[uIdStr]) {
        userMap[uIdStr] = {
          userId: exp.userId._id,
          userName: exp.userId.name,
          totalSpent: 0,
        };
      }
      userMap[uIdStr].totalSpent += amt;
    }

    const budget = Number(ride.budget) || 0;
    const difference = budget - totalSpent;
    const isOverBudget = totalSpent > budget;

    res.status(200).json({
      status: "success",
      data: {
        summary: {
          totalSpent,
          categoryBreakdown,
          userBreakdown: Object.values(userMap),
          budgetComparison: {
            budget,
            totalSpent,
            difference,
            isOverBudget,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an expense entry (Entry owner only)
 * @route   PATCH /api/mototribe/rides/:id/expenses/:expenseId
 * @access  Private (Owner)
 */
const updateExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user._id;
    const { category, amount, note } = req.body;

    const expense = await RideExpense.findById(expenseId);
    if (!expense) {
      return next(new AppError("Expense entry not found.", 404));
    }

    if (expense.userId.toString() !== userId.toString()) {
      return next(
        new AppError("You can only edit your own expense entries.", 403)
      );
    }

    if (category !== undefined) expense.category = category;
    if (amount !== undefined) expense.amount = amount;
    if (note !== undefined) expense.note = note;

    await expense.save();

    res.status(200).json({
      status: "success",
      message: "Expense updated successfully.",
      data: {
        expense,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an expense entry (Entry owner only)
 * @route   DELETE /api/mototribe/rides/:id/expenses/:expenseId
 * @access  Private (Owner)
 */
const deleteExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user._id;

    const expense = await RideExpense.findById(expenseId);
    if (!expense) {
      return next(new AppError("Expense entry not found.", 404));
    }

    if (expense.userId.toString() !== userId.toString()) {
      return next(
        new AppError("You can only delete your own expense entries.", 403)
      );
    }

    await RideExpense.deleteOne({ _id: expense._id });

    res.status(200).json({
      status: "success",
      message: "Expense entry deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getRideExpenses,
  getRideExpenseSummary,
  updateExpense,
  deleteExpense,
};
