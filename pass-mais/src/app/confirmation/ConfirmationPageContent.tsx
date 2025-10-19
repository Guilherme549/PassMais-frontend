"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Doctor } from "@/app/medical-appointments/types";
import { fallbackDoctors } from "@/app/medical-appointments/fallbackDoctors";
import { normalizeImageUrl } from "@/lib/utils";

export default function ConfirmationPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const queryString = searchParams.toString();
    const currentPath = useMemo(
        () => (queryString.length > 0 ? `/confirmation?${queryString}` : "/confirmation"),
        [queryString]
    );

    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const forWhom = searchParams.get("forWhom");
    const paymentMethod = searchParams.get("paymentMethod");
    const patientName = searchParams.get("patientName");
    const patientCpf = searchParams.get("cpf");
    const patientPhone = searchParams.get("phone");
    const otherPatientName = searchParams.get("otherPatientName");
    const otherPatientCpf = searchParams.get("otherPatientCpf");
    const otherPatientBirthDate = searchParams.get("otherPatientBirthDate");
    const otherPatientPhone = searchParams.get("otherPatientPhone");

    const [isReady, setIsReady] = useState(false);
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

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
                        {forWhom === "other" ? (
                            <>
                                <DetailRow label="Paciente" value={otherPatientName ?? "—"} />
                                {otherPatientCpf ? (
                                    <DetailRow label="CPF do Paciente" value={formatCpf(otherPatientCpf)} />
                                ) : null}
                                {otherPatientBirthDate ? (
                                    <DetailRow
                                        label="Nascimento do Paciente"
                                        value={formatBirthDate(otherPatientBirthDate)}
                                    />
                                ) : null}
                                {otherPatientPhone ? (
                                    <DetailRow
                                        label="Telefone do Paciente"
                                        value={formatPhone(otherPatientPhone)}
                                    />
                                ) : null}
                                <DetailRow
                                    label="Titular do Agendamento"
                                    value={patientName ?? "Não informado"}
                                />
                            </>
                    ) : (
                            <DetailRow label="Paciente" value={patientName ?? "-"} />
                        )}
                        {forWhom !== "other" && patientCpf ? (
                            <DetailRow label="CPF do Paciente" value={formatCpf(patientCpf)} />
                        ) : null}
                        {patientPhone ? (
                            <DetailRow label="Telefone de Contato" value={formatPhone(patientPhone)} />
                        ) : null}
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

function formatCpf(value: string | null): string {
    if (!value) return "—";
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 11) return value;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatBirthDate(value: string | null): string {
    if (!value) return "—";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-");
        return `${day}/${month}/${year}`;
    }
    return value;
}

function formatPhone(value: string | null): string {
    if (!value) return "—";
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10) return value;
    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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

        const acceptedInsurances = extractAcceptedInsurances(raw);

        normalized.push({
            id,
            name: typeof raw.name === "string" ? raw.name : "Nome não informado",
            specialty: typeof raw.specialty === "string" ? raw.specialty : "Especialidade não informada",
            crm: typeof raw.crm === "string" ? raw.crm : "CRM não informado",
            bio: typeof raw.bio === "string" ? raw.bio : "",
            averageRating: typeof raw.averageRating === "number" ? raw.averageRating : 0,
            reviewsCount: typeof raw.reviewsCount === "number" ? raw.reviewsCount : 0,
            photo: normalizeImageUrl(raw.photoUrl),
            clinicName,
            clinicStreetAndNumber,
            clinicCity,
            clinicState,
            clinicPostalCode,
            consultationPrice:
                typeof raw.consultationPrice === "number" ? raw.consultationPrice : null,
            acceptedInsurances: acceptedInsurances.length > 0 ? acceptedInsurances : null,
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

                const composedAddressWithName = [clinicName ?? "", composedAddress]
                    .filter((value) => value.length > 0)
                    .join(" - ");

                return composedAddressWithName.length > 0 ? composedAddressWithName : null;
            })(),
        });
    }

    return normalized;
}

function extractAcceptedInsurances(source: Record<string, unknown>): string[] {
    const candidateKeys = [
        "acceptedInsurances",
        "acceptedInsurance",
        "healthPlans",
        "healthPlan",
        "healthPlanNames",
        "healthInsurances",
        "healthInsurance",
        "insurancePlans",
        "insurancePlan",
        "insurances",
        "insurance",
        "agreements",
        "agreement",
        "convenios",
        "convenio",
    ];

    const collected = new Set<string>();

    const pushValues = (value: unknown) => {
        if (!value) return;

        if (Array.isArray(value)) {
            for (const entry of value) {
                if (typeof entry === "string") {
                    const normalized = entry.trim();
                    if (normalized.length > 0) collected.add(normalized);
                    continue;
                }
                if (entry && typeof entry === "object") {
                    const rawEntry = entry as Record<string, unknown>;
                    const candidate =
                        typeof rawEntry.name === "string"
                            ? rawEntry.name
                            : typeof rawEntry.title === "string"
                            ? rawEntry.title
                            : typeof rawEntry.planName === "string"
                            ? rawEntry.planName
                            : typeof rawEntry.label === "string"
                            ? rawEntry.label
                            : typeof rawEntry.value === "string"
                            ? rawEntry.value
                            : null;
                    if (candidate) {
                        const normalized = candidate.trim();
                        if (normalized.length > 0) collected.add(normalized);
                    }
                }
            }
            return;
        }

        if (typeof value === "string") {
            const parts = value.split(/[,;|/]+/);
            for (const part of parts) {
                const normalized = part.trim();
                if (normalized.length > 0) collected.add(normalized);
            }
            return;
        }

        if (value && typeof value === "object") {
            const rawValue = value as Record<string, unknown>;
            pushValues(rawValue.list ?? rawValue.items ?? rawValue.values);
            const candidate =
                typeof rawValue.name === "string"
                    ? rawValue.name
                    : typeof rawValue.title === "string"
                    ? rawValue.title
                    : typeof rawValue.planName === "string"
                    ? rawValue.planName
                    : typeof rawValue.label === "string"
                    ? rawValue.label
                    : typeof rawValue.value === "string"
                    ? rawValue.value
                    : null;
            if (candidate) {
                const normalized = candidate.trim();
                if (normalized.length > 0) collected.add(normalized);
            }
        }
    };

    for (const key of candidateKeys) {
        if (key in source) {
            pushValues((source as Record<string, unknown>)[key]);
        }
    }

    return Array.from(collected);
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
