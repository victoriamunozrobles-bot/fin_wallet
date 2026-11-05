import { today } from "../../context/financeUtils";
import { useFinance } from "../../context/useFinance";
import "./Header.css";

function Header({ title, user }) {
  const { alerts } = useFinance();
  const date = today();
  const todayLabel = new Date(`${date}T12:00:00`).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  const todayAlerts = alerts.filter((alert) => alert.date === date).length;
  const openAlerts = () => {
    window.dispatchEvent(new CustomEvent("fin-wallet-navigate", { detail: "home" }));
    window.setTimeout(() => document.querySelector(".alert-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };
  return <header className="top-header">
    <div className="mobile-brand"><span className="brand-mark">f<span>.</span></span><strong>fin wallet</strong></div>
    <div className="header-location"><span>MI ESPACIO <b>·</b> {title.toUpperCase()}</span><strong>{todayLabel}</strong></div>
    <div className="header-actions"><button className="notification-button" title={todayAlerts ? `${todayAlerts} alertas nuevas` : "Centro de alertas"} aria-label="Abrir centro de alertas" onClick={openAlerts}>♧{todayAlerts > 0 && <i>{todayAlerts}</i>}</button><span className="header-avatar" aria-label={user?.name}>{user?.name?.trim()?.[0]?.toUpperCase() ?? "F"}</span></div>
  </header>;
}

export default Header;
