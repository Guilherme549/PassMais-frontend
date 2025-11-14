"use client";

import NavBar from "@/components/NavBar";
import { clearTokens, jsonGet } from "@/lib/api";
import { X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import RescheduleModal, { SlotDay } from "./RescheduleModal";

type AppointmentStatus = "AGENDADA" | "REALIZADA" | "CANCELADA" | string;

type Appointment = {
    id: string;
    date: string;
    time: string;
    doctorName: string;
    patientName: string;
    clinicAddress: string;
    price: number;
    status: AppointmentStatus;
};

type PatientAppointmentsApiItem = {
    id?: string | null;
    date?: string | null;
    time?: string | null;
    doctorName?: string | null;
    patientName?: string | null;
    clinicAddress?: string | null;
    price?: number | string | null;
    status?: string | null;
};

function extractAppointmentsPayload(payload: unknown): PatientAppointmentsApiItem[] {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && typeof payload === "object") {
        const source = payload as Record<string, unknown>;
        const candidates = [source.data, source.items, source.results, source.appointments, source.content];
        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                return candidate as PatientAppointmentsApiItem[];
            }
        }
    }

    return [];
}

function normalizeStatus(value?: string | null): AppointmentStatus {
    if (!value) return "AGENDADA";
    const upper = value.toUpperCase();
    if (["AGENDADA", "AGENDADO", "SCHEDULED", "PENDING"].includes(upper)) return "AGENDADA";
    if (["REALIZADA", "REALIZADO", "COMPLETED", "DONE"].includes(upper)) return "REALIZADA";
    if (["CANCELADA", "CANCELADO", "CANCELED", "CANCELLED"].includes(upper)) return "CANCELADA";
    return upper as AppointmentStatus;
}

export default function ClientMyAppointments() {
    const [loadedAppointments, setLoadedAppointments] = useState<Appointment[] | null>(null);
    const [rescheduleId, setRescheduleId] = useState<string | null>(null);
    const [rescheduleSlots, setRescheduleSlots] = useState<SlotDay[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const normalizeAppointments = (data: PatientAppointmentsApiItem[] | null | undefined): Appointment[] => {
        if (!Array.isArray(data) || data.length === 0) return [];
        return data.map((item, index) => {
            const priceValue =
                typeof item?.price === "number"
                    ? item.price
                    : typeof item?.price === "string"
                        ? Number(item.price)
                        : 0;
            const status = normalizeStatus(item?.status);
            return {
                id: (item?.id && String(item.id)) || `appt-${index + 1}`,
                date: item?.date ?? "—",
                time: item?.time ?? "—",
                doctorName: item?.doctorName ?? "—",
                patientName: item?.patientName ?? "—",
                clinicAddress: item?.clinicAddress ?? "—",
                price: Number.isFinite(priceValue) ? priceValue : 0,
                status,
            };
        });
    };

    const loadAppointments = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await jsonGet<unknown>("/api/patients/appointments");
            const parsed = extractAppointmentsPayload(response);
            setLoadedAppointments(normalizeAppointments(parsed));
        } catch (error) {
            const status = (error as Error & { status?: number }).status;
            if (status === 401) {
                clearTokens();
            }
            const message =
                error instanceof Error
                    ? error.message
                    : "Não foi possível carregar suas consultas. Tente novamente.";
            setFetchError(message);
            setLoadedAppointments(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAppointments();
    }, [loadAppointments]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const formatDateBR = (d: Date) => {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const defaultTimes = useMemo(() => ["09:00", "10:30", "14:00", "16:00"], []);

    const computeSlots = (): SlotDay[] => {
        // Simula agenda do médico: próximos 7 dias com horários padrão
        const days: SlotDay[] = [];
        for (let i = 1; i <= 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            days.push({ date: formatDateBR(d), times: defaultTimes });
        }
        return days;
    };

    const scheduledAppointments = loadedAppointments?.filter((app) => app.status === "AGENDADA") || [];
    const pastAppointments = loadedAppointments?.filter((app) => app.status === "REALIZADA") || [];
    const canceledAppointments = loadedAppointments?.filter((app) => app.status === "CANCELADA") || [];

    const handleCancel = (id: string) => {
        const confirmCancel = typeof window !== "undefined" && window.confirm("Tem certeza que deseja cancelar esta consulta?");
        if (!confirmCancel) return;
        setLoadedAppointments((prev) =>
            prev?.map((a) => (a.id === id ? { ...a, status: "CANCELADA" } : a)) || null
        );
    };

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

                    {isLoading ? (
                        <p className="text-gray-600 text-lg px-2">Carregando suas consultas...</p>
                    ) : null}

                    {fetchError ? (
                        <div className="mb-10 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {fetchError}
                        </div>
                    ) : null}

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
                                    <p><strong>Médico:</strong> {appointment.doctorName}</p>
                                    <p><strong>Paciente:</strong> {appointment.patientName}</p>
                                    <p><strong>Endereço:</strong> {appointment.clinicAddress}</p>
                                    <p><strong>Valor:</strong> {formatCurrency(appointment.price)}</p>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <button
                                            onClick={() => handleCancel(appointment.id)}
                                            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                                        >
                                            Cancelar consulta
                                        </button>
                                        <button
                                            onClick={() => {
                                                setRescheduleId(appointment.id);
                                                setRescheduleSlots(computeSlots());
                                            }}
                                            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                                        >
                                            Reagendar
                                        </button>
                                    </div>
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
                                    <p><strong>Médico:</strong> {appointment.doctorName}</p>
                                    <p><strong>Paciente:</strong> {appointment.patientName}</p>
                                    <p><strong>Endereço:</strong> {appointment.clinicAddress}</p>
                                    <p><strong>Valor:</strong> {formatCurrency(appointment.price)}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Consultas Canceladas */}
                    {canceledAppointments.length > 0 && (
                        <div className="mt-10">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Consultas Canceladas</h3>
                            {canceledAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="bg-gray-50 shadow-sm rounded-lg p-6 mb-4 border border-gray-200"
                                >
                                    <p className="text-gray-700"><strong>Data:</strong> {appointment.date}</p>
                                    <p className="text-gray-700"><strong>Horário:</strong> {appointment.time}</p>
                                    <p className="text-gray-700"><strong>Médico:</strong> {appointment.doctorName}</p>
                                    <p className="text-gray-700"><strong>Paciente:</strong> {appointment.patientName}</p>
                                    <p className="text-gray-700"><strong>Endereço:</strong> {appointment.clinicAddress}</p>
                                    <p className="text-gray-700"><strong>Valor:</strong> {formatCurrency(appointment.price)}</p>
                                    <p className="mt-2 text-sm text-red-700">Esta consulta foi cancelada.</p>
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
                    {rescheduleId && rescheduleSlots && loadedAppointments && (
                        <RescheduleModal
                            appointment={{
                                id: rescheduleId,
                                doctor: loadedAppointments.find((a) => a.id === rescheduleId)?.doctorName || "",
                            }}
                            slots={rescheduleSlots}
                            onClose={() => {
                                setRescheduleId(null);
                                setRescheduleSlots(null);
                    }}
                    onConfirm={({ date, time }) => {
                        setLoadedAppointments((prev) =>
                            prev?.map((a) => (a.id === rescheduleId ? { ...a, date, time } : a)) || null
                        );
                        setRescheduleId(null);
                        setRescheduleSlots(null);
                        if (typeof window !== "undefined") {
                            // Simples feedback nativo; podemos trocar por toast futuramente
                            window.alert("Consulta reagendada com sucesso!");
                        }
                    }}
                />
            )}
        </div>
    );
}
