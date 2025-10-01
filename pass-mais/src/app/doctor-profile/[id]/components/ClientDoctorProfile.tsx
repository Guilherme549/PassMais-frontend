"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import Image from "next/image";
import { Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type {
    Doctor as DoctorSummary,
    DoctorSchedule,
    DoctorScheduleDay,
} from "@/app/medical-appointments/types";

type ScheduleStatus = "idle" | "loading" | "success" | "error";

interface Doctor extends DoctorSummary {
    consultationFee?: number | null;
}

interface ClientDoctorProfileProps {
    doctor: Doctor;
    schedule: DoctorSchedule | null;
    scheduleStatus: ScheduleStatus;
    scheduleError: string | null;
    onRetrySchedule: () => void;
}

const DOCTOR_AVATAR_PLACEHOLDER = "/avatar-placeholer.jpeg";

const joinAddressParts = (...parts: Array<string | null | undefined>) =>
    parts
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
        .join(", ");

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

function isSlotPast(day: DoctorScheduleDay, slot: string, schedule: DoctorSchedule | null) {
    if (!schedule) return false;
    const utcDate = zonedTimeToUtc(day.isoDate, slot, schedule.timezone);
    if (!utcDate) return false;
    return utcDate.getTime() <= Date.now();
}

function formatIsoDateLabel(isoDate: string, schedule: DoctorSchedule | null) {
    if (!schedule) return isoDate;
    const [year, month, day] = isoDate.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: schedule.timezone,
        weekday: "long",
        day: "2-digit",
        month: "long",
    }).format(utcDate);
}

