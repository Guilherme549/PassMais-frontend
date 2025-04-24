import { Calendar, Home, LogOut, User } from 'lucide-react';
import React from 'react';

const UserMenu: React.FC = () => {
    return (
        <div className="user-menu">
            <div className="user-menu-header">
                <div className="user-avatar">
                    <span>FS</span>
                </div>
                <div className="user-info">
                    <p className="user-name">Fulano da Silva</p>
                </div>
            </div>

            <div className="user-menu-items">
                <a href="#" className="user-menu-item">
                    <Home size={16} />
                    <span>Início</span>
                </a>
                <a href="/appointments" className="user-menu-item">
                    <Calendar size={16} />
                    <span>Minhas consultas</span>
                </a>
                <a href="/profile" className="user-menu-item">
                    <User size={16} />
                    <span>Meu perfil</span>
                </a>
                <a href="/logout" className="user-menu-item">
                    <LogOut size={16} />
                    <span>Sair da conta</span>
                </a>
            </div>
        </div>
    );
};

export default UserMenu;