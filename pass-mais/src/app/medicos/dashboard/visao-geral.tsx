"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    AlertCircle,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    History,
    Loader2,
    Pill,
    ShieldAlert,
    Stethoscope,
    Syringe,
    Zap,
    X,
    type LucideIcon,
} from "lucide-react";
import { jsonGet } from "@/lib/api";
import { extractDoctorIdFromToken } from "@/lib/token";

const SAO_PAULO_TZ = "America/Sao_Paulo";
const PAGE_SIZE = 20;
const APPOINTMENTS_POLL_INTERVAL = 30_000;

export type AppointmentStatus = "agendada" | "confirmada" | "em-andamento" | "concluida" | "cancelada";
export type AlertType = "alergia" | "risco" | "interacao";
export type SeverityLevel = "alto" | "moderado" | "baixo";

type SegmentFilter = "past" | "today" | "future" | "all";
type SortKey = "datetime" | "status" | "patient";
type ConsultationTabKey = "resumo" | "consulta" | "historico";
type ConsultationRecordFieldKey = "reason" | "symptomDuration" | "anamnesis" | "physicalExam" | "plan";
type ConsultationRecordStatus = "draft" | "finalized";
type ConsultationRecordSaveOrigin = "auto" | "manual" | "blur";

interface PatientAlert {
    id: string;
    type: AlertType;
    label: string;
    description: string;
    severity: SeverityLevel;
}

interface PatientMedication {
    id: string;
    name: string;
    dose: string;
    form: string;
    schedule: string;
    adherence: "alta" | "media" | "baixa";
    updatedAt: string;
    notes?: string;
}

interface PatientExam {
    id: string;
    kind: "laboratorio" | "imagem";
    exam: string;
    date: string;
    value?: string;
    reference?: string;
    highlight?: string;
    abnormal: boolean;
    reportUrl?: string;
}

interface PatientVaccine {
    id: string;
    category: string;
    vaccine: string;
    status: "pendente" | "atualizada";
    date?: string;
}

interface AppointmentPatient {
    id: string;
    name: string;
    birthDate?: string;
    cpf?: string;
    gender?: string;
    email?: string;
    emailMasked?: boolean;
    address?: string;
    addressMasked?: boolean;
    avatarUrl?: string;
    phone?: string;
    healthInsurance?: string;
}

interface PatientResponsibleInfo {
    fullName?: string | null;
    relationship?: string | null;
    cpf?: string | null;
    phone?: string | null;
}

interface PatientHealthInsuranceInfo {
    name?: string | null;
}

interface PatientFileResponse {
    fullName?: string | null;
    cpf?: string | null;
    birthDate?: string | null;
    motherName?: string | null;
    sex?: string | null;
    email?: string | null;
    contactPhone?: string | null;
    fullAddress?: string | null;
    hasLegalResponsible?: boolean;
    responsible?: PatientResponsibleInfo | null;
    healthInsurance?: PatientHealthInsuranceInfo | null;
    presenceConfirmedAt?: string | null;
}

export interface ConsultationRecordSnapshot {
    reason?: string;
    symptomDuration?: string;
    anamnesis?: string;
    physicalExam?: string;
    plan?: string;
    status?: ConsultationRecordStatus;
    lastSavedAt?: string;
}

export interface AppointmentDetail {
    id: string;
    scheduledAt: string;
    status: AppointmentStatus;
    reason?: string;
    symptomDuration?: string;
    preConsultNotes?: string;
    consultationRecord?: ConsultationRecordSnapshot;
    alerts: PatientAlert[];
    medications: PatientMedication[];
    exams: PatientExam[];
    vaccines: PatientVaccine[];
    patient: AppointmentPatient;
    presenceConfirmedAt?: string | null;
}

export interface VisaoGeralProps {
    appointments: AppointmentDetail[];
    isLoading?: boolean;
}

type DoctorAppointmentApiItem = {
    id?: string | null;
    doctorId?: string | null;
    patientId?: string | null;
    patientFullName?: string | null;
    patientCpf?: string | null;
    patientBirthDate?: string | null;
    patientCellPhone?: string | null;
    dateTime?: string | null;
    bookedAt?: string | null;
    value?: number | null;
    location?: string | null;
    reason?: string | null;
    status?: string | null;
    presenceConfirmedAt?: string | null;
};

type DoctorAppointmentsApiResponse = DoctorAppointmentApiItem[];

type PatientPresenceAppointmentApiItem = {
    id?: string | null;
    doctorId?: string | null;
    patientId?: string | null;
    dateTime?: string | null;
    bookedAt?: string | null;
    value?: number | null;
    location?: string | null;
    patientFullName?: string | null;
    patientCpf?: string | null;
    patientBirthDate?: string | null;
    patientCellPhone?: string | null;
    reason?: string | null;
    status?: string | null;
    presenceConfirmedAt?: string | null;
};

type PatientPresenceApiEntry = {
    patientFile?: PatientFileResponse | null;
    appointment?: PatientPresenceAppointmentApiItem | null;
};

type PatientsPresenceApiResponse = PatientPresenceApiEntry[];

const API_STATUS_NORMALIZATION: Record<string, AppointmentStatus> = {
    PENDING: "agendada",
    CONFIRMED: "confirmada",
    IN_PROGRESS: "em-andamento",
    INPROGRESS: "em-andamento",
    "IN-PROGRESS": "em-andamento",
    COMPLETED: "concluida",
    FINISHED: "concluida",
    DONE: "concluida",
    CANCELLED: "cancelada",
    CANCELED: "cancelada",
};

function normalizeApiStatus(value?: string | null): AppointmentStatus {
    if (!value) return "agendada";
    const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    return API_STATUS_NORMALIZATION[normalized] ?? "agendada";
}

function mapDoctorAppointmentFromApi(item: DoctorAppointmentApiItem): AppointmentDetail {
    const scheduledAt = item.dateTime ?? new Date().toISOString();
    const appointmentId =
        item.id ?? `${item.patientId ?? "appointment"}-${item.dateTime ?? Math.random().toString(36).slice(2)}`;
    const patientName =
        item.patientFullName && item.patientFullName.trim().length > 0 ? item.patientFullName : "Paciente";

    return {
        id: appointmentId,
        scheduledAt,
        status: normalizeApiStatus(item.status),
        reason: item.reason ?? undefined,
        symptomDuration: undefined,
        preConsultNotes: undefined,
        consultationRecord: undefined,
        alerts: [],
        medications: [],
        exams: [],
        vaccines: [],
        presenceConfirmedAt: item.presenceConfirmedAt ?? null,
        patient: {
            id: item.patientId ?? "",
            name: patientName,
            cpf: item.patientCpf ?? undefined,
            birthDate: item.patientBirthDate ?? undefined,
            email: undefined,
            phone: item.patientCellPhone ?? undefined,
        },
    };
}

function mapPresenceEntryToAppointment(entry: PatientPresenceApiEntry): AppointmentDetail {
    const appointment = entry.appointment ?? {};
    const patientFile = entry.patientFile ?? {};
    const merged = mapDoctorAppointmentFromApi({
        id: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId ?? patientFile.cpf ?? undefined,
        dateTime: appointment.dateTime,
        bookedAt: appointment.bookedAt,
        value: appointment.value,
        location: appointment.location,
        patientFullName: appointment.patientFullName ?? patientFile.fullName ?? undefined,
        patientCpf: appointment.patientCpf ?? patientFile.cpf ?? undefined,
        patientBirthDate: appointment.patientBirthDate ?? patientFile.birthDate ?? undefined,
        patientCellPhone: appointment.patientCellPhone ?? patientFile.contactPhone ?? undefined,
        reason: appointment.reason ?? undefined,
        status: appointment.status ?? undefined,
        presenceConfirmedAt: patientFile.presenceConfirmedAt ?? appointment.presenceConfirmedAt ?? null,
    });

    return {
        ...merged,
        presenceConfirmedAt: patientFile.presenceConfirmedAt ?? merged.presenceConfirmedAt ?? null,
        patient: {
            ...merged.patient,
            name: patientFile.fullName ?? merged.patient.name,
            cpf: patientFile.cpf ?? merged.patient.cpf,
            birthDate: patientFile.birthDate ?? merged.patient.birthDate,
            email: patientFile.email ?? merged.patient.email,
            phone: patientFile.contactPhone ?? merged.patient.phone,
            address: patientFile.fullAddress ?? merged.patient.address,
            healthInsurance: patientFile.healthInsurance?.name ?? merged.patient.healthInsurance,
        },
    };
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
    agendada: "Agendada",
    confirmada: "Confirmada",
    "em-andamento": "Em andamento",
    concluida: "Concluída",
    cancelada: "Cancelada",
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
    agendada: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    confirmada: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    "em-andamento": "bg-amber-50 text-amber-600 ring-amber-100",
    concluida: "bg-slate-100 text-slate-600 ring-slate-200",
    cancelada: "bg-rose-50 text-rose-600 ring-rose-100",
};

const ALERT_ICON: Record<AlertType, LucideIcon> = {
    alergia: AlertTriangle,
    risco: ShieldAlert,
    interacao: Zap,
};

const ALERT_COLORS: Record<AlertType, string> = {
    alergia: "text-rose-600",
    risco: "text-amber-600",
    interacao: "text-indigo-600",
};

