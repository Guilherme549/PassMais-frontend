"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClientMedicalAppointments from "./components/ClientMedicalAppointments";
import { fallbackDoctors } from "./fallbackDoctors";
import { type Doctor } from "./types";

export default function MedicalAppointments() {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [doctors, setDoctors] = useState<Doctor[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadDoctors(token: string) {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch("/api/doctors/search", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(message || "Falha ao carregar médicos");
                }

                const data = (await response.json()) as unknown[];
                const normalized = normalizeDoctors(data);
                if (isMounted) {
                    if (normalized.length === 0) {
                        setError("Nenhum médico encontrado. Mostrando dados temporários.");
                        setDoctors(fallbackDoctors);
                    } else {
                        setDoctors(normalized);
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar médicos", err);
                if (isMounted) {
                    setError("Não foi possível carregar os médicos. Mostrando dados temporários.");
                    setDoctors(fallbackDoctors);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                router.replace("/login");
            } else {
                setReady(true);
                loadDoctors(token);
            }
        } catch {
            router.replace("/login");
        }

        return () => {
            isMounted = false;
        };
    }, [router]);

    if (!ready) return null;

    return (
        <ClientMedicalAppointments doctors={doctors} isLoading={isLoading} error={error} />
    );
}

function normalizeDoctors(data: unknown[]): Doctor[] {
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
                photo:
                    typeof raw.photoUrl === "string" && raw.photoUrl.trim().length > 0
                        ? raw.photoUrl
                        : null,
                address: typeof raw.address === "string" ? raw.address : null,
            } satisfies Doctor;
        })
        .filter((doctor): doctor is Doctor => Boolean(doctor));
}
