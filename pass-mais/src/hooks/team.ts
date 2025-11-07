"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiFetch, getAccessToken, jsonGet, jsonPost, BASE_URL } from "@/lib/api";
import { decodeAccessTokenPayload } from "@/lib/token";

export type TeamMember = {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    joinedAt: string;
};

export type JoinCode = {
    id: string;
    code: string;
    expiresAt: string | null;
    usesLeft: number;
    status:
        | "ativo"
        | "expirado"
        | "sem-usos"
        | "revogado"
        | "bloqueado"
        | "ACTIVE"
        | "EXPIRED"
        | "EXHAUSTED"
        | "REVOKED"
        | "BLOCKED"
        | string;
    secretaryName?: string;
    secretaryEmail?: string;
};

export type DoctorTeamResponse = {
    members: TeamMember[];
    joinCodes: JoinCode[];
};

type SecretariesApiEntry = {
    id?: string;
    name?: string;
    fullName?: string;
    email?: string;
    corporateEmail?: string;
    secretaryEmail?: string;
    linkedAt?: string;
    joinedAt?: string;
    createdAt?: string;
    phone?: string | null;
};

function ensureIsoDate(value: unknown): string {
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }
    try {
        return new Date().toISOString();
    } catch {
        return new Date(Date.now()).toISOString();
    }
}

function normalizeSecretariesPayload(payload: unknown): SecretariesApiEntry[] {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
        const source = payload as Record<string, unknown>;
        const data = source.data;
        if (Array.isArray(data)) return data;
        const content = source.content;
        if (Array.isArray(content)) return content;
        const items = source.items;
        if (Array.isArray(items)) return items;
        const results = source.results;
        if (Array.isArray(results)) return results;
    }
    return [];
}

function normalizeSecretaries(secretaries: unknown): TeamMember[] {
    const entries = normalizeSecretariesPayload(secretaries);
    const normalized: TeamMember[] = [];

    for (const entry of entries) {
        if (!entry || typeof entry !== "object") continue;
        const source = entry as SecretariesApiEntry;

        const id =
            (typeof source.id === "string" && source.id.trim()) ||
            null;
        const fullName =
            (typeof source.name === "string" && source.name.trim()) ||
            (typeof source.fullName === "string" && source.fullName.trim()) ||
            null;
        const email =
            (typeof source.email === "string" && source.email.trim()) ||
            (typeof source.corporateEmail === "string" && source.corporateEmail.trim()) ||
            (typeof source.secretaryEmail === "string" && source.secretaryEmail.trim()) ||
            null;

        if (!id || !fullName || !email) continue;

        const phone =
            typeof source.phone === "string" && source.phone.trim().length > 0
                ? source.phone.trim()
                : null;
        const joinedAt =
            ensureIsoDate(source.linkedAt ?? source.joinedAt ?? source.createdAt);

        normalized.push({
            id,
            fullName,
            email,
            phone,
            joinedAt,
        });
    }

    return normalized;
}

function normalizeJoinCodes(payload: unknown): JoinCode[] {
    if (!payload || typeof payload !== "object") return [];
    const source = payload as Record<string, unknown>;
    const joinCodesRaw = source.joinCodes;
    if (!Array.isArray(joinCodesRaw)) return [];

    const normalized: JoinCode[] = [];
    for (const entry of joinCodesRaw) {
        if (!entry || typeof entry !== "object") continue;
        const candidate = entry as Record<string, unknown>;

        const id = typeof candidate.id === "string" ? candidate.id : null;
        const code = typeof candidate.code === "string" ? candidate.code : null;
        if (!id || !code) continue;

        const status = typeof candidate.status === "string" ? candidate.status : "ativo";
        const expiresAt =
            typeof candidate.expiresAt === "string" || candidate.expiresAt === null
                ? (candidate.expiresAt as string | null)
                : null;
        const usesLeft =
            typeof candidate.usesLeft === "number"
                ? candidate.usesLeft
                : typeof candidate.usesRemaining === "number"
                  ? candidate.usesRemaining
                  : 0;
        const secretaryName =
            typeof candidate.secretaryName === "string"
                ? candidate.secretaryName
                : undefined;
        const secretaryEmail =
            typeof candidate.secretaryEmail === "string"
                ? candidate.secretaryEmail
                : undefined;

        normalized.push({
            id,
            code,
            expiresAt,
            usesLeft,
            status,
            secretaryName,
            secretaryEmail,
        });
    }

    return normalized;
}

