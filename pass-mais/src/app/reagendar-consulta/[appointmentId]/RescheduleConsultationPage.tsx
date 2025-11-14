"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import NavBar from "@/components/NavBar";
import type { DoctorSchedule, DoctorScheduleDay } from "@/app/medical-appointments/types";
import type { Appointment } from "@/app/minhas-consultas/utils/appointments";
import { extractAppointmentsPayload, normalizeAppointments } from "@/app/minhas-consultas/utils/appointments";
import type { DoctorProfile } from "@/app/doctor-profile/utils";
import { buildDoctorProfile, normalizeDoctors } from "@/app/doctor-profile/utils";
import { fallbackDoctors } from "@/app/medical-appointments/fallbackDoctors";
import { jsonGet, jsonPost } from "@/lib/api";

interface RescheduleConsultationPageProps {
    appointmentId: string;
}

type LoadState = "idle" | "loading" | "success" | "error";

const DOCTOR_AVATAR_PLACEHOLDER = "/avatar-placeholer.jpeg";

export default function RescheduleConsultationPage({ appointmentId }: RescheduleConsultationPageProps) {
    const router = useRouter();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [appointmentStatus, setAppointmentStatus] = useState<LoadState>("idle");
    const [appointmentError, setAppointmentError] = useState<string | null>(null);

    const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
    const [doctorStatus, setDoctorStatus] = useState<LoadState>("idle");
    const [doctorError, setDoctorError] = useState<string | null>(null);

    const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
    const [scheduleStatus, setScheduleStatus] = useState<LoadState>("idle");
    const [scheduleError, setScheduleError] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [initialSelectionApplied, setInitialSelectionApplied] = useState(false);

    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!appointmentId) {
            router.replace("/minhas-consultas");
            return;
        }

        let cancelled = false;
        const loadAppointment = async () => {
            setAppointmentStatus("loading");
            setAppointmentError(null);
            try {
                const response = await jsonGet<unknown>("/api/patients/appointments");
                if (cancelled) return;
                const parsed = extractAppointmentsPayload(response);
                const normalized = normalizeAppointments(parsed);
                const found = normalized.find((item) => item.id === appointmentId);
                if (!found) {
                    throw new Error("Consulta não encontrada.");
                }
                setAppointment(found);
                setAppointmentStatus("success");
            } catch (error) {
                if (cancelled) return;
                const err = error as Error & { status?: number };
                if (err?.status === 401) {
                    router.replace("/login");
                    return;
                }
                setAppointmentStatus("error");
                setAppointmentError(err?.message || "Não foi possível carregar a consulta selecionada.");
            }
        };

        void loadAppointment();

        return () => {
            cancelled = true;
        };
    }, [appointmentId, router]);

    const fetchDoctor = useCallback(
        async (doctorId: string) => {
            setDoctorStatus("loading");
            setDoctorError(null);
            try {
                const data = await jsonGet<unknown>(`/api/doctors/${doctorId}`);
                const normalized = Array.isArray(data) ? normalizeDoctors(data) : normalizeDoctors([data]);
                const first = normalized[0];
                if (first) {
                    setDoctor(buildDoctorProfile(first));
                    setDoctorStatus("success");
                    return;
                }
                throw new Error("Médico não encontrado.");
            } catch (error) {
                const fallback = fallbackDoctors.find((doc) => doc.id === doctorId);
                if (fallback) {
                    setDoctor(buildDoctorProfile(fallback));
                    setDoctorStatus("success");
                    return;
                }
                const err = error as Error & { status?: number };
                if (err?.status === 401) {
                    router.replace("/login");
                    return;
                }
                setDoctorStatus("error");
                setDoctorError(err?.message || "Não foi possível carregar os dados do médico.");
            }
        },
        [router]
    );

    useEffect(() => {
        if (!appointment?.doctorId) return;
        void fetchDoctor(appointment.doctorId);
    }, [appointment?.doctorId, fetchDoctor]);

    const loadSchedule = useCallback(
        async (doctorId: string) => {
            setScheduleStatus("loading");
            setScheduleError(null);
            try {
                const data = await jsonGet<DoctorSchedule>(`/api/patient/doctors/${doctorId}/schedule`);
                setSchedule(data);
                setScheduleStatus("success");
            } catch (error) {
                const err = error as Error & { status?: number };
                if (err?.status === 401) {
                    router.replace("/login");
                    return;
                }
                setSchedule(null);
                setScheduleStatus("error");
                setScheduleError(err?.message || "Não foi possível carregar a agenda do médico.");
            }
        },
        [router]
    );

    useEffect(() => {
        if (!doctor) return;
        void loadSchedule(doctor.id);
    }, [doctor, loadSchedule]);

    const appointmentSelection = useMemo(() => deriveSelectionFromAppointment(appointment), [appointment]);

    const upcomingDays = useMemo(() => {
        const baseDays = schedule?.days ?? [];
        if (!schedule) return baseDays;
        return baseDays.filter((day) => day.slots.some((slot) => !isSlotPast(day, slot, schedule)));
    }, [schedule]);

    const availableDays = useMemo(
        () => upcomingDays.filter((day) => !day.blocked && day.slots.length > 0),
        [upcomingDays]
    );

    const selectedDay = useMemo(
        () => upcomingDays.find((day) => day.isoDate === selectedDate) ?? null,
        [upcomingDays, selectedDate]
    );

    useEffect(() => {
        if (!schedule || availableDays.length === 0) {
            setSelectedDate(null);
            setSelectedTime(null);
            setInitialSelectionApplied(false);
            return;
        }

        if (!initialSelectionApplied) {
            const preferredDate =
                appointmentSelection.date &&
                availableDays.some((day) => day.isoDate === appointmentSelection.date)
                    ? appointmentSelection.date
                    : availableDays[0]?.isoDate ?? null;

            setSelectedDate(preferredDate);

            if (
                preferredDate &&
                appointmentSelection.date === preferredDate &&
                appointmentSelection.time
            ) {
                const day = availableDays.find((day) => day.isoDate === preferredDate);
                if (day?.slots.includes(appointmentSelection.time)) {
                    setSelectedTime(appointmentSelection.time);
                } else {
                    setSelectedTime(null);
                }
            } else {
                setSelectedTime(null);
            }

            setInitialSelectionApplied(true);
            return;
        }

        setSelectedDate((prev) => {
            if (prev && availableDays.some((day) => day.isoDate === prev)) {
                return prev;
            }
            return availableDays[0]?.isoDate ?? null;
        });
    }, [schedule, availableDays, initialSelectionApplied, appointmentSelection]);

    useEffect(() => {
        if (!schedule || !selectedDate) {
            setSelectedTime(null);
            return;
        }

        const day = availableDays.find((item) => item.isoDate === selectedDate);
        if (!day) {
            setSelectedTime(null);
            return;
        }

        setSelectedTime((prev) => {
            if (!prev) return null;
            return day.slots.includes(prev) ? prev : null;
        });
    }, [selectedDate, availableDays, schedule]);

    useEffect(() => {
        if (!successMessage) return;
        const timer = setTimeout(() => {
            router.replace("/minhas-consultas");
        }, 3000);
        return () => clearTimeout(timer);
    }, [successMessage, router]);

    const handleConfirm = async () => {
        if (!appointment) return;
        if (!selectedDate || !selectedTime) {
            setFormError("Selecione uma nova data e horário para continuar.");
            return;
        }

        setFormError(null);
        setIsSubmitting(true);
        setSuccessMessage(null);
        try {
            await jsonPost(`/api/patients/appointments/${appointment.id}/reschedule`, {
                newDate: selectedDate,
                newTime: selectedTime,
            });
            setSuccessMessage("Consulta reagendada com sucesso!");
        } catch (error) {
            const err = error as Error & { status?: number };
            if (err?.status === 401) {
                router.replace("/login");
                return;
            }
            setFormError(err?.message || "Não foi possível reagendar a consulta. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading =
        appointmentStatus === "loading" || doctorStatus === "loading" || doctorStatus === "idle";

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <div className="max-w-5xl mx-auto px-4 py-10 lg:py-16">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                        <p className="text-sm text-gray-500">Reagendamento</p>
                        <h1 className="text-3xl font-bold text-gray-900">Escolha um novo horário</h1>
                    </div>
                    <Link
                        href="/minhas-consultas"
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Voltar para Minhas Consultas
                    </Link>
                </div>

                {appointmentStatus === "error" && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {appointmentError}
                    </div>
                )}

                {doctorStatus === "error" && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {doctorError}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {successMessage} Redirecionando...
                    </div>
                )}

                {isLoading ? (
                    <div className="rounded-2xl bg-white p-6 shadow">Carregando dados...</div>
                ) : doctor ? (
                    <div className="rounded-2xl bg-white p-6 shadow mb-6">
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-200">
                                <Image
                                    src={doctor.photo ?? DOCTOR_AVATAR_PLACEHOLDER}
                                    alt={`Foto de ${doctor.name}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-semibold text-gray-900">{doctor.name}</h2>
                                <p className="text-gray-600">{doctor.specialty}</p>
                                {doctor.crm && <p className="text-sm text-gray-500">CRM: {doctor.crm}</p>}
                                <div className="mt-3 space-y-1 text-sm text-gray-600">
                                    {doctor.address && <p>{doctor.address}</p>}
                                    {doctor.clinicStreetAndNumber || doctor.clinicCity ? (
                                        <p>
                                            {joinAddressParts(
                                                doctor.clinicStreetAndNumber,
                                                doctor.clinicCity,
                                                doctor.clinicState,
                                                doctor.clinicPostalCode
                                            )}
                                        </p>
                                    ) : null}
                                </div>
                                <p className="mt-3 text-lg font-semibold text-gray-900">
                                    Valor da consulta: {formatCurrency(doctor.consultationFee ?? doctor.consultationPrice ?? 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="rounded-2xl bg-white p-6 shadow">
                    <header className="mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">Escolha nova data e horário</h3>
                        <p className="text-sm text-gray-600">Selecione o horário disponível que preferir.</p>
                    </header>

                    {scheduleStatus === "loading" || scheduleStatus === "idle" ? (
                        <p className="text-gray-600">Carregando agenda...</p>
                    ) : scheduleStatus === "error" ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            <p>{scheduleError ?? "Não foi possível carregar a agenda."}</p>
                            <button
                                type="button"
                                onClick={() => doctor && loadSchedule(doctor.id)}
                                className="mt-2 inline-flex items-center rounded-lg border border-red-200 px-3 py-1 text-xs font-medium hover:bg-red-100"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : availableDays.length === 0 ? (
                        <p className="text-gray-600">Nenhum horário disponível no momento.</p>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <p className="mb-2 text-sm font-medium text-gray-700">Datas disponíveis</p>
                                <div className="flex flex-wrap gap-2">
                                    {upcomingDays.map((day) => {
                                        const hasSlots = !day.blocked && day.slots.length > 0;
                                        return (
                                            <button
                                                key={day.isoDate}
                                                type="button"
                                                onClick={() => hasSlots && setSelectedDate(day.isoDate)}
                                                disabled={!hasSlots}
                                                className={`rounded-xl border px-4 py-2 text-sm transition ${
                                                    selectedDate === day.isoDate
                                                        ? "border-[#5179EF] bg-[#F3F6FF] text-[#1E3D8F]"
                                                        : hasSlots
                                                        ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                                        : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                                }`}
                                            >
                                                {formatIsoDateLabel(day.isoDate, schedule)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedDate && selectedDay && (
                                <div>
                                    <p className="mb-2 text-sm font-medium text-gray-700">Horários</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDay.slots.map((time) => {
                                            const past = isSlotPast(selectedDay, time, schedule);
                                            return (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    onClick={() => !past && setSelectedTime(time)}
                                                    disabled={past}
                                                    className={`rounded-xl border px-4 py-2 text-sm transition ${
                                                        selectedTime === time
                                                            ? "border-[#5179EF] bg-[#F3F6FF] text-[#1E3D8F]"
                                                            : past
                                                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                                    }`}
                                                >
                                                    {time}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {formError && (
                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={() => void handleConfirm()}
                            disabled={
                                !selectedDate ||
                                !selectedTime ||
                                scheduleStatus !== "success" ||
                                isSubmitting ||
                                Boolean(successMessage)
                            }
                            className={`rounded-xl px-6 py-3 text-white transition ${
                                !selectedDate ||
                                !selectedTime ||
                                scheduleStatus !== "success" ||
                                isSubmitting ||
                                successMessage
                                    ? "bg-blue-300"
                                    : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {isSubmitting ? "Confirmando..." : "Confirmar reagendamento"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function deriveSelectionFromAppointment(appointment: Appointment | null) {
    if (!appointment) {
        return { date: null as string | null, time: null as string | null };
    }

    if (appointment.appointmentDateTime) {
        const parsed = new Date(appointment.appointmentDateTime);
        if (!Number.isNaN(parsed.getTime())) {
            const iso = parsed.toISOString();
            return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
        }
    }

    const normalizedDate = appointment.date && /^\d{4}-\d{2}-\d{2}$/.test(appointment.date) ? appointment.date : null;
    const normalizedTime = appointment.time && /^\d{2}:\d{2}/.test(appointment.time) ? appointment.time.slice(0, 5) : null;
    return { date: normalizedDate, time: normalizedTime };
}

function joinAddressParts(...parts: Array<string | null | undefined>) {
    return parts
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
        .join(", ");
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function isSlotPast(day: DoctorScheduleDay, slot: string, schedule: DoctorSchedule | null) {
    if (!schedule) return false;
    const utcDate = zonedTimeToUtc(day.isoDate, slot, schedule.timezone);
    if (!utcDate) return false;
    return utcDate.getTime() <= Date.now();
}

function zonedTimeToUtc(isoDate: string, time: string, timeZone: string) {
    try {
        const [year, month, day] = isoDate.split("-").map(Number);
        const [hour, minute] = time.split(":").map(Number);
        const candidate = new Date(Date.UTC(year, month - 1, day, hour, minute));
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
        const parts = formatter.formatToParts(candidate);
        const data: Record<string, string> = {};
        for (const part of parts) {
            data[part.type] = part.value;
        }
        const tzDate = new Date(
            Date.UTC(
                Number(data.year),
                Number(data.month) - 1,
                Number(data.day),
                Number(data.hour),
                Number(data.minute),
                Number(data.second)
            )
        );
        const offset = tzDate.getTime() - candidate.getTime();
        return new Date(candidate.getTime() - offset);
    } catch {
        return null;
    }
}

function formatIsoDateLabel(isoDate: string, schedule: DoctorSchedule | null) {
    if (!schedule) return isoDate;
    const [year, month, day] = isoDate.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12));
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: schedule.timezone,
        weekday: "long",
        day: "2-digit",
        month: "long",
    }).format(utcDate);
}
