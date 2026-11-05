import { Router } from "express";
import Budget from "../models/Budget.js";
import Category from "../models/Category.js";
import Debt from "../models/Debt.js";
import PaymentMethod from "../models/PaymentMethod.js";
import RecurringPayment from "../models/RecurringPayment.js";
import SavingsGoal from "../models/SavingsGoal.js";
import Transaction from "../models/Transaction.js";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import { listBudgets, createBudget, updateBudget, deleteBudget } from "../controllers/budgetController.js";
import { resourceController } from "../controllers/resourceController.js";
import {
  createSavingsGoal,
  deleteSavingsGoal,
  depositToGoal,
  listSavingsGoals,
  updateSavingsGoal,
  withdrawFromGoal,
} from "../controllers/savingsGoalController.js";
import {
  createRecurringPayment,
  deleteRecurringPayment,
  listRecurringPayments,
  processDuePayments,
  simulateRecurringPayment,
  updateRecurringPayment,
} from "../controllers/recurringPaymentController.js";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from "../controllers/transactionController.js";
import { resetSeed } from "../controllers/seedController.js";
import { asyncHandler, httpError } from "../utils/asyncHandler.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import auth from "./auth.js";

const api = Router();
const categoryController = resourceController(Category, {
  beforeDelete: async (item, userId) => {
    const referenced = await Promise.all([
      Transaction.exists({ userId, categoryId: item._id }),
      Budget.exists({ userId, categoryId: item._id }),
      RecurringPayment.exists({ userId, categoryId: item._id }),
    ]);
    if (referenced.some(Boolean)) throw httpError(409, "La categoría está asociada a movimientos, presupuestos o pagos automáticos.");
  },
});
const paymentMethodController = resourceController(PaymentMethod, {
  beforeDelete: async (item, userId) => {
    const referenced = await Promise.all([
      Transaction.exists({ userId, paymentMethodId: item._id }),
      RecurringPayment.exists({ userId, paymentMethodId: item._id }),
    ]);
    if (referenced.some(Boolean)) throw httpError(409, "El medio de pago está asociado a movimientos o pagos automáticos.");
  },
});
const debtController = resourceController(Debt);

api.get("/health", (_req, res) => res.json({ status: "ok", database: "connected" }));
api.use("/auth", auth);
api.use(authMiddleware);
api.get("/dashboard/summary", getDashboardSummary);

api.route("/transactions")
  .get(listTransactions)
  .post(createTransaction);
api.route("/transactions/:id")
  .put(updateTransaction)
  .delete(deleteTransaction);

api.route("/categories")
  .get(categoryController.list)
  .post(categoryController.create);
api.route("/categories/:id")
  .put(categoryController.update)
  .delete(categoryController.remove);

api.route("/payment-methods")
  .get(paymentMethodController.list)
  .post(paymentMethodController.create);
api.route("/payment-methods/:id")
  .put(paymentMethodController.update)
  .delete(paymentMethodController.remove);

api.route("/budgets")
  .get(listBudgets)
  .post(createBudget);
api.route("/budgets/:id")
  .put(updateBudget)
  .delete(deleteBudget);

api.route("/savings-goals")
  .get(listSavingsGoals)
  .post(createSavingsGoal);
api.post("/savings-goals/:id/deposit", depositToGoal);
api.post("/savings-goals/:id/withdraw", withdrawFromGoal);
api.route("/savings-goals/:id")
  .put(updateSavingsGoal)
  .delete(deleteSavingsGoal);

api.post("/recurring-payments/process-due", processDuePayments);
api.post("/recurring-payments/:id/simulate", simulateRecurringPayment);
api.route("/recurring-payments")
  .get(listRecurringPayments)
  .post(createRecurringPayment);
api.route("/recurring-payments/:id")
  .put(updateRecurringPayment)
  .delete(deleteRecurringPayment);

api.route("/debts")
  .get(debtController.list)
  .post(debtController.create);
api.route("/debts/:id")
  .put(debtController.update)
  .delete(debtController.remove);

api.post("/seed/reset", resetSeed);

api.use((_req, _res, next) => next(httpError(404, "Ruta API no encontrada.")));

export default api;
