"use client";

import {
    AlarmClock,
    CalendarCheck,
    CheckCircle2,
    Clock4,
    XCircle,
    type LucideIcon,
} from "lucide-react";

interface Appointment {
    id: number;
    patient: string;
    date: string;
    time: string;
    status: string;
}

interface VisaoGeralProps {
    appointments: Appointment[];
}

const STATUS_LABEL: Record<string, string> = {
    pendente: "Pendente",
    realizada: "Realizada",
    cancelada: "Cancelada",
};

const STATUS_STYLES: Record<string, string> = {
    pendente: "bg-amber-50 text-amber-700 ring-amber-100",
    realizada: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    cancelada: "bg-rose-50 text-rose-700 ring-rose-100",
};

function toDateTime(appointment: Appointment) {
    return new Date(`${appointment.date}T${appointment.time}`);
}

function formatDateHuman(date: string) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(date));
}

function formatTime(time: string) {
    return time.slice(0, 5);
}

type StatCard = {
    title: string;
    value: number;
    icon: LucideIcon;
    accent: string;
    trend?: string;
};

export default function VisaoGeral({ appointments }: VisaoGeralProps) {
    const todayIso = new Date().toLocaleDateString("en-CA");
    const todaysAppointments = appointments.filter((appt) => appt.date === todayIso);
    const upcomingAppointments = [...appointments]
        .filter((appt) => appt.status === "pendente")
        .sort((a, b) => toDateTime(a).getTime() - toDateTime(b).getTime());
    const recentAppointments = [...appointments]
        .filter((appt) => appt.status === "realizada")
        .sort((a, b) => toDateTime(b).getTime() - toDateTime(a).getTime());

    const nextAppointment = upcomingAppointments[0];

    const stats: StatCard[] = [
        {
            title: "Consultas hoje",
            value: todaysAppointments.length,
            icon: CalendarCheck,
            accent: "bg-[#5179EF]/10 text-[#5179EF]",
        },
        {
            title: "Próxima consulta",
            value: nextAppointment ? 1 : 0,
            icon: AlarmClock,
            accent: "bg-amber-100 text-amber-600",
            trend: nextAppointment ? `${formatTime(nextAppointment.time)} · ${nextAppointment.patient}` : "Nenhuma agendada",
        },
        {
            title: "Realizadas hoje",
            value: todaysAppointments.filter((appt) => appt.status === "realizada").length,
            icon: CheckCircle2,
            accent: "bg-emerald-100 text-emerald-600",
        },
        {
            title: "Cancelamentos",
            value: todaysAppointments.filter((appt) => appt.status === "cancelada").length,
            icon: XCircle,
            accent: "bg-rose-100 text-rose-600",
        },
    ];

    return (
        <section className="space-y-8">
            <header className="flex flex-col gap-2">
                <h2 className="text-3xl font-semibold text-gray-900">Bem-vindo de volta!</h2>
                <p className="text-sm text-gray-500">Acompanhe o andamento das suas consultas e prepare-se para o dia.</p>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.title}
                            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500">{stat.title}</span>
                                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm ${stat.accent}`}>
                                    <Icon className="h-5 w-5" />
                                </span>
                            </div>
                            <div className="mt-4 flex items-end justify-between">
                                <span className="text-3xl font-semibold text-gray-900">{stat.value}</span>
                                {stat.trend && <span className="text-xs text-gray-500">{stat.trend}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Próximas consultas</h3>
                            <span className="text-sm text-gray-400">{upcomingAppointments.length} agendadas</span>
                        </div>
                        <div className="mt-4 space-y-3">
                            {upcomingAppointments.slice(0, 5).map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-white text-sm font-semibold text-gray-700 shadow-sm">
                                            {formatDateHuman(appointment.date)}
                                            <span className="text-xs font-normal text-gray-400">{formatTime(appointment.time)}</span>
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">{appointment.patient}</span>
                                            <span className="text-xs text-gray-500">Código #{appointment.id}</span>
                                        </div>
                                    </div>
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                                            STATUS_STYLES[appointment.status] ?? "bg-gray-100 text-gray-600 ring-gray-200"
                                        }`}
                                    >
                                        {STATUS_LABEL[appointment.status] ?? appointment.status}
                                    </span>
                                </div>
                            ))}
                            {upcomingAppointments.length === 0 && (
                                <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                                    Nenhuma consulta pendente no momento.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Últimos atendimentos</h3>
                        <ul className="mt-4 space-y-3">
                            {recentAppointments.slice(0, 5).map((appointment) => (
                                <li
                                    key={appointment.id}
                                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/70 p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                            <Clock4 className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{appointment.patient}</p>
                                            <p className="text-xs text-gray-500">
                                                {formatDateHuman(appointment.date)} · {formatTime(appointment.time)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-emerald-600">Consulta concluída</span>
                                </li>
                            ))}
                            {recentAppointments.length === 0 && (
                                <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                                    Nenhuma consulta realizada recentemente.
                                </p>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-[#5179EF] to-blue-600 p-6 text-white shadow-md">
                        <h3 className="text-lg font-semibold">Resumo rápido</h3>
                        <p className="mt-2 text-sm text-white/80">
                            Revise os horários, confirme solicitações e mantenha seu perfil atualizado para atrair mais pacientes.
                        </p>
                        <div className="mt-6 space-y-3 text-sm">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                                    <CalendarCheck className="h-4 w-4" />
                                </span>
                                <span>{upcomingAppointments.length} consultas aguardando confirmação</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                                    <AlarmClock className="h-4 w-4" />
                                </span>
                                <span>
                                    Próxima em {nextAppointment ? `${formatTime(nextAppointment.time)} (${nextAppointment.patient})` : "—"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Status do dia</h3>
                        <dl className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <dt className="text-gray-500">Total agendado hoje</dt>
                                <dd className="font-semibold text-gray-900">{todaysAppointments.length}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-gray-500">Pendentes</dt>
                                <dd className="font-semibold text-amber-600">
                                    {todaysAppointments.filter((appt) => appt.status === "pendente").length}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-gray-500">Realizadas</dt>
                                <dd className="font-semibold text-emerald-600">
                                    {todaysAppointments.filter((appt) => appt.status === "realizada").length}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-gray-500">Canceladas</dt>
                                <dd className="font-semibold text-rose-600">
                                    {todaysAppointments.filter((appt) => appt.status === "cancelada").length}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </section>
    );
}
