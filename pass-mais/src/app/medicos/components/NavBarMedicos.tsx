"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NavBarMedicos() {
    const [isMedico, setIsMedico] = useState(true);
    const router = useRouter();

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const isMedicoSelected = e.target.value === "medico";
        setIsMedico(isMedicoSelected);
        if (!isMedicoSelected) {
            router.push("/");
        } else {
            router.push("/medicos");
        }
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
                    <div className="relative">
                        <select
                            value={isMedico ? "medico" : "paciente"}
                            onChange={handleRoleChange}
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5179EF] focus:border-transparent text-gray-700"
                        >
                            <option value="medico">Médico</option>
                            <option value="paciente">Paciente</option>
                        </select>
                    </div>
                    <Link
                        href={isMedico ? "/register" : "/register/patient"}
                        className="text-gray-600 hover:text-[#5179EF] transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
                    >
                        Cadastrar
                    </Link>
                    <Link
                        href={isMedico ? "/login" : "/login/patient"}
                        className="text-gray-600 hover:text-[#5179EF] transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
                    >
                        Entrar
                    </Link>
                </div>
            </nav>
        </header>
    );
}