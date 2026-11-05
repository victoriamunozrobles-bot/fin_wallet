import "./Sidebar.css";
import { useAuth } from "../../context/useAuth";

const links = [
  { id: "home", icon: "⌂", label: "Inicio" },
  { id: "transactions", icon: "↗", label: "Transacciones" },
  { id: "analytics", icon: "▥", label: "Análisis" },
  { id: "planning", icon: "✿", label: "Presupuestos y ahorro" },
  { id: "settings", icon: "⚙", label: "Configuración" },
];

function Sidebar({ activeView, onSelect }) {
  const { user, signOut } = useAuth();
  const initials = user?.name?.trim()?.[0]?.toUpperCase() ?? "F";
  return <aside className="sidebar">
    <button className="brand-lockup" onClick={() => onSelect("home")} aria-label="Fin Wallet, ir a Inicio">
      <span className="brand-mark">f<span>.</span></span><span className="brand-name">fin wallet<small>dinero en calma</small></span>
    </button>
    <p className="nav-caption">MENÚ PRINCIPAL</p>
    <nav className="sidebar-nav" aria-label="Navegación principal">
      {links.map((link) => <button key={link.id} className={`nav-link ${activeView === link.id ? "is-active" : ""}`} onClick={() => onSelect(link.id)} aria-current={activeView === link.id ? "page" : undefined}>
        <span className="nav-icon">{link.icon}</span><span>{link.label}</span>{activeView === link.id && <i/>}
      </button>)}
    </nav>
    <div className="sidebar-note"><span>✦</span><strong>Un paso a la vez</strong><p>Pequeños hábitos crean una relación más bonita con tu dinero.</p></div>
    <div className="sidebar-profile"><span className="avatar">{initials}</span><div><strong>{user?.name}</strong><span>{user?.email}</span></div></div>
    <button className="sidebar-logout" type="button" onClick={signOut}>↪ Cerrar Sesión</button>
  </aside>;
}

export default Sidebar;
