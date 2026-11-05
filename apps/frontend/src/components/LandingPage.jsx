import { useState } from "react";
import "./Auth.css";

const features = [
  { icon: "✿", title: "Saldos separados", text: "Tu ahorro nunca se mezcla con tu dinero para gastar.", tone: "pink" },
  { icon: "↗", title: "Alertas inteligentes", text: "Barras de progreso que te avisan al 80% y al llegar al límite.", tone: "lavender" },
  { icon: "↻", title: "Pagos automáticos", text: "Tus suscripciones se registran el día que corresponde.", tone: "mint" },
  { icon: "▦", title: "Calendario y reportes", text: "Descubre tus días de más gasto y descarga tu historial.", tone: "peach" },
];

function Brand({ onClick }) {
  return <button className="auth-brand" type="button" onClick={onClick} aria-label="Fin Wallet, inicio">
    <span className="auth-brand-mark">f<span>.</span></span>
    <span>fin wallet<small>dinero en calma</small></span>
  </button>;
}

export default function LandingPage({ onNavigate, onDemo }) {
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState("");
  const tryDemo = async () => {
    setDemoLoading(true);
    setDemoError("");
    try { await onDemo(); } catch (error) {
      setDemoError(error instanceof Error ? error.message : "No se pudo abrir la demo.");
    } finally { setDemoLoading(false); }
  };
  return <div className="landing-page">
    <header className="landing-nav">
      <Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}/>
      <nav aria-label="Acceso a tu cuenta">
        <button className="auth-button auth-button--white" type="button" onClick={() => onNavigate("login")}>Iniciar Sesión</button>
        <button className="auth-button auth-button--berry" type="button" onClick={() => onNavigate("signup")}>Crear Cuenta Gratis</button>
      </nav>
    </header>
    <main>
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-badge">✨ Tu dinero, tus reglas, sin planillas aburridas</span>
          <h1>Toma el control de tus finanzas <em>con estilo.</em></h1>
          <p>Separa tu <strong>saldo para gastar</strong> de tus sobres de ahorro, automatiza los pagos recurrentes y recibe alertas antes de pasarte del presupuesto.</p>
          <div className="landing-actions">
            <button className="auth-button auth-button--berry auth-button--large" type="button" onClick={() => onNavigate("signup")}>Comenzar ahora <span>→</span></button>
            <button className="auth-button auth-button--white auth-button--large" type="button" disabled={demoLoading} onClick={tryDemo}>{demoLoading ? "Preparando demo…" : "Probar Demo Rápida"}</button>
          </div>
          {demoError && <p className="auth-error landing-demo-error" role="alert">{demoError}</p>}
          <div className="landing-social-proof"><span aria-hidden="true">✦ ✿ ✦</span> Un espacio amable para tomar mejores decisiones.</div>
        </div>
        <div className="landing-preview" aria-label="Vista previa del dashboard de Fin Wallet">
          <div className="preview-orbit preview-orbit--one"/>
          <div className="preview-orbit preview-orbit--two"/>
          <article className="preview-card preview-card--balance">
            <span>DISPONIBLE PARA GASTAR <i>✳</i></span>
            <strong>$850.000</strong>
            <small>Tu dinero libre, con intención.</small>
          </article>
          <article className="preview-card preview-card--goal">
            <span className="preview-icon">✿</span>
            <div><small>SOBRE DE AHORRO</small><strong>Viaje ✨</strong><b>$420.000 <small>de $600.000</small></b><span className="preview-progress"><i/></span></div>
          </article>
          <article className="preview-card preview-card--alert">
            <span className="preview-alert-icon">!</span>
            <div><small>PRESUPUESTO · COMIDA</small><strong>Vas en el 85%</strong><span>¡Vas muy bien, queda poquito!</span></div>
          </article>
          <span className="preview-sparkle preview-sparkle--one">✦</span>
          <span className="preview-sparkle preview-sparkle--two">✿</span>
        </div>
      </section>
      <section className="landing-features" aria-labelledby="features-title">
        <div className="landing-section-heading"><span>TODO EN SU LUGAR</span><h2 id="features-title">Finanzas claras, <em>mente tranquila.</em></h2><p>Las herramientas que necesitas, con una experiencia que da gusto abrir.</p></div>
        <div className="feature-grid">{features.map((feature) => <article className={`feature-card feature-card--${feature.tone}`} key={feature.title}><span>{feature.icon}</span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
      </section>
    </main>
    <footer className="landing-footer">
      <Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}/>
      <span>Un paso a la vez, tus finanzas en calma. ✿</span>
      <nav aria-label="Accesos rápidos"><button type="button" onClick={() => onNavigate("login")}>Iniciar Sesión</button><button type="button" onClick={() => onNavigate("signup")}>Crear Cuenta</button></nav>
    </footer>
  </div>;
}

export { Brand };