type MutationOptions<T> = {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    onSettled?: () => void;
};

type RemoveMemberPayload = {
    doctorId: string;
    secretaryId: string;
};

type RemoveMemberResult = {
    message?: string;
};

type UseDoctorTeamReturn = {
    data: DoctorTeamResponse | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    isRefetching: boolean;
};

export function useDoctorTeam(): UseDoctorTeamReturn {
    const [data, setData] = useState<DoctorTeamResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadJoinCodes = useCallback(async (): Promise<JoinCode[]> => {
        try {
            const response = await jsonGet<unknown>("/api/doctor/team");
            return normalizeJoinCodes(response);
        } catch {
            return [];
        }
    }, []);

    const loadSecretaries = useCallback(async (): Promise<TeamMember[]> => {
        const response = await jsonGet<unknown>("/api/teams/secretaries");
        const members = normalizeSecretaries(response);
        if (members.length === 0) {
            return [];
        }
        return members;
    }, []);

    const fetchTeam = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [members, joinCodes] = await Promise.all([loadSecretaries(), loadJoinCodes()]);
            setData({ members, joinCodes });
        } catch (err) {
            setError(err as Error);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [loadJoinCodes, loadSecretaries]);

    const refetch = useCallback(async () => {
        setIsRefetching(true);
        setError(null);
        try {
            const [members, joinCodes] = await Promise.all([loadSecretaries(), loadJoinCodes()]);
            setData({ members, joinCodes });
        } catch (err) {
            setError(err as Error);
            setData(null);
        } finally {
            setIsRefetching(false);
        }
    }, [loadJoinCodes, loadSecretaries]);

    useEffect(() => {
        void fetchTeam();
    }, [fetchTeam]);

    return { data, isLoading, error, refetch, isRefetching };
}

type GenerateJoinCodeResponse = {
    inviteId?: string;
    code: string;
    expiresAt: string | null;
    status: string;
    usesRemaining: number;
    secretaryFullName?: string;
    secretaryCorporateEmail?: string;
};

type GenerateJoinCodePayload = {
    fullName: string;
    email: string;
    maxUses?: number;
    expiresAt?: string;
};

export function useGenerateJoinCode(options: MutationOptions<GenerateJoinCodeResponse> = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutateAsync = useCallback(
        async (payload: GenerateJoinCodePayload) => {
            setIsPending(true);
            setError(null);
            try {
                if (!payload?.fullName?.trim() || !payload?.email?.trim()) {
                    const validationError = new Error("Informe o nome completo e o e-mail corporativo da secretária.");
                    setError(validationError);
                    options.onError?.(validationError);
                    throw validationError;
                }
                const uses = typeof payload.maxUses === "number" && Number.isFinite(payload.maxUses) ? payload.maxUses : 1;
                const expiresAt =
                    payload.expiresAt ??
                    new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(); // fallback to 3h ahead if caller omits

                const response = await jsonPost<GenerateJoinCodeResponse>(
                    "/api/teams/invite",
                    {
                        maxUses: uses,
                        expiresAt,
                        secretaryFullName: payload.fullName.trim(),
                        secretaryCorporateEmail: payload.email.trim(),
                    },
                    {
                        rawUrl: `${BASE_URL}/api/teams/invite`,
                    },
                );
                const normalizedResponse: GenerateJoinCodeResponse = {
                    ...response,
                    secretaryFullName: response.secretaryFullName ?? payload.fullName.trim(),
                    secretaryCorporateEmail: response.secretaryCorporateEmail ?? payload.email.trim(),
                };
                options.onSuccess?.(normalizedResponse);
                return normalizedResponse;
            } catch (err) {
                const errorInstance = err as Error;
                setError(errorInstance);
                options.onError?.(errorInstance);
                throw errorInstance;
            } finally {
                setIsPending(false);
                options.onSettled?.();
            }
        },
        [options],
    );

    return { mutateAsync, isPending, error };
}

