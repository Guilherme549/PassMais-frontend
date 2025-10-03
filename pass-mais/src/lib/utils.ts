import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === "string") return null;

  if (/^data:image\//i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;

  if (trimmed.startsWith("/")) {
    if (API_BASE_URL) return `${API_BASE_URL}${trimmed}`;
    return trimmed;
  }

  if (API_BASE_URL) {
    try {
      return new URL(trimmed, `${API_BASE_URL}/`).toString();
    } catch {
      // ignore
    }
  }

  return `/${trimmed.replace(/^\/+/, "")}`;
}
