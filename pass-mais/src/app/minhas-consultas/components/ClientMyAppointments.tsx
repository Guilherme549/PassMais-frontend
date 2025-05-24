"use client";

import NavBar from "@/components/NavBar";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Appointment {
    id: number;
    date: string;
    time: string;
    doctor: string;
    address: string;
    value: number;
    status: "agendada" | "realizada";
}

export default function ClientMyAppointments({
    appointments,
}: {
    appointments: Appointment[] | null;
}) {
    const [loadedAppointments, setLoadedAppointments] = useState<Appointment[] | null>(appointments);

    useEffect(() => {
        setLoadedAppointments(appointments);
    }, [appointments]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const scheduledAppointments = loadedAppointments?.filter((app) => app.status === "agendada") || [];
    const pastAppointments = loadedAppointments?.filter((app) => app.status === "realizada") || [];

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <div className="flex justify-center items-center w-full px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-5xl mt-[100px]">
                    {/* Botão Fechar */}
                    <div className="flex justify-end mb-4">
                        <Link
                            href="/medical-appointments"
                            className="flex items-center gap-2 bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg 
                hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 
                transition-all duration-200"
                        >
                            Fechar <X size={18} />
                        </Link>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10 px-2 tracking-tight">
                        Minhas Consultas
                    </h2>

                    {/* Consultas Agendadas */}
                    {scheduledAppointments.length > 0 && (
                        <div className="mb-10">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Consultas Agendadas</h3>
                            {scheduledAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="bg-white shadow-lg rounded-lg p-6 mb-4 border border-gray-200"
                                >
                                    <p><strong>Data:</strong> {appointment.date}</p>
                                    <p><strong>Horário:</strong> {appointment.time}</p>
                                    <p><strong>Médico:</strong> {appointment.doctor}</p>
                                    <p><strong>Endereço:</strong> {appointment.address}</p>
                                    <p><strong>Valor:</strong> {formatCurrency(appointment.value)}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Consultas Realizadas */}
                    {pastAppointments.length > 0 && (
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Consultas Realizadas</h3>
                            {pastAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="bg-white shadow-lg rounded-lg p-6 mb-4 border border-gray-200"
                                >
                                    <p><strong>Data:</strong> {appointment.date}</p>
                                    <p><strong>Horário:</strong> {appointment.time}</p>
                                    <p><strong>Médico:</strong> {appointment.doctor}</p>
                                    <p><strong>Endereço:</strong> {appointment.address}</p>
                                    <p><strong>Valor:</strong> {formatCurrency(appointment.value)}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Mensagem se não houver consultas */}
                    {(!loadedAppointments || loadedAppointments.length === 0) && (
                        <p className="text-gray-600 text-lg">Nenhuma consulta encontrada.</p>
                    )}
                </div>
            </div>
        </div>
    );
}