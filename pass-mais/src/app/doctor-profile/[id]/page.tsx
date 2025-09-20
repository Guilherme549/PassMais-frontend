"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClientDoctorProfile from "./components/ClientDoctorProfile";
import type { Doctor as DoctorSummary } from "@/app/medical-appointments/types";
import { fallbackDoctors } from "@/app/medical-appointments/fallbackDoctors";

interface AvailableSlot {
    date: string;
    times: string[];
}

interface DoctorProfile extends DoctorSummary {
    consultationFee?: number | null;
    availableSlots: AvailableSlot[];
}

export default function DoctorProfilePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const doctorId = params?.id ?? "";

    const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
                    return;
                }

                if (!applyFallbackDoctor(doctorId, isMounted, setDoctor)) {
                    router.replace("/medical-appointments");
                }
            } catch (error) {
                console.error("Erro ao carregar perfil do médico", error);
                if (!applyFallbackDoctor(doctorId, isMounted, setDoctor)) {
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
    }, [doctorId, router]);

    if (isLoading || !doctor) return null;

    return <ClientDoctorProfile doctor={doctor} />;
}

function buildDoctorProfile(base: DoctorSummary): DoctorProfile {
    return {
        ...base,
        bio: base.bio || "Biografia não informada.",
        address: base.address ?? "Endereço não informado.",
        consultationFee: deriveConsultationFee(base.id),
        availableSlots: generateDefaultSlots(base.id),
    };
}

function normalizeDoctors(data: unknown[]): DoctorSummary[] {
    return data
        .map((item) => {
            const raw = item as Record<string, unknown>;
            const id = raw?.id != null ? String(raw.id) : "";
            if (!id) return null;
            return {
                id,
                name: typeof raw.name === "string" ? raw.name : "Nome não informado",
                specialty: typeof raw.specialty === "string" ? raw.specialty : "Especialidade não informada",
                crm: typeof raw.crm === "string" ? raw.crm : "CRM não informado",
                bio: typeof raw.bio === "string" ? raw.bio : "",
                averageRating: typeof raw.averageRating === "number" ? raw.averageRating : 0,
                reviewsCount: typeof raw.reviewsCount === "number" ? raw.reviewsCount : 0,
                address: typeof raw.address === "string" ? raw.address : null,
            } satisfies DoctorSummary;
        })
        .filter((doctor): doctor is DoctorSummary => Boolean(doctor));
}

function applyFallbackDoctor(
    doctorId: string,
    isMounted: boolean,
    setDoctor: (doctor: DoctorProfile) => void,
): boolean {
    const fallback = fallbackDoctors.find((doc) => doc.id === doctorId);
    if (!fallback) return false;
    if (isMounted) {
        setDoctor(buildDoctorProfile(fallback));
    }
    return true;
}

function deriveConsultationFee(id: string): number {
    const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseFee = 200;
    const variation = (hash % 6) * 20; // Gera valores entre 0 e 100
    return baseFee + variation;
}

function generateDefaultSlots(id: string): AvailableSlot[] {
    const baseTimes = [
        ["09:00", "10:00", "11:00"],
        ["13:00", "14:00", "15:00"],
        ["16:00", "17:00"],
    ];
    const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return Array.from({ length: 3 }).map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index + 1);
        const times = baseTimes[(hash + index) % baseTimes.length];
        return {
            date: date.toISOString().split("T")[0],
            times,
        };
    });
}