const SEVERITY_LABEL: Record<SeverityLevel, string> = {
    alto: "Crítico",
    moderado: "Moderado",
    baixo: "Leve",
};

const ADHERENCE_LABEL: Record<"alta" | "media" | "baixa", string> = {
    alta: "Alta",
    media: "Média",
    baixa: "Baixa",
};

const ADHERENCE_COLOR: Record<"alta" | "media" | "baixa", string> = {
    alta: "text-emerald-600",
    media: "text-amber-600",
    baixa: "text-rose-600",
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "datetime", label: "Data/Hora" },
    { key: "status", label: "Status" },
    { key: "patient", label: "Nome do paciente" },
];

const SEGMENT_LABEL: Record<SegmentFilter, string> = {
    today: "Hoje",
    future: "Futuras",
    past: "Passadas",
    all: "Todas",
};

const SEGMENT_OPTIONS: SegmentFilter[] = ["past", "today", "future", "all"];
const CONSULTATION_TABS: { key: ConsultationTabKey; label: string; helper?: string }[] = [
    { key: "resumo", label: "Resumo" },
    { key: "consulta", label: "Consulta Atual", helper: "Prontuário" },
    { key: "historico", label: "Histórico" },
];
const SYMPTOM_DURATION_CHIPS = ["1 dia", "1 semana", ">1 mês"];
const ANAMNESIS_TEMPLATES = ["Dor torácica — OPQRST", "HAS — controle", "Diabetes tipo 2 — seguimento anual"];
const PHYSICAL_EXAM_SNIPPETS = ["PA: ", "FC: ", "SpO₂: ", "IMC: "];
const PLAN_SNIPPETS = ["Orientar sinais de alarme e retorno se piora.", "Solicitar exames laboratoriais complementares.", "Agendar retorno em 30 dias."];
const AUTOSAVE_INTERVAL = 5000;
const SAVE_SIMULATED_LATENCY = 350;

interface ConsultationRecordDraft {
    reason: string;
    symptomDuration: string;
    anamnesis: string;
    physicalExam: string;
    plan: string;
}

interface ConsultationRecordStore {
    consultationId: string;
    draft: ConsultationRecordDraft;
    saved: ConsultationRecordDraft;
    status: ConsultationRecordStatus;
    isDirty: boolean;
    isSaving: boolean;
    lastSavedAt?: number;
    lastError?: string | null;
    lastSaveOrigin?: ConsultationRecordSaveOrigin;
}

interface ConsultationRecordOptions {
    onPersist?: (consultationId: string, draft: ConsultationRecordDraft) => void;
    onFinalize?: (consultationId: string) => void;
}

function createDraftFromAppointment(appointment: AppointmentDetail): ConsultationRecordDraft {
    return {
        reason: appointment.consultationRecord?.reason ?? appointment.reason ?? "",
        symptomDuration: appointment.consultationRecord?.symptomDuration ?? appointment.symptomDuration ?? "",
        anamnesis: appointment.consultationRecord?.anamnesis ?? appointment.preConsultNotes ?? "",
        physicalExam: appointment.consultationRecord?.physicalExam ?? "",
        plan: appointment.consultationRecord?.plan ?? "",
    };
}

function cloneDraft(draft: ConsultationRecordDraft): ConsultationRecordDraft {
    return {
        reason: draft.reason,
        symptomDuration: draft.symptomDuration,
        anamnesis: draft.anamnesis,
        physicalExam: draft.physicalExam,
        plan: draft.plan,
    };
}

function hasDraftChanges(draft: ConsultationRecordDraft, saved: ConsultationRecordDraft) {
    return (
        draft.reason !== saved.reason ||
        draft.symptomDuration !== saved.symptomDuration ||
        draft.anamnesis !== saved.anamnesis ||
        draft.physicalExam !== saved.physicalExam ||
        draft.plan !== saved.plan
    );
}

function simulateNetworkLatency(delay = SAVE_SIMULATED_LATENCY) {
    return new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), delay);
    });
}

function formatRelativeTimeFromNow(timestamp?: number) {
    if (!timestamp) {
        return null;
    }

    const diffMs = timestamp - Date.now();
    const absDiff = Math.abs(diffMs);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

    if (absDiff < minute) {
        return "agora";
    }
    if (absDiff < hour) {
        return formatter.format(Math.round(diffMs / minute), "minute");
    }
    if (absDiff < day) {
        return formatter.format(Math.round(diffMs / hour), "hour");
    }
    return formatter.format(Math.round(diffMs / day), "day");
}

function useConsultationRecord(appointment: AppointmentDetail | null, options?: ConsultationRecordOptions) {
    const [state, setState] = useState<ConsultationRecordStore | null>(null);
    const persistCallback = options?.onPersist;
    const finalizeCallback = options?.onFinalize;
    const appointmentRef = useRef<AppointmentDetail | null>(appointment);

    useEffect(() => {
        appointmentRef.current = appointment;
    }, [appointment]);

    useEffect(() => {
        const currentAppointment = appointmentRef.current;
        const appointmentId = currentAppointment?.id ?? null;
        if (!appointmentId || !currentAppointment) {
            setState((existing) => (existing ? null : existing));
            return;
        }

        setState((current) => {
            if (current && current.consultationId === appointmentId) {
                return current;
            }

            const draft = createDraftFromAppointment(currentAppointment);
            return {
                consultationId: appointmentId,
                draft,
                saved: cloneDraft(draft),
                status:
                    currentAppointment.consultationRecord?.status ??
                    (currentAppointment.status === "concluida" ? "finalized" : "draft"),
                isDirty: false,
                isSaving: false,
                lastSavedAt: currentAppointment.consultationRecord?.lastSavedAt
                    ? Date.parse(currentAppointment.consultationRecord.lastSavedAt)
                    : undefined,
                lastError: null,
                lastSaveOrigin: undefined,
            };
        });
    }, [appointment?.id]);

    const updateField = useCallback((field: ConsultationRecordFieldKey, value: string) => {
        setState((current) => {
            if (!current || current.status === "finalized") {
                return current;
            }

            const nextDraft = { ...current.draft, [field]: value };
            return {
                ...current,
                draft: nextDraft,
                isDirty: hasDraftChanges(nextDraft, current.saved),
                lastError: field === "reason" && value.trim().length === 0 ? "Motivo da consulta é obrigatório." : null,
            };
        });
    }, []);

    const saveDraft = useCallback(
        async (origin: ConsultationRecordSaveOrigin = "manual") => {
            let snapshot: ConsultationRecordDraft | null = null;
            let canPersist = false;

            setState((current) => {
                if (!current || current.status === "finalized") {
                    return current;
                }
                if (!current.isDirty && origin === "auto") {
                    return current;
                }
                if (!current.isDirty) {
                    return { ...current, lastSaveOrigin: origin };
                }

                snapshot = cloneDraft(current.draft);
                canPersist = true;
                return {
                    ...current,
                    isSaving: true,
                    lastError: null,
                    lastSaveOrigin: origin,
                };
            });

            if (!canPersist || !snapshot) {
                return false;
            }

            await simulateNetworkLatency();

            setState((current) => {
                if (!current || current.consultationId !== appointment?.id) {
                    return current;
                }

                const saved = cloneDraft(snapshot!);
                return {
                    ...current,
                    saved,
                    isDirty: false,
                    isSaving: false,
                    lastSavedAt: Date.now(),
                    lastError: null,
                };
            });

            persistCallback?.(appointment!.id, snapshot);
            return true;
        },
        [appointment, persistCallback],
    );

    useEffect(() => {
        if (!state || state.status === "finalized" || state.isSaving || !state.isDirty) {
            return;
        }

        const timer = window.setTimeout(() => {
            void saveDraft("auto");
        }, AUTOSAVE_INTERVAL);

        return () => window.clearTimeout(timer);
    }, [saveDraft, state]);

    const cancelChanges = useCallback(() => {
        setState((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                draft: cloneDraft(current.saved),
                isDirty: false,
                lastError: null,
            };
        });
    }, []);

    const finalize = useCallback(async () => {
        let allowFinalize = true;

        setState((current) => {
            if (!current) {
                allowFinalize = false;
                return current;
            }
            if (current.status === "finalized") {
                return current;
            }
            if (current.draft.reason.trim().length === 0) {
                allowFinalize = false;
                return {
                    ...current,
                    lastError: "Motivo da consulta é obrigatório para finalizar o atendimento.",
                };
            }
            return current;
        });

        if (!allowFinalize) {
            return false;
        }

        await saveDraft("manual");

        setState((current) => {
            if (!current) {
                return current;
            }
            if (current.status === "finalized") {
                return current;
            }
            return {
                ...current,
                status: "finalized",
                lastError: null,
            };
        });

        if (appointment) {
            finalizeCallback?.(appointment.id);
        }

        return true;
    }, [appointment, finalizeCallback, saveDraft]);

    return {
        state,
        updateField,
        saveDraft,
        cancelChanges,
        finalize,
    };
}

function getZonedDateString(date: Date) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: SAO_PAULO_TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

function getZonedDate(date: Date, time: "start" | "end") {
    const base = getZonedDateString(date);
    const suffix = time === "start" ? "T00:00:00" : "T23:59:59";
    return new Date(`${base}${suffix}-03:00`);
}

