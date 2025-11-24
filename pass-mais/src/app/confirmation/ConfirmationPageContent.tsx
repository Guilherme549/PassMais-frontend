"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Doctor } from "@/app/medical-appointments/types";
import { fallbackDoctors } from "@/app/medical-appointments/fallbackDoctors";
import { normalizeDoctors } from "@/app/doctor-profile/utils";

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

function formatCpf(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length !== 11) return value;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatBirthDate(value: string): string {
    const parts = value.split("-");
    if (parts.length === 3) {
        const [year, month, day] = parts;
        if (year && month && day) return `${day}/${month}/${year}`;
    }
    return value;
}

function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10) return value;
    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function buildAddressFallback(doctor: Doctor | null): string {
    if (!doctor) return "Endereço não informado";
    const parts = [
        doctor.clinicStreetAndNumber,
        doctor.clinicCity,
        doctor.clinicState,
        doctor.clinicPostalCode,
    ].filter((value) => typeof value === "string" && value.trim().length > 0) as string[];
    const address = parts.join(", ");
    if (address.length > 0 && doctor.clinicName) {
        return `${doctor.clinicName} - ${address}`;
    }
    if (address.length > 0) return address;
    return doctor.clinicName ?? doctor.address ?? "Endereço não informado";
}
