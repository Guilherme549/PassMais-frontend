"use client";

import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
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

type CalendarPage = {
    id: string;
    title: string;
    rangeLabel: string | null;
    cells: WeekDayCell[];
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

function formatMonthTitle(cells: WeekDayCell[], timezone: string) {
    const first = cells[0];
    if (!first) return null;
    const reference = zonedTimeToUtc(first.isoDate, "12:00", timezone);
    const formatter = getFormatter(timezone, {
        timeZone: timezone,
        month: "long",
        year: "numeric",
    });
    const formatted = formatter.format(reference);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatRangeSummary(cells: WeekDayCell[], timezone: string) {
    if (cells.length === 0) return null;
    const first = cells[0];
    const last = cells[cells.length - 1];
    const sameMonth = first.isoDate.slice(0, 7) === last.isoDate.slice(0, 7);
    const startRef = zonedTimeToUtc(first.isoDate, "12:00", timezone);
    const endRef = zonedTimeToUtc(last.isoDate, "12:00", timezone);

    if (sameMonth) {
        const dayFormatter = getFormatter(timezone, {
            timeZone: timezone,
            day: "2-digit",
        });
        const monthFormatter = getFormatter(timezone, {
            timeZone: timezone,
            month: "long",
        });
        const startDay = dayFormatter.format(startRef);
        const endDay = dayFormatter.format(endRef);
        const month = monthFormatter.format(startRef);
        return `${startDay} – ${endDay} de ${month.charAt(0).toUpperCase() + month.slice(1)}`;
    }

    const fullFormatter = getFormatter(timezone, {
        timeZone: timezone,
        day: "2-digit",
        month: "long",
    });
    const startLabel = fullFormatter.format(startRef);
    const endLabel = fullFormatter.format(endRef);
    const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
    return `${capitalize(startLabel)} – ${capitalize(endLabel)}`;
}

function buildCalendarCells(
    schedule: DoctorSchedule,
    startIso: string,
    daysCount: number,
    todayIso: string,
    dayMap: Map<string, DoctorScheduleDay>
): WeekDayCell[] {
    const cells: WeekDayCell[] = [];

    for (let index = 0; index < daysCount; index += 1) {
        const isoDate = shiftIsoDate(startIso, index, schedule.timezone);
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

function buildCalendarPages(schedule: DoctorSchedule | null, pageSize = 7): CalendarPage[] {
    if (!schedule) return [];

    const todayIso = formatDateKey(getTodayInTimezone(schedule.timezone));
    const dayMap = new Map((schedule.days ?? []).map((day) => [day.isoDate, day]));
    const endIso = schedule.endDate ?? todayIso;

    const pages: CalendarPage[] = [];
    let pageIndex = 0;
    let currentStartIso = todayIso;
    const maxIterations = 52;

    while (currentStartIso <= endIso && pageIndex < maxIterations) {
        const cells = buildCalendarCells(schedule, currentStartIso, pageSize, todayIso, dayMap);
        const title = formatMonthTitle(cells, schedule.timezone);
        const rangeLabel = formatRangeSummary(cells, schedule.timezone);
        pages.push({
            id: `${currentStartIso}-${pageIndex}`,
            title: title ?? "Próximas datas",
            rangeLabel,
            cells,
        });
        currentStartIso = shiftIsoDate(currentStartIso, pageSize, schedule.timezone);
        pageIndex += 1;
    }

    return pages;
}

export default function DoctorModal({ doctor, onClose, onSlotSelect }: DoctorModalProps) {
    const router = useRouter();
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const alertShownRef = useRef(false);

    const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus>("idle");
    const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
    const [scheduleError, setScheduleError] = useState<{ message: string; status?: number } | null>(null);
    const [fetchToken, setFetchToken] = useState(0);
    const [pageIndex, setPageIndex] = useState(0);

    const dateRangeLabel = useMemo(() => formatRangeLabel(schedule), [schedule]);
    const calendarPages = useMemo(() => buildCalendarPages(schedule), [schedule]);
    const currentPage = calendarPages[pageIndex] ?? null;
    const hasAvailableSlots = useMemo(
        () =>
            (currentPage?.cells ?? []).some((cell) => cell.state === "available" && cell.slots.length > 0),
        [currentPage]
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
                setPageIndex(0);
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
                setPageIndex(0);
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
        setPageIndex(0);
    }, [schedule?.doctorId, fetchToken]);

    useEffect(() => {
        if (pageIndex >= calendarPages.length) {
            setPageIndex(calendarPages.length > 0 ? calendarPages.length - 1 : 0);
        }
    }, [calendarPages.length, pageIndex]);

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
            const canGoPrev = pageIndex > 0;
            const canGoNext = pageIndex < calendarPages.length - 1;

            if (!currentPage) {
                return (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                        Agenda indisponível para as próximas datas.
                    </div>
                );
            }

            return (
                <div className="space-y-5" aria-live="polite">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            {currentPage.title && (
                                <h4 className="text-base font-semibold text-gray-900">{currentPage.title}</h4>
                            )}
                            {currentPage.rangeLabel && (
                                <p className="text-sm text-gray-500">{currentPage.rangeLabel}</p>
                            )}
                            {dateRangeLabel && (
                                <p className="text-xs text-gray-400">
                                    Agenda completa de {dateRangeLabel} · Fuso {schedule.timezone}
                                </p>
                            )}
                        </div>
                        {calendarPages.length > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
                                    disabled={!canGoPrev}
                                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                        canGoPrev
                                            ? "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                            : "border-gray-100 text-gray-300 cursor-not-allowed"
                                    }`}
                                    aria-label="Ver dias anteriores"
                                >
                                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                    Anterior
                                </button>
                                <span className="text-xs font-medium text-gray-500">
                                    Página {pageIndex + 1} de {calendarPages.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPageIndex((value) =>
                                            Math.min(calendarPages.length - 1, value + 1)
                                        )
                                    }
                                    disabled={!canGoNext}
                                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                        canGoNext
                                            ? "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                            : "border-gray-100 text-gray-300 cursor-not-allowed"
                                    }`}
                                    aria-label="Ver próximos dias"
                                >
                                    Próximos dias
                                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                        )}
                    </div>
                    {!hasAvailableSlots && (
                        <p className="text-sm text-gray-500">Sem horários disponíveis para este período.</p>
                    )}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {currentPage.cells.map((cell) => (
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
