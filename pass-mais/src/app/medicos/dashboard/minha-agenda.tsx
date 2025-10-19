"use client";

import { useMemo, useState } from "react";

import type { AppointmentDetail } from "./visao-geral";

interface MinhaAgendaProps {
    appointments: AppointmentDetail[];
}

type FilterValue = "todos" | AppointmentDetail["status"];

const STATUS_LABELS: Record<AppointmentDetail["status"], string> = {
    agendada: "Agendada",
    confirmada: "Confirmada",
    "em-andamento": "Em andamento",
    concluida: "Concluída",
    cancelada: "Cancelada",
};

const filterOptions: Array<{ value: FilterValue; label: string }> = [
    { value: "todos", label: "Todos" },
    { value: "agendada", label: STATUS_LABELS.agendada },
    { value: "confirmada", label: STATUS_LABELS.confirmada },
    { value: "em-andamento", label: STATUS_LABELS["em-andamento"] },
    { value: "concluida", label: STATUS_LABELS.concluida },
    { value: "cancelada", label: STATUS_LABELS.cancelada },
];

function formatDateLabel(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

function formatTimeLabel(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function MinhaAgenda({ appointments }: MinhaAgendaProps) {
    const [filterStatus, setFilterStatus] = useState<FilterValue>("todos");

    const filteredAppointments = useMemo(() => {
        return appointments.filter((appointment) => filterStatus === "todos" || appointment.status === filterStatus);
    }, [appointments, filterStatus]);

    return (
        <section>
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">Minha Agenda</h2>
            <div className="mb-6">
                <label htmlFor="status-filter" className="mr-4">
                    Filtrar por status:
                </label>
                <select
                    id="status-filter"
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value as FilterValue)}
                    className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5179EF]"
                >
                    {filterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-lg">
                <ul className="space-y-4">
                    {filteredAppointments.map((appointment) => {
                        const dateLabel = formatDateLabel(appointment.scheduledAt);
                        const timeLabel = formatTimeLabel(appointment.scheduledAt);
                        return (
                            <li key={appointment.id} className="flex items-center justify-between border-b pb-2">
                                <div>
                                    <p className="font-medium text-gray-900">{appointment.patient.name}</p>
                                    <p className="text-gray-600">
                                        {dateLabel} às {timeLabel} — {STATUS_LABELS[appointment.status] ?? appointment.status}
                                    </p>
                                </div>
                                {appointment.status === "confirmada" && (
                                    <button className="rounded-lg bg-[#5179EF] px-4 py-2 text-white transition hover:bg-[#3f63d6]">
                                        Iniciar Consulta
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
                {filteredAppointments.length === 0 ? (
                    <p className="mt-6 text-center text-sm text-gray-500">Nenhuma consulta para o filtro selecionado.</p>
                ) : null}
            </div>
        </section>
    );
}
