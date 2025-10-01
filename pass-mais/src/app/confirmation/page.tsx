"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Doctor } from "@/app/medical-appointments/types";
import { fallbackDoctors } from "@/app/medical-appointments/fallbackDoctors";

export default function Confirmation() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const forWhom = searchParams.get("forWhom");
    const paymentMethod = searchParams.get("paymentMethod");

    const [isReady, setIsReady] = useState(false);
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const currentPath = useMemo(() => {
        const query = searchParams.toString();
        return query.length > 0 ? `/confirmation?${query}` : "/confirmation";
    }, [searchParams]);

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

        if (!token) {
            router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
            return;
        }

        if (!doctorId || !date || !time || !forWhom || !paymentMethod) {
            router.replace("/medical-appointments");
            return;
        }

        let isCancelled = false;
        setIsReady(true);
        setIsLoadingDoctor(true);
        setLoadError(null);

        async function fetchDoctor() {
            try {
                const response = await fetch("/api/doctors/search", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(await response.text());
                }

                const payload = (await response.json()) as unknown[];
                const normalized = normalizeDoctors(payload);
                const found = normalized.find((entry) => entry.id === doctorId);

                if (!isCancelled) {
                    if (found) {
                        setDoctor(found);
                    } else {
                        const fallback = fallbackDoctors.find((doc) => doc.id === doctorId);
                        if (fallback) {
                            setDoctor(fallback);
                        } else {
                            setLoadError("Médico não encontrado.");
                        }
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar médico para a confirmação", error);
                if (!isCancelled) {
                    const fallback = fallbackDoctors.find((doc) => doc.id === doctorId);
                    if (fallback) {
                        setDoctor(fallback);
                    } else {
                        setLoadError("Não foi possível carregar os dados do médico.");
                    }
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingDoctor(false);
                }
            }
        }

        fetchDoctor();

        return () => {
            isCancelled = true;
        };
    }, [router, currentPath, doctorId, date, time, forWhom, paymentMethod]);

    useEffect(() => {
        if (!isLoadingDoctor && loadError) {
            router.replace("/medical-appointments");
        }
    }, [isLoadingDoctor, loadError, router]);

    if (!isReady) return null;

    const consultationPrice = doctor?.consultationPrice ?? null;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="bg-white shadow-xl rounded-2xl p-8 max-w-2xl w-full">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                    Consulta Agendada com Sucesso!
                </h1>

                {isLoadingDoctor ? (
                    <p className="text-center text-gray-600">Carregando informações do médico...</p>
                ) : doctor ? (
                    <div className="space-y-4">
                        <DetailRow label="Médico" value={`${doctor.name} (${doctor.specialty})`} />
                        <DetailRow label="Data" value={date ?? "-"} />
                        <DetailRow label="Horário" value={time ?? "-"} />
                        <DetailRow label="Para" value={formatForWhom(forWhom)} />
                        <DetailRow label="Método de Pagamento" value={formatPaymentMethod(paymentMethod)} />
                        <DetailRow
                            label="Local de atendimento"
                            value={doctor.address ?? buildAddressFallback(doctor)}
                        />
                        <DetailRow
                            label="Valor da Consulta"
                            value={
                                consultationPrice != null
                                    ? new Intl.NumberFormat("pt-BR", {
                                          style: "currency",
                                          currency: "BRL",
                                      }).format(consultationPrice)
                                    : "Não informado"
                            }
                        />
                    </div>
                ) : (
                    <p className="text-center text-gray-600">Médico não encontrado.</p>
                )}

                <div className="mt-8 text-center">
                    <Link
                        href="/medical-appointments"
                        className="inline-flex items-center justify-center rounded-lg bg-[#5179EF] px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-blue-700"
                    >
                        Voltar para Lista de Médicos
                    </Link>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <p className="text-lg text-gray-700">
            <span className="font-semibold">{label}:</span> {value}
        </p>
    );
}

function formatForWhom(value: string | null): string {
    if (!value) return "-";
    if (value === "self") return "Para mim";
    if (value === "other") return "Outro paciente";
    return value;
}

function formatPaymentMethod(value: string | null): string {
    if (!value) return "-";
    if (value === "pix") return "PIX";
    if (value === "card") return "Cartão";
    return value;
}

function buildAddressFallback(doctor: Doctor | null): string {
    if (!doctor) return "Endereço não informado";
    const composed = joinAddressParts(
        doctor.clinicName,
        doctor.clinicStreetAndNumber,
        doctor.clinicCity,
        doctor.clinicState,
        doctor.clinicPostalCode
    );
    return composed.length > 0 ? composed : doctor.address ?? "Endereço não informado";
}

const joinAddressParts = (...parts: Array<string | null | undefined>) =>
    parts
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
        .join(", ");

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
        });
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
