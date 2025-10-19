"use client";

import { useMemo, useRef, useState } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

const ACTIVE_APPOINTMENTS_STORAGE_KEY = "passmais:activeDoctorAppointments";

interface ActiveAppointmentRecord {
    doctorId: string;
    appointmentId?: string;
    scheduledAt?: string;
    recordedAt: string;
}

function readActiveAppointments(): ActiveAppointmentRecord[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(ACTIVE_APPOINTMENTS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ActiveAppointmentRecord[]) : [];
    } catch {
        return [];
    }
}

function pruneExpiredAppointments(records: ActiveAppointmentRecord[]): ActiveAppointmentRecord[] {
    const now = Date.now();
    return records.filter((record) => {
        if (!record || typeof record !== "object") return false;
        if (!record.doctorId) return false;
        if (!record.scheduledAt) return true;
        const timestamp = Date.parse(record.scheduledAt);
        if (Number.isNaN(timestamp)) return true;
        return timestamp > now;
    });
}

function writeActiveAppointments(records: ActiveAppointmentRecord[]) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(ACTIVE_APPOINTMENTS_STORAGE_KEY, JSON.stringify(records));
    } catch {
        // ignore
    }
}

interface ClientPaymentProps {
    doctorId: string;
    date: string;
    time: string;
    forWhom: string;
    timezone: string;
    reason?: string | null;
    otherPatientName?: string | null;
    otherPatientCpf?: string | null;
    otherPatientBirthDate?: string | null;
    patientName?: string | null;
    patientCpf?: string | null;
    patientBirthDate?: string | null;
    patientPhone?: string | null;
    otherPatientPhone?: string | null;
    consultationValue?: string | null;
    location?: string | null;
}

type PaymentMethod = "pix" | "card";

function zonedTimeToUtc(isoDate: string, time: string, timeZone: string) {
    try {
        const [year, month, day] = isoDate.split("-").map(Number);
        const [hour, minute] = time.split(":").map(Number);
        if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) {
            return null;
        }

        const candidate = new Date(Date.UTC(year, month - 1, day, hour, minute));
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });

        const mapped: Record<string, string> = {};
        for (const part of formatter.formatToParts(candidate)) {
            if (part.type !== "literal") {
                mapped[part.type] = part.value;
            }
        }

        const zoned = new Date(
            Date.UTC(
                Number(mapped.year),
                Number(mapped.month) - 1,
                Number(mapped.day),
                Number(mapped.hour),
                Number(mapped.minute),
                Number(mapped.second),
            ),
        );

        const offset = zoned.getTime() - candidate.getTime();
        return new Date(candidate.getTime() - offset);
    } catch (error) {
        console.warn("Falha ao converter horário local para UTC", error);
        return null;
    }
}

