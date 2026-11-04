import { useCallback, useEffect, useMemo, useReducer } from "react";
import FinanceContext from "./FinanceContextValue";
import { initialState, makeId, monthKey, today } from "./financeUtils";

const STORAGE_KEY = "fin-wallet-state-v1";

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TRANSACTION":
      return { ...state, transactions: [action.transaction, ...state.transactions] };
    case "UPDATE_TRANSACTION": {
      const previous = state.transactions.find((item) => item.id === action.transaction.id);
      const transaction = action.transaction;
      let goals = state.goals;
      if (previous?.type === "savings" && previous.goalId) {
        goals = goals.map((goal) => goal.id === previous.goalId ? { ...goal, saved: goal.saved - previous.amount } : goal);
      }
      if (transaction.type === "savings" && transaction.goalId) {
        goals = goals.map((goal) => goal.id === transaction.goalId ? { ...goal, saved: goal.saved + transaction.amount } : goal);
      }
      return { ...state, goals, transactions: state.transactions.map((item) => item.id === transaction.id ? transaction : item) };
    }
    case "DELETE_TRANSACTION": {
      const transaction = state.transactions.find((item) => item.id === action.id);
      const goals = transaction?.type === "savings" && transaction.goalId
        ? state.goals.map((goal) => goal.id === transaction.goalId ? { ...goal, saved: goal.saved - transaction.amount } : goal)
        : state.goals;
      return { ...state, goals, transactions: state.transactions.filter((item) => item.id !== action.id) };
    }
    case "SET_COLLECTION":
      return { ...state, [action.collection]: action.items };
    case "SET_PREFERENCES":
      return { ...state, preferences: { ...state.preferences, ...action.preferences } };
    case "ADD_ALERT":
      return { ...state, alerts: [action.alert, ...state.alerts].slice(0, 30) };
    case "PROCESS_AUTOMATIC_PAYMENTS": {
      const currentMonth = monthKey(action.date);
      const day = Number(action.date.slice(8, 10));
      const due = state.automaticPayments.filter((payment) => Number(payment.day) <= day && payment.lastChargedMonth !== currentMonth);
      if (!due.length) return state;
      const newTransactions = due.map((payment) => ({
        id: makeId(),
        type: "expense",
        amount: Number(payment.amount),
        date: action.date,
        category: payment.category,
        paymentMethod: payment.paymentMethod,
        description: `${payment.name} · pago automático`,
        automaticPaymentId: payment.id,
      }));
      const newAlerts = due.map((payment) => ({
        id: makeId(),
        kind: "automatic",
        message: `Se registró el pago de ${payment.name} por ${payment.amount}.`,
        date: action.date,
      }));
      return {
        ...state,
        transactions: [...newTransactions, ...state.transactions],
        automaticPayments: state.automaticPayments.map((payment) => due.some((item) => item.id === payment.id) ? { ...payment, lastChargedMonth: currentMonth } : payment),
        alerts: [...newAlerts, ...state.alerts].slice(0, 30),
      };
    }
    default:
      return state;
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialState;
    return { ...initialState, ...JSON.parse(saved) };
  } catch (error) {
    console.error("No se pudo cargar el estado guardado de Fin Wallet.", error);
    return initialState;
  }
}

export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("No se pudo guardar el estado de Fin Wallet.", error);
    }
  }, [state]);

  const addTransaction = useCallback((data) => {
    dispatch({ type: "ADD_TRANSACTION", transaction: { ...data, id: makeId(), amount: Number(data.amount) } });
  }, []);

  const updateTransaction = useCallback((data) => {
    const updated = { ...data, amount: Number(data.amount) };
    const previous = state.transactions.find((item) => item.id === updated.id);
    const nextGoals = state.goals.map((goal) => {
      const removedAmount = previous?.type === "savings" && previous.goalId === goal.id ? previous.amount : 0;
      const addedAmount = updated.type === "savings" && updated.goalId === goal.id ? updated.amount : 0;
      return { ...goal, saved: goal.saved - removedAmount + addedAmount };
    });
    if (nextGoals.some((goal) => goal.saved < 0) || (updated.type === "savings" && !nextGoals.some((goal) => goal.id === updated.goalId))) return false;
    if (updated.type === "savings" && updated.amount > 0) {
      const nextTransactions = state.transactions.map((item) => item.id === updated.id ? updated : item);
      const nextIncome = nextTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
      const nextExpenses = nextTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
      if (nextIncome - nextExpenses - nextGoals.reduce((sum, item) => sum + item.saved, 0) < 0) return false;
    }
    dispatch({ type: "UPDATE_TRANSACTION", transaction: updated });
    return true;
  }, [state.transactions, state.goals]);

  const addSavings = useCallback((goalId, amount, date = today(), description = "Aporte a meta") => {
    const value = Number(amount);
    const goal = state.goals.find((item) => item.id === goalId);
    const income = state.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = state.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
    const available = income - expenses - state.goals.reduce((sum, item) => sum + Number(item.saved), 0);
    if (!goal || value <= 0 || value > available) return false;
    dispatch({ type: "SET_COLLECTION", collection: "goals", items: state.goals.map((item) => item.id === goalId ? { ...item, saved: item.saved + value } : item) });
    addTransaction({ type: "savings", amount: value, date, category: goal.name, goalId, paymentMethod: "Ahorros", description });
    return true;
  }, [addTransaction, state.goals, state.transactions]);

  const withdrawSavings = useCallback((goalId, amount, date = today()) => {
    const value = Number(amount);
    const goal = state.goals.find((item) => item.id === goalId);
    if (!goal || value <= 0 || value > goal.saved) return false;
    dispatch({ type: "SET_COLLECTION", collection: "goals", items: state.goals.map((item) => item.id === goalId ? { ...item, saved: item.saved - value } : item) });
    addTransaction({ type: "savings", amount: -value, date, category: goal.name, goalId, paymentMethod: "Ahorros", description: "Retiro de meta" });
    return true;
  }, [addTransaction, state.goals]);

  const totals = useMemo(() => {
    const totalIncome = state.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenses = state.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
    const totalSavings = state.goals.reduce((sum, item) => sum + Number(item.saved), 0);
    return { totalIncome, totalExpenses, totalSavings, available: totalIncome - totalExpenses - totalSavings };
  }, [state.transactions, state.goals]);

  const processAutomaticPayments = useCallback((date = today()) => {
    dispatch({ type: "PROCESS_AUTOMATIC_PAYMENTS", date });
  }, []);

  const value = useMemo(() => ({
    ...state,
    ...totals,
    addTransaction,
    updateTransaction,
    deleteTransaction: (id) => dispatch({ type: "DELETE_TRANSACTION", id }),
    addSavings,
    withdrawSavings,
    setCollection: (collection, items) => dispatch({ type: "SET_COLLECTION", collection, items }),
    setPreferences: (preferences) => dispatch({ type: "SET_PREFERENCES", preferences }),
    addAlert: (alert) => dispatch({ type: "ADD_ALERT", alert: { ...alert, id: makeId(), date: today() } }),
    processAutomaticPayments,
  }), [state, totals, addTransaction, updateTransaction, addSavings, withdrawSavings, processAutomaticPayments]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
