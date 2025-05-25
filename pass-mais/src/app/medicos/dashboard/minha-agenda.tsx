"use client";

import { useState } from "react";

interface MinhaAgendaProps {
    appointments: { id: number; patient: string; date: string; time: string; status: string }[];
}

export default function MinhaAgenda({ appointments }: MinhaAgendaProps) {
    const [filterStatus, setFilterStatus] = useState("todos");

    const filteredAppointments = appointments.filter((appt) =>
        filterStatus === "todos" || appt.status === filterStatus
    );

    return (
        <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Minha Agenda</h2>
            <div className="mb-6">
                <label className="mr-4">Filtrar por status:</label>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5179EF]"
                >
                    <option value="todos">Todos</option>
                    <option value="pendente">Pendente</option>
                    <option value="realizada">Realizada</option>
                    <option value="cancelada">Cancelada</option>
                </select>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6">
                <ul className="space-y-4">
                    {filteredAppointments.map((appt) => (
                        <li key={appt.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                                <p className="text-gray-900 font-medium">{appt.patient}</p>
                                <p className="text-gray-600">{appt.date} às {appt.time} - {appt.status}</p>
                            </div>
                            {appt.status === "pendente" && (
                                <button className="bg-[#5179EF] text-white px-4 py-2 rounded-lg">
                                    Iniciar Consulta
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}