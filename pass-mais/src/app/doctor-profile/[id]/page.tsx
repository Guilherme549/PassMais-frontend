"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ClientDoctorProfile from "./components/ClientDoctorProfile";
import type { Doctor as DoctorSummary, DoctorSchedule } from "@/app/medical-appointments/types";
import { fallbackDoctors } from "@/app/medical-appointments/fallbackDoctors";
import { normalizeImageUrl } from "@/lib/utils";

type ScheduleStatus = "idle" | "loading" | "success" | "error";

interface DoctorProfile extends DoctorSummary {
    consultationFee?: number | null;
}

export default function DoctorProfilePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const doctorId = params?.id ?? "";

    const { initialDate, initialTime } = useMemo(() => {
        const dateValue = searchParams?.get("date") ?? null;
        const timeValue = searchParams?.get("time") ?? null;

        const validDate = dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : null;
        const validTime = timeValue && /^\d{2}:\d{2}$/.test(timeValue) ? timeValue : null;

        return { initialDate: validDate, initialTime: validTime };
    }, [searchParams]);

    const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
    const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus>("idle");
    const [scheduleError, setScheduleError] = useState<string | null>(null);

    const loadSchedule = useCallback(
        async (targetDoctorId: string, _force?: boolean) => {
            if (!targetDoctorId) return;

            const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
            if (!token) {
                router.replace("/login");
                return;
            }

            setScheduleStatus("loading");
            setScheduleError(null);

            try {
                const response = await fetch(`/api/patient/doctors/${targetDoctorId}/schedule`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });

                if (response.status === 401) {
                    router.replace("/login");
                    return;
                }

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(text || `HTTP ${response.status}`);
                }

                const data = (await response.json()) as DoctorSchedule;
                setSchedule(data);
                setScheduleStatus("success");
            } catch (error) {
                console.error("Erro ao carregar agenda do médico", error);
                setSchedule(null);
                setScheduleStatus("error");
                setScheduleError(
                    error instanceof Error ? error.message : "Não foi possível carregar a agenda."
                );
            }
        },
        [router]
    );

    useEffect(() => {
        let isMounted = true;

        async function loadDoctor() {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                router.replace("/login");
                return;
            }

            if (!doctorId) {
                router.replace("/medical-appointments");
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch("/api/doctors/search", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(await response.text());
                }

                const doctors = (await response.json()) as unknown[];
                const normalized = normalizeDoctors(doctors);
                const found = normalized.find((doc) => doc.id === doctorId);

                if (found) {
                    if (isMounted) setDoctor(buildDoctorProfile(found));
                    await loadSchedule(found.id, true);
                    return;
                }

                if (!applyFallbackDoctor(doctorId, isMounted, setDoctor, loadSchedule)) {
                    router.replace("/medical-appointments");
                }
            } catch (error) {
                console.error("Erro ao carregar perfil do médico", error);
                if (!applyFallbackDoctor(doctorId, isMounted, setDoctor, loadSchedule)) {
                    if (isMounted) {
                        router.replace("/medical-appointments");
                    }
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadDoctor();

        return () => {
            isMounted = false;
        };
    }, [doctorId, router, loadSchedule]);

    if (isLoading || !doctor) return null;

    return (
        <ClientDoctorProfile
            doctor={doctor}
            schedule={schedule}
            scheduleStatus={scheduleStatus}
            scheduleError={scheduleError}
            onRetrySchedule={() => loadSchedule(doctor.id, true)}
            initialDate={initialDate}
            initialTime={initialTime}
        />
    );
}

function buildDoctorProfile(base: DoctorSummary): DoctorProfile {
    return {
        ...base,
        bio: base.bio || "Biografia não informada.",
        address: base.address ?? "Endereço não informado.",
        consultationFee: deriveConsultationFee(base.id),
    };
}

function normalizeDoctors(data: unknown[]): DoctorSummary[] {
    const normalized: DoctorSummary[] = [];

    for (const item of data) {
        const raw = item as Record<string, unknown>;
        const id = raw?.id != null ? String(raw.id) : "";
        if (!id) continue;

        normalized.push({
            id,
            name: typeof raw.name === "string" ? raw.name : "Nome não informado",
            specialty: typeof raw.specialty === "string" ? raw.specialty : "Especialidade não informada",
            crm: typeof raw.crm === "string" ? raw.crm : "CRM não informado",
            bio: typeof raw.bio === "string" ? raw.bio : "",
            averageRating: typeof raw.averageRating === "number" ? raw.averageRating : 0,
            reviewsCount: typeof raw.reviewsCount === "number" ? raw.reviewsCount : 0,
            photo: normalizeImageUrl(raw.photoUrl),
            clinicName:
                typeof raw.clinicName === "string" && raw.clinicName.trim().length > 0
                    ? raw.clinicName
                    : null,
            clinicStreetAndNumber:
                typeof raw.clinicStreetAndNumber === "string" && raw.clinicStreetAndNumber.trim().length > 0
                    ? raw.clinicStreetAndNumber
                    : null,
            clinicCity:
                typeof raw.clinicCity === "string" && raw.clinicCity.trim().length > 0
                    ? raw.clinicCity
                    : null,
            clinicPostalCode:
                typeof raw.clinicPostalCode === "string" && raw.clinicPostalCode.trim().length > 0
                    ? raw.clinicPostalCode
                    : null,
            consultationPrice:
                typeof raw.consultationPrice === "number" ? raw.consultationPrice : null,
            address: (() => {
                const legacy =
                    typeof raw.address === "string" && raw.address.trim().length > 0
                        ? raw.address
                        : null;
                if (legacy) return legacy;

                const composedAddress = [
                    typeof raw.clinicStreetAndNumber === "string"
                        ? raw.clinicStreetAndNumber.trim()
                        : "",
                    typeof raw.clinicCity === "string" ? raw.clinicCity.trim() : "",
                    typeof raw.clinicPostalCode === "string" ? raw.clinicPostalCode.trim() : "",
                ]
                    .filter((value) => value.length > 0)
                    .join(", ");

                const composed = [
                    typeof raw.clinicName === "string" ? raw.clinicName.trim() : "",
                    composedAddress,
                ]
                    .filter((value) => value.length > 0)
                    .join(" - ");

                return composed.length > 0 ? composed : null;
            })(),
        } satisfies DoctorSummary);
    }

    return normalized;
}

function applyFallbackDoctor(
    doctorId: string,
    isMounted: boolean,
    setDoctor: (doctor: DoctorProfile) => void,
    loadSchedule: (doctorId: string, force?: boolean) => void
): boolean {
    const fallback = fallbackDoctors.find((doc) => doc.id === doctorId);
    if (!fallback) return false;
    if (isMounted) {
        setDoctor(buildDoctorProfile(fallback));
        loadSchedule(fallback.id, true);
    }
    return true;
}

function deriveConsultationFee(id: string): number {
    const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseFee = 200;
    const variation = (hash % 6) * 20; // Gera valores entre 0 e 100
    return baseFee + variation;
}
