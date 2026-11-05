import { useState } from "react";
import { Brand } from "./LandingPage";
import "./Auth.css";

function humanError(error) {
  return error instanceof Error ? error.message : "No se pudo completar. Intenta nuevamente.";
}

export default function AuthPage({ mode, onNavigate, onLogin, onSignUp, onDemo }) {
  const isSignUp = mode === "signup";
  const [values, setValues] = useState({ name: "", email: "", currency: "CLP", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const change = (field) => (event) => setValues((previous) => ({ ...previous, [field]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (isSignUp && values.password !== values.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) await onSignUp(values);
      else await onLogin(values);
    } catch (submitError) {
      setError(humanError(submitError));
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-screen">
    <header className="auth-screen-nav"><Brand onClick={() => onNavigate("landing")}/><button type="button" className="auth-back-link" onClick={() => onNavigate("landing")}>← Volver al inicio</button></header>
    <section className="auth-card" aria-labelledby="auth-title">
      <div className={`auth-card-heading ${isSignUp ? "auth-card-heading--lavender" : ""}`}>
        <span className="auth-card-flower">{isSignUp ? "✿" : "✦"}</span>
        <p>{isSignUp ? "UN LUGAR PARA TUS PLANES" : "QUÉ BUENO TENERTE DE VUELTA"}</p>
        <h1 id="auth-title">{isSignUp ? "Crea tu cuenta" : "Inicia sesión"}</h1>
        <span>{isSignUp ? "Tu dinero merece un espacio bonito." : "Tus finanzas en calma te esperan."}</span>
      </div>
      <form className="auth-form" onSubmit={submit}>
        {isSignUp && <>
          <label>Nombre o apodo<input autoComplete="name" maxLength="80" required value={values.name} onChange={change("name")} placeholder="Victoria"/></label>
        </>}
        <label>Correo electrónico<input autoComplete="email" type="email" maxLength="254" required value={values.email} onChange={change("email")} placeholder="tu@correo.com"/></label>
        {isSignUp && <label>Moneda preferida<select value={values.currency} onChange={change("currency")}><option value="CLP">CLP $ · Peso chileno</option><option value="USD">USD $ · Dólar</option></select></label>}
        <label>Contraseña<span className="auth-password-field"><input autoComplete={isSignUp ? "new-password" : "current-password"} type={showPassword ? "text" : "password"} minLength="6" maxLength="128" required value={values.password} onChange={change("password")} placeholder="Al menos 6 caracteres"/><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? "Ocultar" : "Ver"}</button></span></label>
        {isSignUp && <label>Confirmar contraseña<input autoComplete="new-password" type={showPassword ? "text" : "password"} minLength="6" maxLength="128" required value={values.confirmPassword} onChange={change("confirmPassword")} placeholder="Repite tu contraseña"/></label>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-button auth-button--berry auth-submit" disabled={loading} type="submit">{loading ? "Un momento…" : isSignUp ? "Crear mi cuenta" : "Entrar a mi billetera"}<span>→</span></button>
      </form>
      {!isSignUp && <button className="auth-button auth-button--white auth-demo-button" disabled={loading} type="button" onClick={async () => {
        setError("");
        setLoading(true);
        try { await onDemo(); } catch (demoError) { setError(humanError(demoError)); } finally { setLoading(false); }
      }}>✿ Entrar con cuenta Demo</button>}
      <p className="auth-switch">{isSignUp ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}{" "}<button type="button" onClick={() => onNavigate(isSignUp ? "login" : "signup")}>{isSignUp ? "Inicia sesión" : "Crea una aquí"}</button></p>
      <p className="auth-privacy">Tus datos financieros son privados y pertenecen a tu cuenta.</p>
    </section>
    <footer className="auth-screen-footer">Fin Wallet · dinero en calma ✿</footer>
  </main>;
}
