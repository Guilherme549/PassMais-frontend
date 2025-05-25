"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import NavBarDashboardMedico from "../../components/NavBarDashboardMedico";
import AvaliacoesFeedback from "../avaliacoes-feedback";
import GerenciarAgendamentos from "../gerenciar-agendamentos";
import MeuFinanceiro from "../meu-financeiro";
import MeuPerfilProfissional from "../meu-perfil-profissional";
import MeusPacientes from "../meus-pacientes";
import MinhaAgenda from "../minha-agenda";
import Notificacoes from "../notificacoes";
import VisaoGeral from "../visao-geral";

// Dados fictícios (substitua por chamadas à API)
const mockAppointments = [
    { id: 1, patient: "Ana Oliveira", date: "2025-05-25", time: "09:00", status: "pendente" },
    { id: 2, patient: "Carlos Souza", date: "2025-05-25", time: "10:30", status: "realizada" },
    { id: 3, patient: "Mariana Lima", date: "2025-05-26", time: "14:00", status: "pendente" },
];

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

    useEffect(() => {
        const section = pathname.split("/").pop() || "visao-geral";
        setActiveSection(section);
        if (!["visao-geral", "minha-agenda", "gerenciar-agendamentos", "meu-financeiro", "meus-pacientes", "meu-perfil-profissional", "notificacoes", "avaliacoes-feedback"].includes(section)) {
            router.push("/medicos/dashboard/visao-geral");
        }
    }, [pathname, router]);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md fixed h-screen mt-[80px]">
                <nav className="mt-6">
                    {[
                        { name: "Visão Geral", path: "visao-geral" },
                        { name: "Minha Agenda", path: "minha-agenda" },
                        { name: "Gerenciar Agendamentos", path: "gerenciar-agendamentos" },
                        { name: "Meu Financeiro", path: "meu-financeiro" },
                        { name: "Meus Pacientes", path: "meus-pacientes" },
                        { name: "Meu Perfil Profissional", path: "meu-perfil-profissional" },
                        { name: "Notificações", path: "notificacoes" },
                        { name: "Avaliações e Feedback", path: "avaliacoes-feedback" },
                    ].map((item) => (
                        <Link
                            key={item.path}
                            href={`/medicos/dashboard/${item.path}`} // Usando /medicos/ para corresponder ao diretório
                            className={`block w-full text-left px-6 py-3 text-gray-700 hover:bg-gray-100 ${activeSection === item.path ? "bg-gray-100 font-semibold" : ""
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Conteúdo Principal */}
            <div className="flex-1 ml-64">
                <NavBarDashboardMedico />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-[80px]">
                    {activeSection === "visao-geral" && <VisaoGeral appointments={mockAppointments} />}
                    {activeSection === "minha-agenda" && <MinhaAgenda appointments={mockAppointments} />}
                    {activeSection === "gerenciar-agendamentos" && <GerenciarAgendamentos appointments={mockAppointments} />}
                    {activeSection === "meu-financeiro" && <MeuFinanceiro financials={mockFinancials} />}
                    {activeSection === "meus-pacientes" && <MeusPacientes patients={mockPatients} />}
                    {activeSection === "meu-perfil-profissional" && <MeuPerfilProfissional />}
                    {activeSection === "notificacoes" && <Notificacoes notifications={mockNotifications} />}
                    {activeSection === "avaliacoes-feedback" && <AvaliacoesFeedback reviews={mockReviews} />}
                </div>

                <Footer />
            </div>
        </div>
    );
}