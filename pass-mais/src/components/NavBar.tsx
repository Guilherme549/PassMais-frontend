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
        setIsMenuOpen(false);
    };

    const toggleUserMenu = () => {
        setIsMenuOpen(prev => !prev);
    };

    return (
        <nav className="h-16 w-full bg-white shadow-md fixed top-0 z-50">
            <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <Link href="/">
                    <span className="text-blue-600 font-bold text-3xl tracking-tight">Pass+</span>
                </Link>

                {/* Menu Desktop */}
                <div className="hidden md:flex items-center gap-10 relative">
                    <Link href="#">
                        <span className="text-gray-700 text-lg font-medium hover:text-blue-600 
                            transition-colors duration-200">
                            Minhas consultas
                        </span>
                    </Link>

                    <button
                        onClick={toggleUserMenu}
                        className="flex items-center gap-2 text-gray-700 text-lg font-medium 
                            hover:text-blue-600 transition-colors duration-200 focus:outline-none"
                    >
                        Minha conta <ChevronDown size={20} className="text-gray-500" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute top-14 right-0 z-50 animate-fadeIn">
                            <UserMenu />
                        </div>
                    )}
                </div>

                {/* Ícone de Hambúrguer para Mobile */}
                <button
                    className="md:hidden text-gray-700 hover:text-blue-600 focus:outline-none 
                        transition-colors duration-200"
                    onClick={toggleMobileMenu}
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Menu Mobile */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white shadow-xl w-full absolute top-16 left-0 z-50 
                    animate-slideDown">
                    <div className="flex flex-col items-start gap-6 p-6">
                        <Link href="#" onClick={toggleMobileMenu}>
                            <span className="text-gray-700 text-lg font-medium hover:text-blue-600 
                                transition-colors duration-200">
                                Minhas consultas
                            </span>
                        </Link>

                        <button
                            onClick={toggleUserMenu}
                            className="flex items-center gap-2 text-gray-700 text-lg font-medium 
                                hover:text-blue-600 transition-colors duration-200 focus:outline-none"
                        >
                            Minha conta <ChevronDown size={20} className="text-gray-500" />
                        </button>

                        {isMenuOpen && (
                            <div className="w-full mt-4">
                                <UserMenu />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}