export function useRevokeJoinCode(options: MutationOptions<void> = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutateAsync = useCallback(
        async (id: string) => {
            setIsPending(true);
            setError(null);
            try {
                const response = await apiFetch(`/api/doctor/team/join-codes/${id}`, { method: "DELETE" });
                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(message || "Não foi possível revogar o código");
                }
                options.onSuccess?.();
            } catch (err) {
                const errorInstance = err as Error;
                setError(errorInstance);
                options.onError?.(errorInstance);
                throw errorInstance;
            } finally {
                setIsPending(false);
                options.onSettled?.();
            }
        },
        [options],
    );

    return { mutateAsync, isPending, error };
}

export function useRemoveMember(options: MutationOptions<RemoveMemberResult> = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutateAsync = useCallback(
        async (payload: RemoveMemberPayload) => {
            setIsPending(true);
            setError(null);
            try {
                const doctorIdRaw =
                    typeof payload?.doctorId === "string" ? payload.doctorId : String(payload?.doctorId ?? "");
                const secretaryIdRaw =
                    typeof payload?.secretaryId === "string"
                        ? payload.secretaryId
                        : String(payload?.secretaryId ?? "");

                const doctorId = doctorIdRaw.trim();
                const secretaryId = secretaryIdRaw.trim();

                if (!doctorId || !secretaryId) {
                    throw new Error("Não foi possível identificar os dados necessários para remover a secretária.");
                }

                const response = await apiFetch("/api/teams/link", {
                    method: "DELETE",
                    body: JSON.stringify({ doctorId, secretaryId }),
                    rawUrl: `${BASE_URL}/api/teams/link`,
                });

                const responseText = await response.text();

                if (!response.ok) {
                    const parseErrorMessage = (raw: string): string | null => {
                        if (!raw) return null;
                        try {
                            const data = JSON.parse(raw) as Record<string, unknown>;
                            const candidates = [
                                data.message,
                                data.mensagem,
                                data.error,
                                data.detail,
                                data.descricao,
                                data.description,
                            ];
                            const firstString = candidates.find(
                                (candidate): candidate is string =>
                                    typeof candidate === "string" && candidate.trim().length > 0,
                            );
                            if (firstString) return firstString;
                        } catch {
                            // ignore json parse failures
                        }
                        const trimmed = raw.trim();
                        return trimmed.length > 0 ? trimmed : null;
                    };

                    const message =
                        parseErrorMessage(responseText) || `Não foi possível remover a secretária (HTTP ${response.status})`;
                    throw new Error(message);
                }

                let message: string | undefined;
                if (responseText) {
                    try {
                        const data = JSON.parse(responseText) as Record<string, unknown>;
                        if (typeof data.message === "string" && data.message.trim().length > 0) {
                            message = data.message.trim();
                        }
                    } catch {
                        // ignore json parse failures on success body
                    }
                }

                const result: RemoveMemberResult = { message };
                options.onSuccess?.(result);
                return result;
            } catch (err) {
                const errorInstance = err instanceof Error ? err : new Error("Não foi possível remover a secretária");
                setError(errorInstance);
                options.onError?.(errorInstance);
                throw errorInstance;
            } finally {
                setIsPending(false);
                options.onSettled?.();
            }
        },
        [options],
    );

    return { mutateAsync, isPending, error };
}

type JoinTeamResponse = {
    redirectTo: string;
};

export function useJoinTeam(options: MutationOptions<JoinTeamResponse> = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutateAsync = useCallback(
        async (payload: { code: string; acceptTerms: boolean }) => {
            setIsPending(true);
            setError(null);
            try {
                const response = await jsonPost<JoinTeamResponse>("/api/auth/join-team", payload);
                options.onSuccess?.(response);
                return response;
            } catch (err) {
                const errorInstance = err as Error;
                setError(errorInstance);
                options.onError?.(errorInstance);
                throw errorInstance;
            } finally {
                setIsPending(false);
                options.onSettled?.();
            }
        },
        [options],
    );

    return { mutateAsync, isPending, error };
}

export type DoctorSummary = {
    id: string;
    name: string;
};

