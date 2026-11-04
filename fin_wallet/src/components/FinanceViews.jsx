import { useMemo, useState } from "react";
import { makeId, today } from "../context/financeUtils";
import { useFinance } from "../context/useFinance";

const money = (amount, currency = "CLP") => new Intl.NumberFormat("es-CL", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount || 0);
const shortDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
const monthName = (date) => new Date(`${date}T12:00:00`).toLocaleDateString("es-CL", { month: "long", year: "numeric" });
const monthNow = today().slice(0, 7);
const categoryIcon = (categories, name) => categories.find((item) => item.name === name)?.emoji ?? "✦";

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>;
}

function EmptyState({ icon = "✿", title, children }) {
  return <div className="empty-state"><span>{icon}</span><strong>{title}</strong><p>{children}</p></div>;
}

function MetricCard({ label, value, note, className = "" }) {
  return <article className={`metric-card ${className}`}><span className="metric-label">{label}</span><strong>{value}</strong><span className="metric-note">{note}</span></article>;
}

function budgetStatus(used, limit, threshold = 80) {
  const ratio = limit ? (used / limit) * 100 : 0;
  return { ratio, tone: ratio >= 100 ? "danger" : ratio >= threshold ? "warning" : "healthy" };
}

function BudgetAlertList() {
  const { transactions, budgets, preferences, categories } = useFinance();
  const monthExpenses = transactions.filter((item) => item.type === "expense" && item.date.startsWith(monthNow));
  const alerts = budgets.map((budget) => {
    const spent = monthExpenses.filter((item) => item.category === budget.category).reduce((sum, item) => sum + Number(item.amount), 0);
    return { ...budget, spent, ...budgetStatus(spent, budget.limit, preferences.threshold) };
  }).filter((item) => item.ratio >= preferences.threshold);
  return <div className="alert-list">
    {alerts.length === 0 && <div className="alert-card alert-card--good"><span>✦</span><div><strong>Todo en calma</strong><p>Tus presupuestos están dentro de los límites.</p></div></div>}
    {alerts.map((item) => <div className={`alert-card alert-card--${item.tone}`} key={item.id}>
      <span>{item.tone === "danger" ? "!" : "↗"}</span><div><strong>{item.category}: {Math.round(item.ratio)}% del presupuesto</strong><p>{money(item.spent, preferences.currency)} de {money(item.limit, preferences.currency)} · {item.tone === "danger" ? "límite superado" : "cerca del límite"}</p></div>
      <i style={{ backgroundColor: categories.find((cat) => cat.name === item.category)?.color }} />
    </div>)}
  </div>;
}

function UpcomingPayments({ onPayment }) {
  const { automaticPayments, preferences } = useFinance();
  const payments = automaticPayments.slice().sort((a, b) => a.day - b.day);
  return <div className="payment-list">
    {payments.map((payment) => {
      const done = payment.lastChargedMonth === monthNow;
      return <div className="payment-row" key={payment.id}><span className="payment-icon">↻</span><div className="payment-info"><strong>{payment.name}</strong><span>Día {payment.day} · {payment.paymentMethod}</span></div><strong className="payment-amount">{money(payment.amount, preferences.currency)}</strong><button className="button button--small button--plain" disabled={done} onClick={() => onPayment(payment)}>{done ? "Pagado" : "Simular"}</button></div>;
    })}
    {!payments.length && <EmptyState icon="↻" title="Sin pagos programados">Agrégalos desde Configuración para verlos aquí.</EmptyState>}
  </div>;
}

