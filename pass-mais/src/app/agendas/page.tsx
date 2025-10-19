"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, CalendarRange, Check, Filter, FolderClock, MapPin, User2 } from "lucide-react";

import { useAppointments, useMyDoctors } from "@/hooks/team";

type FiltersState = {
    doctorIds: string[];
    from: string;
    to: string;
};

const initialFilters: FiltersState = {
    doctorIds: [],
    from: "",
    to: "",
};

export default function SchedulesPage() {
    const [filters, setFilters] = useState<FiltersState>(initialFilters);

    const { data: doctors, isLoading: isLoadingDoctors } = useMyDoctors();
    const hasDoctors = (doctors?.length ?? 0) > 0;

    const normalizedFilters = useMemo(
        () => ({
            doctorIds: filters.doctorIds.length > 0 ? filters.doctorIds : undefined,
            from: filters.from || undefined,
            to: filters.to || undefined,
        }),
        [filters],
    );

    const { data: appointments, isLoading, error, refetch } = useAppointments(normalizedFilters, {
        enabled: hasDoctors || filters.doctorIds.length > 0,
    });

    const toggleDoctor = (doctorId: string) => {
        setFilters((prev) => {
            const exists = prev.doctorIds.includes(doctorId);
            return {
                ...prev,
                doctorIds: exists ? prev.doctorIds.filter((id) => id !== doctorId) : [...prev.doctorIds, doctorId],
            };
        });
    };

    const resetFilters = () => {
        setFilters(initialFilters);
        void refetch();
    };

    const handleDateChange = (key: "from" | "to", value: string) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const isEmpty =
        (hasDoctors || filters.doctorIds.length > 0) && !isLoading && (appointments?.length ?? 0) === 0;

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12">
            <div className="mx-auto flex max-w-6xl flex-col gap-8">
                <header className="space-y-2">
                    <div className="flex items-center gap-2 text-[#5179EF]">
                        <CalendarClock className="h-5 w-5" />
                        <span className="text-xs font-semibold uppercase tracking-wide">Agendas consolidadas</span>
                    </div>
                    <h1 className="text-3xl font-semibold text-gray-900">Consultas das Equipes</h1>
                    <p className="text-sm text-gray-500">
                        Visualize em um só lugar todas as consultas dos médicos que autorizaram seu acesso. Aplique filtros por
                        profissional ou período e mantenha o fluxo sempre organizado.
                    </p>
                </header>

                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Filter className="h-4 w-4" />
                            Filtros
                        </div>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="text-xs font-semibold text-[#5179EF] hover:text-[#3356b3]"
                        >
                            Limpar filtros
                        </button>
                    </div>

                    <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="md:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Médico responsável</p>
                            <div className="mt-3 flex flex-wrap gap-3">
                                {isLoadingDoctors ? (
                                    <>
                                        <span className="h-10 w-28 animate-pulse rounded-full bg-gray-100" />
                                        <span className="h-10 w-32 animate-pulse rounded-full bg-gray-100" />
                                        <span className="h-10 w-24 animate-pulse rounded-full bg-gray-100" />
                                    </>
                                ) : !hasDoctors ? (
                                    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                                        <p>Você ainda não ingressou na equipe de um médico.</p>
                                        <Link
                                            href="/join-team"
                                            className="inline-flex items-center gap-2 text-xs font-semibold text-[#5179EF] hover:text-[#3356b3]"
                                        >
                                            Usar código de convite
                                        </Link>
                                    </div>
                                ) : (
                                    doctors.map((doctor) => {
                                        const isSelected = filters.doctorIds.includes(doctor.id);
                                        return (
                                            <button
                                                key={doctor.id}
                                                type="button"
                                                onClick={() => toggleDoctor(doctor.id)}
                                                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                                                    isSelected
                                                        ? "border-[#5179EF] bg-[#5179EF] text-white"
                                                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-800"
                                                }`}
                                            >
                                                {isSelected ? <Check className="h-4 w-4" /> : <User2 className="h-4 w-4" />}
                                                {doctor.name}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Data inicial</p>
                            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                                <CalendarRange className="h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={filters.from}
                                    onChange={(event) => handleDateChange("from", event.target.value)}
                                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Data final</p>
                            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                                <CalendarRange className="h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={filters.to}
                                    min={filters.from}
                                    onChange={(event) => handleDateChange("to", event.target.value)}
                                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">Consultas agendadas</h2>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
                        >
                            Atualizar lista
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="mt-6 space-y-4">
                            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                        </div>
                    ) : error ? (
                        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
                            <p>{error.message || "Não foi possível carregar as agendas."}</p>
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:text-red-800"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : isEmpty ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                            <FolderClock className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-3 text-sm font-semibold text-gray-700">Nenhuma consulta encontrada</p>
                            <p className="mt-1 text-sm text-gray-500">
                                Ajuste os filtros ou verifique se o médico já liberou a agenda para você.
                            </p>
                        </div>
                    ) : (
                        <ul className="mt-6 space-y-4">
                            {appointments.map((appointment) => (
                                <li
                                    key={appointment.id}
                                    className="rounded-2xl border border-gray-200 p-5 transition hover:border-gray-300"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-semibold text-gray-900">
                                                Paciente: {appointment.patientName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Data/Hora:{" "}
                                                {new Intl.DateTimeFormat("pt-BR", {
                                                    day: "2-digit",
                                                    month: "long",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }).format(new Date(appointment.scheduledAt))}
                                            </p>
                                            <p className="flex items-center gap-2 text-xs text-gray-400">
                                                <MapPin className="h-4 w-4" />
                                                {appointment.location}
                                            </p>
                                            <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                                                Status: {appointment.status}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
                                            >
                                                Confirmar
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
                                            >
                                                Remarcar
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
