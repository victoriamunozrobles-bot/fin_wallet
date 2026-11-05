import Budget from "../models/Budget.js";
import Category from "../models/Category.js";
import Debt from "../models/Debt.js";
import PaymentMethod from "../models/PaymentMethod.js";
import RecurringPayment from "../models/RecurringPayment.js";
import SavingsGoal from "../models/SavingsGoal.js";
import Transaction from "../models/Transaction.js";

const dateInCurrentMonth = (day, now) => new Date(now.getFullYear(), now.getMonth(), Math.min(day, 28), 12);

export async function resetDemoData(userId) {
  await Promise.all([
    Transaction.deleteMany({ userId }),
    Budget.deleteMany({ userId }),
    RecurringPayment.deleteMany({ userId }),
    SavingsGoal.deleteMany({ userId }),
    Debt.deleteMany({ userId }),
    PaymentMethod.deleteMany({ userId }),
    Category.deleteMany({ userId }),
  ]);

  const categories = await Category.insertMany([
    { userId, name: "Comida", type: "expense", icon: "🥑", color: "#FFE5EC" },
    { userId, name: "Hogar", type: "expense", icon: "🏡", color: "#F3E8FF" },
    { userId, name: "Transporte", type: "expense", icon: "🚲", color: "#E2F5EA" },
    { userId, name: "Suscripciones", type: "expense", icon: "🎧", color: "#FFF0E5" },
    { userId, name: "Salud", type: "expense", icon: "🌷", color: "#FFE5EC" },
    { userId, name: "Salario", type: "income", icon: "✦", color: "#E2F5EA" },
    { userId, name: "Freelance", type: "income", icon: "✿", color: "#F3E8FF" },
  ]);
  const category = Object.fromEntries(categories.map((item) => [item.name, item._id]));

  const methods = await PaymentMethod.insertMany([
    { userId, name: "Débito", type: "debit", icon: "▣", color: "#E2F5EA" },
    { userId, name: "Crédito", type: "credit", icon: "▣", color: "#FFE5EC" },
    { userId, name: "Efectivo", type: "cash", icon: "◉", color: "#FFF0E5" },
  ]);
  const method = Object.fromEntries(methods.map((item) => [item.name, item._id]));
  const goals = await SavingsGoal.insertMany([
    { userId, name: "Viaje a la costa", targetAmount: 900000, currentAmount: 260000, icon: "✿", color: "#FF4D8D" },
    { userId, name: "Fondo tranquilo", targetAmount: 1500000, currentAmount: 480000, icon: "✦", color: "#8B5CF6" },
  ]);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const budgets = await Budget.insertMany([
    { userId, categoryId: category.Comida, limitAmount: 100000, month, year, alertThreshold: 80 },
    { userId, categoryId: category.Hogar, limitAmount: 200000, month, year, alertThreshold: 80 },
    { userId, categoryId: category.Transporte, limitAmount: 100000, month, year, alertThreshold: 80 },
  ]);

  await Transaction.insertMany([
    { userId, type: "income", amount: 2535000, date: dateInCurrentMonth(1, now), description: "Sueldo mensual", categoryId: category.Salario, paymentMethodId: method["Débito"] },
    { userId, type: "income", amount: 85000, date: dateInCurrentMonth(3, now), description: "Proyecto de diseño", categoryId: category.Freelance, paymentMethodId: method["Débito"] },
    { userId, type: "expense", amount: 60000, date: dateInCurrentMonth(2, now), description: "Compra del súper", categoryId: category.Comida, paymentMethodId: method["Débito"] },
    { userId, type: "expense", amount: 170000, date: dateInCurrentMonth(5, now), description: "Servicios y compras del hogar", categoryId: category.Hogar, paymentMethodId: method["Débito"] },
    { userId, type: "expense", amount: 105000, date: dateInCurrentMonth(8, now), description: "Traslados del mes", categoryId: category.Transporte, paymentMethodId: method.Efectivo },
    { userId, type: "expense", amount: 15990, date: dateInCurrentMonth(10, now), description: "Streaming", categoryId: category.Suscripciones, paymentMethodId: method["Crédito"] },
    { userId, type: "expense", amount: 22990, date: dateInCurrentMonth(12, now), description: "Farmacia", categoryId: category.Salud, paymentMethodId: method["Débito"] },
    { userId, type: "transfer_to_savings", amount: 260000, date: dateInCurrentMonth(4, now), description: "Aporte inicial · Viaje a la costa", savingsGoalId: goals[0]._id, transferDirection: "deposit" },
    { userId, type: "transfer_to_savings", amount: 480000, date: dateInCurrentMonth(7, now), description: "Aporte inicial · Fondo tranquilo", savingsGoalId: goals[1]._id, transferDirection: "deposit" },
  ]);

  const nextBillingDay = (offset) => Math.min(now.getDate() + offset, 28);
  await RecurringPayment.insertMany([
    { userId, serviceName: "Streaming", amount: 15990, categoryId: category.Suscripciones, paymentMethodId: method["Crédito"], billingDay: nextBillingDay(4), active: true },
    { userId, serviceName: "Internet", amount: 32990, categoryId: category.Hogar, paymentMethodId: method["Débito"], billingDay: nextBillingDay(9), active: true },
    { userId, serviceName: "Música", amount: 4990, categoryId: category.Suscripciones, paymentMethodId: method["Débito"], billingDay: nextBillingDay(15), active: true },
  ]);

  await Debt.insertMany([
    { userId, direction: "i_owe", personName: "Tarjeta de crédito", amount: 84000, dueDate: dateInCurrentMonth(Math.min(now.getDate() + 6, 28), now), notes: "Cuota del mes" },
    { userId, direction: "owed_to_me", personName: "Camila", amount: 18000, dueDate: dateInCurrentMonth(Math.min(now.getDate() + 3, 28), now), notes: "Cena compartida" },
  ]);

  return { categories, methods, goals, budgets };
}