export function Dashboard({ onCreate }) {
  const finance = useFinance();
  const { transactions, alerts, budgets, categories, preferences, totalIncome, totalExpenses, totalSavings, available, processAutomaticPayments, addTransaction, setCollection, addAlert } = finance;
  const monthTransactions = transactions.filter((item) => item.date.startsWith(monthNow));
  const incomeThisMonth = monthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenseThisMonth = monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const budgetAlerts = budgets.filter((budget) => {
    const spent = monthTransactions.filter((item) => item.type === "expense" && item.category === budget.category).reduce((sum, item) => sum + item.amount, 0);
    return budgetStatus(spent, budget.limit, preferences.threshold).ratio >= preferences.threshold;
  }).length;
  const todaysPaymentAlerts = alerts.filter((item) => item.kind === "automatic" && item.date === today()).length;
  const runPayment = (payment) => {
    if (payment.lastChargedMonth === monthNow) return;
    addTransaction({ type: "expense", amount: payment.amount, date: today(), category: payment.category, paymentMethod: payment.paymentMethod, description: `${payment.name} · pago automático`, automaticPaymentId: payment.id });
    setCollection("automaticPayments", finance.automaticPayments.map((item) => item.id === payment.id ? { ...item, lastChargedMonth: monthNow } : item));
    addAlert({ kind: "automatic", message: `Se registró el pago de ${payment.name} por ${money(payment.amount, preferences.currency)}.` });
  };
  const latest = transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  const todayLabel = new Date(`${today()}T12:00:00`).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  return <div className="view-content dashboard-view">
    <PageHeading eyebrow={todayLabel.toUpperCase()} title="Hola, tus finanzas ✿" description="Un vistazo amable y claro a cómo va tu dinero." action={<button className="button button--plain date-chip" onClick={() => processAutomaticPayments(today())}>◷ <span>Actualizado hoy</span></button>} />
    <section className="balance-grid">
      <article className="balance-card balance-card--main"><div className="balance-card-top"><span className="eyebrow">SALDO DISPONIBLE PARA GASTAR</span><span className="balance-sparkle">✳</span></div><strong>{money(available, preferences.currency)}</strong><p>Lo que tienes para usar, después de gastos y ahorros protegidos.</p><div className="balance-card-foot"><span>↗ Ingresos {money(totalIncome, preferences.currency)}</span><span>↘ Gastos {money(totalExpenses, preferences.currency)}</span></div></article>
      <article className="balance-card balance-card--savings"><span className="eyebrow">AHORROS PROTEGIDOS</span><strong>{money(totalSavings, preferences.currency)}</strong><p>Guardado en tus metas</p><div className="mini-flow"><span>Este mes</span><b className="flow-in">+{money(incomeThisMonth, preferences.currency)}</b><b className="flow-out">−{money(expenseThisMonth, preferences.currency)}</b></div></article>
    </section>
    <div className="dashboard-columns">
      <section className="panel alert-panel"><div className="section-title"><div><p className="eyebrow">OJO CON ESTO</p><h2>Centro de alertas</h2></div><span className="count-badge">{budgetAlerts + todaysPaymentAlerts}</span></div><BudgetAlertList />
        {alerts.filter((item) => item.kind === "automatic" && item.date === today()).map((item) => <div className="alert-card alert-card--good" key={item.id}><span>✓</span><div><strong>Pago automático registrado</strong><p>{item.message}</p></div></div>)}
      </section>
      <section className="panel payments-panel"><div className="section-title"><div><p className="eyebrow">A LA VISTA</p><h2>Próximos pagos</h2></div><span className="section-icon">↻</span></div><UpcomingPayments onPayment={runPayment} /></section>
    </div>
    <section className="panel recent-panel"><div className="section-title"><div><p className="eyebrow">LO MÁS RECIENTE</p><h2>Movimientos</h2></div><button className="text-button" onClick={() => window.dispatchEvent(new CustomEvent("fin-wallet-navigate", { detail: "transactions" }))}>Ver historial →</button></div>
      <TransactionRows items={latest} compact categories={categories} currency={preferences.currency} />
      {!latest.length && <EmptyState title="Aún no hay movimientos">Registra tu primer ingreso o gasto con el botón rosa.</EmptyState>}
    </section>
    <button className="fab" type="button" onClick={onCreate}><span>＋</span><b>Nuevo movimiento</b></button>
  </div>;
}

function TransactionRows({ items, compact = false, onEdit, onDelete, categories, currency = "CLP" }) {
  return <div className={`transaction-list ${compact ? "transaction-list--compact" : ""}`}>
    {items.map((item) => <article className="transaction-row" key={item.id}>
      <span className="category-icon" style={{ background: categories?.find((cat) => cat.name === item.category)?.color ?? "#F3E8FF" }}>{categoryIcon(categories ?? [], item.category)}</span>
      <div className="transaction-main"><strong>{item.description || item.category}</strong><span>{item.category} · {shortDate(item.date)}</span></div>
      {!compact && <span className="method-chip">{item.paymentMethod}</span>}
      <strong className={`transaction-amount transaction-amount--${item.type}`}>{item.type === "income" ? "+" : item.type === "savings" && item.amount < 0 ? "+" : "−"}{money(Math.abs(item.amount), currency)}</strong>
      {!compact && <div className="row-actions"><button title="Editar movimiento" onClick={() => onEdit(item)}>✎</button><button title="Eliminar movimiento" onClick={() => onDelete(item)}>×</button></div>}
    </article>)}
  </div>;
}