function normalizeDoctorSummary(entry: unknown): DoctorSummary | null {
    if (!entry || typeof entry !== "object") return null;
    const source = entry as Record<string, unknown>;

    const candidateId =
        (typeof source.id === "string" && source.id) ||
        (typeof source.doctorId === "string" && source.doctorId) ||
        (typeof source.doctor_id === "string" && source.doctor_id) ||
        (typeof source.userId === "string" && source.userId) ||
        (typeof source.user_id === "string" && source.user_id) ||
        null;

    const candidateName =
        (typeof source.name === "string" && source.name) ||
        (typeof source.fullName === "string" && source.fullName) ||
        (typeof source.full_name === "string" && source.full_name) ||
        (typeof source.doctorFullName === "string" && source.doctorFullName) ||
        (typeof source.doctor_full_name === "string" && source.doctor_full_name) ||
        (typeof source.doctorName === "string" && source.doctorName) ||
        (typeof source.doctor_name === "string" && source.doctor_name) ||
        null;

    if (!candidateId || !candidateName) return null;
    return { id: candidateId, name: candidateName };
}

function resolveStoredAccessToken(): string | null {
    const inMemory = getAccessToken();
    if (inMemory) return inMemory;
    if (typeof window === "undefined") return null;
    try {
        return (
            window.localStorage.getItem("passmais:accessToken") ??
            window.localStorage.getItem("accessToken")
        );
    } catch {
        return null;
    }
}

function ensureDoctorName(name: string | null | undefined, fallbackId: string): string {
    const trimmed = (name ?? "").trim();
    return trimmed.length > 0 ? trimmed : fallbackId;
}

