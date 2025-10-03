"use client";

import { CalendarClock, Repeat, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { jsonPost } from "@/lib/api";
import { extractDoctorIdFromToken } from "@/lib/token";

const DEFAULT_SPECIFIC_SETTINGS = {
    appointmentInterval: 30,
    bufferMinutes: 0,
};

const APPOINTMENT_INTERVAL_OPTIONS = [15, 20, 30, 45, 60];
const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30];

const ORDERED_DAYS = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
] as const;

type Weekday = (typeof ORDERED_DAYS)[number];

type SpecificSlot = {
    id: string;
    start: string;
    end: string;
    interval: number;
};

type SpecificDaySchedule = {
    slots: SpecificSlot[];
};

type RecurringSlot = {
    id: string;
    start: string;
    end: string;
};

type RecurringDaySchedule = {
    enabled: boolean;
    slots: RecurringSlot[];
};

type Mode = "specific" | "recurring";

type SaveDoctorSchedulesResponse = {
    message?: string;
    mensagem?: string;
    status?: string;
    daysCount?: number;
    slotsCount?: number;
    updatedDays?: number;
    savedSlots?: number;
    daysSaved?: number;
    slotsSaved?: number;
    diasAtualizados?: number;
    horariosSalvos?: number;
};

const MODE_OPTIONS: Array<{
    key: Mode;
    label: string;
    description: string;
    icon: LucideIcon;
}> = [
    {
        key: "specific",
        label: "Horários específicos",
        description: "Datas pontuais com personalização",
        icon: CalendarClock,
    },
    {
        key: "recurring",
        label: "Horários recorrentes",
        description: "Regras semanais automáticas",
        icon: Repeat,
    },
];

const DEFAULT_RECURRING_SCHEDULE: Record<Weekday, RecurringDaySchedule> = {
    "Segunda-feira": { enabled: true, slots: [{ id: createId(), start: "08:00", end: "17:00" }] },
    "Terça-feira": { enabled: true, slots: [{ id: createId(), start: "08:00", end: "17:00" }] },
    "Quarta-feira": { enabled: true, slots: [{ id: createId(), start: "08:00", end: "17:00" }] },
    "Quinta-feira": { enabled: true, slots: [{ id: createId(), start: "08:00", end: "17:00" }] },
    "Sexta-feira": { enabled: true, slots: [{ id: createId(), start: "08:00", end: "17:00" }] },
    "Sábado": { enabled: true, slots: [{ id: createId(), start: "08:00", end: "12:00" }] },
    "Domingo": { enabled: false, slots: [{ id: createId(), start: "08:00", end: "12:00" }] },
};

const DEFAULT_RECURRING_SETTINGS = {
    appointmentInterval: 30,
    bufferMinutes: 0,
    startDate: formatDate(new Date()),
    endDate: "",
    noEndDate: true,
    exceptions: [] as string[],
};

function createId() {
    return Math.random().toString(36).slice(2, 9);
}

function minutesFromTime(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function addMinutesToTime(time: string, minutes: number) {
    const total = minutesFromTime(time) + minutes;
    const safe = Math.max(0, Math.min(total, 24 * 60));
    const hour = String(Math.floor(safe / 60)).padStart(2, "0");
    const minute = String(safe % 60).padStart(2, "0");
    return `${hour}:${minute}`;
}

function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString: string) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
}

function formatWeekdayPreview(date: Date) {
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
}

function getCalendarDays(monthDate: Date) {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const start = new Date(firstDay);
    const firstWeekday = (firstDay.getDay() + 6) % 7; // Monday as first day
    start.setDate(firstDay.getDate() - firstWeekday);

    const end = new Date(lastDay);
    const lastWeekday = (lastDay.getDay() + 6) % 7;
    end.setDate(lastDay.getDate() + (6 - lastWeekday));

    const days: Date[] = [];
    const iterator = new Date(start);
    while (iterator <= end) {
        days.push(new Date(iterator));
        iterator.setDate(iterator.getDate() + 1);
    }

    return days;
}

function normalizeSlots<T extends { start: string; end: string }>(slots: T[]) {
    return [...slots].sort((a, b) => minutesFromTime(a.start) - minutesFromTime(b.start));
}

function validateSlots(slots: { start: string; end: string }[]) {
    const issues: string[] = [];
    const ordered = normalizeSlots(slots);

    for (let i = 0; i < ordered.length; i += 1) {
        const current = ordered[i];
        const currentStart = minutesFromTime(current.start);
        const currentEnd = minutesFromTime(current.end);

        if (!current.start || !current.end) {
            issues.push("Preencha início e fim para todas as faixas.");
        }

        if (currentStart >= currentEnd) {
            issues.push("Horário inicial deve ser menor que o final.");
        }

        if (i > 0) {
            const previous = ordered[i - 1];
            const previousEnd = minutesFromTime(previous.end);
            if (currentStart < previousEnd) {
                issues.push("As faixas não podem se sobrepor.");
                break;
            }
        }
    }

    return [...new Set(issues)];
}

function generateSlotsPreview(
    slots: { start: string; end: string }[],
    appointmentInterval: number,
    bufferMinutes: number
) {
    const ordered = normalizeSlots(slots);
    const preview: string[] = [];

    ordered.forEach((slot) => {
        const startMinutes = minutesFromTime(slot.start);
        const endMinutes = minutesFromTime(slot.end);
        let cursor = startMinutes;

        while (cursor + appointmentInterval <= endMinutes) {
            const hour = String(Math.floor(cursor / 60)).padStart(2, "0");
            const minute = String(cursor % 60).padStart(2, "0");
            preview.push(`${hour}:${minute}`);
            cursor += appointmentInterval + bufferMinutes;
        }
    });

    return preview;
}

