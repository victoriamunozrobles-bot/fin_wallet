import { useCallback, useEffect, useMemo, useState } from "react";
import AuthContext from "./AuthContextValue";
import { apiGet, apiPost, apiPut, ApiError } from "../services/api";

const USER_KEY = "fin_wallet_user";
const TOKEN_KEY = "fin_wallet_token";
const MODE_KEY = "fin_wallet_auth_mode";
const ACCOUNTS_KEY = "fin_wallet_local_accounts";
const PBKDF2_ITERATIONS = 120000;

const isNetworkFailure = (error) => error instanceof ApiError && (error.status === 0 || error.status >= 500);
const newLocalId = () => `local-${crypto.randomUUID()}`;

function readUser() {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    return user && user.id && user.email ? user : null;
  } catch (error) {
    console.error("No se pudo recuperar el perfil de Fin Wallet.", error);
    return null;
  }
}

function readLocalAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
    return Array.isArray(accounts) ? accounts : [];
  } catch (error) {
    console.error("No se pudieron leer las cuentas locales de Fin Wallet.", error);
    return [];
  }
}

function updateLocalAccount(user) {
  const accounts = readLocalAccounts().map((account) => account.id === user.id
    ? { ...account, name: user.name, email: user.email.toLowerCase(), currency: user.currency }
    : account);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function passwordDigest(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const digest = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    salt,
    iterations: PBKDF2_ITERATIONS,
    hash: "SHA-256",
  }, key, 256);
  return new Uint8Array(digest);
}

async function saveLocalAccount(user, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await passwordDigest(password, salt);
  const accounts = readLocalAccounts().filter((account) => account.email !== user.email.toLowerCase());
  accounts.push({ id: user.id, name: user.name, email: user.email.toLowerCase(), currency: user.currency, salt: toBase64(salt), hash: toBase64(hash) });
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

async function verifyLocalPassword(account, password) {
  if (!account?.salt || !account?.hash) return false;
  const actual = await passwordDigest(password, fromBase64(account.salt));
  const expected = fromBase64(account.hash);
  return actual.length === expected.length && actual.reduce((difference, byte, index) => difference | (byte ^ expected[index]), 0) === 0;
}

function localUser(name, email, currency = "CLP") {
  return { id: newLocalId(), name, email: email.toLowerCase(), currency };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ user: null, mode: null, loading: true });

  const establishSession = useCallback((user, token, mode) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(MODE_KEY, mode);
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    setSession({ user, mode, loading: false });
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(MODE_KEY);
    setSession({ user: null, mode: null, loading: false });
  }, []);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      const cachedUser = readUser();
      const token = localStorage.getItem(TOKEN_KEY);
      const storedMode = localStorage.getItem(MODE_KEY);
      if (storedMode === "local" && cachedUser) {
        if (active) setSession({ user: cachedUser, mode: "local", loading: false });
        return;
      }
      if (!token) {
        if (cachedUser && storedMode === "local") {
          if (active) setSession({ user: cachedUser, mode: "local", loading: false });
        } else if (active) {
          clearSession();
        }
        return;
      }

      try {
        const result = await apiGet("/auth/me");
        if (active) establishSession(result.user, token, "api");
      } catch (error) {
        if (!active) return;
        if (isNetworkFailure(error) && cachedUser) {
          establishSession(cachedUser, token, "local");
        } else {
          clearSession();
        }
      }
    };
    restoreSession();
    return () => { active = false; };
  }, [clearSession, establishSession]);

  const signUp = useCallback(async ({ name, email, password, currency }) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const result = await apiPost("/auth/signup", { name: name.trim(), email: normalizedEmail, password, currency });
      establishSession(result.user, result.token, "api");
      await saveLocalAccount(result.user, password);
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
      if (readLocalAccounts().some((account) => account.email === normalizedEmail)) {
        throw new Error("Ya existe una cuenta local con ese correo.", { cause: error });
      }
      const user = localUser(name.trim(), normalizedEmail, currency);
      await saveLocalAccount(user, password);
      establishSession(user, null, "local");
    }
  }, [establishSession]);

  const signIn = useCallback(async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const result = await apiPost("/auth/login", { email: normalizedEmail, password });
      establishSession(result.user, result.token, "api");
      await saveLocalAccount(result.user, password);
    } catch (error) {
      if (!isNetworkFailure(error)) throw new Error(error instanceof Error ? error.message : "No se pudo iniciar sesión.", { cause: error });
      const account = readLocalAccounts().find((item) => item.email === normalizedEmail);
      if (!await verifyLocalPassword(account, password)) throw new Error("El correo o la contraseña no coinciden en este dispositivo.", { cause: error });
      establishSession({ id: account.id, name: account.name, email: account.email, currency: account.currency }, null, "local");
    }
  }, [establishSession]);

  const signInDemo = useCallback(async () => {
    try {
      const result = await apiPost("/auth/demo");
      establishSession(result.user, result.token, "api");
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
      const user = { id: "local-demo", name: "Demo", email: "demo@finwallet.local", currency: "CLP" };
      establishSession(user, null, "local");
    }
  }, [establishSession]);

  const signOut = useCallback(async () => {
    if (session.mode === "api") {
      void apiPost("/auth/logout").catch((error) => {
        console.warn("No se pudo notificar el cierre de sesión al servidor.", error);
      });
    }
    clearSession();
    window.dispatchEvent(new Event("fin-wallet-logged-out"));
  }, [clearSession, session.mode]);

  const updateUser = useCallback(async (updates) => {
    const nextUser = { ...session.user, ...updates };
    if (session.mode === "api") {
      try {
        const result = await apiPut("/auth/me", updates);
        establishSession(result.user, localStorage.getItem(TOKEN_KEY), "api");
        updateLocalAccount(result.user);
        return result.user;
      } catch (error) {
        if (!isNetworkFailure(error)) throw error;
        establishSession(nextUser, null, "local");
        updateLocalAccount(nextUser);
        return nextUser;
      }
    }
    establishSession(nextUser, null, "local");
    updateLocalAccount(nextUser);
    return nextUser;
  }, [establishSession, session.mode, session.user]);

  const value = useMemo(() => ({
    ...session,
    signUp,
    signIn,
    signInDemo,
    signOut,
    updateUser,
  }), [session, signUp, signIn, signInDemo, signOut, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
