export const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const monthKey = (date = today()) => date.slice(0, 7);
export const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const initialDate = today();
export const initialState = {
  transactions: [
    { id: "demo-1", type: "income", amount: 2450000, date: initialDate, category: "Salario", paymentMethod: "Cuenta principal", description: "Sueldo mensual" },
    { id: "demo-2", type: "expense", amount: 48500, date: initialDate, category: "Comida", paymentMethod: "Visa débito", description: "Compra del súper" },
    { id: "demo-3", type: "expense", amount: 22000, date: initialDate, category: "Transporte", paymentMethod: "Efectivo", description: "Carga de transporte" },
    { id: "demo-4", type: "expense", amount: 15990, date: initialDate, category: "Suscripciones", paymentMethod: "Visa débito", description: "Streaming" },
    { id: "demo-5", type: "expense", amount: 79000, date: initialDate, category: "Hogar", paymentMethod: "Cuenta principal", description: "Servicios del hogar" },
    { id: "demo-6", type: "income", amount: 85000, date: initialDate, category: "Freelance", paymentMethod: "Cuenta principal", description: "Proyecto de diseño" },
  ],
  categories: [
    { id: "c-food", name: "Comida", type: "expense", emoji: "🥑", color: "#FFE5EC" },
    { id: "c-home", name: "Hogar", type: "expense", emoji: "🏡", color: "#F3E8FF" },
    { id: "c-transport", name: "Transporte", type: "expense", emoji: "🚲", color: "#E2F5EA" },
    { id: "c-subscriptions", name: "Suscripciones", type: "expense", emoji: "🎧", color: "#FFF0E5" },
    { id: "c-health", name: "Salud", type: "expense", emoji: "🌷", color: "#FFE5EC" },
    { id: "c-salary", name: "Salario", type: "income", emoji: "✦", color: "#E2F5EA" },
    { id: "c-freelance", name: "Freelance", type: "income", emoji: "✿", color: "#F3E8FF" },
  ],
  paymentMethods: [
    { id: "p-cash", name: "Efectivo", type: "Efectivo" },
    { id: "p-bank", name: "Cuenta principal", type: "Cuenta bancaria" },
    { id: "p-card", name: "Visa débito", type: "Tarjeta de débito" },
  ],
  budgets: [
    { id: "b-food", category: "Comida", limit: 280000 },
    { id: "b-home", category: "Hogar", limit: 350000 },
    { id: "b-transport", category: "Transporte", limit: 100000 },
    { id: "b-subscriptions", category: "Suscripciones", limit: 80000 },
  ],
  goals: [
    { id: "g-trip", name: "Viaje a la costa", target: 900000, saved: 260000, color: "#FF4D8D" },
    { id: "g-emergency", name: "Fondo tranquilo", target: 1500000, saved: 480000, color: "#8B5CF6" },
  ],
  debts: [],
  automaticPayments: [
    { id: "auto-stream", name: "Streaming", amount: 15990, category: "Suscripciones", paymentMethod: "Visa débito", day: 15, lastChargedMonth: "" },
    { id: "auto-internet", name: "Internet", amount: 32990, category: "Hogar", paymentMethod: "Cuenta principal", day: 22, lastChargedMonth: "" },
  ],
  alerts: [],
  preferences: { threshold: 80, currency: "CLP", theme: "light" },
};
