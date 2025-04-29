'use client';

import { ChevronDown, Menu, X } from "lucide-react";
import Link from 'next/link';
import { useState } from "react";
import UserMenu from "./UserMenu";

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
        setIsMenuOpen(false); // Fecha o UserMenu ao abrir/fechar o menu mobile
    };

    const toggleUserMenu = () => {
        setIsMenuOpen(prev => !prev);
    };

    return (
        <nav className="h-14 w-full bg-white shadow-sm">
            <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 h-full">
                <Link href="/">
                    <span className="text-[#2563EB] font-bold text-2xl">Pass+</span>
                </Link>

                {/* Menu Desktop */}
                <div className="hidden md:flex items-center gap-8 relative">
                    <Link href="#">
                        <span className="text-gray-700 hover:text-[#1078B0] transition-colors text-lg">
                            Minhas consultas
                        </span>
                    </Link>

                    <button
                        onClick={toggleUserMenu}
                        className="flex items-center gap-1 text-gray-700 text-lg hover:text-[#1078B0] transition-colors focus:outline-none cursor-pointer"
                    >
                        Minha conta <ChevronDown size={18} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute top-12 right-0 z-50">
                            <UserMenu />
                        </div>
                    )}
                </div>

                {/* Ícone de Hambúrguer para Mobile */}
                <button
                    className="md:hidden text-gray-700 hover:text-[#1078B0] focus:outline-none"
                    onClick={toggleMobileMenu}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Menu Mobile */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white shadow-lg w-full absolute top-14 left-0 z-50">
                    <div className="flex flex-col items-start gap-4 p-4">
                        <Link href="#" onClick={toggleMobileMenu}>
                            <span className="text-gray-700 hover:text-[#1078B0] transition-colors text-lg">
                                Minhas consultas
                            </span>
                        </Link>

                        <button
                            onClick={toggleUserMenu}
                            className="flex items-center gap-1 text-gray-700 text-lg hover:text-[#1078B0] transition-colors focus:outline-none cursor-pointer"
                        >
                            Minha conta <ChevronDown size={18} />
                        </button>

                        {isMenuOpen && (
                            <div className="w-full mt-2">
                                <UserMenu />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}