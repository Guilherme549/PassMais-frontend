'use client';

import { ChevronDown } from "lucide-react";
import Link from 'next/link';
import { useState } from "react";
import UserMenu from "./UserMenu";

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="h-14 w-full bg-white shadow-sm ">
            <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-full">
                <Link href="/">
                    <span className="text-[#2563EB] font-bold text-2xl">Pass+</span>
                </Link>

                <div className="flex items-center gap-12 relative">
                    <Link href="#">
                        <span className="text-gray-700 text-base font-medium hover:text-[#1078B0] transition-colors">
                            Minhas consultas
                        </span>
                    </Link>

                    <button
                        onClick={() => setIsMenuOpen(prev => !prev)}
                        className="flex items-center gap-1 text-gray-700 text-base font-medium hover:text-[#1078B0] transition-colors focus:outline-none cursor-pointer"
                    >
                        Minha conta <ChevronDown size={18} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute top-12 right-0 z-50">
                            <UserMenu />
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
