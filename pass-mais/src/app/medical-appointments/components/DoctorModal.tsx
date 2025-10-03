"use client";

import { Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { jsonGet } from "@/lib/api";
import type { Doctor, DoctorSchedule, DoctorScheduleDay } from "../types";

type SlotSelection = {
    doctor: Doctor;
    isoDate: string;
    time: string;
    timezone: string;
    dateTimeUtc: string;
};

interface DoctorModalProps {
    doctor: Doctor;
    onClose: () => void;
    onSlotSelect?: (selection: SlotSelection) => void;
}

const DOCTOR_AVATAR_PLACEHOLDER = "/avatar-placeholer.jpeg";
const CACHE_TTL_MS = 5 * 60 * 1000;

type ScheduleStatus = "idle" | "loading" | "success" | "error";

type DoctorScheduleCacheEntry = {
    data: DoctorSchedule;
    expiresAt: number;
};

const scheduleCache = new Map<string, DoctorScheduleCacheEntry>();

type ProcessedSlot = {
    key: string;
    time: string;
    isoDate: string;
    dateTimeUtc: Date;
};

type WeekDayCell = {
    isoDate: string;
    header: string;
    isToday: boolean;
    state: "available" | "empty" | "blocked" | "none";
    slots: ProcessedSlot[];
};

const joinAddressParts = (...parts: Array<string | null | undefined>) =>
    parts
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
        .join(", ");

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string, options: Intl.DateTimeFormatOptions) {
    const key = `${timeZone}-${JSON.stringify(options)}`;
    if (!dateFormatterCache.has(key)) {
        dateFormatterCache.set(key, new Intl.DateTimeFormat("pt-BR", options));
    }
    return dateFormatterCache.get(key)!;
}

