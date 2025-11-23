"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type SessionExpiredDetail = {
  role?: string | null;
};

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

export function SessionWatcher() {
  const router = useRouter();
  const lastRoleRef = useRef<string | null>(null);

  const resolveRole = () => {
    const inMemory = lastRoleRef.current;
    if (inMemory) return inMemory;
    try {
      const stored = localStorage.getItem("role");
      if (stored) {
        lastRoleRef.current = stored;
        return stored;
      }
    } catch {}
    return null;
  };

  const isOnLoginPage = () => {
    if (typeof window === "undefined") return false;
    const path = window.location.pathname || "";
    return (
      path.startsWith("/login") ||
      path.startsWith("/medicos/login-medico") ||
      path.startsWith("/secretarias/convite")
    );
  };

  const redirect = (role?: string | null) => {
    if (isOnLoginPage()) return;
    const target = resolveLoginRedirect(role);
    router.replace(target);
  };

  useEffect(() => {
    // Primeira leitura do role armazenado
    try {
      const stored = localStorage.getItem("role");
      if (stored) lastRoleRef.current = stored;
    } catch {}

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<SessionExpiredDetail>).detail;
      const role = detail?.role ?? resolveRole();
      redirect(role);
    };

    const storageHandler = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === "role" && event.newValue) {
        lastRoleRef.current = event.newValue;
      }
      const sensitiveKeys = ["accessToken", "passmais:accessToken", "refreshToken", "passmais:sessionId"];
      if (sensitiveKeys.includes(event.key) && event.newValue === null) {
        redirect(resolveRole());
      }
    };

    window.addEventListener("sessionExpired", handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("sessionExpired", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, [router]);

  return null;
}
