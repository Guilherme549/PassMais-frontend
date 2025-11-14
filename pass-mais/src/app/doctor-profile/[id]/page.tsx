"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ClientDoctorProfile from "./components/ClientDoctorProfile";
import type { DoctorSchedule } from "@/app/medical-appointments/types";
import type { DoctorProfile } from "../utils";
import { applyFallbackDoctor, buildDoctorProfile, normalizeDoctors } from "../utils";

type ScheduleStatus = "idle" | "loading" | "success" | "error";

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