function extractDoctorsFromTokenPayload(payload: Record<string, unknown> | null): DoctorSummary[] {
    if (!payload) return [];

    const doctorsSource =
        (payload.doctors as unknown) ??
        payload.Doctors ??
        payload.authorizedDoctors ??
        payload.allowedDoctors ??
        payload.medicos ??
        payload.secretaryDoctors ??
        payload.doctorsAccess;

    const doctors: DoctorSummary[] = [];
    const pushDoctor = (entry: unknown) => {
        const normalized = normalizeDoctorSummary(entry);
        if (!normalized) return;
        doctors.push({
            id: normalized.id,
            name: ensureDoctorName(normalized.name, normalized.id),
        });
    };

    if (Array.isArray(doctorsSource)) {
        doctorsSource.forEach(pushDoctor);
    } else if (doctorsSource && typeof doctorsSource === "object") {
        pushDoctor(doctorsSource);
    } else if (typeof doctorsSource === "string" && doctorsSource.trim().length > 0) {
        const id = doctorsSource.trim();
        doctors.push({ id, name: id });
    }

    if (doctors.length === 0) {
        const fallback = normalizeDoctorSummary(payload);
        if (fallback) {
            doctors.push({
                id: fallback.id,
                name: ensureDoctorName(fallback.name, fallback.id),
            });
        } else {
            const fallbackId =
                (typeof payload.doctorId === "string" && payload.doctorId) ||
                (typeof payload.doctor_id === "string" && payload.doctor_id) ||
                null;
            if (fallbackId) {
                doctors.push({ id: fallbackId, name: fallbackId });
            }
        }
    }

    const unique = new Map<string, DoctorSummary>();
    for (const doctor of doctors) {
        if (!doctor.id) continue;
        const existing = unique.get(doctor.id);
        if (!existing) {
            unique.set(doctor.id, doctor);
            continue;
        }
        if (existing.name === existing.id && doctor.name !== doctor.id) {
            unique.set(doctor.id, doctor);
        }
    }

    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function useMyDoctors() {
    const [data, setData] = useState<DoctorSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadDoctorsFromToken = useCallback(() => {
        setIsLoading(true);
        setError(null);
        try {
            const accessToken = resolveStoredAccessToken();
            if (!accessToken) {
                setData([]);
                return;
            }
            const payload = decodeAccessTokenPayload(accessToken);
            const normalized = extractDoctorsFromTokenPayload(payload);
            setData(normalized);
        } catch (err) {
            setData([]);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDoctorsFromToken();
    }, [loadDoctorsFromToken]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleStorage = (event: StorageEvent) => {
            if (event.key && !["accessToken", "passmais:accessToken"].includes(event.key)) return;
            loadDoctorsFromToken();
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [loadDoctorsFromToken]);

    const refetch = useCallback(async () => {
        loadDoctorsFromToken();
    }, [loadDoctorsFromToken]);

    return { data, isLoading, error, refetch };
}

export type AppointmentPatient = {
    id: string;
    name: string;
    cpf: string;
    birthDate?: string | null;
    motherName?: string | null;
    sex?: "Feminino" | "Masculino" | "Outro" | "Não informado" | null;
    email?: string | null;
    address?: string | null;
    updatedAt?: string | null;
    cellPhone?: string | null;
    insuranceProvider?: string | null;
    insuranceNumber?: string | null;
};

export type Appointment = {
    id: string;
    doctorId: string;
    doctorName: string;
    doctorCrm?: string | null;
    scheduledAt: string;
    location: string;
    status: "agendada" | "confirmada" | "em-andamento" | "concluida" | "cancelada";
    statusRaw?: string;
    checkInAt: string | null;
    patient: AppointmentPatient;
    observations?: string | null;
    reason?: string | null;
    symptomDuration?: string | null;
    preConsultNotes?: string | null;
    rescheduledFromId?: string | null;
    value?: number | null;
    bookedAt?: string | null;
    dependentId?: string | null;
    createdAt?: string | null;
    finalizedAt?: string | null;
};

export type AppointmentFilters = {
    doctorId?: string | null;
    doctorIds?: string[];
    from?: string | null;
    to?: string | null;
};

export function useAppointments(filters: AppointmentFilters, options: { enabled?: boolean } = {}) {
    const enabled = options.enabled ?? true;
    const [data, setData] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(enabled);
    const [error, setError] = useState<Error | null>(null);

    const queryKey = useMemo(() => JSON.stringify(filters), [filters]);
    const lastQueryKeyRef = useRef<string | null>(null);

    const fetchAppointments = useCallback(
        async (force = false) => {
            if (!enabled) {
                setIsLoading(false);
                return;
            }

            if (!force && lastQueryKeyRef.current === queryKey) {
                setIsLoading(false);
                return;
            }

            lastQueryKeyRef.current = queryKey;

            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (filters.doctorIds && filters.doctorIds.length > 0) {
                    filters.doctorIds.forEach((id) => params.append("doctorId", id));
                } else if (filters.doctorId) {
                    params.append("doctorId", filters.doctorId);
                }
                if (filters.from) params.append("from", filters.from);
                if (filters.to) params.append("to", filters.to);
                const response = await jsonGet<Appointment[]>(`/api/appointments?${params.toString()}`);
                setData(response);
            } catch (err) {
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        },
        [enabled, filters, queryKey],
    );

    useEffect(() => {
        if (!enabled) return;
        void fetchAppointments(false);
    }, [enabled, fetchAppointments, queryKey]);

    const refetch = useCallback(async () => {
        lastQueryKeyRef.current = null;
        await fetchAppointments(true);
    }, [fetchAppointments]);

    return { data, isLoading, error, refetch };
}

const DEFAULT_DOCTOR_APPOINTMENTS_PAGE_SIZE = 20;

const STATUS_NORMALIZATION_MAP: Record<string, Appointment["status"]> = {
    PENDING: "agendada",
    CONFIRMED: "confirmada",
    "IN-PROGRESS": "em-andamento",
    IN_PROGRESS: "em-andamento",
    STARTED: "em-andamento",
    COMPLETED: "concluida",
    FINISHED: "concluida",
    FINALIZED: "concluida",
    CANCELLED: "cancelada",
    CANCELED: "cancelada",
};

type DoctorAppointmentsApiItem = {
    id?: string;
    appointment_id?: string;
    doctor_id?: string;
    doctorId?: string;
    doctor_full_name?: string;
    doctorFullName?: string;
    doctor_crm?: string;
    doctorCrm?: string;
    dependent_id?: string;
    dependentId?: string;
    date_time?: string;
    dateTime?: string;
    observations?: string | null;
    reason?: string | null;
    status?: string;
    value?: number | null;
    location?: string | null;
    symptom_duration?: string | null;
    pre_consult_notes?: string | null;
    rescheduled_from_id?: string | null;
    booked_at?: string | null;
    patient_full_name?: string;
    patientFullName?: string;
    patient_cpf?: string;
    patientCpf?: string;
    patient_birth_date?: string | null;
    patientBirthDate?: string | null;
    patient_cell_phone?: string | null;
    patientCellPhone?: string | null;
    patient_mother_name?: string | null;
    patientMotherName?: string | null;
    patient_email?: string | null;
    patientEmail?: string | null;
    patient_address?: string | null;
    patientAddress?: string | null;
    patient_insurance_provider?: string | null;
    patientInsuranceProvider?: string | null;
    patient_insurance_number?: string | null;
    patientInsuranceNumber?: string | null;
    created_at?: string | null;
    createdAt?: string | null;
    finalized_at?: string | null;
    finalizedAt?: string | null;
    check_in_at?: string | null;
    checkInAt?: string | null;
};

type DoctorAppointmentsApiResponse = {
    items?: DoctorAppointmentsApiItem[];
    page?: number;
    pageSize?: number;
    totalElements?: number;
};

function normalizeAppointmentStatus(value: unknown): Appointment["status"] {
    if (typeof value !== "string") return "agendada";
    const candidate = value.toUpperCase();
    return STATUS_NORMALIZATION_MAP[candidate] ?? "agendada";
}

function coerceString(value: unknown, fallback = ""): string {
    if (typeof value === "string") return value;
    if (value == null) return fallback;
    return String(value);
}

function coerceNumber(value: unknown, fallback: number | null = null): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) return parsed;
    }
    return fallback;
}

