import { Calendar, Home, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const UserMenu: React.FC = () => {
    return (
        <div className="w-64 bg-white rounded-lg border shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="text-[#2563EB]" size={20} />
                </div>
                <p className="text-sm font-semibold text-[#2563EB]">Fulano de Tal</p>
            </div>

            {/* Links */}
            <div className="flex flex-col">
                <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#EDEFF2] transition-colors border-b">
                    <Home size={16} /> Início
                </Link>

                <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#EDEFF2] transition-colors border-b">
                    <Calendar size={16} /> Minhas consultas
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#EDEFF2] transition-colors border-b">
                    <User size={16} /> Meu perfil
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#EDEFF2] transition-colors">
                    <LogOut size={16} /> Sair da conta
                </a>
            </div>
        </div>
    );
};

export default UserMenu;
