// Central API client with token handling and refresh.

import { decodeAccessTokenPayload, extractDoctorIdFromToken } from "./token";

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const SESSION_ID_KEY = "passmais:sessionId";
const SESSION_OWNER_KEY = "passmais:sessionOwner";

let accessTokenMemory: string | null = null;
let activeSessionIdMemory: string | null = null;
let sessionOwnerMemory: SessionOwner | null = null;
let storageListenerRegistered = false;
let sessionInvalidated = false;

type SessionOwner = { sessionId?: string | null; role?: string | null; userId?: string | null };
type SessionMeta = { userId?: string | number | null; role?: string | null };

function generateSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readSessionId() {
  try { return localStorage.getItem(SESSION_ID_KEY); } catch { return null; }
}

function readSessionOwner() {
  try {
    const raw = localStorage.getItem(SESSION_OWNER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionOwner | null;
  } catch {
    return null;
  }
}

function readAccessTokenFromStorage() {
  try {
    return localStorage.getItem("accessToken") ?? localStorage.getItem("passmais:accessToken");
  } catch {
    return null;
  }
}

function persistSession(sessionId: string, meta?: SessionMeta) {
  activeSessionIdMemory = sessionId;
  const normalizedRole = meta?.role ? String(meta.role).toUpperCase() : undefined;
  const normalizedUserId = meta?.userId != null ? String(meta.userId) : undefined;
  const sessionOwner = JSON.stringify({ sessionId, role: normalizedRole, userId: normalizedUserId });
  sessionOwnerMemory = { sessionId, role: normalizedRole, userId: normalizedUserId };
  try {
    localStorage.setItem(SESSION_ID_KEY, sessionId);
    localStorage.setItem(SESSION_OWNER_KEY, sessionOwner);
  } catch {
    // ignore quota failures
  }
}

function dispatchSessionExpired(role?: string | null) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent("sessionExpired", { detail: { role: role ?? null } });
  window.dispatchEvent(event);
}

function ensureStorageListener() {
  if (storageListenerRegistered) return;
  if (typeof window === "undefined") return;
  window.addEventListener("storage", (event) => {
    if (!event.key) return;
    if ([SESSION_ID_KEY, "accessToken", "passmais:accessToken", "refreshToken"].includes(event.key)) {
      syncSessionFromStorage();
    }
  });
  storageListenerRegistered = true;
}

function syncSessionFromStorage() {
  if (typeof window === "undefined") return;
  const previousOwner = sessionOwnerMemory || readSessionOwner();
  const hadSession = Boolean(activeSessionIdMemory || sessionOwnerMemory);
  const storedSessionId = readSessionId();
  const storedOwner = readSessionOwner();
  const sessionChanged =
    (storedOwner?.sessionId && sessionOwnerMemory?.sessionId && storedOwner.sessionId !== sessionOwnerMemory.sessionId) ||
    (storedSessionId && activeSessionIdMemory && storedSessionId !== activeSessionIdMemory);
  if (!storedSessionId) {
    if (hadSession) {
      sessionInvalidated = true;
      accessTokenMemory = null;
      activeSessionIdMemory = null;
      sessionOwnerMemory = null;
      dispatchSessionExpired(previousOwner?.role);
      return;
    }
    activeSessionIdMemory = null;
    accessTokenMemory = null;
    sessionOwnerMemory = null;
    sessionInvalidated = false;
    return;
  }

  if (sessionChanged) {
    sessionInvalidated = true;
    accessTokenMemory = null;
    activeSessionIdMemory = storedSessionId;
    sessionOwnerMemory = storedOwner;
    dispatchSessionExpired(previousOwner?.role || storedOwner?.role || sessionOwnerMemory?.role);
    return;
  }

  if (storedSessionId !== activeSessionIdMemory) {
    activeSessionIdMemory = storedSessionId;
    accessTokenMemory = readAccessTokenFromStorage();
  } else if (!accessTokenMemory) {
    accessTokenMemory = readAccessTokenFromStorage();
  }

  sessionOwnerMemory = storedOwner;
}

export function setTokens(
  tokens: { accessToken?: string | null; refreshToken?: string | null },
  sessionMeta?: SessionMeta,
  options?: { resetSession?: boolean },
) {
  ensureStorageListener();
  const shouldResetSession = options?.resetSession !== false;

  if (shouldResetSession) {
    clearTokens({ emitEvent: false });
    sessionInvalidated = false;
  } else {
    syncSessionFromStorage();
  }

  const { accessToken, refreshToken } = tokens;

  const decodedPayload = typeof accessToken === "string" ? decodeAccessTokenPayload(accessToken) : null;
  const resolvedUserId =
    sessionMeta?.userId ??
    extractDoctorIdFromToken(accessToken ?? null) ??
    (decodedPayload?.userId as string | number | undefined) ??
    (decodedPayload?.sub as string | number | undefined) ??
    (decodedPayload?.id as string | number | undefined);
  const resolvedRole =
    sessionMeta?.role ??
    (decodedPayload?.role as string | undefined) ??
    (Array.isArray(decodedPayload?.roles) ? decodedPayload?.roles[0] as string : undefined);

  const existingSessionId = activeSessionIdMemory || readSessionId();
  const newSessionId = shouldResetSession ? generateSessionId() : existingSessionId || generateSessionId();
  persistSession(newSessionId, { userId: resolvedUserId, role: resolvedRole });

  // Reset in-memory token when a new session is created
  accessTokenMemory = null;

  if (typeof accessToken === "string") {
    accessTokenMemory = accessToken;
    try {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("passmais:accessToken", accessToken);
    } catch {}
  }
  if (typeof refreshToken === "string") {
    try { localStorage.setItem("refreshToken", refreshToken); } catch {}
  }
}