export function Transactions({ onEdit }) {
  const { transactions, categories, paymentMethods, preferences, deleteTransaction } = useFinance();
  const [view, setView] = useState("list");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("");
  const [type, setType] = useState("");
  const [month, setMonth] = useState(monthNow);
  const [selectedDate, setSelectedDate] = useState("");
  const filtered = useMemo(() => transactions.filter((item) =>
    (!query || `${item.description} ${item.category} ${item.paymentMethod}`.toLowerCase().includes(query.toLowerCase())) &&
    (!from || item.date >= from) && (!to || item.date <= to) &&
    (!category || item.category === category) && (!method || item.paymentMethod === method) &&
    (!type || item.type === type)
  ).sort((a, b) => b.date.localeCompare(a.date)), [transactions, query, from, to, category, method, type]);
  const remove = (item) => {
    if (window.confirm(`¿Eliminar “${item.description || item.category}”?`)) deleteTransaction(item.id);
  };

  return <div className="view-content">
    <PageHeading eyebrow="TU HISTORIAL" title="Cada peso tiene su historia" description="Encuentra, revisa y mantén tus movimientos al día." action={<button className="button button--primary" onClick={() => onEdit(null)}>＋ Registrar</button>} />
    <section className="panel filters-panel">
      <div className="filter-toolbar"><div className="search-field"><span>⌕</span><input aria-label="Buscar movimientos" placeholder="Buscar descripción o categoría..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="view-toggle"><button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>☷ Lista</button><button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>▦ Calendario</button></div></div>
      <div className="filter-fields"><label>Desde<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>Hasta<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label><label>Categoría<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas</option>{categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><label>Tipo<select value={type} onChange={(event) => setType(event.target.value)}><option value="">Todos</option><option value="income">Ingreso</option><option value="expense">Gasto</option><option value="savings">Ahorro</option></select></label><label>Medio de pago<select value={method} onChange={(event) => setMethod(event.target.value)}><option value="">Todos</option>{paymentMethods.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label></div>
    </section>
    {view === "list" ? <section className="panel transactions-panel"><div className="section-title"><div><p className="eyebrow">MOVIMIENTOS ENCONTRADOS</p><h2>{filtered.length} resultados</h2></div></div>
      <TransactionRows items={filtered} onEdit={onEdit} onDelete={remove} categories={categories} currency={preferences.currency} />
      {!filtered.length && <EmptyState title="No hay movimientos con esos filtros">Prueba ajustando la búsqueda o el rango de fechas.</EmptyState>}
    </section> : <CalendarView items={filtered} month={month} setMonth={setMonth} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onEdit={onEdit} onDelete={remove} categories={categories} currency={preferences.currency} />}
  </div>;
}

function CalendarView({ items, month, setMonth, selectedDate, setSelectedDate, onEdit, onDelete, categories, currency }) {
  const [year, monthNum] = month.split("-").map(Number);
  const offset = new Date(year, monthNum - 1, 1).getDay();
  const days = new Date(year, monthNum, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
  const changeMonth = (delta) => {
    const date = new Date(year, monthNum - 1 + delta, 1);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };
  const byDay = items.filter((item) => item.date.startsWith(month)).reduce((acc, item) => {
    const day = Number(item.date.slice(-2));
    acc[day] ??= { income: 0, expense: 0 };
    if (item.type === "income") acc[day].income += item.amount;
    if (item.type === "expense") acc[day].expense += item.amount;
    return acc;
  }, {});
  const selectedItems = selectedDate ? items.filter((item) => item.date === selectedDate) : [];
  return <section className="panel calendar-panel">
    <div className="calendar-heading"><button className="icon-button" onClick={() => changeMonth(-1)} aria-label="Mes anterior">‹</button><h2>{monthName(`${month}-01`)}</h2><button className="icon-button" onClick={() => changeMonth(1)} aria-label="Mes siguiente">›</button></div>
    <div className="calendar-grid">{["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"].map((day) => <span className="calendar-weekday" key={day}>{day}</span>)}{cells.map((day, index) => {
      if (!day) return <span className="calendar-empty" key={`empty-${index}`} />;
      const date = `${month}-${String(day).padStart(2, "0")}`;
      const entry = byDay[day];
      return <button className={`calendar-day ${selectedDate === date ? "selected" : ""}`} key={date} onClick={() => setSelectedDate(date)}><b>{day}</b>{entry && <span className="day-indicators">{entry.income > 0 && <i className="income-dot" />}{entry.expense > 0 && <i className="expense-dot" />}</span>}{entry && <small>{money(entry.expense || entry.income, currency)}</small>}</button>;
    })}</div>
    <div className="calendar-legend"><span><i className="income-dot" /> Ingresos</span><span><i className="expense-dot" /> Gastos</span></div>
    {selectedDate && <div className="selected-day"><div className="section-title"><h3>Movimientos del {shortDate(selectedDate)}</h3><span>{selectedItems.length}</span></div><TransactionRows items={selectedItems} onEdit={onEdit} onDelete={onDelete} categories={categories} currency={currency}/>{!selectedItems.length && <p className="subtle-copy">No hay movimientos este día.</p>}</div>}
  </section>;
}

export function Analytics() {
  const { transactions, categories, preferences } = useFinance();
  const [period, setPeriod] = useState(6);
  const [exportQuery, setExportQuery] = useState("");
  const [exportCategory, setExportCategory] = useState("");
  const [exportType, setExportType] = useState("");
  const now = new Date();
  const monthData = Array.from({ length: period }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - period + index + 1, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const rows = transactions.filter((item) => item.date.startsWith(key));
    return { key, label: date.toLocaleDateString("es-CL", { month: "short" }), income: rows.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0), expense: rows.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0) };
  });
  const current = transactions.filter((item) => item.type === "expense" && item.date.startsWith(monthNow));
  const categoryTotals = categories.filter((item) => item.type === "expense").map((category) => ({ ...category, total: current.filter((tx) => tx.category === category.name).reduce((sum, tx) => sum + tx.amount, 0) })).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);
  const grandTotal = categoryTotals.reduce((sum, item) => sum + item.total, 0);
  const donut = categoryTotals.map((item, index) => {
    const start = categoryTotals.slice(0, index).reduce((sum, entry) => sum + (grandTotal ? entry.total / grandTotal * 100 : 0), 0);
    const end = start + (grandTotal ? item.total / grandTotal * 100 : 0);
    return `${item.color} ${start}% ${end}%`;
  }).join(", ");
  const topMethod = current.reduce((acc, item) => { acc[item.paymentMethod] = (acc[item.paymentMethod] ?? 0) + 1; return acc; }, {});
  const mostUsed = Object.entries(topMethod).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const income = transactions.filter((item) => item.type === "income" && item.date.startsWith(monthNow)).reduce((sum, item) => sum + item.amount, 0);
  const saved = transactions.filter((item) => item.type === "savings" && item.date.startsWith(monthNow)).reduce((sum, item) => sum + item.amount, 0);
  const exportTransactions = transactions.filter((item) =>
    (!exportQuery || `${item.description} ${item.category} ${item.paymentMethod}`.toLowerCase().includes(exportQuery.toLowerCase())) &&
    (!exportCategory || item.category === exportCategory) && (!exportType || item.type === exportType)
  );
  const exportCsv = () => {
    const rows = [["Fecha", "Tipo", "Categoría", "Descripción", "Medio de pago", "Monto"], ...exportTransactions.map((item) => [item.date, item.type, item.category, item.description, item.paymentMethod, item.amount])];
    const csv = `\uFEFF${rows.map((row) => row.map((field) => `"${String(field ?? "").replaceAll('"', '""')}"`).join(";")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "fin-wallet-movimientos.csv"; link.click();
    URL.revokeObjectURL(url);
  };
  return <div className="view-content">
    <PageHeading eyebrow="TU DINERO, EN PERSPECTIVA" title="Análisis que sí se entienden" description="Patrones, tendencias y pequeñas victorias de este mes." action={<div className="report-actions"><button className="button button--plain" onClick={exportCsv}>↓ Exportar CSV</button><button className="button button--plain" onClick={() => window.print()}>▧ Imprimir / PDF</button></div>} />
    <div className="export-filters"><strong>Exportar {exportTransactions.length} movimientos</strong><input aria-label="Buscar en el reporte" placeholder="Buscar descripción..." value={exportQuery} onChange={(event) => setExportQuery(event.target.value)} /><select aria-label="Filtrar por categoría" value={exportCategory} onChange={(event) => setExportCategory(event.target.value)}><option value="">Todas las categorías</option>{categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select><select aria-label="Filtrar por tipo" value={exportType} onChange={(event) => setExportType(event.target.value)}><option value="">Todos los tipos</option><option value="income">Ingresos</option><option value="expense">Gastos</option><option value="savings">Ahorros</option></select></div>
    <div className="analytics-metrics"><MetricCard label="INGRESOS DEL MES" value={money(income, preferences.currency)} note="Entradas registradas" className="metric-card--mint"/><MetricCard label="GASTOS DEL MES" value={money(grandTotal, preferences.currency)} note="En todas las categorías" className="metric-card--peach"/><MetricCard label="AHORRO DEL MES" value={money(saved, preferences.currency)} note="Aportes a tus metas" className="metric-card--lavender"/></div>
    <div className="analytics-grid">
      <section className="panel chart-panel"><div className="section-title"><div><p className="eyebrow">FLUJO DE EFECTIVO</p><h2>Ingresos vs. gastos</h2></div><select aria-label="Meses del gráfico" value={period} onChange={(event) => setPeriod(Number(event.target.value))}><option value="3">3 meses</option><option value="6">6 meses</option><option value="12">12 meses</option></select></div>
        <div className="bar-legend"><span><i className="income-dot"/> Ingresos</span><span><i className="expense-dot"/> Gastos</span></div>
        <div className="bar-chart">{monthData.map((item) => { const max = Math.max(...monthData.flatMap((month) => [month.income, month.expense]), 1); return <div className="bar-group" key={item.key}><div className="bars"><i className="bar-income" style={{ height: `${Math.max(3, item.income / max * 100)}%` }} title={`Ingresos ${money(item.income, preferences.currency)}`}/><i className="bar-expense" style={{ height: `${Math.max(3, item.expense / max * 100)}%` }} title={`Gastos ${money(item.expense, preferences.currency)}`}/></div><small>{item.label}</small></div>; })}</div>
      </section>
      <section className="panel chart-panel category-chart-panel"><div className="section-title"><div><p className="eyebrow">EN QUÉ SE VA</p><h2>Gastos por categoría</h2></div></div>
        {categoryTotals.length ? <><div className="donut-wrap"><div className="donut-chart" style={{ background: `conic-gradient(${donut})` }}><div><b>{money(grandTotal, preferences.currency)}</b><span>este mes</span></div></div></div><div className="category-legend">{categoryTotals.map((item) => <div key={item.id}><span><i style={{ backgroundColor: item.color }} />{item.emoji} {item.name}</span><b>{Math.round(item.total / grandTotal * 100)}%</b></div>)}</div></> : <EmptyState title="Aún no hay gastos este mes">Cuando registres movimientos, aquí verás el desglose.</EmptyState>}
      </section>
    </div>
    <section className="panel cashflow-panel"><div className="section-title"><div><p className="eyebrow">RESUMEN MENSUAL</p><h2>Tu flujo de efectivo</h2></div><span className="section-icon">✿</span></div><div className="cashflow-items"><div><span>Tasa de ahorro</span><strong>{income ? `${Math.max(0, saved / income * 100).toLocaleString("es-CL", { maximumFractionDigits: 1 })}%` : "0%"}</strong><small>del ingreso registrado</small></div><div><span>Mayor categoría</span><strong>{categoryTotals[0]?.name ?? "—"}</strong><small>{categoryTotals[0] ? money(categoryTotals[0].total, preferences.currency) : "Sin gastos aún"}</small></div><div><span>Medio más usado</span><strong>{mostUsed}</strong><small>{current.length} pagos este mes</small></div></div></section>
  </div>;
}