function duplicateSpecificSlots(slots: SpecificSlot[], suffix: string) {
    return slots.map((slot) => ({
        id: `${createId()}-${suffix}`,
        start: slot.start,
        end: slot.end,
        interval: slot.interval,
    }));
}

function splitTimesByContinuity(times: string[], interval: number, bufferMinutes: number) {
    const ordered = [...times].sort((a, b) => minutesFromTime(a) - minutesFromTime(b));
    const sequences: string[][] = [];
    const step = interval + bufferMinutes;

    let current: string[] = [];
    let previous: number | null = null;

    ordered.forEach((time) => {
        const minutes = minutesFromTime(time);
        if (previous != null && minutes - previous !== step) {
            if (current.length > 0) {
                sequences.push(current);
                current = [];
            }
        }

        current.push(time);
        previous = minutes;
    });

    if (current.length > 0) {
        sequences.push(current);
    }

    return sequences;
}

function splitSpecificSlotByTime(
    slot: SpecificSlot,
    timeToRemove: string,
    appointmentInterval: number,
    bufferMinutes: number
) {
    const interval = Math.max(5, slot.interval ?? appointmentInterval);
    const preview = generateSlotsPreview([{ start: slot.start, end: slot.end }], interval, bufferMinutes);
    if (!preview.includes(timeToRemove)) {
        return { slots: [slot], changed: false };
    }

    const remainingTimes = preview.filter((time) => time !== timeToRemove);
    if (remainingTimes.length === 0) {
        return { slots: [], changed: true };
    }

    const sequences = splitTimesByContinuity(remainingTimes, interval, bufferMinutes);
    const updatedSlots = sequences.map((sequence, index) => ({
        id: index === 0 ? slot.id : createId(),
        start: sequence[0],
        end: addMinutesToTime(sequence[sequence.length - 1], interval),
        interval: slot.interval,
    }));

    return { slots: updatedSlots, changed: true };
}

function splitRecurringSlotByTime(
    slot: RecurringSlot,
    timeToRemove: string,
    appointmentInterval: number,
    bufferMinutes: number
) {
    const preview = generateSlotsPreview([{ start: slot.start, end: slot.end }], appointmentInterval, bufferMinutes);
    if (!preview.includes(timeToRemove)) {
        return { slots: [slot], changed: false };
    }

    const remainingTimes = preview.filter((time) => time !== timeToRemove);
    if (remainingTimes.length === 0) {
        return { slots: [], changed: true };
    }

    const sequences = splitTimesByContinuity(remainingTimes, appointmentInterval, bufferMinutes);
    const updatedSlots = sequences.map((sequence, index) => ({
        id: index === 0 ? slot.id : createId(),
        start: sequence[0],
        end: addMinutesToTime(sequence[sequence.length - 1], appointmentInterval),
    }));

    return { slots: updatedSlots, changed: true };
}

function getNextSevenDays() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, idx) => {
        const next = new Date(today);
        next.setDate(today.getDate() + idx);
        return next;
    });
}