function normalizeSchedule(response: DoctorSchedule): DoctorSchedule {
    const days = [...(response.days ?? [])]
        .map((day) => ({
            ...day,
            source: day.source ?? "none",
            slots: [...(day.slots ?? [])].sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.isoDate.localeCompare(b.isoDate));

    return {
        ...response,
        days,
    };
}

function zonedTimeToUtc(isoDate: string, time: string, timeZone: string) {
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
    const lookup: Record<string, string> = {};
    for (const part of parts) {
        lookup[part.type] = part.value;
    }
    const tzDate = new Date(
        Date.UTC(
            Number(lookup.year),
            Number(lookup.month) - 1,
            Number(lookup.day),
            Number(lookup.hour),
            Number(lookup.minute),
            Number(lookup.second)
        )
    );
    const offset = tzDate.getTime() - candidate.getTime();
    return new Date(candidate.getTime() - offset);
}

function isSlotPast(day: DoctorScheduleDay, slot: string, schedule: DoctorSchedule) {
    try {
        const slotDate = zonedTimeToUtc(day.isoDate, slot, schedule.timezone);
        return slotDate.getTime() <= Date.now();
    } catch {
        return false;
    }
}

function formatRangeLabel(schedule: DoctorSchedule | null) {
    if (!schedule) return null;
    const formatDate = (isoDate: string) => {
        const [year, month, day] = isoDate.split("-").map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        const formatter = getFormatter(schedule.timezone, {
            timeZone: schedule.timezone,
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
        return formatter.format(utcDate);
    };

    const start = formatDate(schedule.startDate);
    const end = formatDate(schedule.endDate);
    return `${start} - ${end}`;
}

function formatDateKey(date: Date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getTodayInTimezone(timezone: string) {
    const now = new Date();
    try {
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const parts = formatter.formatToParts(now);
        const lookup: Record<string, string> = {};
        for (const part of parts) {
            lookup[part.type] = part.value;
        }
        const year = Number(lookup.year);
        const month = Number(lookup.month);
        const day = Number(lookup.day);
        if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return new Date();
        return new Date(Date.UTC(year, month - 1, day));
    } catch {
        return new Date();
    }
}

function buildSlotKey(isoDate: string, time: string) {
    return `${isoDate}T${time}`;
}

function getMondayIndex(date: Date) {
    return (date.getDay() + 6) % 7;
}

function getWeekStart(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - getMondayIndex(start));
    return start;
}

function formatWeekdayHeader(isoDate: string, timezone: string) {
    const reference = zonedTimeToUtc(isoDate, "12:00", timezone);
    const formatter = getFormatter(timezone, {
        timeZone: timezone,
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
    });
    const formatted = formatter.format(reference);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatIsoFromDate(date: Date, timezone: string) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    return formatter.format(date);
}

function getWeekdayIndexInTimezone(isoDate: string, timezone: string) {
    const reference = zonedTimeToUtc(isoDate, "12:00", timezone);
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "short",
    });
    const weekday = formatter.format(reference).toLowerCase();
    const map: Record<string, number> = {
        sun: 0,
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6,
    };
    const index = map[weekday] ?? 0;
    return (index + 6) % 7; // transforma segunda-feira em índice 0
}

function shiftIsoDate(baseIso: string, amount: number, timezone: string) {
    const baseUtc = zonedTimeToUtc(baseIso, "00:00", timezone);
    baseUtc.setUTCDate(baseUtc.getUTCDate() + amount);
    return formatIsoFromDate(baseUtc, timezone);
}

function collectAvailableSlots(day: DoctorScheduleDay, schedule: DoctorSchedule): ProcessedSlot[] {
    const uniqueSlots = new Set<string>();
    const processedSlots: ProcessedSlot[] = [];

    for (const rawSlot of day.slots ?? []) {
        const slot = rawSlot.trim();
        if (!slot || uniqueSlots.has(slot)) continue;

        if (isSlotPast(day, slot, schedule)) continue;

        uniqueSlots.add(slot);
        processedSlots.push({
            key: buildSlotKey(day.isoDate, slot),
            time: slot,
            isoDate: day.isoDate,
            dateTimeUtc: zonedTimeToUtc(day.isoDate, slot, schedule.timezone),
        });
    }

    processedSlots.sort((a, b) => a.time.localeCompare(b.time));
    return processedSlots;
}

function buildCalendarCells(schedule: DoctorSchedule | null): WeekDayCell[] {
    if (!schedule) return [];

    const todayIso = formatDateKey(getTodayInTimezone(schedule.timezone));
    const dayMap = new Map((schedule.days ?? []).map((day) => [day.isoDate, day]));

    const weekdayIndex = getWeekdayIndexInTimezone(todayIso, schedule.timezone);
    const weekStartIso = shiftIsoDate(todayIso, -weekdayIndex, schedule.timezone);

    const cells: WeekDayCell[] = [];

    for (let index = 0; index < 7; index += 1) {
        const isoDate = shiftIsoDate(weekStartIso, index, schedule.timezone);
        const dayData = dayMap.get(isoDate) ?? null;

        let state: WeekDayCell["state"] = "none";
        let slots: ProcessedSlot[] = [];

        if (dayData) {
            if (dayData.blocked) {
                state = "blocked";
            } else {
                slots = collectAvailableSlots(dayData, schedule);
                state = slots.length > 0 ? "available" : "empty";
            }
        }

        cells.push({
            isoDate,
            header: formatWeekdayHeader(isoDate, schedule.timezone),
            isToday: isoDate === todayIso,
            state,
            slots,
        });
    }

    return cells;
}

export default function DoctorModal({ doctor, onClose, onSlotSelect }: DoctorModalProps) {
    const router = useRouter();
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const alertShownRef = useRef(false);

    const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus>("idle");
    const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
    const [scheduleError, setScheduleError] = useState<{ message: string; status?: number } | null>(null);
    const [fetchToken, setFetchToken] = useState(0);

    const dateRangeLabel = useMemo(() => formatRangeLabel(schedule), [schedule]);
    const calendarCells = useMemo(() => buildCalendarCells(schedule), [schedule]);
    const hasAvailableSlots = useMemo(
        () => calendarCells.some((cell) => cell.state === "available" && cell.slots.length > 0),
        [calendarCells]
    );

    const handleSlotSelection = useCallback(
        (dayIso: string, slot: ProcessedSlot) => {
            if (!doctor) return;

            const payload: SlotSelection = {
                doctor,
                isoDate: dayIso,
                time: slot.time,
                timezone: schedule?.timezone ?? "",
                dateTimeUtc: slot.dateTimeUtc.toISOString(),
            };

            if (onSlotSelect) {
                onSlotSelect(payload);
            } else {
                router.push(`/doctor-profile/${doctor.id}?date=${dayIso}&time=${slot.time}`);
            }

            onClose();
        },
        [doctor, onClose, onSlotSelect, router, schedule]
    );

    const fetchSchedule = useCallback(
        async (targetDoctor: Doctor) => {
            if (!targetDoctor) return;

            alertShownRef.current = false;
            const cache = scheduleCache.get(targetDoctor.id);
            if (cache && cache.expiresAt > Date.now()) {
                setSchedule(cache.data);
                setScheduleStatus("success");
                setScheduleError(null);
                return;
            }

            setScheduleStatus("loading");
            setScheduleError(null);

            try {
                const response = await jsonGet<DoctorSchedule>(
                    `/api/patient/doctors/${targetDoctor.id}/schedule`,
                    {
                        headers: { Accept: "application/json" },
                    }
                );

                const normalized = normalizeSchedule(response);
                scheduleCache.set(targetDoctor.id, {
                    data: normalized,
                    expiresAt: Date.now() + CACHE_TTL_MS,
                });

                setSchedule(normalized);
                setScheduleStatus("success");
            } catch (error) {
                const status = (error as { status?: number } | null)?.status;
                const isUnauthorized = status === 401 || status === 403;

                const message = isUnauthorized
                    ? "Sessão expirada. Faça login novamente."
                    : status === 404 || status === 422
                    ? "Agenda indisponível para este médico."
                    : "Não foi possível carregar a agenda. Tentar novamente.";

                setSchedule(null);
                setScheduleStatus("error");
                setScheduleError({ message, status });

                if (typeof window !== "undefined" && !alertShownRef.current) {
                    alertShownRef.current = true;
                    window.setTimeout(() => window.alert(message), 0);
                }

                if (isUnauthorized) {
                    router.push(`/login?redirect=/medical-appointments`);
                }
            }
        },
        [router]
    );

    useEffect(() => {
        if (!doctor) return;
        setSchedule(null);
        fetchSchedule(doctor);
    }, [doctor, fetchSchedule, fetchToken]);

    useEffect(() => {
        if (!doctor) return;
        closeButtonRef.current?.focus();
    }, [doctor]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!doctor) return null;

    const renderSchedule = () => {
        if (scheduleStatus === "loading") {
            return (
                <div className="flex flex-col gap-4" aria-live="polite" aria-busy="true">
                    <div className="flex items-center gap-3 text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Carregando agenda...</span>
                    </div>
                    <div className="grid gap-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-20 rounded-xl border border-gray-200 bg-gray-100 animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            );
        }

        if (scheduleStatus === "error" && scheduleError) {
            const canRetry = scheduleError.status !== 401 && scheduleError.status !== 403;
            return (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p>{scheduleError.message}</p>
                    {canRetry && (
                        <button
                            type="button"
                            onClick={() => setFetchToken((token) => token + 1)}
                            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1 font-medium text-red-700 hover:bg-red-100"
                        >
                            Tentar novamente
                        </button>
                    )}
                </div>
            );
        }

        if (scheduleStatus === "success" && schedule) {
            return (
                <div className="space-y-5" aria-live="polite">
                    {dateRangeLabel && (
                        <p className="text-sm text-gray-500">
                            Agenda disponível entre {dateRangeLabel} (horários no fuso {schedule.timezone})
                        </p>
                    )}
                    {calendarCells.length === 0 ? (
                        <p className="text-sm text-gray-500">Agenda indisponível para este período.</p>
                    ) : (
                        <>
                            {!hasAvailableSlots && (
                                <p className="text-sm text-gray-500">Sem horários disponíveis para este período.</p>
                            )}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {calendarCells.map((cell) => (
                                    <div
                                        key={cell.isoDate}
                                        className={`flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm transition ${
                                            cell.isToday ? "border-[#5179EF] shadow-md" : "border-gray-200"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900">{cell.header}</span>
                                                <span className="text-[11px] uppercase tracking-wide text-gray-400">
                                                    {schedule.timezone}
                                                </span>
                                            </div>
                                            {cell.isToday && (
                                                <span className="rounded-full bg-[#5179EF]/10 px-3 py-1 text-[11px] font-semibold text-[#1E3D8F]">
                                                    Hoje
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-3 flex-1">
                                            {cell.state === "available" && cell.slots.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {cell.slots.map((slot) => (
                                                        <button
                                                            key={slot.key}
                                                            type="button"
                                                            onClick={() => handleSlotSelection(cell.isoDate, slot)}
                                                            className="rounded-full border border-[#D6E0FF] bg-[#F3F6FF] px-3 py-1 text-xs font-medium text-[#1E3D8F] transition hover:border-[#5179EF] hover:bg-[#E6EDFF]"
                                                        >
                                                            {slot.time}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : cell.state === "blocked" ? (
                                                <p className="text-sm text-gray-400">Agenda bloqueada.</p>
                                            ) : cell.state === "empty" ? (
                                                <p className="text-sm text-gray-400">Sem horários disponíveis.</p>
                                            ) : (
                                                <p className="text-sm text-gray-400">Agenda não cadastrada.</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-8 relative shadow-2xl focus:outline-none">
                <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    aria-label="Fechar modal"
                >
                    <X size={24} aria-hidden="true" />
                </button>

                <div className="space-y-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="relative h-24 w-24 flex-shrink-0">
                            <Image
                                fill
                                src={doctor.photo ?? DOCTOR_AVATAR_PLACEHOLDER}
                                alt="Imagem do médico"
                                className="rounded-lg object-cover border-2 border-gray-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">{doctor.name}</h2>
                            <p className="text-lg text-gray-600">{doctor.specialty} • CRM {doctor.crm}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Sobre</h3>
                            <p className="text-gray-600 whitespace-pre-line">{doctor.bio || "Biografia não informada."}</p>
                        </div>
                        {(doctor.clinicName || doctor.clinicStreetAndNumber || doctor.clinicCity || doctor.clinicPostalCode || doctor.address) && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Local de atendimento</h3>
                                <div className="text-gray-600 space-y-1">
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
                    </div>

                    <div className="space-y-3">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Agenda disponível</h3>
                            <p className="mt-1 text-xs text-gray-500">
                                Consulte os horários disponíveis e continue o agendamento no perfil do médico.
                            </p>
                        </div>
                        {renderSchedule()}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        >
                            Fechar
                        </button>
                        <Link
                            href={`/doctor-profile/${doctor.id}`}
                            className="inline-flex items-center justify-center rounded-lg bg-[#5179EF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50"
                        >
                            Agendar Consulta
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
