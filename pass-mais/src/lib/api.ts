// Central API client with token handling and refresh.

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

let accessTokenMemory: string | null = null;

export function setTokens(tokens: { accessToken?: string | null; refreshToken?: string | null }) {
  const { accessToken, refreshToken } = tokens;
  if (typeof accessToken === "string") {
    accessTokenMemory = accessToken;
    // Persist optionally for page refresh convenience
    try { localStorage.setItem("accessToken", accessToken); } catch {}
  }
  if (typeof refreshToken === "string") {
    try { localStorage.setItem("refreshToken", refreshToken); } catch {}
  }
}

export function getAccessToken(): string | null {
  if (accessTokenMemory) return accessTokenMemory;
  try {
    const fromStorage = localStorage.getItem("accessToken");
    if (fromStorage) {
      accessTokenMemory = fromStorage;
      return fromStorage;
    }
  } catch {}
  return null;
}

export function getRefreshToken(): string | null {
  try { return localStorage.getItem("refreshToken"); } catch { return null; }
}

export function clearTokens() {
  accessTokenMemory = null;
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
  } catch {}
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
    setTokens({ accessToken: newAccess, refreshToken: newRefresh ?? refreshToken });
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