function resolveLoginRedirect(role?: string | null) {
  const normalized = role ? String(role).toUpperCase() : "";
  switch (normalized) {
    case "DOCTOR":
      return "/medicos/login-medico";
    case "SECRETARY":
      return "/secretarias/convite";
    case "ADMINISTRATOR":
      return "/login";
    case "PATIENT":
      return "/login";
    default:
      return "/login";
  }
}

export function getAccessToken(): string | null {
  ensureStorageListener();
  syncSessionFromStorage();
  if (sessionInvalidated) return null;
  if (accessTokenMemory) return accessTokenMemory;
  return readAccessTokenFromStorage();
}

export function getRefreshToken(): string | null {
  ensureStorageListener();
  syncSessionFromStorage();
  if (sessionInvalidated) return null;
  try { return localStorage.getItem("refreshToken"); } catch { return null; }
}

export function clearTokens(options?: { emitEvent?: boolean }) {
  accessTokenMemory = null;
  activeSessionIdMemory = null;
  sessionOwnerMemory = null;
  sessionInvalidated = false;
  const emitEvent = options?.emitEvent !== false;
  const lastRole = readSessionOwner()?.role;
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("passmais:accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(SESSION_OWNER_KEY);
  } catch {}
  if (emitEvent) {
    dispatchSessionExpired(lastRole);
  }
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    const newAccess = data?.accessToken as string | undefined;
    const newRefresh = data?.refreshToken as string | undefined;
    if (!newAccess) return false;
    setTokens({ accessToken: newAccess, refreshToken: newRefresh ?? refreshToken }, undefined, { resetSession: false });
    return true;
  } catch {
    return false;
  }
}

type ApiFetchInit = RequestInit & { rawUrl?: string };

export async function apiFetch(path: string, init: ApiFetchInit = {}): Promise<Response> {
  // If the path targets Next.js API routes ("/api/..."), keep it same-origin to avoid CORS
  const url = init.rawUrl
    ? init.rawUrl
    : (path.startsWith("/api/")
        ? path
        : `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  const headers = new Headers(init.headers || {});

  const hasFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!hasFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const retryHeaders = new Headers(init.headers || {});
      const newToken = getAccessToken();
      if (newToken) retryHeaders.set("Authorization", `Bearer ${newToken}`);
      if (!hasFormData && !retryHeaders.has("Content-Type")) retryHeaders.set("Content-Type", "application/json");
      res = await fetch(url, { ...init, headers: retryHeaders });
    } else {
      clearTokens();
    }
  }
  return res;
}

function buildResponseError(res: Response, raw: string): Error & { status?: number } {
  const error = new Error(raw || `HTTP ${res.status}`) as Error & { status?: number };
  error.status = res.status;
  return error;
}

export async function jsonPost<T>(path: string, body: any, init: ApiFetchInit = {}): Promise<T> {
  const res = await apiFetch(path, { method: "POST", body: JSON.stringify(body), ...init });
  const text = await res.text();
  if (!res.ok) {
    try {
      const data = JSON.parse(text);
      const message = data.message || data.mensagem || data.error || `HTTP ${res.status}`;
      throw buildResponseError(res, message);
    } catch {
      throw buildResponseError(res, text);
    }
  }
  return text ? JSON.parse(text) : ({} as T);
}

export async function jsonPut<T>(path: string, body: any, init: ApiFetchInit = {}): Promise<T> {
  const res = await apiFetch(path, { method: "PUT", body: JSON.stringify(body), ...init });
  const text = await res.text();
  if (!res.ok) {
    try {
      const data = JSON.parse(text);
      const message = data.message || data.mensagem || data.error || `HTTP ${res.status}`;
      throw buildResponseError(res, message);
    } catch {
      throw buildResponseError(res, text);
    }
  }
  return text ? JSON.parse(text) : ({} as T);
}

export async function jsonGet<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const res = await apiFetch(path, { method: "GET", ...init });
  const text = await res.text();
  if (!res.ok) {
    try {
      const data = JSON.parse(text);
      const message = data.message || data.mensagem || data.error || `HTTP ${res.status}`;
      throw buildResponseError(res, message);
    } catch {
      throw buildResponseError(res, text);
    }
  }
  return text ? JSON.parse(text) : ({} as T);
}

export { BASE_URL };
