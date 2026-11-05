import { useEffect, useState } from "react";
import "./App.css";
import { FinanceProvider } from "./context/FinanceContext";
import { today } from "./context/financeUtils";
import { useFinance } from "./context/useFinance";
import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import QuickActionModal from "./components/QuickActionModal";
import { Analytics, Dashboard, Planning, Settings, Transactions } from "./components/FinanceViews";

const pages = {
  home: { title: "Inicio", component: Dashboard },
  transactions: { title: "Transacciones", component: Transactions },
  analytics: { title: "Análisis", component: Analytics },
  planning: { title: "Presupuestos y ahorro", component: Planning },
  settings: { title: "Configuración", component: Settings },
};

function AppShell() {
  const { preferences, processAutomaticPayments } = useFinance();
  const [activeView, setActiveView] = useState("home");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  useEffect(() => {
    processAutomaticPayments(today());
    const handleNavigation = (event) => {
      if (pages[event.detail]) setActiveView(event.detail);
    };
    window.addEventListener("fin-wallet-navigate", handleNavigation);
    return () => window.removeEventListener("fin-wallet-navigate", handleNavigation);
  }, [processAutomaticPayments]);

  const openNewTransaction = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };
  const openEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  return <div className={`app-shell theme-${preferences.theme}`}>
    <Sidebar activeView={activeView} onSelect={setActiveView}/>
    <div className="app-main">
      <Header title={pages[activeView].title}/>
      <main className="main-content">
        {activeView === "home" && <Dashboard onCreate={openNewTransaction}/>}
        {activeView === "transactions" && <Transactions onEdit={openEditTransaction}/>}
        {activeView === "analytics" && <Analytics/>}
        {activeView === "planning" && <Planning/>}
        {activeView === "settings" && <Settings/>}
        {activeView !== "home" && <button className="fab fab--global" type="button" aria-label="Registrar movimiento" onClick={openNewTransaction}><span>＋</span><b>Nuevo movimiento</b></button>}
      </main>
    </div>
    {modalOpen && <QuickActionModal editTransaction={editingTransaction} onClose={() => setModalOpen(false)}/>}
  </div>;
}

function App() {
  return <FinanceProvider><AppShell/></FinanceProvider>;
}

export default App;
