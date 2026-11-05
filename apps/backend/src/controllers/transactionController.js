import mongoose from "mongoose";
import Category from "../models/Category.js";
import PaymentMethod from "../models/PaymentMethod.js";
import SavingsGoal from "../models/SavingsGoal.js";
import Transaction from "../models/Transaction.js";
import { asyncHandler, httpError, inTransaction } from "../utils/asyncHandler.js";

const refs = [
  { path: "categoryId" },
  { path: "paymentMethodId" },
  { path: "savingsGoalId" },
];

function signedSavingsEffect(transaction) {
  if (transaction.type !== "transfer_to_savings") return 0;
  return transaction.transferDirection === "withdraw" ? -transaction.amount : transaction.amount;
}

async function validateReferences(data) {
  if (data.type !== "transfer_to_savings" && !data.categoryId) throw httpError(400, "categoryId es obligatorio.");
  if (data.categoryId && !await Category.exists({ _id: data.categoryId })) throw httpError(400, "La categoría indicada no existe.");
  if (data.paymentMethodId && !await PaymentMethod.exists({ _id: data.paymentMethodId })) throw httpError(400, "El medio de pago indicado no existe.");
  if (data.type === "transfer_to_savings" && !data.savingsGoalId) throw httpError(400, "savingsGoalId es obligatorio para un traspaso.");
  if (data.savingsGoalId && !await SavingsGoal.exists({ _id: data.savingsGoalId })) throw httpError(400, "La meta de ahorro indicada no existe.");
}

async function applyGoalDelta(goalId, delta, session) {
  if (!goalId || delta === 0) return;
  const condition = delta < 0 ? { _id: goalId, currentAmount: { $gte: -delta } } : { _id: goalId };
  const result = await SavingsGoal.updateOne(condition, { $inc: { currentAmount: delta } }, { session, runValidators: true });
  if (result.matchedCount !== 1) throw httpError(400, "El saldo de la meta no alcanza para este retiro.");
}

async function currentAvailableBalance(session) {
  const incomeResult = await Transaction.aggregate([
    { $match: { type: "income" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).session(session);
  const expenseResult = await Transaction.aggregate([
    { $match: { type: "expense" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).session(session);
  const savedResult = await SavingsGoal.aggregate([
    { $group: { _id: null, total: { $sum: "$currentAmount" } } },
  ]).session(session);
  return (incomeResult[0]?.total ?? 0) - (expenseResult[0]?.total ?? 0) - (savedResult[0]?.total ?? 0);
}

function parseDate(value, field) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw httpError(400, `${field} no es una fecha válida.`);
  return date;
}

export const listTransactions = asyncHandler(async (req, res) => {
  const { startDate, endDate, categoryId, paymentMethodId, type, q } = req.query;
  const filter = {};
  if (type) {
    if (!["income", "expense", "transfer_to_savings"].includes(type)) throw httpError(400, "type no es válido.");
    filter.type = type;
  }
  if (categoryId) filter.categoryId = new mongoose.Types.ObjectId(categoryId);
  if (paymentMethodId) filter.paymentMethodId = new mongoose.Types.ObjectId(paymentMethodId);
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = parseDate(startDate, "startDate");
    if (endDate) {
      filter.date.$lte = parseDate(endDate, "endDate");
      if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) filter.date.$lte.setHours(23, 59, 59, 999);
    }
    if (filter.date.$gte && filter.date.$lte && filter.date.$gte > filter.date.$lte) throw httpError(400, "startDate debe ser anterior a endDate.");
  }
  if (q) {
    const text = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const [matchingCategories, matchingMethods] = await Promise.all([
      Category.find({ name: { $regex: text, $options: "i" } }).distinct("_id"),
      PaymentMethod.find({ name: { $regex: text, $options: "i" } }).distinct("_id"),
    ]);
    filter.$or = [
      { description: { $regex: text, $options: "i" } },
      { categoryId: { $in: matchingCategories } },
      { paymentMethodId: { $in: matchingMethods } },
    ];
  }
  const transactions = await Transaction.find(filter).populate(refs).sort({ date: -1, createdAt: -1 }).limit(2000).lean();
  res.json(transactions);
});

export const createTransaction = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!["income", "expense", "transfer_to_savings"].includes(data.type)) throw httpError(400, "type no es válido.");
  if (!Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0) throw httpError(400, "amount debe ser mayor a cero.");
  data.amount = Number(data.amount);
  data.date = parseDate(data.date, "date");
  await validateReferences(data);
  const transaction = await inTransaction(async (session) => {
    if (data.type === "transfer_to_savings") {
      const direction = data.transferDirection ?? "deposit";
      if (!["deposit", "withdraw"].includes(direction)) throw httpError(400, "transferDirection no es válido.");
      const effect = direction === "withdraw" ? -data.amount : data.amount;
      await applyGoalDelta(data.savingsGoalId, effect, session);
      if (direction === "deposit" && await currentAvailableBalance(session) < 0) throw httpError(400, "El saldo disponible no alcanza para este ahorro.");
      data.transferDirection = direction;
    }
    const [created] = await Transaction.create([data], { session });
    return created;
  });
  await transaction.populate(refs);
  res.status(201).json(transaction);
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await inTransaction(async (session) => {
    const previous = await Transaction.findById(req.params.id).session(session);
    if (!previous) throw httpError(404, "Transacción no encontrada.");
    const data = { ...req.body };
    if (data.type && !["income", "expense", "transfer_to_savings"].includes(data.type)) throw httpError(400, "type no es válido.");
    if (data.amount !== undefined) {
      if (!Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0) throw httpError(400, "amount debe ser mayor a cero.");
      data.amount = Number(data.amount);
    }
    if (data.date !== undefined) data.date = parseDate(data.date, "date");
    const next = { ...previous.toObject(), ...data };
    await validateReferences(next);
    if (previous.type === "transfer_to_savings") await applyGoalDelta(previous.savingsGoalId, -signedSavingsEffect(previous), session);
    if (next.type === "transfer_to_savings") {
      const effect = signedSavingsEffect(next);
      await applyGoalDelta(next.savingsGoalId, effect, session);
      if (next.transferDirection !== "withdraw" && await currentAvailableBalance(session) < 0) throw httpError(400, "El saldo disponible no alcanza para este ahorro.");
    }
    Object.assign(previous, data);
    return previous.save({ session });
  });
  await transaction.populate(refs);
  res.json(transaction);
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  await inTransaction(async (session) => {
    const transaction = await Transaction.findById(req.params.id).session(session);
    if (!transaction) throw httpError(404, "Transacción no encontrada.");
    if (transaction.type === "transfer_to_savings") await applyGoalDelta(transaction.savingsGoalId, -signedSavingsEffect(transaction), session);
    await transaction.deleteOne({ session });
  });
  res.status(204).end();
});
