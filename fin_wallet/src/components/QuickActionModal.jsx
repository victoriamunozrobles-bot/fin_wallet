import { useState } from "react";
import { today } from "../context/financeUtils";
import { useFinance } from "../context/useFinance";

const typeLabels = { income: "Ingreso", expense: "Gasto", savings: "Ahorro" };

function QuickActionModal({ onClose, editTransaction = null }) {
  const { categories, paymentMethods, goals, addTransaction, updateTransaction, addSavings, available } = useFinance();
  const [type, setType] = useState(editTransaction?.type ?? "expense");
  const [amount, setAmount] = useState(editTransaction ? String(Math.abs(editTransaction.amount)) : "");
  const [date, setDate] = useState(editTransaction?.date ?? today());
  const [category, setCategory] = useState(editTransaction?.category ?? "");
  const [paymentMethod, setPaymentMethod] = useState(editTransaction?.paymentMethod ?? paymentMethods[0]?.name ?? "");
  const [description, setDescription] = useState(editTransaction?.description ?? "");
  const [goalId, setGoalId] = useState(editTransaction?.goalId ?? goals[0]?.id ?? "");
  const [error, setError] = useState("");

  const selectableCategories = categories.filter((item) => item.type === type);
  const selectedCategory = selectableCategories.some((item) => item.name === category) ? category : selectableCategories[0]?.name ?? "";

  const submit = (event) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Ingresa un monto mayor a cero.");
      return;
    }
    if (type === "savings") {
      const savedValue = editTransaction && editTransaction.type === "savings" ? value * Math.sign(editTransaction.amount) : value;
      const success = editTransaction
        ? updateTransaction({ ...editTransaction, amount: savedValue, date, category: goals.find((goal) => goal.id === goalId)?.name ?? category, goalId })
        : addSavings(goalId, value, date, description || "Aporte a meta");
      if (!success) {
        setError("Revisa el saldo disponible y el monto de la meta.");
        return;
      }
    } else {
      const transaction = { ...(editTransaction ?? {}), type, amount: value, date, category: selectedCategory, paymentMethod, description: description.trim() || selectedCategory };
      if (editTransaction) updateTransaction(transaction);
      else addTransaction(transaction);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editTransaction ? "EDITAR MOVIMIENTO" : "REGISTRO RÁPIDO"}</p>
            <h2 id="transaction-modal-title">{editTransaction ? "Ajusta los detalles" : "¿Qué quieres registrar?"}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}>×</button>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Tipo de movimiento">
          {["income", "expense", "savings"].map((item) => (
            <button type="button" role="tab" aria-selected={type === item} className={type === item ? "is-selected" : ""} key={item} onClick={() => setType(item)}>
              {typeLabels[item]}
            </button>
          ))}
        </div>
        <form className="stack-form" onSubmit={submit}>
          <label className="field-label">Monto
            <span className="amount-input"><span>$</span><input autoFocus type="number" min="1" step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" /></span>
          </label>
          <div className="field-grid">
            <label className="field-label">Fecha<input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
            {type !== "savings" && <label className="field-label">Categoría
              <select value={selectedCategory} onChange={(event) => setCategory(event.target.value)} required>
                {selectableCategories.map((item) => <option key={item.id} value={item.name}>{item.emoji} {item.name}</option>)}
              </select>
            </label>}
          </div>
          {type === "savings" ? (
            <>
              <label className="field-label">Meta de ahorro
                <select value={goalId} onChange={(event) => setGoalId(event.target.value)} required>
                  {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}
                </select>
              </label>
              <p className="form-hint">Disponible para gastar: ${Math.max(available, 0).toLocaleString("es-CL")}</p>
            </>
          ) : (
            <label className="field-label">{type === "income" ? "Cuenta destino" : "Medio de pago"}
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                {paymentMethods.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select>
            </label>
          )}
          <label className="field-label">Descripción
            <input maxLength="80" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Agrega una nota (opcional)" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="button button--plain" onClick={onClose}>Cancelar</button>
            <button className="button button--primary" type="submit">{editTransaction ? "Guardar cambios" : `Guardar ${typeLabels[type].toLowerCase()}`}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default QuickActionModal;
