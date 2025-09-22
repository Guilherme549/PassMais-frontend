"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/api";

export default function NavBarDashboardMedico() {
    const router = useRouter();

    const handleLogout = () => {
        clearTokens();
        try { localStorage.removeItem("fullName"); } catch {}
        try { document.cookie = "role=; Max-Age=0; path=/"; } catch {}
        router.push("/medicos/login-medico");
    };

    return (
        <header className="bg-white shadow-md fixed w-full top-0 z-50">
            <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo */}
                <div className="text-2xl font-bold text-[#5179EF]">
                    <Link href="/">Pass+</Link>
                </div>
                {/* Menu de Navegação */}
                <div className="flex items-center space-x-6">
                    <button
                        onClick={handleLogout}
                        className="text-gray-600 hover:text-[#5179EF] transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
                    >
                        Sair
                    </button>
                </div>
            </nav>
        </header>
    );
}