function mapDoctorAppointment(item: DoctorAppointmentsApiItem, fallbackDoctorId: string): Appointment {
    const id =
        item.id ??
        item.appointment_id ??
        coerceString(item.date_time || item.dateTime || `${fallbackDoctorId}-${Math.random()}`);
    const doctorId =
        item.doctor_id ??
        item.doctorId ??
        fallbackDoctorId;
    const doctorName =
        item.doctor_full_name ??
        item.doctorFullName ??
        "";
    const doctorCrm = item.doctor_crm ?? item.doctorCrm ?? null;
    const scheduledAt = item.date_time ?? item.dateTime ?? "";
    const location = item.location ?? "";
    const statusRaw = coerceString(item.status).toUpperCase();
    const status = normalizeAppointmentStatus(statusRaw);
    const checkInAt = item.check_in_at ?? item.checkInAt ?? null;
    const dependentId = item.dependent_id ?? item.dependentId ?? null;

    const patientFullName = item.patient_full_name ?? item.patientFullName ?? "";
    const patientCpf = item.patient_cpf ?? item.patientCpf ?? "";
    const patientBirthDate = item.patient_birth_date ?? item.patientBirthDate ?? null;
    const patientCellPhone = item.patient_cell_phone ?? item.patientCellPhone ?? null;
    const patientMotherName = item.patient_mother_name ?? item.patientMotherName ?? null;
    const patientEmail = item.patient_email ?? item.patientEmail ?? null;
    const patientAddress = item.patient_address ?? item.patientAddress ?? null;
    const patientInsuranceProvider =
        item.patient_insurance_provider ?? item.patientInsuranceProvider ?? null;
    const patientInsuranceNumber =
        item.patient_insurance_number ?? item.patientInsuranceNumber ?? null;

    return {
        id,
        doctorId: doctorId ?? fallbackDoctorId,
        doctorName,
        doctorCrm,
        scheduledAt,
        location,
        status,
        statusRaw: statusRaw || undefined,
        checkInAt: checkInAt ?? null,
        patient: {
            id: dependentId ?? "",
            name: patientFullName,
            cpf: patientCpf,
            birthDate: patientBirthDate,
            motherName: patientMotherName,
            email: patientEmail,
            address: patientAddress,
            cellPhone: patientCellPhone,
            insuranceProvider: patientInsuranceProvider,
            insuranceNumber: patientInsuranceNumber,
        },
        observations: item.observations ?? null,
        reason: item.reason ?? null,
        symptomDuration: item.symptom_duration ?? null,
        preConsultNotes: item.pre_consult_notes ?? null,
        rescheduledFromId: item.rescheduled_from_id ?? null,
        value: coerceNumber(item.value),
        bookedAt: item.booked_at ?? null,
        dependentId,
        createdAt: item.created_at ?? item.createdAt ?? null,
        finalizedAt: item.finalized_at ?? item.finalizedAt ?? null,
    };
}

