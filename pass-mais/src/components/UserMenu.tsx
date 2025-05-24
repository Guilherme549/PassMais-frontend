import { Calendar, Home, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const UserMenu: React.FC = () => {
    return (
        <div className="w-72 bg-white rounded-xl border shadow-2xl overflow-hidden transform 
            transition-all duration-200">
            {/* Header */}
            <div className="flex items-center gap-4 p-5 border-b bg-gray-50">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="text-blue-600" size={24} />
                </div>
                <p className="text-base font-semibold text-blue-600">Fulano de Tal</p>
            </div>

            {/* Links */}
            <div className="flex flex-col">
                <Link href="/medical-appointments" className="flex items-center gap-4 px-5 py-4 text-base text-gray-700 
                    hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 border-b">
                    <Home size={18} /> Início
                </Link>

                <Link href="/minhas-consultas" className="flex items-center gap-4 px-5 py-4 text-base text-gray-700 
                    hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 border-b">
                    <Calendar size={18} /> Minhas consultas
                </Link>

                <Link href="/my-profile" className="flex items-center gap-4 px-5 py-4 text-base text-gray-700 
                    hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 border-b">
                    <User size={18} /> Meu perfil
                </Link>

                <Link href="#" className="flex items-center gap-4 px-5 py-4 text-base text-gray-700 
                    hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                    <LogOut size={18} /> Sair da conta
                </Link>
            </div>
        </div>
    );
};

export default UserMenu;