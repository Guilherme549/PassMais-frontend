"use client";

import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/api";

export default function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    try {
      clearTokens();
      try { localStorage.removeItem("fullName"); } catch {}
      try { document.cookie = "role=; Max-Age=0; path=/"; } catch {}
    } finally {
      router.push("/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
      aria-label="Sair"
    >
      Sair
    </button>
  );
}