export default function ClientPayment({
    doctorId,
    date,
    time,
    forWhom,
    timezone,
    reason,
    otherPatientName,
    otherPatientCpf,
    otherPatientBirthDate,
    patientName,
    patientCpf,
    patientBirthDate,
    patientPhone,
    otherPatientPhone,
    consultationValue,
    location,
}: ClientPaymentProps) {
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const errorRef = useRef<HTMLDivElement | null>(null);

    const scheduledAt = useMemo(() => {
        const utcDate = zonedTimeToUtc(date, time, timezone);
        return utcDate ? utcDate.toISOString() : null;
    }, [date, time, timezone]);

    const normalizedReason = useMemo(() => (reason ?? "").trim(), [reason]);
    const normalizedLocation = useMemo(() => (location ?? "").trim(), [location]);
    const consultationValueNumber = useMemo(() => {
        if (consultationValue == null) return null;
        const parsed = Number(consultationValue);
        return Number.isFinite(parsed) ? parsed : null;
    }, [consultationValue]);
    const normalizedPatientName = useMemo(() => (patientName ?? "").trim(), [patientName]);
    const normalizedPatientCpf = useMemo(() => (patientCpf ?? "").replace(/\D/g, ""), [patientCpf]);
    const normalizedPatientBirthDate = useMemo(() => (patientBirthDate ?? "").trim(), [patientBirthDate]);
    const patientPhoneDigits = useMemo(
        () => (patientPhone ?? "").replace(/\D/g, ""),
        [patientPhone]
    );
    const normalizedOtherPatient = useMemo(() => {
        if (forWhom !== "other") return null;
        const name = (otherPatientName ?? "").trim();
        const cpf = (otherPatientCpf ?? "").replace(/\D/g, "");
        const birthDate = (otherPatientBirthDate ?? "").trim();
        const phoneDigits = (otherPatientPhone ?? "").replace(/\D/g, "");
        if (!name || !cpf || !birthDate || phoneDigits.length < 10) return null;
        return { name, cpf, birthDate, phone: phoneDigits };
    }, [forWhom, otherPatientName, otherPatientCpf, otherPatientBirthDate, otherPatientPhone]);

    const formattedOtherCpf = useMemo(() => {
        const digits = normalizedOtherPatient?.cpf ?? "";
        if (digits.length !== 11) return digits;
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }, [normalizedOtherPatient]);

    const formattedOtherBirthDate = useMemo(() => {
        const value = normalizedOtherPatient?.birthDate ?? "";
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const [year, month, day] = value.split("-");
        return `${day}/${month}/${year}`;
    }, [normalizedOtherPatient]);

    const formattedOtherPhone = useMemo(() => {
        const digits = normalizedOtherPatient?.phone ?? "";
        if (digits.length < 10) return digits;
        if (digits.length === 10) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        }
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }, [normalizedOtherPatient]);

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const patientIdFromToken = useMemo(() => {
        if (!token) return null;
        try {
            const [, payloadBase64] = token.split(".");
            if (!payloadBase64) return null;
            const decoded = JSON.parse(atob(payloadBase64));
            const id =
                decoded?.patientId ??
                decoded?.userId ??
                decoded?.sub ??
                decoded?.id ??
                null;
            return typeof id === "string" ? id : null;
        } catch (error) {
            console.warn("Falha ao extrair patientId do token", error);
            return null;
        }
    }, [token]);

    const primaryPatientReady = Boolean(
        patientIdFromToken &&
            normalizedPatientName.length > 0 &&
            normalizedPatientCpf.length === 11 &&
            normalizedPatientBirthDate &&
            patientPhoneDigits.length >= 10
    );

    const isActorReady = forWhom === "other" ? Boolean(normalizedOtherPatient) : primaryPatientReady;
    const isFormReady = Boolean(paymentMethod && scheduledAt && isActorReady);
    const isButtonDisabled = !isFormReady || isSubmitting;

    if (formError && errorRef.current) {
        errorRef.current.focus();
    }

    const handleSubmit = async () => {
        setFormError(null);

        if (!paymentMethod) {
            setFormError("Selecione um método de pagamento antes de continuar.");
            return;
        }

        if (!scheduledAt) {
            setFormError("Não foi possível calcular o horário da consulta. Volte e selecione novamente.");
            return;
        }

        const storedAppointments = readActiveAppointments();
        const existingAppointments = pruneExpiredAppointments(storedAppointments);
        if (existingAppointments.length !== storedAppointments.length) {
            writeActiveAppointments(existingAppointments);
        }

        if (existingAppointments.some((record) => record.doctorId === doctorId)) {
            setFormError(
                "Você já possui uma consulta ativa com este médico. Aguarde o atendimento ou cancele a consulta atual antes de agendar novamente."
            );
            return;
        }

        if (!isActorReady) {
            setFormError("Informe os dados de quem receberá a consulta.");
            return;
        }

        if (!patientIdFromToken) {
            setFormError("Não foi possível identificar o paciente titular. Faça login novamente.");
            return;
        }

        const paymentIntentId =
            typeof window !== "undefined" ? localStorage.getItem("paymentIntentId") : null;

        const bookingDateTime = new Date().toISOString();
        const targetFullName =
            forWhom === "other" && normalizedOtherPatient ? normalizedOtherPatient.name : normalizedPatientName;
        const targetCpf =
            forWhom === "other" && normalizedOtherPatient ? normalizedOtherPatient.cpf : normalizedPatientCpf;
        const targetBirthDate =
            forWhom === "other" && normalizedOtherPatient
                ? normalizedOtherPatient.birthDate
                : normalizedPatientBirthDate;
        const targetPhone =
            forWhom === "other" && normalizedOtherPatient ? normalizedOtherPatient.phone : patientPhoneDigits;
        const resolvedLocation = normalizedLocation.length > 0 ? normalizedLocation : "Local não informado";

        const payload: Record<string, unknown> = {
            doctorId,
            patientId: patientIdFromToken,
            appointmentDateTime: scheduledAt,
            bookingDateTime,
            consultationValue: consultationValueNumber ?? 0,
            patientCellPhone: targetPhone,
            patientFullName: targetFullName,
            patientCpf: targetCpf,
            patientBirthDate: targetBirthDate,
            location: resolvedLocation,
            reason: normalizedReason,
        };

        if (paymentIntentId) {
            payload.paymentIntentId = paymentIntentId;
        }

        if (paymentMethod) {
            payload.paymentMethod = paymentMethod;
        }

        console.info("[appointments:create]", {
            doctorId,
            appointmentDateTime: scheduledAt,
            bookingDateTime,
            paymentMethod,
        });

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/appointments", {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                if (response.status === 409) {
                    setFormError("Esse horário acabou de ser ocupado. Escolha outro.");
                    return;
                }
                if (response.status === 422) {
                    const result = await response.json().catch(() => null);
                    const firstError = result?.errors?.[0]?.message ?? result?.message;
                    setFormError(firstError ?? "Há informações faltando ou inválidas.");
                    return;
                }
                if (response.status === 401 || response.status === 403) {
                    setFormError("Sua sessão expirou. Faça login novamente.");
                    return;
                }
                if (response.status === 404) {
                    console.error("Endpoint /api/appointments não encontrado (HTTP 404).");
                    setFormError("Serviço indisponível no momento. Tente novamente em instantes.");
                    return;
                }

                const text = await response.text().catch(() => "");
                throw new Error(text || `Falha ao agendar (HTTP ${response.status})`);
            }

            const data = await response.json().catch(() => ({}));
            const appointmentId = data?.appointmentId ?? data?.id ?? "";

            const refreshedAppointments = pruneExpiredAppointments(readActiveAppointments()).filter(
                (record) => record.doctorId !== doctorId
            );
            refreshedAppointments.push({
                doctorId,
                appointmentId,
                scheduledAt,
                recordedAt: new Date().toISOString(),
            });
            writeActiveAppointments(refreshedAppointments);

            const params = new URLSearchParams({
                doctorId,
                date,
                time,
                forWhom,
                paymentMethod,
            });
            if (appointmentId) {
                params.set("appointmentId", appointmentId);
            }
            if (patientName) {
                params.set("patientName", patientName);
            }
            if (patientCpf) {
                params.set("cpf", patientCpf);
            }
            if (patientBirthDate) {
                params.set("birthDate", patientBirthDate);
            }
            if (patientPhoneDigits.length >= 10) {
                params.set("phone", patientPhoneDigits);
            }
            if (normalizedOtherPatient) {
                params.set("otherPatientName", normalizedOtherPatient.name);
                params.set("otherPatientCpf", normalizedOtherPatient.cpf);
                params.set("otherPatientBirthDate", normalizedOtherPatient.birthDate);
                params.set("otherPatientPhone", normalizedOtherPatient.phone);
            }

            router.push(`/confirmation?${params.toString()}`);
        } catch (error) {
            console.error("Erro ao criar agendamento", error);
            setFormError(error instanceof Error ? error.message : "Erro inesperado ao criar agendamento.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <div className="h-16" />
            <div className="mt-4 flex w-full items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-5xl">
                    <div className="mb-4 flex justify-end">
                        <Link
                            href="/medical-appointments"
                            className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50"
                        >
                            Fechar <X size={18} />
                        </Link>
                    </div>

                    <h2 className="px-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Seleção de Pagamento
                    </h2>

                    <div className="mb-6 mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
                        <h3 className="mb-4 text-2xl font-semibold text-gray-900">Escolha o método de pagamento</h3>
                        <div className="space-y-4">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="pix"
                                    checked={paymentMethod === "pix"}
                                    onChange={() => setPaymentMethod("pix")}
                                    className="h-5 w-5 border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">PIX</span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="card"
                                    checked={paymentMethod === "card"}
                                    onChange={() => setPaymentMethod("card")}
                                    className="h-5 w-5 border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Cartão de Crédito/Débito</span>
                            </label>
                        </div>
                    </div>

                    {forWhom === "other" && (
                        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
                            <h3 className="mb-4 text-2xl font-semibold text-gray-900">Para quem será a consulta?</h3>
                            {normalizedOtherPatient ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-500">
                                        Revisar os dados informados para o paciente que receberá a consulta:
                                    </p>
                                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold">Nome:</span> {normalizedOtherPatient.name}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold">CPF:</span>{" "}
                                            {formattedOtherCpf || normalizedOtherPatient.cpf}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold">Data de nascimento:</span>{" "}
                                            {formattedOtherBirthDate || normalizedOtherPatient.birthDate}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold">Telefone:</span>{" "}
                                            {formattedOtherPhone || normalizedOtherPatient.phone}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-red-600">
                                    Os dados da pessoa que receberá a consulta não foram informados corretamente. Volte
                                    e preencha para continuar.
                                </p>
                            )}
                        </div>
                    )}

                    {formError ? (
                        <div
                            ref={errorRef}
                            tabIndex={-1}
                            className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700"
                            role="alert"
                        >
                            {formError}
                        </div>
                    ) : null}

                    <div className="flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={isButtonDisabled}
                            className="rounded-lg bg-[#5179EF] px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                            {isSubmitting ? "Processando..." : "Continuar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