export default function Horarios() {
    const [mode, setMode] = useState<Mode>("recurring");

    const [specificSettings, setSpecificSettings] = useState(DEFAULT_SPECIFIC_SETTINGS);
    const [specificSchedule, setSpecificSchedule] = useState<Record<string, SpecificDaySchedule>>({});
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [specificModalSlotDraft, setSpecificModalSlotDraft] = useState({ start: "08:00", end: "17:00", interval: 30 });
    const [copyModalOpen, setCopyModalOpen] = useState(false);
    const [copyTargets, setCopyTargets] = useState<string[]>([]);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    const [recurringSchedule, setRecurringSchedule] = useState(DEFAULT_RECURRING_SCHEDULE);
    const [recurringSettings, setRecurringSettings] = useState(DEFAULT_RECURRING_SETTINGS);

    const [specificErrors, setSpecificErrors] = useState<string[]>([]);
    const [recurringErrors, setRecurringErrors] = useState<Record<Weekday, string[]>>(() => ({
        "Segunda-feira": [],
        "Terça-feira": [],
        "Quarta-feira": [],
        "Quinta-feira": [],
        "Sexta-feira": [],
        "Sábado": [],
        "Domingo": [],
    }));
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [doctorId, setDoctorId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = localStorage.getItem("doctorId");
        if (stored) {
            setDoctorId(stored);
            return;
        }

        const token = localStorage.getItem("accessToken");
        const derived = extractDoctorIdFromToken(token);
        if (derived) {
            setDoctorId(derived);
            try {
                localStorage.setItem("doctorId", derived);
            } catch {
                // ignore quota errors
            }
        }
    }, []);

    const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

    const selectedDaySlots = selectedDay ? specificSchedule[selectedDay]?.slots ?? [] : [];

    const specificConfiguredDays = useMemo(
        () =>
            Object.entries(specificSchedule)
                .filter((entry): entry is [string, SpecificDaySchedule] => entry[1].slots.length > 0)
                .map(([day]) => day),
        [specificSchedule]
    );

    const activeRecurringDays = useMemo(
        () => Object.values(recurringSchedule).filter((day) => day.enabled && day.slots.length > 0).length,
        [recurringSchedule]
    );

    const previewNextSevenDays = useMemo(() => {
        const upcomingDates = getNextSevenDays();
        return upcomingDates.map((date) => {
            const isoDate = formatDate(date);
            const weekdayIndex = date.getDay();
            const weekday = ORDERED_DAYS[(weekdayIndex + 6) % 7] as Weekday;

            const specificSlotsForDay = specificSchedule[isoDate]?.slots ?? [];
            const hasSpecific = specificSlotsForDay.length > 0;

            const recurringData = recurringSchedule[weekday as Weekday];
            const withinRange = (() => {
                const start = recurringSettings.startDate;
                const end = recurringSettings.noEndDate ? null : recurringSettings.endDate;
                if (!start) return true;
                if (isoDate < start) return false;
                if (end && isoDate > end) return false;
                return !recurringSettings.exceptions.includes(isoDate);
            })();

            let slots: SpecificSlot[] | RecurringSlot[] = [];
            let source: "specific" | "recurring" | "none" = "none";

            if (hasSpecific) {
                slots = specificSlotsForDay;
                source = "specific";
            } else if (recurringData.enabled && withinRange) {
                slots = recurringData.slots;
                source = "recurring";
            }

            let previewSlots: string[] = [];
            if (source === "specific") {
                const buffer = specificSettings.bufferMinutes;
                const specificSlots = slots as SpecificSlot[];
                previewSlots = specificSlots.flatMap((slot) =>
                    generateSlotsPreview(
                        [{ start: slot.start, end: slot.end }],
                        slot.interval ?? specificSettings.appointmentInterval,
                        buffer
                    )
                );
            } else if (source === "recurring") {
                previewSlots = generateSlotsPreview(
                    slots as RecurringSlot[],
                    recurringSettings.appointmentInterval,
                    recurringSettings.bufferMinutes
                );
            }

            return {
                date,
                isoDate,
                source,
                slotPreview: previewSlots,
                weekday,
            };
        });
    }, [recurringSchedule, recurringSettings, specificSchedule, specificSettings]);

    const handleRemovePreviewSlot = ({
        isoDate,
        weekday,
        source,
        time,
    }: {
        isoDate: string;
        weekday: Weekday;
        source: "specific" | "recurring" | "none";
        time: string;
    }) => {
        if (source === "specific") {
            const daySlots = specificSchedule[isoDate]?.slots ?? [];
            if (daySlots.length === 0) return;

            const bufferMinutes = specificSettings.bufferMinutes;
            const nextSlots: SpecificSlot[] = [];
            let changed = false;

            daySlots.forEach((slot) => {
                const interval = slot.interval ?? specificSettings.appointmentInterval;
                const result = splitSpecificSlotByTime(slot, time, interval, bufferMinutes);
                if (result.changed) {
                    changed = true;
                }
                nextSlots.push(...result.slots);
            });

            if (!changed) return;

            setSpecificSchedule((prev) => {
                const next = { ...prev };
                if (nextSlots.length === 0) {
                    delete next[isoDate];
                } else {
                    next[isoDate] = { slots: nextSlots };
                }
                return next;
            });

            if (selectedDay === isoDate) {
                setSpecificErrors(validateSlots(nextSlots));
            }
        } else if (source === "recurring") {
            const bufferMinutes = recurringSettings.bufferMinutes;
            const appointmentInterval = recurringSettings.appointmentInterval;

            setRecurringSchedule((prev) => {
                const dayData = prev[weekday];
                if (!dayData) return prev;

                const nextSlots: RecurringSlot[] = [];
                let changed = false;

                dayData.slots.forEach((slot) => {
                    const result = splitRecurringSlotByTime(slot, time, appointmentInterval, bufferMinutes);
                    if (result.changed) {
                        changed = true;
                    }
                    nextSlots.push(...result.slots);
                });

                if (!changed) return prev;

                const updatedSchedule = {
                    ...prev,
                    [weekday]: {
                        ...dayData,
                        slots: nextSlots,
                    },
                };

                setRecurringErrors((prevErrors) => ({
                    ...prevErrors,
                    [weekday]: validateSlots(nextSlots),
                }));

                return updatedSchedule;
            });
        }
    };

    const handleMonthChange = (direction: "prev" | "next") => {
        setCurrentMonth((prev) => {
            const next = new Date(prev);
            next.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
            return new Date(next.getFullYear(), next.getMonth(), 1);
        });
    };

    const openDayModal = (isoDate: string) => {
        setSelectedDay(isoDate);
        const slots = specificSchedule[isoDate]?.slots ?? [];
        if (slots.length > 0) {
            setSpecificErrors(validateSlots(slots));
        } else {
            setSpecificErrors([]);
        }
        setSpecificModalSlotDraft({
            start: slots[0]?.start ?? "08:00",
            end: slots[0]?.end ?? "17:00",
            interval: slots[0]?.interval ?? specificSettings.appointmentInterval,
        });
    };

    const closeDayModal = () => {
        setSelectedDay(null);
        setSpecificModalSlotDraft({ start: "08:00", end: "17:00", interval: specificSettings.appointmentInterval });
        setSpecificErrors([]);
    };

    const handleDayClick = (isoDate: string) => {
        openDayModal(isoDate);
    };

    const handleSpecificSlotChange = (day: string, slotId: string, field: keyof SpecificSlot, value: string | number) => {
        setSpecificSchedule((prev) => {
            const dayData = prev[day] ?? { slots: [] };
            const updatedSlots = dayData.slots.map((slot) =>
                slot.id === slotId ? { ...slot, [field]: value } : slot
            );
            const next = { ...prev, [day]: { slots: updatedSlots } };
            setSpecificErrors(validateSlots(updatedSlots));
            return next;
        });
    };

    const handleAddSpecificSlot = () => {
        if (!selectedDay) return;
        const newSlot: SpecificSlot = {
            id: createId(),
            start: specificModalSlotDraft.start,
            end: specificModalSlotDraft.end,
            interval: specificModalSlotDraft.interval,
        };

        const nextSlots = [...selectedDaySlots, newSlot];
        const issues = validateSlots(nextSlots);
        setSpecificErrors(issues);
        if (issues.length > 0) return;

        setSpecificSchedule((prev) => ({
            ...prev,
            [selectedDay]: {
                slots: nextSlots,
            },
        }));

        setSpecificModalSlotDraft((draft) => ({
            ...draft,
            start: draft.start,
            end: draft.end,
        }));
    };

    const handleRemoveSpecificSlot = (day: string, slotId: string) => {
        setSpecificSchedule((prev) => {
            const remaining = (prev[day]?.slots ?? []).filter((slot) => slot.id !== slotId);
            const next = { ...prev };
            if (remaining.length === 0) {
                delete next[day];
            } else {
                next[day] = { slots: remaining };
            }
            setSpecificErrors(validateSlots(remaining));
            return next;
        });
    };

    const handleClearSpecificDay = () => {
        if (!selectedDay) return;
        setSpecificSchedule((prev) => {
            const next = { ...prev };
            delete next[selectedDay];
            return next;
        });
        setSpecificErrors([]);
    };

    const handleCopyToOtherDays = () => {
        if (!selectedDay) return;
        const slots = specificSchedule[selectedDay]?.slots ?? [];
        if (slots.length === 0) return;
        setCopyTargets([]);
        setCopyModalOpen(true);
    };

    const confirmCopyToDays = () => {
        if (!selectedDay) return;
        const sourceSlots = specificSchedule[selectedDay]?.slots ?? [];
        if (sourceSlots.length === 0 || copyTargets.length === 0) {
            setCopyModalOpen(false);
            return;
        }

        setSpecificSchedule((prev) => {
            const next = { ...prev };
            copyTargets.forEach((target) => {
                next[target] = {
                    slots: duplicateSpecificSlots(sourceSlots, target.replace(/-/g, "")),
                };
            });
            return next;
        });
        setCopyModalOpen(false);
    };

    const handleRecurringToggle = (day: Weekday) => {
        setRecurringSchedule((prev) => ({
            ...prev,
            [day]: { ...prev[day], enabled: !prev[day].enabled },
        }));
    };

    const handleRecurringSlotChange = (day: Weekday, slotId: string, field: keyof RecurringSlot, value: string) => {
        setRecurringSchedule((prev) => {
            const updatedSlots = prev[day].slots.map((slot) =>
                slot.id === slotId ? { ...slot, [field]: value } : slot
            );
            const issues = validateSlots(updatedSlots);
            setRecurringErrors((prevErrors) => ({ ...prevErrors, [day]: issues }));
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    slots: updatedSlots,
                },
            };
        });
    };

    const addRecurringSlot = (day: Weekday) => {
        setRecurringSchedule((prev) => {
            const slots = prev[day].slots;
            const lastSlot = slots[slots.length - 1];
            const newSlot: RecurringSlot = {
                id: createId(),
                start: lastSlot ? lastSlot.end : "08:00",
                end: lastSlot ? lastSlot.end : "17:00",
            };
            const updatedSlots = [...slots, newSlot];
            const issues = validateSlots(updatedSlots);
            setRecurringErrors((prevErrors) => ({ ...prevErrors, [day]: issues }));
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    slots: updatedSlots,
                },
            };
        });
    };

    const removeRecurringSlot = (day: Weekday, slotId: string) => {
        setRecurringSchedule((prev) => {
            const updatedSlots = prev[day].slots.filter((slot) => slot.id !== slotId);
            const issues = validateSlots(updatedSlots);
            setRecurringErrors((prevErrors) => ({ ...prevErrors, [day]: issues }));
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    slots: updatedSlots.length > 0 ? updatedSlots : [{ id: createId(), start: "08:00", end: "17:00" }],
                },
            };
        });
    };

    const activateAllDays = () => {
        setRecurringSchedule((prev) => {
            const entries = Object.entries(prev).map(([day, data]) => [day, { ...data, enabled: true }]);
            return Object.fromEntries(entries) as typeof prev;
        });
    };

    const deactivateAllDays = () => {
        setRecurringSchedule((prev) => {
            const entries = Object.entries(prev).map(([day, data]) => [day, { ...data, enabled: false }]);
            return Object.fromEntries(entries) as typeof prev;
        });
    };

    const handleSave = async () => {
        setSaveError(null);
        setSaveSuccess(null);

        const specificDaysPayload = Object.entries(specificSchedule).map(([isoDate, day]) => ({
            isoDate,
            slots: (day?.slots ?? []).map((slot) => ({
                start: slot.start,
                end: slot.end,
                interval: slot.interval,
            })),
        }));

        const recurringDaysPayload = ORDERED_DAYS.map((weekday) => {
            const day = recurringSchedule[weekday];
            return {
                weekday,
                enabled: day.enabled,
                slots: day.slots.map((slot) => ({
                    start: slot.start,
                    end: slot.end,
                })),
            };
        });

        const hasSpecificConflicts = specificDaysPayload.some((day) => validateSlots(day.slots).length > 0);
        const hasRecurringConflicts = recurringDaysPayload
            .filter((day) => day.enabled)
            .some((day) => validateSlots(day.slots).length > 0);

        if (hasSpecificConflicts || hasRecurringConflicts) {
            setSaveError("Resolva os conflitos de horários antes de salvar.");
            return;
        }

        if (mode === "specific" && specificDaysPayload.length === 0) {
            setSaveError("Configure ao menos um dia específico com horários para salvar.");
            return;
        }

        if (
            mode === "recurring" &&
            !recurringDaysPayload.some((day) => day.enabled && day.slots.length > 0)
        ) {
            setSaveError("Ative ao menos um dia recorrente com horários disponíveis antes de salvar.");
            return;
        }

        if (!doctorId) {
            setSaveError("Não foi possível identificar o médico logado. Faça login novamente.");
            return;
        }

        const schedulePayload = previewNextSevenDays
            .map(({ isoDate, slotPreview, source, date }) => {
                const normalizedSource =
                    source === "specific" ? "SPECIFIC" : source === "recurring" ? "RECURRING" : "NONE";
                const slots = normalizedSource === "NONE" ? [] : slotPreview;
                return {
                    isoDate,
                    label: formatWeekdayPreview(date),
                    source: normalizedSource,
                    slots,
                };
            })
            .filter((entry) => entry.source === "NONE" || entry.slots.length > 0);

        if (schedulePayload.length === 0) {
            setSaveError("Nenhum horário disponível para salvar.");
            return;
        }

        try {
            setIsSaving(true);
            const response = await jsonPost<SaveDoctorSchedulesResponse>(
                `/api/doctors/${doctorId}/schedule`,
                schedulePayload
            );
            const feedback = response?.message || response?.mensagem || "Horários salvos com sucesso!";
            const daysCount = response?.daysCount ?? response?.updatedDays ?? response?.daysSaved ?? response?.diasAtualizados;
            const slotsCount = response?.slotsCount ?? response?.savedSlots ?? response?.slotsSaved ?? response?.horariosSalvos;
            const details: string[] = [];
            if (typeof daysCount === "number" && !Number.isNaN(daysCount)) {
                details.push(`${daysCount} dia${daysCount === 1 ? "" : "s"}`);
            }
            if (typeof slotsCount === "number" && !Number.isNaN(slotsCount)) {
                details.push(`${slotsCount} horário${slotsCount === 1 ? "" : "s"}`);
            }
            const summary = details.length > 0 ? ` (${details.join(" · ")})` : "";
            setSaveSuccess(`${feedback}${summary}`);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Não foi possível salvar os horários. Tente novamente.";
            console.error("Erro ao salvar horários:", error);
            setSaveError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (mode === "specific") {
            setSpecificSchedule({});
            setSpecificSettings(DEFAULT_SPECIFIC_SETTINGS);
            closeDayModal();
        } else {
            setRecurringSchedule(DEFAULT_RECURRING_SCHEDULE);
            setRecurringSettings(DEFAULT_RECURRING_SETTINGS);
            setRecurringErrors({
                "Segunda-feira": [],
                "Terça-feira": [],
                "Quarta-feira": [],
                "Quinta-feira": [],
                "Sexta-feira": [],
                "Sábado": [],
                "Domingo": [],
            });
        }
    };

    const modeChange = (nextMode: Mode) => {
        setMode(nextMode);
    };

    return (
        <section className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold text-gray-900">Configurar horários de atendimento</h1>
                <p className="text-sm text-gray-600">
                    Ajuste horários específicos por data ou configure regras recorrentes semanais. Horários específicos têm prioridade sobre recorrentes.
                </p>
            </div>

            <nav
                aria-label="Alternar modo de configuração"
                className="rounded-2xl border border-gray-200 bg-white p-1 shadow-sm"
            >
                <ul className="grid gap-1 sm:grid-cols-2">
                    {MODE_OPTIONS.map((option) => {
                        const isActive = mode === option.key;
                        const Icon = option.icon;

                        return (
                            <li key={option.key}>
                                <button
                                    type="button"
                                    onClick={() => modeChange(option.key)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                                        isActive
                                            ? "bg-gray-900 text-white shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    <span
                                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm ${
                                            isActive
                                                ? "border-white/40 bg-white/10 text-white"
                                                : "border-gray-200 bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <span className="flex flex-col gap-0.5">
                                        <span className="text-sm font-semibold">{option.label}</span>
                                        <span className={`text-xs ${isActive ? "text-white/80" : "text-gray-500"}`}>
                                            {option.description}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {mode === "specific" ? (
                <div className="space-y-6">
                    <div className="bg-white shadow-md rounded-2xl border border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 px-8 py-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Definir horários específicos</h2>
                                <p className="text-sm text-gray-500">Selecione um dia no calendário para adicionar faixas de atendimento pontuais.</p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <label className="text-sm text-gray-700 flex items-center gap-2">
                                    Intervalo entre consultas
                                    <select
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={specificSettings.appointmentInterval}
                                        onChange={(event) =>
                                            setSpecificSettings((prev) => ({
                                                ...prev,
                                                appointmentInterval: Number(event.target.value),
                                            }))
                                        }
                                    >
                                        {APPOINTMENT_INTERVAL_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{`${option} min`}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm text-gray-700 flex items-center gap-2">
                                    Buffer entre consultas
                                    <select
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={specificSettings.bufferMinutes}
                                        onChange={(event) =>
                                            setSpecificSettings((prev) => ({
                                                ...prev,
                                                bufferMinutes: Number(event.target.value),
                                            }))
                                        }
                                    >
                                        {BUFFER_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{`${option} min`}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div className="px-8 py-6">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    type="button"
                                    onClick={() => handleMonthChange("prev")}
                                    className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    ← Mês anterior
                                </button>
                                <span className="text-lg font-semibold text-gray-900">
                                    {currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleMonthChange("next")}
                                    className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    Próximo mês →
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-3 text-sm">
                                {[
                                    "Seg",
                                    "Ter",
                                    "Qua",
                                    "Qui",
                                    "Sex",
                                    "Sáb",
                                    "Dom",
                                ].map((weekday) => (
                                    <div key={weekday} className="text-center font-medium text-gray-500">
                                        {weekday}
                                    </div>
                                ))}

                                {calendarDays.map((day) => {
                                    const isoDate = formatDate(day);
                                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                                    const hasSlots = specificSchedule[isoDate]?.slots?.length > 0;
                                    return (
                                        <button
                                            type="button"
                                            key={isoDate}
                                            onClick={() => handleDayClick(isoDate)}
                                            className={`flex flex-col items-center justify-center h-20 rounded-xl border text-sm transition ${
                                                isCurrentMonth ? "" : "bg-gray-50 text-gray-400"
                                            } ${hasSlots ? "border-[#5179EF] text-[#1E3D8F]" : "border-gray-200 text-gray-700"} hover:border-[#5179EF]`}
                                        >
                                            <span className="text-lg font-semibold">{day.getDate()}</span>
                                            {hasSlots && <span className="mt-1 text-[10px] uppercase tracking-wide text-[#5179EF]">configurado</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {specificConfiguredDays.length === 0 && (
                        <p className="text-sm text-gray-500">Selecione um dia para começar a configurar horários específicos.</p>
                    )}

                    {selectedDay && (
                        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
                            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Horários do dia {formatDisplayDate(selectedDay)}</h3>
                                        <p className="text-sm text-gray-500">Adicione faixas para este dia e, se necessário, replique para outras datas.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeDayModal}
                                        className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
                                    >
                                        Fechar
                                    </button>
                                </div>

                                <div className="space-y-6 px-6 py-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <label className="text-sm text-gray-700 flex flex-col gap-1">
                                            Início
                                            <input
                                                type="time"
                                                value={specificModalSlotDraft.start}
                                                onChange={(event) =>
                                                    setSpecificModalSlotDraft((prev) => ({ ...prev, start: event.target.value }))
                                                }
                                                className="h-11 rounded-lg border border-gray-300 px-3"
                                            />
                                        </label>
                                        <label className="text-sm text-gray-700 flex flex-col gap-1">
                                            Fim
                                            <input
                                                type="time"
                                                value={specificModalSlotDraft.end}
                                                onChange={(event) =>
                                                    setSpecificModalSlotDraft((prev) => ({ ...prev, end: event.target.value }))
                                                }
                                                className="h-11 rounded-lg border border-gray-300 px-3"
                                            />
                                        </label>
                                        <label className="text-sm text-gray-700 flex flex-col gap-1">
                                            Intervalo entre consultas (min)
                                            <input
                                                type="number"
                                                min={5}
                                                step={5}
                                                value={specificModalSlotDraft.interval}
                                                onChange={(event) =>
                                                    setSpecificModalSlotDraft((prev) => ({
                                                        ...prev,
                                                        interval: Number(event.target.value),
                                                    }))
                                                }
                                                className="h-11 rounded-lg border border-gray-300 px-3"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleAddSpecificSlot}
                                            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                        >
                                            Adicionar faixa
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCopyToOtherDays}
                                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Copiar para outros dias
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearSpecificDay}
                                            className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            Limpar horários do dia
                                        </button>
                                    </div>

                                    {specificErrors.length > 0 && (
                                        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 space-y-1">
                                            {specificErrors.map((issue) => (
                                                <p key={issue}>• {issue}</p>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {selectedDaySlots.length === 0 ? (
                                            <p className="text-sm text-gray-500">Nenhuma faixa cadastrada para este dia.</p>
                                        ) : (
                                            selectedDaySlots.map((slot) => (
                                                <div
                                                    key={slot.id}
                                                    className="flex flex-col gap-3 rounded-xl border border-gray-200 px-4 py-3 md:flex-row md:items-center md:justify-between"
                                                >
                                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                                        <label className="flex items-center gap-2">
                                                            <span className="text-gray-600">Início</span>
                                                            <input
                                                                type="time"
                                                                value={slot.start}
                                                                onChange={(event) =>
                                                                    handleSpecificSlotChange(selectedDay, slot.id, "start", event.target.value)
                                                                }
                                                                className="h-10 rounded-lg border border-gray-300 px-3"
                                                            />
                                                        </label>
                                                        <label className="flex items-center gap-2">
                                                            <span className="text-gray-600">Fim</span>
                                                            <input
                                                                type="time"
                                                                value={slot.end}
                                                                onChange={(event) =>
                                                                    handleSpecificSlotChange(selectedDay, slot.id, "end", event.target.value)
                                                                }
                                                                className="h-10 rounded-lg border border-gray-300 px-3"
                                                            />
                                                        </label>
                                                        <label className="flex items-center gap-2">
                                                            <span className="text-gray-600">Intervalo</span>
                                                            <input
                                                                type="number"
                                                                min={5}
                                                                step={5}
                                                                value={slot.interval}
                                                                onChange={(event) =>
                                                                    handleSpecificSlotChange(selectedDay, slot.id, "interval", Number(event.target.value))
                                                                }
                                                                className="h-10 w-24 rounded-lg border border-gray-300 px-3"
                                                            />
                                                        </label>
                                                        <span className="text-xs text-gray-400 uppercase tracking-wide">
                                                            {slot.start} - {slot.end}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSpecificSlot(selectedDay, slot.id)}
                                                        className="text-sm text-red-500 hover:text-red-600"
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {copyModalOpen && selectedDay && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                                    <h4 className="text-base font-semibold text-gray-900">Copiar horários para outras datas</h4>
                                    <button
                                        type="button"
                                        onClick={() => setCopyModalOpen(false)}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Fechar
                                    </button>
                                </div>
                                <div className="space-y-4 px-5 py-5">
                                    <p className="text-sm text-gray-500">
                                        Selecione os dias que receberão as mesmas faixas de {formatDisplayDate(selectedDay)}.
                                    </p>
                                    <div className="grid max-h-64 grid-cols-2 gap-3 overflow-y-auto pr-2">
                                        {calendarDays.map((day) => {
                                            const isoDate = formatDate(day);
                                            const disabled = isoDate === selectedDay;
                                            const label = formatDisplayDate(isoDate);
                                            return (
                                                <label
                                                    key={isoDate}
                                                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                                        copyTargets.includes(isoDate)
                                                            ? "border-[#5179EF] bg-[#F3F6FF] text-[#1E3D8F]"
                                                            : "border-gray-200 text-gray-600"
                                                    } ${disabled ? "opacity-50" : "hover:border-[#5179EF]"}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        disabled={disabled}
                                                        checked={copyTargets.includes(isoDate)}
                                                        onChange={(event) => {
                                                            const checked = event.target.checked;
                                                            setCopyTargets((prev) => {
                                                                if (checked) {
                                                                    return [...prev, isoDate];
                                                                }
                                                                return prev.filter((value) => value !== isoDate);
                                                            });
                                                        }}
                                                    />
                                                    <span>{label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setCopyModalOpen(false)}
                                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={confirmCopyToDays}
                                            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white shadow-md rounded-2xl border border-gray-200">
                        <div className="flex flex-col gap-4 border-b border-gray-200 px-8 py-6 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Definir Horários</h2>
                                <p className="text-sm text-gray-500">Configure seus horários de atendimento para cada dia da semana.</p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <label className="text-sm text-gray-700 flex items-center gap-2">
                                    Intervalo entre consultas
                                    <select
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={recurringSettings.appointmentInterval}
                                        onChange={(event) =>
                                            setRecurringSettings((prev) => ({
                                                ...prev,
                                                appointmentInterval: Number(event.target.value),
                                            }))
                                        }
                                    >
                                        {APPOINTMENT_INTERVAL_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{`${option} min`}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm text-gray-700 flex items-center gap-2">
                                    Buffer entre consultas
                                    <select
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={recurringSettings.bufferMinutes}
                                        onChange={(event) =>
                                            setRecurringSettings((prev) => ({
                                                ...prev,
                                                bufferMinutes: Number(event.target.value),
                                            }))
                                        }
                                    >
                                        {BUFFER_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{`${option} min`}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-gray-200 px-8 py-4">
                            <h3 className="text-sm font-semibold text-gray-900">Horários de Atendimento</h3>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={activateAllDays}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Ativar todos
                                </button>
                                <button
                                    type="button"
                                    onClick={deactivateAllDays}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Desativar todos
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 px-8 py-6">
                            {ORDERED_DAYS.map((day) => {
                                const data = recurringSchedule[day];
                                const dayIssues = recurringErrors[day];
                                return (
                                    <div key={day} className="rounded-2xl border border-gray-200 p-5">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRecurringToggle(day)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                                        data.enabled ? "bg-[#5179EF]" : "bg-gray-300"
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                            data.enabled ? "translate-x-5" : "translate-x-1"
                                                        }`}
                                                    />
                                                </button>
                                                <span className="text-base font-medium text-gray-900">{day}</span>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {data.slots.map((slot) => `${slot.start} - ${slot.end}`).join(" • ") || "Sem faixas"}
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            {data.slots.map((slot, index) => (
                                                <div
                                                    key={slot.id}
                                                    className="flex flex-col gap-3 rounded-xl border border-gray-200 px-4 py-3 md:flex-row md:items-center md:justify-between"
                                                >
                                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                                        <label className="flex items-center gap-2">
                                                            <span className="text-gray-600">Início</span>
                                                            <input
                                                                type="time"
                                                                value={slot.start}
                                                                disabled={!data.enabled}
                                                                onChange={(event) =>
                                                                    handleRecurringSlotChange(day, slot.id, "start", event.target.value)
                                                                }
                                                                className="h-10 rounded-lg border border-gray-300 px-3 disabled:bg-gray-100"
                                                            />
                                                        </label>
                                                        <label className="flex items-center gap-2">
                                                            <span className="text-gray-600">Fim</span>
                                                            <input
                                                                type="time"
                                                                value={slot.end}
                                                                disabled={!data.enabled}
                                                                onChange={(event) =>
                                                                    handleRecurringSlotChange(day, slot.id, "end", event.target.value)
                                                                }
                                                                className="h-10 rounded-lg border border-gray-300 px-3 disabled:bg-gray-100"
                                                            />
                                                        </label>
                                                        <span className="text-xs uppercase tracking-wide text-gray-400">Faixa {index + 1}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRecurringSlot(day, slot.id)}
                                                        disabled={!data.enabled || data.slots.length === 1}
                                                        className="text-sm text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-300"
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => addRecurringSlot(day)}
                                                disabled={!data.enabled}
                                                className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-[#5179EF] hover:text-[#5179EF] disabled:cursor-not-allowed disabled:text-gray-300"
                                            >
                                                + Adicionar faixa
                                            </button>
                                            {dayIssues.length > 0 && (
                                                <div className="text-right text-xs text-red-500">
                                                    {dayIssues.map((issue) => (
                                                        <p key={issue}>• {issue}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="border-t border-gray-200 px-8 py-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <label className="flex flex-col gap-1 text-sm text-gray-700">
                                    Aplicar a partir de
                                    <input
                                        type="date"
                                        value={recurringSettings.startDate}
                                        onChange={(event) =>
                                            setRecurringSettings((prev) => ({
                                                ...prev,
                                                startDate: event.target.value,
                                            }))
                                        }
                                        className="h-11 rounded-lg border border-gray-300 px-3"
                                    />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-gray-700">
                                    Até
                                    <input
                                        type="date"
                                        value={recurringSettings.endDate}
                                        disabled={recurringSettings.noEndDate}
                                        onChange={(event) =>
                                            setRecurringSettings((prev) => ({
                                                ...prev,
                                                endDate: event.target.value,
                                            }))
                                        }
                                        className="h-11 rounded-lg border border-gray-300 px-3 disabled:bg-gray-100"
                                    />
                                </label>
                                <label className="mt-6 flex items-center gap-2 text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={recurringSettings.noEndDate}
                                        onChange={(event) =>
                                            setRecurringSettings((prev) => ({
                                                ...prev,
                                                noEndDate: event.target.checked,
                                                endDate: event.target.checked ? "" : prev.endDate,
                                            }))
                                        }
                                    />
                                    Sem data de término
                                </label>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-900">Exceções (feriados, folgas)</h4>
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value=""
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                if (!value) return;
                                                setRecurringSettings((prev) => ({
                                                    ...prev,
                                                    exceptions: prev.exceptions.includes(value)
                                                        ? prev.exceptions
                                                        : [...prev.exceptions, value],
                                                }));
                                            }}
                                            className="h-11 rounded-lg border border-gray-300 px-3"
                                        />
                                    </div>
                                    {recurringSettings.exceptions.length === 0 ? (
                                        <p className="text-sm text-gray-500">Nenhuma exceção cadastrada.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {recurringSettings.exceptions.map((exception) => (
                                                <span
                                                    key={exception}
                                                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs text-gray-600"
                                                >
                                                    {formatDisplayDate(exception)}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setRecurringSettings((prev) => ({
                                                                ...prev,
                                                                exceptions: prev.exceptions.filter((value) => value !== exception),
                                                            }))
                                                        }
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl bg-blue-50 border border-blue-100 p-5 text-sm text-blue-700 space-y-2">
                                <p>• Os horários serão aplicados para agendamentos futuros.</p>
                                <p>• Consultas já agendadas não serão afetadas.</p>
                                <p>• Você pode alterar estes horários a qualquer momento.</p>
                                <p>• Intervalos para almoço podem ser configurados individualmente.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow-md rounded-2xl border border-gray-200">
                <div className="border-b border-gray-200 px-8 py-6">
                    <h3 className="text-lg font-semibold text-gray-900">Pré-visualização da semana</h3>
                    <p className="text-sm text-gray-500">Visualize como os horários configurados serão aplicados nos próximos 7 dias (prioridade para horários específicos).</p>
                </div>
                <div className="px-8 py-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {previewNextSevenDays.map(({ date, source, slotPreview, isoDate, weekday }) => (
                            <div key={isoDate} className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span className="font-medium text-gray-900">{formatWeekdayPreview(date)}</span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                            source === "specific"
                                                ? "bg-[#F3F6FF] text-[#1E3D8F]"
                                                : source === "recurring"
                                                ? "bg-green-50 text-green-700"
                                                : "bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                        {source === "specific" ? "Específico" : source === "recurring" ? "Recorrente" : "Sem horário"}
                                    </span>
                                </div>
                                <div className="mt-3 min-h-[52px] text-sm">
                                    {slotPreview.length === 0 ? (
                                        <p className="text-gray-500">Nenhum slot gerado.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {slotPreview.map((slot, index) => (
                                                <button
                                                    type="button"
                                                    key={`${isoDate}-${slot}-${index}`}
                                                    onClick={() =>
                                                        handleRemovePreviewSlot({
                                                            isoDate,
                                                            weekday,
                                                            source,
                                                            time: slot,
                                                        })
                                                    }
                                                    className={`group rounded-full border border-transparent px-3 py-1 text-xs transition ${
                                                        source === "none"
                                                            ? "cursor-default bg-gray-100 text-gray-400"
                                                            : "flex items-center gap-2 bg-gray-100 text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                    }`}
                                                    disabled={source === "none"}
                                                >
                                                    <span>{slot}</span>
                                                    {source !== "none" && (
                                                        <span className="hidden text-[10px] font-semibold group-hover:inline">×</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-2xl border border-gray-200">
                <div className="flex flex-col gap-3 px-8 py-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Resumo dos horários</h3>
                        <p className="text-sm text-gray-600">
                            {mode === "specific"
                                ? `${specificConfiguredDays.length} dia(s) com horários específicos configurados`
                                : `${activeRecurringDays} dia(s) de atendimento configurados semanalmente`}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-black"
                        >
                            {isSaving ? "Salvando..." : "Salvar horários"}
                        </button>
                    </div>
                </div>
                {saveError && (
                    <div className="border-t border-rose-100 bg-rose-50 px-8 py-4 text-sm text-rose-600" role="alert">
                        {saveError}
                    </div>
                )}
                {saveSuccess && (
                    <div
                        className="border-t border-emerald-100 bg-emerald-50 px-8 py-4 text-sm text-emerald-600"
                        role="status"
                        aria-live="polite"
                    >
                        {saveSuccess}
                    </div>
                )}
                <div className="border-t border-gray-200 px-8 py-6 text-sm text-gray-500 space-y-2">
                    <p>• Os horários serão aplicados para agendamentos futuros.</p>
                    <p>• Consultas já agendadas não serão afetadas.</p>
                    <p>• Horários específicos sobrescrevem horários recorrentes na mesma data.</p>
                    <p>• Buffers adicionados são declarativos e utilizados apenas para geração de slots.</p>
                </div>
            </div>
        </section>
    );
}
