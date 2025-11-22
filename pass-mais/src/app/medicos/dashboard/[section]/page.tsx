"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Bell,
    CalendarCheck,
    CalendarClock,
    CalendarDays,
    LayoutDashboard,
    Stethoscope,
    Star,
    Users,
    Users2,
    Wallet,
    type LucideIcon,
} from "lucide-react";
import NavBarDashboardMedico from "../../components/NavBarDashboardMedico";
import AvaliacoesFeedback from "../avaliacoes-feedback";
import GerenciarAgendamentos from "../gerenciar-agendamentos";
import MeuFinanceiro from "../meu-financeiro";
import MeuPerfilProfissional from "../meu-perfil-profissional";
import Horarios from "../horarios";
import MeusPacientes from "../meus-pacientes";
import MinhaAgenda from "../minha-agenda";
import Notificacoes from "../notificacoes";
import VisaoGeral, { type AppointmentDetail } from "../visao-geral";
import DoctorTeamPage from "../team";

type DashboardNavItem = {
    name: string;
    path: string;
    icon: LucideIcon;
    description: string;
};

const NAV_ITEMS: DashboardNavItem[] = [
    {
        name: "Visão Geral",
        path: "visao-geral",
        icon: LayoutDashboard,
        description: "Resumo do dia e indicadores",
    },
    // {
    //     name: "Minha Agenda",
    //     path: "minha-agenda",
    //     icon: CalendarDays,
    //     description: "Consultas confirmadas",
    // },
    // {
    //     name: "Gerenciar Agendamentos",
    //     path: "gerenciar-agendamentos",
    //     icon: CalendarCheck,
    //     description: "Solicitações e ajustes",
    // },
    // {
    //     name: "Meu Financeiro",
    //     path: "meu-financeiro",
    //     icon: Wallet,
    //     description: "Pagamentos e repasses",
    // },
    // {
    //     name: "Meus Pacientes",
    //     path: "meus-pacientes",
    //     icon: Users,
    //     description: "Histórico e prontuários",
    // },
    {
        name: "Meu Perfil Profissional",
        path: "meu-perfil-profissional",
        icon: Stethoscope,
        description: "Dados pessoais e clínicos",
    },
    {
        name: "Horários",
        path: "horarios",
        icon: CalendarClock,
        description: "Disponibilidades e bloqueios",
    },
    {
        name: "Equipe",
        path: "team",
        icon: Users2,
        description: "Secretárias e códigos de convite",
    },
    // {
    //     name: "Notificações",
    //     path: "notificacoes",
    //     icon: Bell,
    //     description: "Alertas recentes",
    // },
    // {
    //     name: "Avaliações e Feedback",
    //     path: "avaliacoes-feedback",
    //     icon: Star,
    //     description: "Notas e comentários",
    // },
];

// Dados fictícios (substitua por chamadas à API)
const mockAppointments: AppointmentDetail[] = [];

const mockPatients = [
    { id: 1, name: "Ana Oliveira", cpf: "123.456.789-00", lastVisit: "2025-05-20", notes: "Paciente com hipertensão." },
    { id: 2, name: "Carlos Souza", cpf: "987.654.321-00", lastVisit: "2025-05-25", notes: "Consulta de rotina." },
];

const mockFinancials = [
    { id: 1, date: "2025-05-20", type: "Consulta", value: 200, status: "pago" },
    { id: 2, date: "2025-05-25", type: "Consulta", value: 200, status: "pendente" },
];

const mockNotifications = [
    { id: 1, message: "Nova consulta agendada com Ana Oliveira para 25/05/2025 às 09:00", date: "2025-05-24" },
    { id: 2, message: "Lembrete: Consulta com Mariana Lima em 26/05/2025 às 14:00", date: "2025-05-25" },
];

const mockReviews = [
    { id: 1, patient: "Ana Oliveira", rating: 5, comment: "Excelente médico, muito atencioso!" },
    { id: 2, patient: "Carlos Souza", rating: 4, comment: "Consulta boa, mas atrasou um pouco." },
];

export default function MedicoDashboardSection() {
    const router = useRouter();
    const pathname = usePathname();
    const [activeSection, setActiveSection] = useState("visao-geral");

    // Bloqueia acesso sem accessToken
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/medicos/login-medico');
        }
    }, [router]);

    useEffect(() => {
        const section = pathname.split("/").pop() || "visao-geral";
        setActiveSection(section);
        if (!["visao-geral", "minha-agenda", "gerenciar-agendamentos", "meu-financeiro", "meus-pacientes", "meu-perfil-profissional", "horarios", "team", "notificacoes", "avaliacoes-feedback"].includes(section)) {
            router.push("/medicos/dashboard/visao-geral");
        }
    }, [pathname, router]);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="fixed mt-[80px] h-screen w-72 bg-white/95 shadow-md backdrop-blur">
                <nav className="flex h-full flex-col border-r border-gray-100">
                    <div className="px-6 pb-4 pt-6">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Menu principal</p>
                    </div>
                    <ul className="flex-1 space-y-1 px-4 pb-6">
                        {NAV_ITEMS.map((item) => {
                            const isActive = activeSection === item.path;
                            const Icon = item.icon;

                            return (
                                <li key={item.path}>
                                    <Link
                                        href={`/medicos/dashboard/${item.path}`}
                                        className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                                            isActive
                                                ? "bg-[#5179EF] text-white shadow-sm"
                                                : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        <span
                                            className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm transition ${
                                                isActive
                                                    ? "border-white/40 bg-white/10 text-white"
                                                    : "border-gray-200 bg-gray-100 text-gray-500 group-hover:border-gray-300"
                                            }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <span className="flex flex-col">
                                            <span className="text-sm font-semibold leading-snug">{item.name}</span>
                                            <span
                                                className={`text-xs leading-tight ${
                                                    isActive ? "text-white/80" : "text-gray-400"
                                                }`}
                                            >
                                                {item.description}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>

            {/* Conteúdo Principal */}
            <div className="ml-72 flex-1">  
                <NavBarDashboardMedico />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-[80px]">
                    {activeSection === "visao-geral" && <VisaoGeral appointments={mockAppointments} />}
                    {activeSection === "minha-agenda" && <MinhaAgenda appointments={mockAppointments} />}
                    {activeSection === "gerenciar-agendamentos" && <GerenciarAgendamentos appointments={mockAppointments} />}
                    {activeSection === "meu-financeiro" && <MeuFinanceiro financials={mockFinancials} />}
                    {activeSection === "meus-pacientes" && <MeusPacientes patients={mockPatients} />}
                    {activeSection === "meu-perfil-profissional" && <MeuPerfilProfissional />}
                    {activeSection === "horarios" && <Horarios />}
                    {activeSection === "team" && <DoctorTeamPage />}
                    {activeSection === "notificacoes" && <Notificacoes notifications={mockNotifications} />}
                    {activeSection === "avaliacoes-feedback" && <AvaliacoesFeedback reviews={mockReviews} />}
                </div>
                
            </div>
        </div>
    );
}