type UseDoctorAppointmentsParams = {
    doctorId: string | null;
    page?: number;
    pageSize?: number;
    sort?: string;
    enabled?: boolean;
};

export function useDoctorAppointments(params: UseDoctorAppointmentsParams) {
    const { doctorId, page = 0, pageSize = DEFAULT_DOCTOR_APPOINTMENTS_PAGE_SIZE, sort, enabled = true } = params;
    const [data, setData] = useState<Appointment[]>([]);
    const [meta, setMeta] = useState<{ page: number; pageSize: number; totalElements: number }>({
        page,
        pageSize,
        totalElements: 0,
    });
    const [isLoading, setIsLoading] = useState(enabled && Boolean(doctorId));
    const [error, setError] = useState<Error | null>(null);

    const queryKey = useMemo(
        () => JSON.stringify({ doctorId, page, pageSize, sort, enabled }),
        [doctorId, page, pageSize, sort, enabled],
    );
    const lastQueryKeyRef = useRef<string | null>(null);

    const fetchAppointments = useCallback(
        async (force = false) => {
            if (!enabled || !doctorId) {
                setIsLoading(false);
                setData([]);
                setMeta({ page, pageSize, totalElements: 0 });
                return;
            }

            if (!force && lastQueryKeyRef.current === queryKey) {
                setIsLoading(false);
                return;
            }
            lastQueryKeyRef.current = queryKey;

            setIsLoading(true);
            setError(null);
            try {
                const searchParams = new URLSearchParams();
                searchParams.set("page", String(Math.max(0, page)));
                const effectivePageSize = pageSize > 0 ? pageSize : DEFAULT_DOCTOR_APPOINTMENTS_PAGE_SIZE;
                searchParams.set("pageSize", String(effectivePageSize));
                if (sort) searchParams.set("sort", sort);

                const response = await jsonGet<DoctorAppointmentsApiResponse>(
                    `/api/doctors/${doctorId}/appointments?${searchParams.toString()}`,
                );

                const items = Array.isArray(response.items) ? response.items : [];
                const mapped = items.map((item) => mapDoctorAppointment(item, doctorId));

                setData(mapped);
                setMeta({
                    page: typeof response.page === "number" ? response.page : page,
                    pageSize:
                        typeof response.pageSize === "number" && response.pageSize > 0
                            ? response.pageSize
                            : effectivePageSize,
                    totalElements:
                        typeof response.totalElements === "number" && response.totalElements >= 0
                            ? response.totalElements
                            : mapped.length,
                });
            } catch (err) {
                setError(err as Error);
                setData([]);
            } finally {
                setIsLoading(false);
            }
        },
        [doctorId, enabled, page, pageSize, sort, queryKey],
    );

    useEffect(() => {
        if (!enabled || !doctorId) {
            setIsLoading(false);
            setData([]);
            setMeta({ page, pageSize, totalElements: 0 });
            return;
        }
        void fetchAppointments(false);
    }, [doctorId, enabled, fetchAppointments, page, pageSize, sort]);

    const refetch = useCallback(async () => {
        lastQueryKeyRef.current = null;
        await fetchAppointments(true);
    }, [fetchAppointments]);

    return { data, isLoading, error, refetch, page: meta.page, pageSize: meta.pageSize, totalElements: meta.totalElements };
}

type ConfirmAttendancePayload = {
    appointmentId: string;
    fullName: string;
    cpf: string;
    birthDate: string;
    motherName: string;
    sex: AppointmentPatient["sex"];
    email?: string | null;
    phone: string;
    address: string;
    insuranceProvider?: string | null;
    insuranceNumber?: string | null;
};

export function useConfirmAttendance(options: MutationOptions<Appointment> = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutateAsync = useCallback(
        async (payload: ConfirmAttendancePayload) => {
            setIsPending(true);
            setError(null);
            try {
                const { appointmentId, ...body } = payload;
                const response = await jsonPost<Appointment>(`/api/appointments/${appointmentId}/check-in`, body);
                options.onSuccess?.(response);
                return response;
            } catch (err) {
                const errorInstance = err as Error;
                setError(errorInstance);
                options.onError?.(errorInstance);
                throw errorInstance;
            } finally {
                setIsPending(false);
                options.onSettled?.();
            }
        },
        [options],
    );

    return { mutateAsync, isPending, error };
}
