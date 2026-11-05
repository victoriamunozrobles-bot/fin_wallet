import Budget from "../models/Budget.js";
import RecurringPayment from "../models/RecurringPayment.js";
import SavingsGoal from "../models/SavingsGoal.js";
import Transaction from "../models/Transaction.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboardSummary = asyncHandler(async (_req, res) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const [income, expenses, goals, budgets, payments] = await Promise.all([
    Transaction.aggregate([
      { $match: { type: { $in: ["income", "expense"] } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { type: "expense", date: { $gte: start, $lt: end } } },
      { $group: { _id: "$categoryId", spentAmount: { $sum: "$amount" } } },
    ]),
    SavingsGoal.aggregate([{ $group: { _id: null, total: { $sum: "$currentAmount" } } }]),
    Budget.find({ month, year }).populate("categoryId").lean(),
    RecurringPayment.find({ active: true }).populate("categoryId paymentMethodId").sort({ billingDay: 1 }).lean(),
  ]);
  const incomeTotal = income.find((item) => item._id === "income")?.total ?? 0;
  const expenseTotal = income.find((item) => item._id === "expense")?.total ?? 0;
  const totalSaved = goals[0]?.total ?? 0;
  const spentByCategory = new Map(expenses.map((item) => [String(item._id), item.spentAmount]));
  const budgetAlerts = budgets.map((budget) => {
    const spentAmount = spentByCategory.get(String(budget.categoryId?._id)) ?? 0;
    const usagePercent = budget.limitAmount ? spentAmount / budget.limitAmount * 100 : 0;
    return { ...budget, spentAmount, usagePercent };
  }).filter((budget) => budget.usagePercent >= budget.alertThreshold);
  const upcomingRecurringPayments = payments.filter((payment) => payment.lastBilledPeriod !== `${year}-${String(month).padStart(2, "0")}`);
  res.json({
    totalIncome: incomeTotal,
    totalExpenses: expenseTotal,
    totalSaved,
    availableBalance: incomeTotal - expenseTotal - totalSaved,
    budgetAlerts,
    upcomingRecurringPayments,
  });
});