export function Planning() {
  const { budgets, categories, transactions, goals, debts, setCollection, addSavings, withdrawSavings, preferences } = useFinance();
  const [budgetForm, setBudgetForm] = useState(null);
  const [goalForm, setGoalForm] = useState(null);
  const [debtForm, setDebtForm] = useState(false);
  const [goalAction, setGoalAction] = useState(null);
  const [actionAmount, setActionAmount] = useState("");
  const [goalError, setGoalError] = useState("");
  const [debt, setDebt] = useState({ name: "", amount: "", dueDate: "", direction: "owed" });
  const monthSpent = (name) => transactions.filter((item) => item.type === "expense" && item.category === name && item.date.startsWith(monthNow)).reduce((sum, item) => sum + item.amount, 0);
  const expenseCategories = categories.filter((item) => item.type === "expense");
  const saveBudget = (event) => {
    event.preventDefault();
    const exists = budgets.find((item) => item.category === budgetForm.category);
    setCollection("budgets", exists ? budgets.map((item) => item.category === budgetForm.category ? { ...item, limit: Number(budgetForm.limit) } : item) : [...budgets, { id: makeId(), category: budgetForm.category, limit: Number(budgetForm.limit) }]);
    setBudgetForm(null);
  };
  const saveGoal = (event) => {
    event.preventDefault();
    if (goalForm.id) setCollection("goals", goals.map((item) => item.id === goalForm.id ? { ...item, ...goalForm, target: Number(goalForm.target) } : item));
    else setCollection("goals", [...goals, { ...goalForm, id: makeId(), target: Number(goalForm.target), saved: 0 }]);
    setGoalForm(null);
  };
  const saveDebt = (event) => {
    event.preventDefault();
    setCollection("debts", [...debts, { ...debt, id: makeId(), amount: Number(debt.amount), paid: false }]);
    setDebt({ name: "", amount: "", dueDate: "", direction: "owed" }); setDebtForm(false);
  };
  const submitGoalAction = (event) => {
    event.preventDefault();
    const operation = goalAction.type === "deposit" ? addSavings : withdrawSavings;
    if (!operation(goalAction.id, Number(actionAmount))) { setGoalError("No se pudo completar. Revisa el saldo disponible o el monto ahorrado."); return; }
    setGoalAction(null); setActionAmount(""); setGoalError("");
  };
  return <div className="view-content">
    <PageHeading eyebrow="PLANEA CON INTENCIÓN" title="Tus planes, paso a paso" description="Ponle límites a tus gastos y propósito a tus ahorros." />
    <section className="planning-section"><div className="section-title"><div><p className="eyebrow">GASTA CON CALMA</p><h2>Presupuestos por categoría</h2></div><button className="button button--primary" onClick={() => setBudgetForm({ category: expenseCategories[0]?.name ?? "", limit: "" })}>＋ Nuevo presupuesto</button></div>
      {budgetForm && <form className="inline-form" onSubmit={saveBudget}><label>Categoría<select required value={budgetForm.category} onChange={(event) => setBudgetForm({ ...budgetForm, category: event.target.value })}>{expenseCategories.map((item) => <option key={item.id}>{item.name}</option>)}</select></label><label>Tope mensual<input type="number" min="1" required value={budgetForm.limit} onChange={(event) => setBudgetForm({ ...budgetForm, limit: event.target.value })}/></label><button className="button button--primary">Guardar tope</button><button type="button" className="text-button" onClick={() => setBudgetForm(null)}>Cancelar</button></form>}
      <div className="budget-grid">{budgets.map((budget) => { const spent = monthSpent(budget.category); const status = budgetStatus(spent, budget.limit, preferences.threshold); return <article className="panel budget-card" key={budget.id}><div className="budget-title"><span className="category-icon" style={{ background: categories.find((item) => item.name === budget.category)?.color }}>{categoryIcon(categories, budget.category)}</span><div><strong>{budget.category}</strong><span>{money(spent, preferences.currency)} de {money(budget.limit, preferences.currency)}</span></div><button className="icon-button" title="Editar presupuesto" onClick={() => setBudgetForm({ ...budget })}>✎</button></div><div className="progress-track"><span className={`progress-fill progress-fill--${status.tone}`} style={{ width: `${Math.min(status.ratio, 100)}%` }} /></div><div className={`budget-status budget-status--${status.tone}`}>{status.ratio >= 100 ? `Te pasaste ${money(spent - budget.limit, preferences.currency)}` : `Quedan ${money(budget.limit - spent, preferences.currency)}`}<button onClick={() => { if (window.confirm(`¿Quitar presupuesto de ${budget.category}?`)) setCollection("budgets", budgets.filter((item) => item.id !== budget.id)); }}>Quitar</button></div></article>; })}</div>
      {!budgets.length && <EmptyState title="Todavía no hay presupuestos">Crea un tope mensual y sigue tu progreso.</EmptyState>}
    </section>
    <section className="planning-section"><div className="section-title"><div><p className="eyebrow">AHORRO PROTEGIDO</p><h2>Metas bonitas, metas posibles</h2></div><button className="button button--plain" onClick={() => setGoalForm({ name: "", target: "", color: "#FF4D8D" })}>＋ Crear meta</button></div>
      {goalForm && <form className="inline-form" onSubmit={saveGoal}><label>Nombre<input required maxLength="36" value={goalForm.name} onChange={(event) => setGoalForm({ ...goalForm, name: event.target.value })}/></label><label>Monto objetivo<input type="number" min="1" required value={goalForm.target} onChange={(event) => setGoalForm({ ...goalForm, target: event.target.value })}/></label><label>Color<input type="color" value={goalForm.color} onChange={(event) => setGoalForm({ ...goalForm, color: event.target.value })}/></label><button className="button button--primary">Guardar meta</button><button type="button" className="text-button" onClick={() => setGoalForm(null)}>Cancelar</button></form>}
      <div className="goal-grid">{goals.map((goal) => <article className="panel goal-card" key={goal.id}><div className="goal-card-head"><span className="goal-illustration" style={{ backgroundColor: `${goal.color}25`, color: goal.color }}>✿</span><button className="icon-button" aria-label={`Editar ${goal.name}`} onClick={() => setGoalForm({ ...goal })}>✎</button></div><h3>{goal.name}</h3><strong className="goal-saved">{money(goal.saved, preferences.currency)}</strong><p>de {money(goal.target, preferences.currency)}</p><div className="progress-track"><span className="progress-fill" style={{ width: `${Math.min(goal.saved / goal.target * 100, 100)}%`, backgroundColor: goal.color }}/></div><div className="goal-progress-label"><span>{Math.round(goal.saved / goal.target * 100)}% completado</span><button className="text-button" onClick={() => { if (window.confirm(`¿Eliminar la meta “${goal.name}”?`)) setCollection("goals", goals.filter((item) => item.id !== goal.id)); }}>Eliminar</button></div><div className="goal-actions"><button className="button button--primary" onClick={() => { setGoalError(""); setGoalAction({ id: goal.id, type: "deposit" }); }}>＋ Abonar</button><button className="button button--plain" disabled={!goal.saved} onClick={() => { setGoalError(""); setGoalAction({ id: goal.id, type: "withdraw" }); }}>Retirar</button></div></article>)}</div>
      {!goals.length && <EmptyState title="¿Qué te gustaría lograr?">Crea una meta y empieza a apartar dinero para ella.</EmptyState>}
    </section>
    {goalAction && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setGoalAction(null)}><form className="modal-card stack-form" onSubmit={submitGoalAction}><div className="modal-heading"><div><p className="eyebrow">META DE AHORRO</p><h2>{goalAction.type === "deposit" ? "Abonar a tu meta" : "Retirar de tu meta"}</h2></div><button type="button" className="icon-button" onClick={() => setGoalAction(null)}>×</button></div><label className="field-label">Monto<input type="number" min="1" required autoFocus value={actionAmount} onChange={(event) => setActionAmount(event.target.value)}/></label>{goalError && <p className="form-error">{goalError}</p>}<button className="button button--primary">Confirmar</button></form></div>}
    <section className="planning-section debt-section"><div className="section-title"><div><p className="eyebrow">CUENTAS CLARAS</p><h2>Deudas y préstamos</h2></div><button className="button button--plain" onClick={() => setDebtForm(!debtForm)}>＋ Registrar deuda</button></div>
      {debtForm && <form className="inline-form debt-form" onSubmit={saveDebt}><label>Persona o entidad<input required value={debt.name} onChange={(event) => setDebt({ ...debt, name: event.target.value })}/></label><label>Monto<input type="number" min="1" required value={debt.amount} onChange={(event) => setDebt({ ...debt, amount: event.target.value })}/></label><label>Fecha límite<input type="date" value={debt.dueDate} onChange={(event) => setDebt({ ...debt, dueDate: event.target.value })}/></label><label>Tipo<select value={debt.direction} onChange={(event) => setDebt({ ...debt, direction: event.target.value })}><option value="owed">A quién le debo</option><option value="receivable">Quién me debe</option></select></label><button className="button button--primary">Guardar</button></form>}
      <div className="debt-grid">{["owed", "receivable"].map((direction) => <div className="panel debt-card" key={direction}><h3>{direction === "owed" ? "↗ A quién le debo" : "↙ Quién me debe"}</h3>{debts.filter((item) => item.direction === direction && !item.paid).map((item) => <div className="debt-row" key={item.id}><div><strong>{item.name}</strong><span>{item.dueDate ? `Vence ${shortDate(item.dueDate)}` : "Sin fecha límite"}</span></div><b>{money(item.amount, preferences.currency)}</b><button className="text-button" onClick={() => setCollection("debts", debts.map((debtItem) => debtItem.id === item.id ? { ...debtItem, paid: true } : debtItem))}>{direction === "owed" ? "Pagado" : "Cobrado"}</button></div>)}{!debts.some((item) => item.direction === direction && !item.paid) && <p className="subtle-copy">No tienes registros pendientes aquí.</p>}</div>)}</div>
    </section>
  </div>;
}

