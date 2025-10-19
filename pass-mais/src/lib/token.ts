function decodeBase64Payload(token: string | null): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1]?.replace(/-/g, "+").replace(/_/g, "/") ?? "";
    if (!base64) return null;
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

    let decoded = "";
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      decoded = window.atob(padded);
    } else {
      const globalBuffer = (
        globalThis as unknown as {
          Buffer?: { from(input: string, encoding: string): { toString(enc: string): string } };
        }
      ).Buffer;
      if (globalBuffer) {
        decoded = globalBuffer.from(padded, "base64").toString("utf8");
      }
    }

    if (!decoded) return null;
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Falha ao decodificar payload do token", error);
    }
    return null;
  }
}

export function decodeAccessTokenPayload(token: string | null): Record<string, unknown> | null {
  return decodeBase64Payload(token);
}

export function extractDoctorIdFromToken(token: string | null): string | null {
  const payload = decodeBase64Payload(token);
  if (!payload) return null;
  const candidate =
    payload.doctorId ??
    payload.doctor_id ??
    payload.id ??
    payload.userId ??
    payload.sub ??
    null;
  if (typeof candidate === "string") return candidate;
  if (candidate != null) return String(candidate);
  return null;
}
