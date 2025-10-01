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
    const normalized: Doctor[] = [];

    for (const item of data) {
        const raw = item as Record<string, unknown>;
        const id = raw?.id != null ? String(raw.id) : "";
        if (!id) continue;

        const serviceLocations = extractServiceLocations(raw);

        const clinicName =
            typeof raw.clinicName === "string" && raw.clinicName.trim().length > 0
                ? raw.clinicName.trim()
                : serviceLocations[0]?.name ?? null;

        const clinicStreetAndNumber =
            typeof raw.clinicStreetAndNumber === "string" && raw.clinicStreetAndNumber.trim().length > 0
                ? raw.clinicStreetAndNumber.trim()
                : serviceLocations[0]?.address ?? null;

        const clinicCity =
            typeof raw.clinicCity === "string" && raw.clinicCity.trim().length > 0
                ? raw.clinicCity.trim()
                : serviceLocations[0]?.city ?? null;

        const clinicState =
            typeof raw.clinicState === "string" && raw.clinicState.trim().length > 0
                ? raw.clinicState.trim()
                : serviceLocations[0]?.state ?? null;

        const clinicPostalCode =
            typeof raw.clinicPostalCode === "string" && raw.clinicPostalCode.trim().length > 0
                ? raw.clinicPostalCode.trim()
                : serviceLocations[0]?.postalCode ?? null;

        normalized.push({
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
            clinicName,
            clinicStreetAndNumber,
            clinicCity,
            clinicState,
            clinicPostalCode,
            consultationPrice:
                typeof raw.consultationPrice === "number" ? raw.consultationPrice : null,
            serviceLocations: serviceLocations.length > 0 ? serviceLocations : undefined,
            address: (() => {
                const legacy =
                    typeof raw.address === "string" && raw.address.trim().length > 0
                        ? raw.address
                        : null;
                if (legacy) return legacy;

                const composedAddress = [
                    clinicStreetAndNumber ?? "",
                    clinicCity ?? "",
                    clinicState ?? "",
                    clinicPostalCode ?? "",
                ]
                    .filter((value) => value.length > 0)
                    .join(", ");

                const composed = [clinicName ?? "", composedAddress]
                    .filter((value) => value.length > 0)
                    .join(" - ");

                return composed.length > 0 ? composed : null;
            })(),
        } satisfies Doctor);
    }

    return normalized;
}

function extractServiceLocations(source: Record<string, unknown>): Doctor["serviceLocations"] {
    const rawLocations = source?.serviceLocations;

    if (!Array.isArray(rawLocations)) {
        return [];
    }

    return rawLocations
        .map((entry) => {
            if (!entry || typeof entry !== "object") return null;
            const rawEntry = entry as Record<string, unknown>;

            const city =
                typeof rawEntry.city === "string" && rawEntry.city.trim().length > 0
                    ? rawEntry.city.trim()
                    : typeof rawEntry.cityName === "string" && rawEntry.cityName.trim().length > 0
                    ? rawEntry.cityName.trim()
                    : null;

            const state =
                typeof rawEntry.state === "string" && rawEntry.state.trim().length > 0
                    ? rawEntry.state.trim()
                    : typeof rawEntry.stateCode === "string" && rawEntry.stateCode.trim().length > 0
                    ? rawEntry.stateCode.trim()
                    : null;

            const address =
                typeof rawEntry.address === "string" && rawEntry.address.trim().length > 0
                    ? rawEntry.address.trim()
                    : typeof rawEntry.street === "string" && rawEntry.street.trim().length > 0
                    ? rawEntry.street.trim()
                    : null;

            const postalCode =
                typeof rawEntry.postalCode === "string" && rawEntry.postalCode.trim().length > 0
                    ? rawEntry.postalCode.trim()
                    : typeof rawEntry.zipCode === "string" && rawEntry.zipCode.trim().length > 0
                    ? rawEntry.zipCode.trim()
                    : null;

            const name =
                typeof rawEntry.name === "string" && rawEntry.name.trim().length > 0
                    ? rawEntry.name.trim()
                    : typeof rawEntry.clinicName === "string" && rawEntry.clinicName.trim().length > 0
                    ? rawEntry.clinicName.trim()
                    : null;

            if (!city && !state && !address && !name && !postalCode) return null;

            return {
                name,
                city,
                state,
                address,
                postalCode,
            };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}
