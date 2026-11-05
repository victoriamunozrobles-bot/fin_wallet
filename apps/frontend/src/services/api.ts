const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  let response: Response;
  try {
    const token = localStorage.getItem("fin_wallet_token");
    const authMode = localStorage.getItem("fin_wallet_auth_mode");
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(token && authMode !== "local" ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "API no disponible.", 0);
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    throw new ApiError(payload?.error || `La API respondió ${response.status}.`, response.status);
  }
  return payload;
}

export const apiGet = (path: string) => apiRequest(path);
export const apiPost = (path: string, body?: unknown) => apiRequest(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
export const apiPut = (path: string, body: unknown) => apiRequest(path, { method: "PUT", body: JSON.stringify(body) });
export const apiDelete = (path: string) => apiRequest(path, { method: "DELETE" });
