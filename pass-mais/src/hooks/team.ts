"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiFetch, jsonGet, jsonPost } from "@/lib/api";

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

type MutationOptions<T> = {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    onSettled?: () => void;
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

    const fetchTeam = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await jsonGet<DoctorTeamResponse>("/api/doctor/team");
            setData(response);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refetch = useCallback(async () => {
        setIsRefetching(true);
        setError(null);
        try {
            const response = await jsonGet<DoctorTeamResponse>("/api/doctor/team");
            setData(response);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsRefetching(false);
        }
    }, []);

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

                const response = await jsonPost<GenerateJoinCodeResponse>("/api/teams/invite", {
                    maxUses: uses,
                    expiresAt,
                    secretaryFullName: payload.fullName.trim(),
                    secretaryCorporateEmail: payload.email.trim(),
                });
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

export function useRemoveMember(options: MutationOptions<void> = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutateAsync = useCallback(
        async (userId: string) => {
            setIsPending(true);
            setError(null);
            try {
                const response = await apiFetch(`/api/doctor/team/members/${userId}`, { method: "DELETE" });
                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(message || "Não foi possível remover a secretária");
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

export function useMyDoctors() {
    const [data, setData] = useState<DoctorSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchDoctors = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await jsonGet<DoctorSummary[]>("/api/me/doctors");
            setData(response);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchDoctors();
    }, [fetchDoctors]);

    return { data, isLoading, error, refetch: fetchDoctors };
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
};

export type Appointment = {
    id: string;
    doctorId: string;
    doctorName: string;
    scheduledAt: string;
    location: string;
    status: "agendada" | "confirmada" | "em-andamento" | "concluida" | "cancelada";
    checkInAt: string | null;
    patient: AppointmentPatient;
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

type ConfirmAttendancePayload = {
    appointmentId: string;
    fullName: string;
    cpf: string;
    birthDate: string;
    motherName: string;
    sex: AppointmentPatient["sex"];
    email?: string | null;
    address: string;
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