function formatScheduleRange(schedule: DoctorSchedule | null) {
    if (!schedule) return null;
    const formatDate = (isoDate: string) => {
        const [year, month, day] = isoDate.split("-").map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        return new Intl.DateTimeFormat("pt-BR", {
            timeZone: schedule.timezone,
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(utcDate);
    };
    return `${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}`;
}

export default function ClientDoctorProfile({
    doctor,
    schedule,
    scheduleStatus,
    scheduleError,
    onRetrySchedule,
}: ClientDoctorProfileProps) {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [forWhom, setForWhom] = useState<string>("self");

    const sortedDays = useMemo(() => schedule?.days ?? [], [schedule]);
    const availableDays = useMemo(
        () => sortedDays.filter((day) => !day.blocked && day.slots.length > 0),
        [sortedDays]
    );
    const selectedDay = useMemo(
        () => sortedDays.find((day) => day.isoDate === selectedDate) ?? null,
        [sortedDays, selectedDate]
    );
    const scheduleRangeLabel = useMemo(() => formatScheduleRange(schedule), [schedule]);

    useEffect(() => {
        if (!schedule || availableDays.length === 0) {
            setSelectedDate(null);
            setSelectedTime(null);
            return;
        }

        setSelectedDate((prev) => {
            if (prev && availableDays.some((day) => day.isoDate === prev)) {
                return prev;
            }
            const first = availableDays[0]?.isoDate ?? null;
            return first;
        });
        setSelectedTime(null);
    }, [schedule, availableDays]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const handleDateSelect = (isoDate: string) => {
        setSelectedDate(isoDate);
        setSelectedTime(null);
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
    };

    const handleSubmit = () => {
    if (!selectedDate || !selectedTime) {
        alert("Por favor, selecione uma data e um horário.");
        return;
    }

        // Redirecionar para a página de pagamento com os dados do agendamento
        router.push(
            `/payment?doctorId=${doctor.id}&date=${selectedDate}&time=${selectedTime}&forWhom=${forWhom}`
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <div className="h-16"></div>
            <div className="flex justify-center items-center w-full px-4 sm:px-6 lg:px-8 mt-4">
                <div className="w-full max-w-5xl">
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

                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 px-2 tracking-tight">
                        Perfil do Médico
                    </h2>

                    {/* Perfil do Médico */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-6 mb-4">
                            <div className="relative w-32 h-32 flex-shrink-0">
                                <Image
                                    src={doctor.photo ?? DOCTOR_AVATAR_PLACEHOLDER}
                                    alt={`Foto de ${doctor.name}`}
                                    fill
                                    className="rounded-xl object-cover border-4 border-gray-100"
                                />
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-2">{doctor.name}</h3>
                                <p className="text-gray-600 mb-2">{doctor.specialty}</p>
                                <p className="text-gray-600 mb-2">CRM: {doctor.crm}</p>
                                <div className="flex items-center gap-1 mb-2">
                                    <Star className="text-yellow-400" size={16} />
                                    <span className="text-gray-600">
                                        {(doctor.averageRating ?? 0).toFixed(1)} ({doctor.reviewsCount ?? 0} avaliações)
                                    </span>
                                </div>
                            </div>
                        </div>
                        {(doctor.clinicName || doctor.clinicStreetAndNumber || doctor.clinicCity || doctor.address) && (
                            <div className="text-gray-600 mb-2">
                                <p className="font-semibold text-gray-700">Local de atendimento</p>
                                <div className="space-y-1">
                                    {doctor.clinicName && <p>{doctor.clinicName}</p>}
                                    {(doctor.clinicStreetAndNumber || doctor.clinicCity) && (
                                        <p>{joinAddressParts(doctor.clinicStreetAndNumber, doctor.clinicCity)}</p>
                                    )}
                                    {doctor.clinicPostalCode && <p>CEP: {doctor.clinicPostalCode}</p>}
                                    {!doctor.clinicName && !doctor.clinicStreetAndNumber && !doctor.clinicCity && doctor.address && (
                                        <p>{doctor.address}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        <p className="text-gray-600 mb-4">{doctor.bio || "Biografia não informada."}</p>
                        <p className="text-gray-600 font-semibold">
                            Valor da consulta: {formatCurrency(doctor.consultationFee ?? 0)}
                        </p>
                    </div>

                    {/* Agenda */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Agenda</h3>
                        {scheduleRangeLabel && (
                            <p className="mb-4 text-sm text-gray-500">
                                Agenda disponível entre {scheduleRangeLabel} ({schedule?.timezone})
                            </p>
                        )}
                        <div className="space-y-4">
                            {scheduleStatus === "loading" || scheduleStatus === "idle" ? (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#5179EF]" />
                                    <span>Carregando agenda...</span>
                                </div>
                            ) : scheduleStatus === "error" ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    <p>{scheduleError ?? "Não foi possível carregar a agenda."}</p>
                                    <button
                                        type="button"
                                        onClick={onRetrySchedule}
                                        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1 font-medium hover:bg-red-100"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            ) : availableDays.length === 0 ? (
                                <p className="text-gray-600">Nenhum horário disponível.</p>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-gray-700 mb-2">Selecione a data:</label>
                                        <div className="flex flex-wrap gap-2">
                                            {sortedDays.map((day) => {
                                                const hasSlots = !day.blocked && day.slots.length > 0;
                                                return (
                                                    <button
                                                        key={day.isoDate}
                                                        type="button"
                                                        onClick={() => hasSlots && handleDateSelect(day.isoDate)}
                                                        disabled={!hasSlots}
                                                        className={`rounded-lg border px-4 py-2 text-sm transition ${
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
                                            <label className="block text-gray-700 mb-2">Selecione o horário:</label>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedDay.slots.map((time) => {
                                                    const past = isSlotPast(selectedDay, time, schedule);
                                                    return (
                                                        <button
                                                            key={time}
                                                            type="button"
                                                            onClick={() => !past && handleTimeSelect(time)}
                                                            disabled={past}
                                                            className={`rounded-lg border px-4 py-2 text-sm transition ${
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
                                </>
                            )}
                        </div>
                    </div>

                    {/* Para quem será a consulta */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Para quem será a consulta?</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Selecione uma opção:</label>
                                <select
                                    value={forWhom}
                                    onChange={(e) => setForWhom(e.target.value)}
                                    className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                >
                                    <option value="self">Para mim (Guilherme)</option>
                                    <option value="other">Outra pessoa</option>
                                </select>
                            </div>
                            {forWhom === "other" && (
                                <div>
                                    <label className="block text-gray-700 mb-2">Selecione a pessoa:</label>
                                    <select
                                        className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                    >
                                        <option value="" disabled>
                                            Selecione uma pessoa
                                        </option>
                                        <option value="person1">João Silva (Dependente)</option>
                                        <option value="person2">Maria Oliveira (Dependente)</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botão Continuar */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSubmit}
                            className="bg-[#5179EF] text-white font-medium px-6 py-3 rounded-lg 
                hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 
                transition-all duration-200"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