function withinSameDay(dateA: Date, dateB: Date) {
    return getZonedDateString(dateA) === getZonedDateString(dateB);
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: SAO_PAULO_TZ,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(iso));
}

function formatTime(iso: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: SAO_PAULO_TZ,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(iso));
}

function getAge(birthDate?: string) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
        age -= 1;
    }
    return age;
}

function normalizeCpf(value?: string | null) {
    if (!value) {
        return "";
    }
    return value.replace(/\D/g, "").slice(0, 11);
}

function formatCpf(value?: string | null) {
    const digits = normalizeCpf(value);
    if (digits.length === 0) {
        return "—";
    }
    if (digits.length !== 11) {
        return digits;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskValue(value?: string) {
    if (!value) return "—";
    if (value.length <= 6) return `${value.slice(0, 1)}***`;
    return `${value.slice(0, 3)}***${value.slice(-3)}`;
}

function maskCpf(value?: string) {
    const digits = value?.replace(/\D/g, "");
    if (!digits || digits.length < 2) {
        return "—";
    }
    return `***.***.***-${digits.slice(-2)}`;
}

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((segment) => segment[0]?.toUpperCase())
        .join("");
}

function toDate(value: string) {
    return new Date(value);
}

function isWithinNextHour(iso: string) {
    const now = new Date();
    const target = new Date(iso);
    const diff = target.getTime() - now.getTime();
    return diff >= 0 && diff <= 60 * 60 * 1000;
}

function appointmentArrivalTime(appointment: AppointmentDetail) {
    return appointment.presenceConfirmedAt ?? null;
}

function mergeAppointmentDetails(base: AppointmentDetail, incoming: AppointmentDetail): AppointmentDetail {
    return {
        ...base,
        reason: base.reason ?? incoming.reason,
        symptomDuration: base.symptomDuration ?? incoming.symptomDuration,
        preConsultNotes: base.preConsultNotes ?? incoming.preConsultNotes,
        presenceConfirmedAt: incoming.presenceConfirmedAt ?? base.presenceConfirmedAt ?? null,
        patient: {
            ...base.patient,
            ...incoming.patient,
        },
    };
}

export default function VisaoGeral({ appointments, isLoading = false }: VisaoGeralProps) {
    const [segment, setSegment] = useState<SegmentFilter>("today");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<SortKey>("datetime");
    const [page, setPage] = useState(1);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDetail | null>(null);
    const [selectedSource, setSelectedSource] = useState<"list" | "presence" | null>(null);
    const [appointmentsState, setAppointmentsState] = useState(appointments);
    const [activeTab, setActiveTab] = useState<ConsultationTabKey>("resumo");
    const [preferredInitialTab, setPreferredInitialTab] = useState<ConsultationTabKey | null>(null);
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const [isFetchingAppointments, setIsFetchingAppointments] = useState(isLoading);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [patientFile, setPatientFile] = useState<PatientFileResponse | null>(null);
    const [isPatientFileLoading, setIsPatientFileLoading] = useState(false);
    const [patientFileError, setPatientFileError] = useState<string | null>(null);
    const [presenceQueue, setPresenceQueue] = useState<AppointmentDetail[]>([]);
    const [isPresenceLoading, setIsPresenceLoading] = useState(false);
    const [presenceError, setPresenceError] = useState<string | null>(null);
    const appointmentsRequestRef = useRef(false);
    const presenceRequestRef = useRef(false);
    const patientFileFetchKeyRef = useRef<string | null>(null);
    const lastSelectedAppointmentIdRef = useRef<string | null>(null);

    useEffect(() => {
        setAppointmentsState(appointments);
    }, [appointments]);

    const fetchAppointments = useCallback(
        async ({ signal, silent = false }: { signal?: AbortSignal; silent?: boolean } = {}) => {
            if (!doctorId || appointmentsRequestRef.current) {
                return;
            }

            appointmentsRequestRef.current = true;
            if (!silent) {
                setFetchError(null);
                setIsFetchingAppointments(true);
            }

            try {
                const response = await jsonGet<DoctorAppointmentsApiResponse>(`/api/appointments/doctor/${doctorId}`, {
                    signal,
                });
                const mapped = Array.isArray(response) ? response.map((item) => mapDoctorAppointmentFromApi(item)) : [];
                setAppointmentsState(mapped);
            } catch (error) {
                if ((error as Error)?.name === "AbortError") {
                    return;
                }
                if (!silent) {
                    setFetchError(
                        error instanceof Error ? error.message : "Não foi possível carregar as consultas do médico.",
                    );
                }
            } finally {
                appointmentsRequestRef.current = false;
                if (!silent) {
                    setIsFetchingAppointments(false);
                }
            }
        },
        [doctorId],
    );

    const fetchPresenceQueue = useCallback(
        async ({ signal, silent = false }: { signal?: AbortSignal; silent?: boolean } = {}) => {
            if (presenceRequestRef.current) {
                return;
            }

            presenceRequestRef.current = true;
            if (!silent) {
                setPresenceError(null);
                setIsPresenceLoading(true);
            }

            try {
                const today = getZonedDateString(new Date());
                const response = await jsonGet<PatientsPresenceApiResponse>(`/api/patients/presence?date=${today}`, {
                    signal,
                });
                const mapped = Array.isArray(response) ? response.map((entry) => mapPresenceEntryToAppointment(entry)) : [];
                setPresenceQueue(mapped);
            } catch (error) {
                if ((error as Error)?.name === "AbortError") {
                    return;
                }
                if (!silent) {
                    setPresenceError(
                        error instanceof Error
                            ? error.message
                            : "Não foi possível carregar os pacientes aguardando atendimento.",
                    );
                }
            } finally {
                presenceRequestRef.current = false;
                if (!silent) {
                    setIsPresenceLoading(false);
                }
            }
        },
        [],
    );

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const storedDoctorId = window.localStorage.getItem("doctorId");
        if (storedDoctorId) {
            setDoctorId(storedDoctorId);
            return;
        }
        const accessToken = window.localStorage.getItem("accessToken");
        const derivedDoctorId = extractDoctorIdFromToken(accessToken);
        if (derivedDoctorId) {
            window.localStorage.setItem("doctorId", derivedDoctorId);
            setDoctorId(derivedDoctorId);
            return;
        }
        setFetchError("Não foi possível identificar o médico logado.");
        setIsFetchingAppointments(false);
    }, []);

    useEffect(() => {
        if (!doctorId) {
            return;
        }
        const controller = new AbortController();
        void fetchAppointments({ signal: controller.signal });
        return () => {
            controller.abort();
        };
    }, [doctorId, fetchAppointments]);

    useEffect(() => {
        if (!doctorId) {
            return;
        }
        const interval = window.setInterval(() => {
            void fetchAppointments({ silent: true });
        }, APPOINTMENTS_POLL_INTERVAL);
        return () => window.clearInterval(interval);
    }, [doctorId, fetchAppointments]);

    useEffect(() => {
        if (!doctorId) {
            return;
        }
        const controller = new AbortController();
        void fetchPresenceQueue({ signal: controller.signal });
        return () => {
            controller.abort();
        };
    }, [doctorId, fetchPresenceQueue]);

    useEffect(() => {
        if (!doctorId) {
            return;
        }
        const interval = window.setInterval(() => {
            void fetchPresenceQueue({ silent: true });
        }, APPOINTMENTS_POLL_INTERVAL);
        return () => window.clearInterval(interval);
    }, [doctorId, fetchPresenceQueue]);

    const selectedAppointmentId = selectedAppointment?.id ?? null;

    useEffect(() => {
        if (!selectedAppointmentId) {
            lastSelectedAppointmentIdRef.current = null;
            if (preferredInitialTab !== null) {
                setPreferredInitialTab(null);
            }
            setActiveTab("resumo");
            return;
        }

        if (preferredInitialTab) {
            setActiveTab(preferredInitialTab);
            setPreferredInitialTab(null);
            lastSelectedAppointmentIdRef.current = selectedAppointmentId;
            return;
        }

        if (lastSelectedAppointmentIdRef.current !== selectedAppointmentId) {
            lastSelectedAppointmentIdRef.current = selectedAppointmentId;
            setActiveTab("resumo");
        }
    }, [preferredInitialTab, selectedAppointmentId]);

    const handlePersistRecord = useCallback((consultationId: string, draft: ConsultationRecordDraft) => {
        const isoTimestamp = new Date().toISOString();

        setAppointmentsState((current) =>
            current.map((appointment) => {
                if (appointment.id !== consultationId) {
                    return appointment;
                }

                return {
                    ...appointment,
                    reason: draft.reason,
                    symptomDuration: draft.symptomDuration,
                    consultationRecord: {
                        ...(appointment.consultationRecord ?? {}),
                        ...draft,
                        status: appointment.consultationRecord?.status ?? "draft",
                        lastSavedAt: isoTimestamp,
                    },
                };
            }),
        );

        setSelectedAppointment((current) => {
            if (!current || current.id !== consultationId) {
                return current;
            }

            return {
                ...current,
                reason: draft.reason,
                symptomDuration: draft.symptomDuration,
                consultationRecord: {
                    ...(current.consultationRecord ?? {}),
                    ...draft,
                    status: current.consultationRecord?.status ?? "draft",
                    lastSavedAt: isoTimestamp,
                },
            };
        });
    }, []);

    const handleFinalizeRecord = useCallback((consultationId: string) => {
        const isoTimestamp = new Date().toISOString();

        setAppointmentsState((current) =>
            current.map((appointment) => {
                if (appointment.id !== consultationId) {
                    return appointment;
                }

                return {
                    ...appointment,
                    status: "concluida",
                    consultationRecord: {
                        ...(appointment.consultationRecord ?? {}),
                        status: "finalized",
                        lastSavedAt: isoTimestamp,
                    },
                };
            }),
        );

        setSelectedAppointment((current) => {
            if (!current || current.id !== consultationId) {
                return current;
            }

            return {
                ...current,
                status: "concluida",
                consultationRecord: {
                    ...(current.consultationRecord ?? {}),
                    status: "finalized",
                    lastSavedAt: isoTimestamp,
                },
            };
        });
    }, []);

    const consultationRecord = useConsultationRecord(selectedAppointment, {
        onPersist: handlePersistRecord,
        onFinalize: handleFinalizeRecord,
    });
    const { state: recordState, updateField, saveDraft: saveRecordDraft, cancelChanges: cancelRecordChanges, finalize: finalizeRecord } =
        consultationRecord;
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!feedbackMessage) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setFeedbackMessage(null);
        }, 4000);

        return () => window.clearTimeout(timeout);
    }, [feedbackMessage]);

    useEffect(() => {
        setFeedbackMessage(null);
    }, [selectedAppointment?.id]);
    const hasPresenceConfirmation = Boolean(selectedAppointment?.presenceConfirmedAt);
    const isEditableStatus =
        selectedAppointment != null &&
        hasPresenceConfirmation &&
        (selectedAppointment.status === "confirmada" || selectedAppointment.status === "em-andamento");
    const isRecordFinalized = recordState?.status === "finalized";
    const canEditConsultationRecord = Boolean(isEditableStatus && !isRecordFinalized);
    const recordDraft = recordState?.draft;
    const relativeSavedLabel = recordState?.lastSavedAt ? formatRelativeTimeFromNow(recordState.lastSavedAt) : null;
    const isSavingRecord = recordState?.isSaving ?? false;
    const hasPendingChanges = recordState?.isDirty ?? false;
    const recordError = recordState?.lastError ?? null;
    const recordReady = Boolean(recordState);
    const recordGuardMessage = selectedAppointment
        ? selectedAppointment.status === "cancelada"
            ? { tone: "danger" as const, text: "Consulta cancelada — edição indisponível." }
            : selectedAppointment.status === "concluida" || isRecordFinalized
              ? { tone: "info" as const, text: "Consulta concluída — prontuário em modo leitura." }
              : !hasPresenceConfirmation
                ? { tone: "warning" as const, text: "Presença não confirmada — aguarde a secretaria finalizar o check-in." }
                : selectedAppointment.status === "agendada"
                    ? { tone: "warning" as const, text: "Consulta aguardando confirmação — edição disponível após confirmação." }
                    : null
        : null;
    const selectedPatientAge = selectedAppointment
        ? getAge(patientFile?.birthDate ?? selectedAppointment.patient.birthDate)
        : null;
    const patientNameFromFile = patientFile?.fullName?.trim();
    const patientDisplayName =
        patientNameFromFile && patientNameFromFile.length > 0
            ? patientNameFromFile
            : selectedAppointment?.patient.name ?? "";
    const patientCpfDisplay = formatCpf(patientFile?.cpf ?? selectedAppointment?.patient.cpf);
    const patientBirthDateDisplay = patientFile?.birthDate ?? selectedAppointment?.patient.birthDate ?? null;
    const patientContactDisplay =
        patientFile?.contactPhone ??
        selectedAppointment?.patient.phone ??
        (selectedAppointment?.patient.emailMasked ? maskValue(selectedAppointment.patient.email) : selectedAppointment?.patient.email) ??
        "—";
    const patientInsuranceDisplay =
        patientFile?.healthInsurance?.name ?? selectedAppointment?.patient.healthInsurance ?? "—";
    const patientSexDisplay = patientFile?.sex ?? selectedAppointment?.patient.gender ?? "—";
    const patientEmailDisplay =
        patientFile?.email ??
        (selectedAppointment?.patient.emailMasked ? maskValue(selectedAppointment.patient.email) : selectedAppointment?.patient.email) ??
        "—";
    const patientAddressDisplay =
        patientFile?.fullAddress ??
        (selectedAppointment?.patient.addressMasked ? maskValue(selectedAppointment.patient.address) : selectedAppointment?.patient.address) ??
        "—";
    const selectedArrivalIso = selectedAppointment ? appointmentArrivalTime(selectedAppointment) : null;
    const patientArrivalLabel =
        selectedArrivalIso != null ? `${formatDate(selectedArrivalIso)} às ${formatTime(selectedArrivalIso)}` : "—";
    const isPresenceFlow = selectedSource === "presence";
    const saveButtonLabel = isPresenceFlow ? "Salvar Observações" : recordState?.lastSavedAt ? "Salvar alterações" : "Salvar rascunho";
    const finalizeButtonLabel = isPresenceFlow ? "Encerrar Consulta" : "Finalizar atendimento";
    const handleTabChange = useCallback((tab: ConsultationTabKey) => {
        setActiveTab(tab);
    }, []);
    const handleManualSave = useCallback(async () => {
        const saved = await saveRecordDraft("manual");
        if (saved) {
            setFeedbackMessage("Rascunho salvo com sucesso.");
        } else if (recordState?.status !== "finalized") {
            setFeedbackMessage("Nenhuma alteração para salvar.");
        }
    }, [recordState?.status, saveRecordDraft]);

    const handleFinalize = useCallback(async () => {
        const success = await finalizeRecord();
        if (success) {
            setFeedbackMessage("Atendimento finalizado.");
        }
    }, [finalizeRecord]);

    const handleCancelChanges = useCallback(() => {
        cancelRecordChanges();
        if (hasPendingChanges) {
            setFeedbackMessage("Alterações descartadas.");
        } else {
            setFeedbackMessage("Nenhuma alteração pendente.");
        }
    }, [cancelRecordChanges, hasPendingChanges]);

    const handleInsertSnippet = useCallback(
        (field: ConsultationRecordFieldKey, snippet: string) => {
            if (!canEditConsultationRecord) {
                return;
            }
            const currentValue = recordState?.draft[field] ?? "";
            if (currentValue.includes(snippet)) {
                return;
            }
            const nextValue = currentValue.trim().length > 0 ? `${currentValue.trimEnd()}\n${snippet}` : snippet;
            updateField(field, nextValue);
        },
        [canEditConsultationRecord, recordState?.draft, updateField],
    );

    useEffect(() => {
        if (!selectedAppointment || !recordReady) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!event.ctrlKey && !event.metaKey) {
                return;
            }

            if (event.key.toLowerCase() === "s") {
                event.preventDefault();
                if (canEditConsultationRecord && !isSavingRecord) {
                    void handleManualSave();
                }
            }

            if (event.key === "Enter") {
                event.preventDefault();
                if (canEditConsultationRecord && !isSavingRecord) {
                    void handleFinalize();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [canEditConsultationRecord, handleFinalize, handleManualSave, isSavingRecord, recordReady, selectedAppointment]);

    const filteredAppointments = useMemo(() => {
        const now = new Date();
        const startOfToday = getZonedDate(now, "start");
        const endOfToday = getZonedDate(now, "end");

        let list = appointmentsState.filter((item) => {
            const scheduled = toDate(item.scheduledAt);

            if (segment === "past" && !(scheduled < startOfToday)) {
                return false;
            }
            if (segment === "today" && !withinSameDay(scheduled, now)) {
                return false;
            }
            if (segment === "future" && !(scheduled > endOfToday)) {
                return false;
            }

            if (startDate) {
                const startBoundary = new Date(`${startDate}T00:00:00-03:00`);
                if (scheduled < startBoundary) {
                    return false;
                }
            }
            if (endDate) {
                const endBoundary = new Date(`${endDate}T23:59:59-03:00`);
                if (scheduled > endBoundary) {
                    return false;
                }
            }

            return true;
        });

        if (search) {
            list = list.filter((item) => item.patient.name.toLowerCase().includes(search.toLowerCase()));
        }

        return list
            .slice()
            .sort((a, b) => {
                if (sortBy === "datetime") {
                    return toDate(a.scheduledAt).getTime() - toDate(b.scheduledAt).getTime();
                }
                if (sortBy === "status") {
                    return STATUS_LABEL[a.status].localeCompare(STATUS_LABEL[b.status]);
                }
                return a.patient.name.localeCompare(b.patient.name);
            });
    }, [appointmentsState, segment, search, sortBy, startDate, endDate]);

    const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginatedAppointments = filteredAppointments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleSegmentChange = (value: SegmentFilter) => {
        setSegment(value);
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleSortChange = (value: SortKey) => {
        setSortBy(value);
        setPage(1);
    };

    const handleDateChange = (value: string, kind: "start" | "end") => {
        if (kind === "start") {
            setStartDate(value);
        } else {
            setEndDate(value);
        }
        setPage(1);
    };

    const showSkeleton = isLoading || isFetchingAppointments;

    const confirmedAppointments = useMemo(() => {
        const shouldInclude = (appointment: AppointmentDetail) =>
            Boolean(appointment.presenceConfirmedAt) &&
            appointment.status !== "concluida" &&
            appointment.status !== "cancelada";

        const queue = new Map<string, AppointmentDetail>();

        appointmentsState.forEach((appointment) => {
            if (!shouldInclude(appointment)) {
                return;
            }
            queue.set(appointment.id, appointment);
        });

        presenceQueue.forEach((appointment) => {
            if (!shouldInclude(appointment)) {
                return;
            }
            const existing = queue.get(appointment.id);
            if (existing) {
                queue.set(appointment.id, mergeAppointmentDetails(existing, appointment));
            } else {
                queue.set(appointment.id, appointment);
            }
        });

        return Array.from(queue.values()).sort((a, b) => {
            const timeA = appointmentArrivalTime(a);
            const timeB = appointmentArrivalTime(b);
            if (!timeA && !timeB) return 0;
            if (!timeA) return 1;
            if (!timeB) return -1;
            return new Date(timeA).getTime() - new Date(timeB).getTime();
        });
    }, [appointmentsState, presenceQueue]);

    const handleOpenAppointment = useCallback(
        (appointment: AppointmentDetail, options?: { source?: "list" | "presence"; initialTab?: ConsultationTabKey }) => {
            setSelectedSource(options?.source ?? null);
            setPreferredInitialTab(options?.initialTab ?? null);
            setSelectedAppointment(appointment);
        },
        [],
    );

    const handleCloseModal = useCallback(() => {
        setSelectedAppointment(null);
        setSelectedSource(null);
        setPreferredInitialTab(null);
    }, []);

    useEffect(() => {
        if (!selectedAppointment) {
            return;
        }
        const existsInAppointments = appointmentsState.some((appointment) => appointment.id === selectedAppointment.id);
        const existsInPresence = presenceQueue.some((appointment) => appointment.id === selectedAppointment.id);
        if (!existsInAppointments && !existsInPresence) {
            handleCloseModal();
        }
    }, [appointmentsState, presenceQueue, handleCloseModal, selectedAppointment]);

    useEffect(() => {
        if (!selectedAppointment) {
            return;
        }
        const incoming = presenceQueue.find((appointment) => appointment.id === selectedAppointment.id);
        if (!incoming) {
            return;
        }
        setSelectedAppointment((current) => (current ? mergeAppointmentDetails(current, incoming) : current));
    }, [presenceQueue, selectedAppointment]);

    const handleStartConsultation = useCallback(
        (appointment: AppointmentDetail) => {
            if (!appointment.presenceConfirmedAt) {
                setFeedbackMessage("Finalize o check-in da secretaria para iniciar a consulta.");
                return;
            }
            handleOpenAppointment(appointment, { source: "presence", initialTab: "consulta" });
        },
        [handleOpenAppointment, setFeedbackMessage],
    );

    const normalizedSelectedPatientCpf = selectedAppointment?.patient.cpf
        ? normalizeCpf(selectedAppointment.patient.cpf)
        : "";

    useEffect(() => {
        if (!selectedAppointmentId) {
            setPatientFile(null);
            setPatientFileError(null);
            setIsPatientFileLoading(false);
            patientFileFetchKeyRef.current = null;
            return;
        }

        if (!normalizedSelectedPatientCpf) {
            setPatientFile(null);
            setPatientFileError("CPF do paciente não informado.");
            setIsPatientFileLoading(false);
            patientFileFetchKeyRef.current = null;
            return;
        }

        const fetchKey = `${selectedAppointmentId}:${normalizedSelectedPatientCpf}`;
        if (patientFileFetchKeyRef.current === fetchKey) {
            return;
        }
        patientFileFetchKeyRef.current = fetchKey;
        setPatientFile(null);
        setPatientFileError(null);

        let cancelled = false;
        const controller = new AbortController();

        const loadPatientFile = async () => {
            setIsPatientFileLoading(true);
            setPatientFileError(null);
            try {
                const response = await jsonGet<PatientFileResponse>(`/api/patients/file/${normalizedSelectedPatientCpf}`, {
                    signal: controller.signal,
                });
                if (cancelled) {
                    return;
                }
                setPatientFile(response);
            } catch (error) {
                if (cancelled) {
                    return;
                }
                if ((error as Error)?.name === "AbortError") {
                    return;
                }
                setPatientFile(null);
                setPatientFileError(
                    error instanceof Error ? error.message : "Não foi possível carregar os dados do paciente.",
                );
            } finally {
                if (!cancelled) {
                    setIsPatientFileLoading(false);
                }
            }
        };

        void loadPatientFile();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [normalizedSelectedPatientCpf, selectedAppointmentId]);

    useEffect(() => {
        if (!selectedAppointment) {
            return;
        }
        if (!patientFile?.presenceConfirmedAt) {
            return;
        }
        setAppointmentsState((current) =>
            current.map((appointment) =>
                appointment.id === selectedAppointment.id
                    ? {
                          ...appointment,
                          presenceConfirmedAt: appointment.presenceConfirmedAt ?? patientFile.presenceConfirmedAt ?? null,
                      }
                    : appointment,
            ),
        );
        setSelectedAppointment((current) =>
            current
                ? {
                      ...current,
                      presenceConfirmedAt: current.presenceConfirmedAt ?? patientFile.presenceConfirmedAt ?? null,
                  }
                : current,
        );
    }, [patientFile?.presenceConfirmedAt, selectedAppointment]);

    return (
        <section className="space-y-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold text-gray-900">Consultas</h1>
                <p className="text-sm text-gray-500">
                    Visualize suas consultas por período, acompanhe alertas clínicos e acesse os detalhes do paciente com segurança.
                </p>
            </header>

            {fetchError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {fetchError}
                </div>
            )}

            <section className="rounded-2xl border border-[#5179EF]/15 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#5179EF]">Chegadas confirmadas</p>
                        <h2 className="text-xl font-semibold text-gray-900">Pacientes aguardando atendimento</h2>
                        <p className="text-sm text-gray-500">Atualizado após a secretaria finalizar o check-in.</p>
                    </div>
                    {confirmedAppointments.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#5179EF]/10 px-4 py-1 text-xs font-semibold text-[#1d3a8c]">
                            {confirmedAppointments.length} aguardando
                        </span>
                    ) : null}
                </div>

                {presenceError ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                        {presenceError}
                    </div>
                ) : null}

                {isPresenceLoading && confirmedAppointments.length === 0 ? (
                    <p className="mt-6 text-sm text-gray-500">Carregando pacientes aguardando...</p>
                ) : confirmedAppointments.length === 0 ? (
                    <p className="mt-6 text-sm text-gray-500">Nenhum paciente com presença confirmada no momento.</p>
                ) : (
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {confirmedAppointments.map((appointment) => {
                            const arrivalIso = appointmentArrivalTime(appointment);
                            const arrivalDate = arrivalIso ? formatDate(arrivalIso) : "—";
                            const arrivalTime = arrivalIso ? formatTime(arrivalIso) : "—";
                            const maskedCpf = maskCpf(appointment.patient.cpf);

                            return (
                                <article
                                    key={`presence-${appointment.id}`}
                                    className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-[#F7F9FF] p-5 shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5179EF]/10 text-sm font-semibold text-[#5179EF]">
                                            {appointment.patient.avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={appointment.patient.avatarUrl}
                                                    alt={`Foto de ${appointment.patient.name}`}
                                                    className="h-12 w-12 rounded-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <span>{getInitials(appointment.patient.name)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-base font-semibold text-gray-900">{appointment.patient.name}</p>
                                            <p className="text-xs text-gray-500">{maskedCpf}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Horário de chegada</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {arrivalDate} às {arrivalTime}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-[#5179EF]/10 px-3 py-1 text-xs font-semibold text-[#1d3a8c]">
                                            Presença confirmada
                                        </span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                                        <span>Status: {STATUS_LABEL[appointment.status]}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleStartConsultation(appointment)}
                                            className="inline-flex items-center justify-center rounded-full bg-[#5179EF] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#3f63d6]"
                                        >
                                            Iniciar consulta
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {SEGMENT_OPTIONS.map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleSegmentChange(key)}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                    segment === key
                                        ? "bg-[#5179EF] text-white shadow"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                {SEGMENT_LABEL[key]}
                            </button>
                        ))}
                    </div>
                    <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                        <label className="flex flex-1 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 shadow-sm focus-within:border-[#5179EF] focus-within:ring-2 focus-within:ring-[#5179EF]/20">
                            <span className="sr-only">Buscar paciente</span>
                            <Stethoscope className="h-4 w-4 text-gray-400" aria-hidden="true" />
                            <input
                                value={search}
                                onChange={(event) => handleSearchChange(event.target.value)}
                                placeholder="Buscar paciente"
                                className="w-full border-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                                type="search"
                                aria-label="Buscar paciente"
                            />
                        </label>

                        <div className="flex flex-1 gap-2 lg:flex-none">
                            <label className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500 focus-within:border-[#5179EF] focus-within:bg-white">
                                <Calendar className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(event) => handleDateChange(event.target.value, "start")}
                                    className="flex-1 border-none bg-transparent text-xs text-gray-700 focus:outline-none"
                                    aria-label="Data inicial"
                                />
                            </label>
                            <label className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500 focus-within:border-[#5179EF] focus-within:bg-white">
                                <Calendar className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(event) => handleDateChange(event.target.value, "end")}
                                    className="flex-1 border-none bg-transparent text-xs text-gray-700 focus:outline-none"
                                    aria-label="Data final"
                                />
                            </label>
                        </div>

                        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500 focus-within:border-[#5179EF] focus-within:bg-white">
                            <FileText className="h-4 w-4 text-gray-400" aria-hidden="true" />
                            <select
                                value={sortBy}
                                onChange={(event) => handleSortChange(event.target.value as SortKey)}
                                className="border-none bg-transparent text-xs font-medium text-gray-700 focus:outline-none"
                                aria-label="Ordenar por"
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.key} value={option.key}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3">Data/Hora</th>
                                <th className="px-4 py-3">Paciente</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Motivo</th>
                                <th className="px-4 py-3">Alertas</th>
                                <th className="px-4 py-3 text-right">Atendimento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white text-sm text-gray-700">
                            {showSkeleton && (
                                [...Array(5)].map((_, index) => (
                                    <tr key={`skeleton-${index}`} className="animate-pulse">
                                        <td className="px-4 py-4">
                                            <div className="h-4 w-24 rounded-full bg-gray-100" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gray-100" />
                                                <div className="flex-1">
                                                    <div className="h-4 w-32 rounded-full bg-gray-100" />
                                                    <div className="mt-2 h-3 w-20 rounded-full bg-gray-100" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-5 w-20 rounded-full bg-gray-100" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-4 w-40 rounded-full bg-gray-100" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex gap-2">
                                                <div className="h-8 w-8 rounded-full bg-gray-100" />
                                                <div className="h-8 w-8 rounded-full bg-gray-100" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="ml-auto h-9 w-24 rounded-full bg-gray-100" />
                                        </td>
                                    </tr>
                                ))
                            )}

                            {!showSkeleton && paginatedAppointments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                                <Calendar className="h-8 w-8 text-gray-400" aria-hidden="true" />
                                            </div>
                                            <p className="text-base font-semibold text-gray-700">Nenhuma consulta neste período</p>
                                            <p className="text-sm text-gray-500">
                                                Ajuste os filtros ou tente outro critério de busca para localizar consultas específicas.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!showSkeleton && paginatedAppointments.map((appointment) => {
                                const { scheduledAt, status, reason, alerts, patient, id } = appointment;
                                const date = formatDate(scheduledAt);
                                const time = formatTime(scheduledAt);
                                const isCriticalSoon = isWithinNextHour(scheduledAt);
                                const age = getAge(patient.birthDate);

                                return (
                                    <tr key={id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col text-sm font-semibold text-gray-900">
                                                    <span>{date}</span>
                                                    <span className="text-xs font-medium text-gray-500">{time}</span>
                                                </div>
                                                {isCriticalSoon && (
                                                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-600">
                                                        Agora
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                                                    {patient.avatarUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={patient.avatarUrl}
                                                            alt={`Foto de ${patient.name}`}
                                                            className="h-10 w-10 rounded-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <span>{getInitials(patient.name)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{patient.name}</p>
                                                    <p className="text-xs text-gray-500">{age != null ? `${age} anos` : "—"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[status]}`}>
                                                {STATUS_LABEL[status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="max-w-xs truncate" title={reason ?? "—"}>
                                                {reason ? reason.slice(0, 60) + (reason.length > 60 ? "…" : "") : "—"}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {alerts.length === 0 && <span className="text-xs text-gray-400">—</span>}
                                                {alerts.slice(0, 3).map((alert) => {
                                                    const Icon = ALERT_ICON[alert.type];
                                                    return (
                                                        <button
                                                            key={alert.id}
                                                            type="button"
                                                            className={`flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200 ${ALERT_COLORS[alert.type]}`}
                                                            title={`${alert.label} • ${SEVERITY_LABEL[alert.severity]}`}
                                                            aria-label={`${alert.type} - ${alert.label}`}
                                                        >
                                                            <Icon className="h-4 w-4" aria-hidden="true" />
                                                        </button>
                                                    );
                                                })}
                                                {alerts.length > 3 && (
                                                    <span className="text-xs text-gray-500">+{alerts.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenAppointment(appointment, { source: "list" })}
                                                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#5179EF] ring-1 ring-[#5179EF] transition hover:bg-[#5179EF] hover:text-white"
                                            >
                                                Visualizar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>
                        {filteredAppointments.length} consulta{filteredAppointments.length === 1 ? "" : "s"} encontrada{filteredAppointments.length === 1 ? "" : "s"}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                            disabled={currentPage === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Página anterior"
                        >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                            disabled={currentPage === totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Próxima página"
                        >
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>

            {selectedAppointment && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-10"
                >
                    <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
                            aria-label="Fechar detalhes"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <header className="sticky top-4 z-30 mb-6 rounded-3xl border border-gray-100 bg-white/95 p-6 shadow-lg shadow-black/5 backdrop-blur">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#5179EF]/10 text-lg font-semibold text-[#5179EF]">
                                            {selectedAppointment.patient.avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={selectedAppointment.patient.avatarUrl}
                                                    alt={`Foto de ${patientDisplayName}`}
                                                    className="h-14 w-14 rounded-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <span>{getInitials(patientDisplayName || selectedAppointment.patient.name)}</span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-[#5179EF]">Consulta atual</p>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h2 className="text-2xl font-semibold text-gray-900">{patientDisplayName}</h2>
                                                <span className="text-sm text-gray-500">
                                                    {selectedPatientAge != null ? `${selectedPatientAge} anos` : "Idade não informada"}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="h-4 w-4 text-[#5179EF]" aria-hidden="true" />
                                                    {formatDate(selectedAppointment.scheduledAt)} às {formatTime(selectedAppointment.scheduledAt)}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[selectedAppointment.status]}`}
                                                >
                                                    {STATUS_LABEL[selectedAppointment.status]}
                                                </span>
                                                {isRecordFinalized && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                        <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                                        Registro finalizado
                                                    </span>
                                                )}
                                            </div>
                                            <dl className="mt-3 grid gap-3 text-xs text-gray-600 sm:grid-cols-3">
                                                <div>
                                                    <dt className="font-semibold uppercase tracking-wide text-gray-400">CPF</dt>
                                                    <dd className="text-sm font-semibold text-gray-900">{patientCpfDisplay}</dd>
                                                </div>
                                                <div>
                                                    <dt className="font-semibold uppercase tracking-wide text-gray-400">Contato</dt>
                                                    <dd className="text-sm font-semibold text-gray-900">{patientContactDisplay}</dd>
                                                </div>
                                                <div>
                                                    <dt className="font-semibold uppercase tracking-wide text-gray-400">Convênio</dt>
                                                    <dd className="text-sm font-semibold text-gray-900">{patientInsuranceDisplay}</dd>
                                                </div>
                                            </dl>
                                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                Chegada registrada:{" "}
                                                <span className="text-sm font-semibold text-gray-900">{patientArrivalLabel}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {isPatientFileLoading ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-[#5179EF]/30 bg-[#5179EF]/10 px-3 py-1 text-xs font-semibold text-[#1d3a8c]">
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                                        Buscando dados do paciente…
                                                    </span>
                                                ) : null}
                                                {patientFileError ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                                                        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                                        {patientFileError}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 text-sm text-gray-600 lg:items-end">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Alertas</span>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedAppointment.alerts.length === 0 ? (
                                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-400">Nenhum alerta crítico</span>
                                            ) : (
                                                selectedAppointment.alerts.map((alert) => {
                                                    const Icon = ALERT_ICON[alert.type];
                                                    return (
                                                        <span
                                                            key={alert.id}
                                                            className={`inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold shadow-sm ${ALERT_COLORS[alert.type]}`}
                                                            title={`${alert.label} • ${SEVERITY_LABEL[alert.severity]}`}
                                                        >
                                                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                                            {alert.label}
                                                        </span>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <nav className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Seções da consulta">
                                        {CONSULTATION_TABS.map((tab) => {
                                            const isActive = activeTab === tab.key;
                                            return (
                                                <button
                                                    key={tab.key}
                                                    id={`tab-btn-${tab.key}`}
                                                    type="button"
                                                    onClick={() => handleTabChange(tab.key)}
                                                    className={`group flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5179EF]/40 ${
                                                        isActive
                                                            ? "border-[#5179EF] bg-[#5179EF] text-white shadow-sm"
                                                            : "border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                                    role="tab"
                                                    aria-selected={isActive}
                                                    aria-controls={`tab-panel-${tab.key}`}
                                                    tabIndex={isActive ? 0 : -1}
                                                >
                                                    <span className="leading-tight">{tab.label}</span>
                                                    {tab.helper ? (
                                                        <span className={`text-xs font-medium ${isActive ? "text-white/80" : "text-gray-400"}`}>
                                                            {tab.helper}
                                                        </span>
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-600">
                                        {isRecordFinalized ? (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                                                <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                                Atendimento concluído
                                            </span>
                                        ) : isSavingRecord ? (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-[#5179EF]/30 bg-[#5179EF]/10 px-3 py-1 text-[#5179EF]">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                                Salvando rascunho…
                                            </span>
                                        ) : hasPendingChanges ? (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                                                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                                Alterações não salvas
                                            </span>
                                        ) : relativeSavedLabel ? (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-gray-600">
                                                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                                Rascunho salvo {relativeSavedLabel}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                {feedbackMessage ? (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700" role="status" aria-live="polite">
                                        {feedbackMessage}
                                    </div>
                                ) : null}
                                {recordError ? (
                                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700" role="alert">
                                        {recordError}
                                    </div>
                                ) : null}
                            </div>
                        </header>

                        <div className="space-y-6 pb-4">
                            {activeTab === "resumo" && (
                                <div
                                    role="tabpanel"
                                    id="tab-panel-resumo"
                                    aria-labelledby="tab-btn-resumo"
                                    tabIndex={0}
                                    className="space-y-6"
                                >
                                    {selectedAppointment.alerts.length > 0 && (
                                        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                                            <h3 className="text-sm font-semibold text-amber-700">Alertas críticos</h3>
                                            <ul className="mt-3 space-y-3">
                                                {selectedAppointment.alerts.map((alert) => {
                                                    const Icon = ALERT_ICON[alert.type];
                                                    return (
                                                        <li
                                                            key={alert.id}
                                                            className="flex items-start gap-3 rounded-xl bg-white/60 p-4"
                                                        >
                                                            <span className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${ALERT_COLORS[alert.type]} bg-white shadow-inner`}>
                                                                <Icon className="h-4 w-4" aria-hidden="true" />
                                                            </span>
                                                            <div className="flex-1 text-sm text-gray-700">
                                                                <p className="font-semibold text-gray-900">
                                                                    {alert.label} · {SEVERITY_LABEL[alert.severity]}
                                                                </p>
                                                                <p className="mt-1 text-sm text-gray-600">{alert.description}</p>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </section>
                                    )}

                                    <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                                        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Identificação</h3>
                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700">
                                                    {selectedAppointment.patient.avatarUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={selectedAppointment.patient.avatarUrl}
                                                            alt={`Foto de ${patientDisplayName}`}
                                                            className="h-16 w-16 rounded-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <span>{getInitials(patientDisplayName || selectedAppointment.patient.name)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-lg font-semibold text-gray-900">{patientDisplayName}</p>
                                                    <p className="text-sm text-gray-500">
                                                        ID do paciente: <span className="font-mono text-gray-700">{selectedAppointment.patient.id}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid gap-2 text-sm text-gray-600">
                                                <p>
                                                    <strong className="text-gray-700">Idade:</strong> {selectedPatientAge ?? "—"}
                                                    {patientBirthDateDisplay && (
                                                        <span className="text-xs text-gray-400">
                                                            {" "}
                                                            · {formatDate(patientBirthDateDisplay)}
                                                        </span>
                                                    )}
                                                </p>
                                                <p>
                                                    <strong className="text-gray-700">Sexo:</strong> {patientSexDisplay}
                                                </p>
                                                <p>
                                                    <strong className="text-gray-700">E-mail:</strong> {patientEmailDisplay}
                                                </p>
                                                <p>
                                                    <strong className="text-gray-700">Endereço:</strong> {patientAddressDisplay}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="rounded-2xl border border-gray-100 bg-white p-6">
                                        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Consulta</h3>
                                        <dl className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-600">
                                            <div>
                                                <dt className="text-gray-500">Motivo</dt>
                                                <dd className="font-semibold text-gray-900">{selectedAppointment.reason ?? "—"}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-gray-500">Tempo de sintomas</dt>
                                                <dd className="font-semibold text-gray-900">{selectedAppointment.symptomDuration ?? "—"}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-gray-500">Data/Hora</dt>
                                                <dd className="font-semibold text-gray-900">
                                                    {formatDate(selectedAppointment.scheduledAt)} · {formatTime(selectedAppointment.scheduledAt)}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-gray-500">Status</dt>
                                                <dd>
                                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[selectedAppointment.status]}`}>
                                                        {STATUS_LABEL[selectedAppointment.status]}
                                                    </span>
                                                </dd>
                                            </div>
                                        </dl>
                                        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                                            <p className="text-gray-500">Observações pré-consulta</p>
                                            <p className="mt-2 whitespace-pre-wrap text-gray-700">
                                                {selectedAppointment.preConsultNotes ?? "—"}
                                            </p>
                                        </div>
                                    </section>

                                    <section className="rounded-2xl border border-gray-100 bg-white p-6">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                                            <Pill className="h-4 w-4 text-indigo-400" aria-hidden="true" /> Medicação em uso
                                        </h3>
                                        {selectedAppointment.medications.length === 0 ? (
                                            <p className="mt-3 text-sm text-gray-500">Nenhuma medicação registrada.</p>
                                        ) : (
                                            <div className="mt-4 space-y-3">
                                                {selectedAppointment.medications.map((medication) => (
                                                    <div
                                                        key={medication.id}
                                                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <p className="text-base font-semibold text-gray-900">{medication.name}</p>
                                                            <span className={`text-xs font-semibold ${ADHERENCE_COLOR[medication.adherence]}`}>
                                                                Adesão {ADHERENCE_LABEL[medication.adherence]}
                                                            </span>
                                                        </div>
                                                        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                                                            <div>
                                                                <dt className="text-xs uppercase tracking-wide text-gray-400">Dose / Forma</dt>
                                                                <dd className="font-medium text-gray-700">{medication.dose} · {medication.form}</dd>
                                                            </div>
                                                            <div>
                                                                <dt className="text-xs uppercase tracking-wide text-gray-400">Horários</dt>
                                                                <dd className="font-medium text-gray-700">{medication.schedule}</dd>
                                                            </div>
                                                            <div>
                                                                <dt className="text-xs uppercase tracking-wide text-gray-400">Última atualização</dt>
                                                                <dd className="font-medium text-gray-700">{formatDate(medication.updatedAt)}</dd>
                                                            </div>
                                                            <div>
                                                                <dt className="text-xs uppercase tracking-wide text-gray-400">Observações</dt>
                                                                <dd className="font-medium text-gray-700">{medication.notes ?? "—"}</dd>
                                                            </div>
                                                        </dl>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    <section className="rounded-2xl border border-gray-100 bg-white p-6">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                                            <FileText className="h-4 w-4 text-indigo-400" aria-hidden="true" /> Resultados anormais recentes
                                        </h3>
                                        {selectedAppointment.exams.length === 0 ? (
                                            <p className="mt-3 text-sm text-gray-500">Nenhum resultado anormal encontrado.</p>
                                        ) : (
                                            <div className="mt-4 space-y-3">
                                                {selectedAppointment.exams.map((exam) => (
                                                    <div
                                                        key={exam.id}
                                                        className={`rounded-2xl border p-4 text-sm ${exam.abnormal ? "border-rose-200 bg-rose-50" : "border-gray-100 bg-gray-50"}`}
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <p className="text-base font-semibold text-gray-900">
                                                                {exam.exam} · {exam.kind === "laboratorio" ? "Laboratório" : "Imagem"}
                                                            </p>
                                                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${exam.abnormal ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
                                                                {exam.abnormal ? "Anormal" : "Dentro do esperado"}
                                                            </span>
                                                        </div>
                                                        <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-gray-600">
                                                            <div>
                                                                <dt className="text-xs uppercase tracking-wide text-gray-400">Data</dt>
                                                                <dd className="font-medium text-gray-700">{formatDate(exam.date)}</dd>
                                                            </div>
                                                            <div>
                                                                <dt className="text-xs uppercase tracking-wide text-gray-400">Valor / Referência</dt>
                                                                <dd className="font-medium text-gray-700">
                                                                    {exam.value ?? "—"}
                                                                    {exam.reference ? <span className="text-xs text-gray-400"> · Ref: {exam.reference}</span> : null}
                                                                </dd>
                                                            </div>
                                                            <div className="sm:col-span-2">
                                                                <dt className="text-xs uppercase tracking-wide text-gray-400">Achados relevantes</dt>
                                                                <dd className="font-medium text-gray-700">{exam.highlight ?? "—"}</dd>
                                                            </div>
                                                        </dl>
                                                        {exam.reportUrl && (
                                                            <a
                                                                href={exam.reportUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="mt-3 inline-flex items-center text-xs font-semibold text-[#5179EF] hover:underline"
                                                            >
                                                                Ver laudo completo
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    <section className="rounded-2xl border border-gray-100 bg-white p-6">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                                            <Syringe className="h-4 w-4 text-indigo-400" aria-hidden="true" /> Vacinas pendentes/relevantes
                                        </h3>
                                        {selectedAppointment.vaccines.length === 0 ? (
                                            <p className="mt-3 text-sm text-gray-500">Nenhuma recomendação de vacina no momento.</p>
                                        ) : (
                                            <div className="mt-4 space-y-3">
                                                {selectedAppointment.vaccines.map((vaccine) => (
                                                    <div key={vaccine.id} className="flex flex-wrap items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{vaccine.vaccine}</p>
                                                            <p className="text-xs text-gray-500">{vaccine.category}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                                vaccine.status === "atualizada"
                                                                    ? "bg-emerald-100 text-emerald-600"
                                                                    : "bg-amber-100 text-amber-600"
                                                            }`}>
                                                                {vaccine.status === "atualizada" ? "Atualizada" : "Pendente"}
                                                            </span>
                                                            <p className="mt-1 text-xs text-gray-500">{vaccine.date ? formatDate(vaccine.date) : "—"}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                </div>
                            )}

                            {activeTab === "consulta" && (
                                <div
                                    role="tabpanel"
                                    id="tab-panel-consulta"
                                    aria-labelledby="tab-btn-consulta"
                                    tabIndex={0}
                                    className="space-y-6"
                                >
                                    {recordGuardMessage && (
                                        <div
                                            className={`rounded-2xl border px-4 py-3 text-sm ${
                                                recordGuardMessage.tone === "danger"
                                                    ? "border-rose-200 bg-rose-50 text-rose-700"
                                                    : recordGuardMessage.tone === "warning"
                                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                                        : "border-slate-200 bg-slate-50 text-slate-700"
                                            }`}
                                        >
                                            {recordGuardMessage.text}
                                        </div>
                                    )}

                                    <form
                                        className="space-y-6"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            void handleManualSave();
                                        }}
                                    >
                                        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-base font-semibold text-gray-900">Motivo da consulta</h3>
                                                    <p className="mt-1 text-sm text-gray-500">Queixa principal e história sucinta…</p>
                                                </div>
                                                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600">
                                                    Obrigatório
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-3">
                                                <div>
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tempo de sintomas</span>
                                                    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Sugestões de tempo de sintomas">
                                                        {SYMPTOM_DURATION_CHIPS.map((chip) => {
                                                            const isSelected = recordDraft?.symptomDuration === chip;
                                                            return (
                                                                <button
                                                                    key={chip}
                                                                    type="button"
                                                                    onClick={() => updateField("symptomDuration", chip)}
                                                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                                                        isSelected
                                                                            ? "border-[#5179EF] bg-[#5179EF]/10 text-[#1d3a8c]"
                                                                            : "border-gray-200 bg-white text-gray-600 hover:border-[#5179EF]/60 hover:text-[#1d3a8c]"
                                                                    }`}
                                                                    disabled={!canEditConsultationRecord || !recordReady}
                                                                    aria-pressed={isSelected}
                                                                    aria-label={`Tempo de sintomas ${chip}`}
                                                                >
                                                                    {chip}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={recordDraft?.symptomDuration ?? ""}
                                                        onChange={(event) => updateField("symptomDuration", event.target.value)}
                                                        onBlur={() => void saveRecordDraft("blur")}
                                                        placeholder="Descreva a duração (opcional)"
                                                        className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#5179EF] focus:outline-none focus:ring-2 focus:ring-[#5179EF]/20 disabled:bg-gray-100 disabled:text-gray-400"
                                                        disabled={!canEditConsultationRecord || !recordReady}
                                                        aria-label="Tempo de sintomas"
                                                    />
                                                </div>
                                                <div>
                                                    <textarea
                                                        value={recordDraft?.reason ?? ""}
                                                        onChange={(event) => updateField("reason", event.target.value)}
                                                        onBlur={() => void saveRecordDraft("blur")}
                                                        placeholder="Queixa principal e história sucinta…"
                                                        className="min-h-[140px] w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#5179EF] focus:outline-none focus:ring-2 focus:ring-[#5179EF]/20 disabled:bg-gray-100 disabled:text-gray-400"
                                                        required
                                                        aria-required="true"
                                                        aria-invalid={Boolean(recordError && (recordDraft?.reason ?? "").trim().length === 0)}
                                                        disabled={!canEditConsultationRecord || !recordReady}
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-base font-semibold text-gray-900">Anamnese dirigida</h3>
                                                    <p className="mt-1 text-sm text-gray-500">Registre perguntas-chave e achados relevantes por sistema.</p>
                                                </div>
                                                <span className="text-xs font-medium text-gray-400">Autosave a cada 5s</span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {ANAMNESIS_TEMPLATES.map((template) => (
                                                    <button
                                                        key={template}
                                                        type="button"
                                                        onClick={() => handleInsertSnippet("anamnesis", template)}
                                                        className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-[#5179EF]/60 hover:text-[#1d3a8c]"
                                                        disabled={!canEditConsultationRecord || !recordReady}
                                                        aria-label={`Inserir template ${template}`}
                                                    >
                                                        {template}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={recordDraft?.anamnesis ?? ""}
                                                onChange={(event) => updateField("anamnesis", event.target.value)}
                                                onBlur={() => void saveRecordDraft("blur")}
                                                placeholder="Use um template ou descreva a anamnese dirigida…"
                                                className="mt-4 min-h-[180px] w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#5179EF] focus:outline-none focus:ring-2 focus:ring-[#5179EF]/20 disabled:bg-gray-100 disabled:text-gray-400"
                                                disabled={!canEditConsultationRecord || !recordReady}
                                            />
                                        </section>

                                        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-base font-semibold text-gray-900">Exame físico</h3>
                                                    <p className="mt-1 text-sm text-gray-500">Combine sinais vitais sugeridos com descrição livre.</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {PHYSICAL_EXAM_SNIPPETS.map((snippet) => (
                                                    <button
                                                        key={snippet}
                                                        type="button"
                                                        onClick={() => handleInsertSnippet("physicalExam", snippet)}
                                                        className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-[#5179EF]/60 hover:text-[#1d3a8c]"
                                                        disabled={!canEditConsultationRecord || !recordReady}
                                                        aria-label={`Inserir marcador ${snippet.trim()}`}
                                                    >
                                                        {snippet}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={recordDraft?.physicalExam ?? ""}
                                                onChange={(event) => updateField("physicalExam", event.target.value)}
                                                onBlur={() => void saveRecordDraft("blur")}
                                                placeholder="PA, FC, SpO₂, IMC, sinais vitais e achados relevantes…"
                                                className="mt-4 min-h-[160px] w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#5179EF] focus:outline-none focus:ring-2 focus:ring-[#5179EF]/20 disabled:bg-gray-100 disabled:text-gray-400"
                                                disabled={!canEditConsultationRecord || !recordReady}
                                            />
                                        </section>

                                        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-base font-semibold text-gray-900">Conduta / Plano</h3>
                                                    <p className="mt-1 text-sm text-gray-500">Defina orientações, pedidos e programação de retorno.</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {PLAN_SNIPPETS.map((snippet) => (
                                                    <button
                                                        key={snippet}
                                                        type="button"
                                                        onClick={() => handleInsertSnippet("plan", snippet)}
                                                        className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-[#5179EF]/60 hover:text-[#1d3a8c]"
                                                        disabled={!canEditConsultationRecord || !recordReady}
                                                        aria-label={`Inserir orientação: ${snippet}`}
                                                    >
                                                        {snippet}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={recordDraft?.plan ?? ""}
                                                onChange={(event) => updateField("plan", event.target.value)}
                                                onBlur={() => void saveRecordDraft("blur")}
                                                placeholder="Orientações, pedidos e plano terapêutico…"
                                                className="mt-4 min-h-[140px] w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#5179EF] focus:outline-none focus:ring-2 focus:ring-[#5179EF]/20 disabled:bg-gray-100 disabled:text-gray-400"
                                                disabled={!canEditConsultationRecord || !recordReady}
                                            />
                                        </section>

                                        <div
                                            className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur"
                                            role="toolbar"
                                            aria-label="Ações do prontuário"
                                        >
                                            <button
                                                type="submit"
                                                className="inline-flex items-center justify-center rounded-full bg-[#5179EF] px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#4166d6] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                                                disabled={!canEditConsultationRecord || !recordReady || isSavingRecord}
                                                aria-label={saveButtonLabel}
                                            >
                                                {saveButtonLabel}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleFinalize}
                                                className="inline-flex items-center justify-center rounded-full border border-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-600 shadow-sm transition hover:bg-emerald-500 hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                                                disabled={!canEditConsultationRecord || !recordReady || isSavingRecord}
                                                aria-label={finalizeButtonLabel}
                                            >
                                                {finalizeButtonLabel}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelChanges}
                                                className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                                                disabled={!canEditConsultationRecord || !recordReady}
                                                aria-label="Cancelar alterações"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500"
                                                disabled
                                                title="Disponível na próxima entrega"
                                                aria-label="Imprimir ou exportar (em breve)"
                                            >
                                                Imprimir/Exportar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === "historico" && (
                                <div
                                    role="tabpanel"
                                    id="tab-panel-historico"
                                    aria-labelledby="tab-btn-historico"
                                    tabIndex={0}
                                    className="space-y-6"
                                >
                                    <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
                                        <History className="mb-3 h-6 w-6 text-[#5179EF]" aria-hidden="true" />
                                        <p className="font-semibold text-gray-700">Linha do tempo clínica em breve</p>
                                        <p className="mt-1 max-w-sm text-xs text-gray-500">
                                            Acompanhe registros anteriores com busca por palavra e cartões colapsáveis na próxima entrega.
                                        </p>
                                    </section>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
