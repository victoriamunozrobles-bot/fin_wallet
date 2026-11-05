import SavingsGoal from "../models/SavingsGoal.js";
import Transaction from "../models/Transaction.js";
import { asyncHandler, httpError, inTransaction } from "../utils/asyncHandler.js";

export const listSavingsGoals = asyncHandler(async (_req, res) => {
  res.json(await SavingsGoal.find().sort({ createdAt: -1 }).lean());
});

export const createSavingsGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.create(req.body);
  res.status(201).json(goal);
});

export const updateSavingsGoal = asyncHandler(async (req, res) => {
  if (Object.hasOwn(req.body, "currentAmount")) throw httpError(400, "Usa deposit o withdraw para cambiar el saldo de la meta.");
  const goal = await SavingsGoal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!goal) throw httpError(404, "Meta de ahorro no encontrada.");
  res.json(goal);
});

export const deleteSavingsGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) throw httpError(404, "Meta de ahorro no encontrada.");
  if (goal.currentAmount !== 0 || await Transaction.exists({ savingsGoalId: goal._id })) {
    throw httpError(409, "Retira el saldo y elimina o reasigna los movimientos de esta meta antes de borrarla.");
  }
  await goal.deleteOne();
  res.status(204).end();
});

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

async function changeGoalBalance(req, res, direction) {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw httpError(400, "amount debe ser mayor a cero.");
  const transaction = await inTransaction(async (session) => {
    const goal = await SavingsGoal.findById(req.params.id).session(session);
    if (!goal) throw httpError(404, "Meta de ahorro no encontrada.");
    if (direction === "deposit" && amount > await currentAvailableBalance(session)) throw httpError(400, "El saldo disponible no alcanza para este ahorro.");
    if (direction === "withdraw" && amount > goal.currentAmount) throw httpError(400, "El saldo de la meta no alcanza para este retiro.");
    goal.currentAmount += direction === "deposit" ? amount : -amount;
    await goal.save({ session });
    const [created] = await Transaction.create([{
      type: "transfer_to_savings",
      amount,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      description: req.body.description || (direction === "deposit" ? `Aporte a ${goal.name}` : `Retiro de ${goal.name}`),
      savingsGoalId: goal._id,
      transferDirection: direction === "deposit" ? "deposit" : "withdraw",
    }], { session });
    return created;
  });
  await transaction.populate("savingsGoalId");
  res.status(201).json(transaction);
}

export const depositToGoal = asyncHandler((req, res) => changeGoalBalance(req, res, "deposit"));
export const withdrawFromGoal = asyncHandler((req, res) => changeGoalBalance(req, res, "withdraw"));
