"use client";

import Link from "next/link";

export default function NavBar() {
    return (
        <header className="bg-white shadow-md fixed w-full top-0 z-50">
            <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo */}
                <div className="text-2xl font-bold text-[#5179EF]">
                    <Link href="/">Pass+</Link>
                </div>
                {/* Menu de Navegação */}
                <div className="flex items-center space-x-6">
                    <Link href="/#inicio" className="text-gray-600 hover:text-[#5179EF] transition-colors">
                        Início
                    </Link>
                    <Link href="/#funcionalidades" className="text-gray-600 hover:text-[#5179EF] transition-colors">
                        Funcionalidades
                    </Link>
                    <Link href="/#como-funciona" className="text-gray-600 hover:text-[#5179EF] transition-colors">
                        Como Funciona
                    </Link>
                    <Link href="/#para-pacientes" className="text-gray-600 hover:text-[#5179EF] transition-colors">
                        Para Pacientes
                    </Link>
                    <Link href="/medicos" className="text-gray-600 hover:text-[#5179EF] transition-colors">
                        Para Médicos
                    </Link>
                    <Link href="/login" className="text-gray-600 hover:text-[#5179EF] transition-colors">
                        Entrar
                    </Link>
                    <Link
                        href="/register"
                        className="bg-[#5179EF] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                    >
                        Cadastrar-se
                    </Link>
                </div>
            </nav>
        </header>
    );
}