export function Settings() {
  const { categories, paymentMethods, automaticPayments, budgets, transactions, preferences, setCollection, setPreferences, addTransaction, addAlert } = useFinance();
  const [categoryForm, setCategoryForm] = useState(null);
  const [methodForm, setMethodForm] = useState(null);
  const [paymentForm, setPaymentForm] = useState(null);
  const saveCategory = (event) => {
    event.preventDefault();
    if (categoryForm?.id) {
      const previous = categories.find((item) => item.id === categoryForm.id);
      setCollection("categories", categories.map((item) => item.id === categoryForm.id ? categoryForm : item));
      if (previous?.name !== categoryForm.name) {
        setCollection("budgets", budgets.map((item) => item.category === previous?.name ? { ...item, category: categoryForm.name } : item));
        setCollection("automaticPayments", automaticPayments.map((item) => item.category === previous?.name ? { ...item, category: categoryForm.name } : item));
      }
    } else setCollection("categories", [...categories, { ...categoryForm, id: makeId() }]);
    setCategoryForm(null);
  };
  const saveMethod = (event) => {
    event.preventDefault();
    if (methodForm?.id) {
      const previous = paymentMethods.find((item) => item.id === methodForm.id);
      setCollection("paymentMethods", paymentMethods.map((item) => item.id === methodForm.id ? methodForm : item));
      if (previous?.name !== methodForm.name) {
        setCollection("transactions", transactions.map((item) => item.paymentMethod === previous?.name ? { ...item, paymentMethod: methodForm.name } : item));
        setCollection("automaticPayments", automaticPayments.map((item) => item.paymentMethod === previous?.name ? { ...item, paymentMethod: methodForm.name } : item));
      }
    } else setCollection("paymentMethods", [...paymentMethods, { ...methodForm, id: makeId() }]);
    setMethodForm(null);
  };
  const savePayment = (event) => {
    event.preventDefault();
    const updated = { ...paymentForm, amount: Number(paymentForm.amount), day: Number(paymentForm.day) };
    if (paymentForm.id) setCollection("automaticPayments", automaticPayments.map((item) => item.id === paymentForm.id ? updated : item));
    else setCollection("automaticPayments", [...automaticPayments, { ...updated, id: makeId(), lastChargedMonth: "" }]);
    setPaymentForm(null);
  };
  const removeCategory = (item) => {
    if (!window.confirm(`¿Eliminar la categoría ${item.name}? Se quitarán su presupuesto y pagos programados; los movimientos existentes conservarán su nombre.`)) return;
    setCollection("categories", categories.filter((category) => category.id !== item.id));
    setCollection("budgets", budgets.filter((budget) => budget.category !== item.name));
    setCollection("automaticPayments", automaticPayments.filter((payment) => payment.category !== item.name));
  };
  const removeMethod = (item) => {
    if (window.confirm(`¿Eliminar el medio ${item.name}?`)) setCollection("paymentMethods", paymentMethods.filter((method) => method.id !== item.id));
  };
  const simulatePayment = (payment) => {
    if (payment.lastChargedMonth === monthNow) return;
    addTransaction({ type: "expense", amount: payment.amount, date: today(), category: payment.category, paymentMethod: payment.paymentMethod, description: `${payment.name} · pago automático`, automaticPaymentId: payment.id });
    setCollection("automaticPayments", automaticPayments.map((item) => item.id === payment.id ? { ...item, lastChargedMonth: monthNow } : item));
    addAlert({ kind: "automatic", message: `Se registró el pago de ${payment.name} por ${money(payment.amount, preferences.currency)}.` });
  };
  return <div className="view-content">
    <PageHeading eyebrow="HECHO A TU MANERA" title="Tu espacio, tus reglas" description="Personaliza las categorías, medios de pago y recordatorios." />
    <section className="settings-section"><div className="section-title"><div><p className="eyebrow">ORGANIZA TUS MOVIMIENTOS</p><h2>Categorías</h2></div><button className="button button--primary" onClick={() => setCategoryForm({ name: "", type: "expense", emoji: "✿", color: "#FFE5EC" })}>＋ Nueva categoría</button></div>
      {categoryForm && <form className="inline-form" onSubmit={saveCategory}><label>Nombre<input required maxLength="24" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}/></label><label>Tipo<select value={categoryForm.type} onChange={(event) => setCategoryForm({ ...categoryForm, type: event.target.value })}><option value="expense">Gasto</option><option value="income">Ingreso</option></select></label><label>Emoji<input maxLength="4" value={categoryForm.emoji} onChange={(event) => setCategoryForm({ ...categoryForm, emoji: event.target.value })}/></label><label>Color<input type="color" value={categoryForm.color} onChange={(event) => setCategoryForm({ ...categoryForm, color: event.target.value })}/></label><button className="button button--primary">Guardar</button><button className="text-button" type="button" onClick={() => setCategoryForm(null)}>Cancelar</button></form>}
      <div className="master-list">{categories.map((item) => <div className="master-row" key={item.id}><span className="category-icon" style={{ background: item.color }}>{item.emoji}</span><div><strong>{item.name}</strong><span>{item.type === "expense" ? "Gasto" : "Ingreso"}</span></div><button className="text-button" onClick={() => setCategoryForm({ ...item })}>Editar</button><button className="icon-button" aria-label={`Eliminar ${item.name}`} onClick={() => removeCategory(item)}>×</button></div>)}</div>
    </section>
    <section className="settings-section"><div className="section-title"><div><p className="eyebrow">¿DESDE DÓNDE PAGAS?</p><h2>Medios de pago</h2></div><button className="button button--plain" onClick={() => setMethodForm({ name: "", type: "Tarjeta de débito" })}>＋ Añadir medio</button></div>
      {methodForm && <form className="inline-form" onSubmit={saveMethod}><label>Nombre<input required value={methodForm.name} onChange={(event) => setMethodForm({ ...methodForm, name: event.target.value })}/></label><label>Tipo<select value={methodForm.type} onChange={(event) => setMethodForm({ ...methodForm, type: event.target.value })}>{["Efectivo", "Cuenta bancaria", "Tarjeta de débito", "Tarjeta de crédito"].map((item) => <option key={item}>{item}</option>)}</select></label><button className="button button--primary">Guardar</button><button className="text-button" type="button" onClick={() => setMethodForm(null)}>Cancelar</button></form>}
      <div className="method-grid">{paymentMethods.map((item) => <div className="method-card" key={item.id}><span>▣</span><div><strong>{item.name}</strong><small>{item.type}</small></div><button className="icon-button" aria-label={`Editar ${item.name}`} onClick={() => setMethodForm({ ...item })}>✎</button><button className="icon-button" aria-label={`Eliminar ${item.name}`} onClick={() => removeMethod(item)}>×</button></div>)}</div>
    </section>
    <section className="settings-section"><div className="section-title"><div><p className="eyebrow">QUE NADA TE TOME POR SORPRESA</p><h2>Pagos automáticos</h2></div><button className="button button--primary" onClick={() => setPaymentForm({ name: "", amount: "", category: categories.find((item) => item.type === "expense")?.name ?? "", paymentMethod: paymentMethods[0]?.name ?? "", day: 1, lastChargedMonth: "" })}>＋ Programar pago</button></div>
      {paymentForm && <form className="inline-form autopay-form" onSubmit={savePayment}><label>Servicio<input required value={paymentForm.name} onChange={(event) => setPaymentForm({ ...paymentForm, name: event.target.value })}/></label><label>Monto<input type="number" min="1" required value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })}/></label><label>Categoría<select value={paymentForm.category} onChange={(event) => setPaymentForm({ ...paymentForm, category: event.target.value })}>{categories.filter((item) => item.type === "expense").map((item) => <option key={item.id}>{item.name}</option>)}</select></label><label>Medio de pago<select value={paymentForm.paymentMethod} onChange={(event) => setPaymentForm({ ...paymentForm, paymentMethod: event.target.value })}>{paymentMethods.map((item) => <option key={item.id}>{item.name}</option>)}</select></label><label>Día del mes<input type="number" min="1" max="31" required value={paymentForm.day} onChange={(event) => setPaymentForm({ ...paymentForm, day: event.target.value })}/></label><button className="button button--primary">Guardar pago</button><button className="text-button" type="button" onClick={() => setPaymentForm(null)}>Cancelar</button></form>}
      <div className="master-list">{automaticPayments.map((item) => <div className="master-row autopay-master-row" key={item.id}><span className="category-icon pastel-lavender">↻</span><div><strong>{item.name}</strong><span>Día {item.day} · {item.category} · {item.paymentMethod}</span></div><b>{money(item.amount, preferences.currency)}</b><button className="text-button" onClick={() => setPaymentForm({ ...item })}>Editar</button><button className="button button--small button--plain" disabled={item.lastChargedMonth === monthNow} onClick={() => simulatePayment(item)}>Simular día de cobro</button><button className="icon-button" aria-label={`Eliminar ${item.name}`} onClick={() => { if (window.confirm(`¿Eliminar el pago de ${item.name}?`)) setCollection("automaticPayments", automaticPayments.filter((payment) => payment.id !== item.id)); }}>×</button></div>)}</div>
      <p className="form-hint">Los pagos vencidos se registran al abrir la app. También puedes simular un cobro para probar el flujo completo.</p>
    </section>
    <section className="settings-section preferences-section"><div className="section-title"><div><p className="eyebrow">EL TOQUE FINAL</p><h2>Preferencias</h2></div></div><div className="preferences-grid"><label>Alerta preventiva<input type="number" min="1" max="99" value={preferences.threshold} onChange={(event) => setPreferences({ threshold: Number(event.target.value) })}/><small>Avisar al llegar a este porcentaje del presupuesto</small></label><label>Moneda<select value={preferences.currency} onChange={(event) => setPreferences({ currency: event.target.value })}><option value="CLP">Peso chileno · CLP</option><option value="ARS">Peso argentino · ARS</option><option value="MXN">Peso mexicano · MXN</option><option value="USD">Dólar · USD</option><option value="EUR">Euro · EUR</option></select></label><label className="theme-setting">Tema de la app<button className="theme-switch" onClick={() => setPreferences({ theme: preferences.theme === "light" ? "dark" : "light" })}>{preferences.theme === "light" ? "☀ Claro" : "☾ Oscuro"}</button></label></div></section>
  </div>;
}
