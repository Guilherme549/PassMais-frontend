"use client";

import { useMemo, useState } from "react";

import type { AppointmentDetail } from "./visao-geral";

interface GerenciarAgendamentosProps {
    appointments: AppointmentDetail[];
}

const STATUS_ACTIONS: Partial<Record<AppointmentDetail["status"], Array<{ label: string; intent: "primary" | "ghost" }>>> = {
    agendada: [
        { label: "Confirmar", intent: "primary" },
        { label: "Cancelar", intent: "ghost" },
    ],
    confirmada: [
        { label: "Iniciar consulta", intent: "primary" },
        { label: "Cancelar", intent: "ghost" },
    ],
    "em-andamento": [{ label: "Continuar atendimento", intent: "primary" }],
    concluida: [{ label: "Ver detalhes", intent: "ghost" }],
    cancelada: [{ label: "Reabrir", intent: "ghost" }],
};

const STATUS_LABELS: Record<AppointmentDetail["status"], string> = {
    agendada: "Agendada",
    confirmada: "Confirmada",
    "em-andamento": "Em andamento",
    concluida: "Concluída",
    cancelada: "Cancelada",
};

function formatDateTime(value: string, options: Intl.DateTimeFormatOptions) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString("pt-BR", options);
}

function formatFullDateTime(value: string) {
    const datePart = formatDateTime(value, { day: "2-digit", month: "long", year: "numeric" });
    const timePart = formatDateTime(value, { hour: "2-digit", minute: "2-digit" });
    return `${datePart} às ${timePart}`;
}

export default function GerenciarAgendamentos({ appointments }: GerenciarAgendamentosProps) {
    const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);

    const ordered = useMemo(
        () =>
            [...appointments].sort(
                (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
            ),
        [appointments],
    );

    return (
        <section>
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">Gerenciar Agendamentos</h2>
            <div className="rounded-lg bg-white p-6 shadow-lg">
                <ul className="space-y-5">
                    {ordered.map((appointment) => {
                        const actions = STATUS_ACTIONS[appointment.status] ?? [];
                        const isExpanded = activeAppointmentId === appointment.id;

                        return (
                            <li key={appointment.id} className="rounded-2xl border border-gray-100 p-5 shadow-sm">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {appointment.patient.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatFullDateTime(appointment.scheduledAt)}
                                        </p>
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {STATUS_LABELS[appointment.status] ?? appointment.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {actions.map((action) => (
                                            <button
                                                key={action.label}
                                                type="button"
                                                className={
                                                    action.intent === "primary"
                                                        ? "rounded-full bg-[#5179EF] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3f63d6]"
                                                        : "rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-[#5179EF] transition hover:border-[#5179EF]/40 hover:bg-[#F3F6FF]"
                                                }
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveAppointmentId((prev) =>
                                                    prev === appointment.id ? null : appointment.id,
                                                )
                                            }
                                            className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
                                        >
                                            {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                                        </button>
                                    </div>
                                </div>
                                {isExpanded ? (
                                    <div className="mt-4 space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                                        <div>
                                            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                Motivo
                                            </h4>
                                            <p className="mt-1">
                                                {appointment.reason ?? "Motivo não informado pelo paciente."}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={`notes-${appointment.id}`}
                                                className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                            >
                                                Observações internas
                                            </label>
                                            <textarea
                                                id={`notes-${appointment.id}`}
                                                name={`notes-${appointment.id}`}
                                                className="h-28 w-full resize-none rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                                placeholder="Adicione orientações para a secretária ou registros do contato com o paciente."
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    className="rounded-full bg-[#5179EF] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3f63d6]"
                                                >
                                                    Salvar observações
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
                {ordered.length === 0 ? (
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Nenhum agendamento encontrado. Volte mais tarde ou verifique sua agenda.
                    </p>
                ) : null}
            </div>
        </section>
    );
}
