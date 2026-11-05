import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import { asyncHandler, httpError } from "../utils/asyncHandler.js";

async function withSpentAmount(budget) {
  const start = new Date(budget.year, budget.month - 1, 1);
  const end = new Date(budget.year, budget.month, 1);
  const result = await Transaction.aggregate([
    { $match: { type: "expense", categoryId: budget.categoryId?._id ?? budget.categoryId, date: { $gte: start, $lt: end } } },
    { $group: { _id: null, spentAmount: { $sum: "$amount" } } },
  ]);
  const spentAmount = result[0]?.spentAmount ?? 0;
  return { ...budget, spentAmount, usagePercent: budget.limitAmount ? spentAmount / budget.limitAmount * 100 : 0 };
}

export const listBudgets = asyncHandler(async (req, res) => {
  const date = new Date();
  const month = Number(req.query.month) || date.getMonth() + 1;
  const year = Number(req.query.year) || date.getFullYear();
  const budgets = await Budget.find({ month, year }).populate("categoryId").sort({ createdAt: -1 }).lean();
  res.json(await Promise.all(budgets.map(withSpentAmount)));
});

export const createBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.create(req.body);
  const populated = await budget.populate("categoryId");
  res.status(201).json(await withSpentAmount(populated.toObject()));
});

export const updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate("categoryId");
  if (!budget) throw httpError(404, "Presupuesto no encontrado.");
  res.json(await withSpentAmount(budget.toObject()));
});

export const deleteBudget = asyncHandler(async (req, res) => {
  const result = await Budget.findByIdAndDelete(req.params.id);
  if (!result) throw httpError(404, "Presupuesto no encontrado.");
  res.status(204).end();
});
