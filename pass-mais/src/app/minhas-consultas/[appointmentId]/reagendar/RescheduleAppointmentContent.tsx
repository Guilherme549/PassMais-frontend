"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { jsonGet, jsonPost } from "@/lib/api";
import type { DoctorSchedule } from "@/app/medical-appointments/types";
import {
    Appointment,
    extractAppointmentsPayload,
    normalizeAppointments,
} from "../../utils/appointments";

interface RescheduleResponse {
    id?: string;
    doctorId?: string;
    patientId?: string;
    patientFullName?: string;
    patientCpf?: string;
    patientBirthDate?: string;
    patientCellPhone?: string;
    dateTime?: string;
    bookedAt?: string;
    value?: number;
    location?: string;
    status?: string;
}

type ScheduleStatus = "idle" | "loading" | "success" | "error";

const formatCurrency = (value?: number | null) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);

const formatCpf = (value?: string | null) => {
    const digits = (value ?? "").replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

const formatPhone = (value?: string | null) => {
    const digits = (value ?? "").replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatBirthDate = (value?: string | null) => {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-");
        return `${day}/${month}/${year}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        return value;
    }
    return value;
};

const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(parsed);
};

function normalizeIsoTime(slot: string) {
    const match = slot.match(/^(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : slot;
}

export default function RescheduleAppointmentContent() {
    const router = useRouter();
    const params = useParams<{ appointmentId: string }>();
    const appointmentId = params?.appointmentId ?? "";

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [appointmentStatus, setAppointmentStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
    const [appointmentError, setAppointmentError] = useState<string | null>(null);

    const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
    const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus>("idle");
    const [scheduleError, setScheduleError] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const [patientForm, setPatientForm] = useState({
        name: "",
        cpf: "",
        birthDate: "",
        phone: "",
    });
    const [patientDraft, setPatientDraft] = useState({
        name: "",
        cpf: "",
        birthDate: "",
        phone: "",
    });
    const [isEditingPatient, setIsEditingPatient] = useState(false);

    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmationData, setConfirmationData] = useState<RescheduleResponse | null>(null);

    useEffect(() => {
        if (!appointmentId) {
            router.replace("/minhas-consultas");
            return;
        }
        let cancelled = false;

        const loadAppointment = async () => {
            setAppointmentStatus("loading");
            setAppointmentError(null);
            try {
                const response = await jsonGet<unknown>("/api/patients/appointments");
                const parsed = extractAppointmentsPayload(response);
                const normalized = normalizeAppointments(parsed);
                const found = normalized.find((item) => item.id === appointmentId);
                if (!found) {
                    throw new Error("Consulta não encontrada.");
                }
                if (cancelled) return;
                setAppointment(found);
                const initialPatient = {
                    name: found.patientName ?? "",
                    cpf: found.patientCpf ?? "",
                    birthDate: found.patientBirthDate ?? "",
                    phone: found.patientPhone ?? "",
                };
                setPatientForm(initialPatient);
                setPatientDraft(initialPatient);
                setAppointmentStatus("success");
            } catch (error) {
                if (cancelled) return;
                setAppointmentStatus("error");
                setAppointmentError(
                    error instanceof Error ? error.message : "Não foi possível carregar a consulta selecionada."
                );
            }
        };

        void loadAppointment();

        return () => {
            cancelled = true;
        };
    }, [appointmentId, router]);

    useEffect(() => {
        if (!appointment || !appointment.doctorId) {
            setSchedule(null);
            if (appointment && !appointment.doctorId) {
                setScheduleError("Não foi possível identificar o médico desta consulta.");
                setScheduleStatus("error");
            }
            return;
        }

        let cancelled = false;

        const loadSchedule = async () => {
            setScheduleStatus("loading");
            setScheduleError(null);
            try {
                const data = await jsonGet<DoctorSchedule>(`/api/patient/doctors/${appointment.doctorId}/schedule`);
                if (cancelled) return;
                setSchedule(data);
                setScheduleStatus("success");
            } catch (error) {
                if (cancelled) return;
                setScheduleStatus("error");
                setScheduleError(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível carregar a agenda do médico. Tente novamente."
                );
            }
        };

        void loadSchedule();

        return () => {
            cancelled = true;
        };
    }, [appointment]);

    useEffect(() => {
        if (!schedule || selectedDate) return;
        const firstDay = schedule.days.find((day) => !day.blocked && day.slots.length > 0);
        if (firstDay) {
            setSelectedDate(firstDay.isoDate);
        }
    }, [schedule, selectedDate]);

    const selectedDay = useMemo(() => {
        if (!schedule || !selectedDate) return null;
        return schedule.days.find((day) => day.isoDate === selectedDate) ?? null;
    }, [schedule, selectedDate]);

    const availableSlots = selectedDay?.slots ?? [];

    const handleStartEditPatient = () => {
        setPatientDraft(patientForm);
        setIsEditingPatient(true);
    };

    const handleCancelEditPatient = () => {
        setIsEditingPatient(false);
        setPatientDraft(patientForm);
    };

    const handleSavePatientData = () => {
        setPatientForm({
            name: patientDraft.name.trim(),
            cpf: patientDraft.cpf.replace(/\D/g, ""),
            birthDate: patientDraft.birthDate.trim(),
            phone: patientDraft.phone.replace(/\D/g, ""),
        });
        setIsEditingPatient(false);
    };

    const handleConfirmReschedule = async () => {
        if (!appointment) return;
        if (!selectedDate || !selectedTime) {
            setFormError("Selecione uma nova data e horário antes de confirmar.");
            return;
        }

        setFormError(null);
        setIsSubmitting(true);

        try {
            const payload = {
                newDate: selectedDate,
                newTime: normalizeIsoTime(selectedTime),
            };
            const response = await jsonPost<RescheduleResponse>(
                `/api/patients/appointments/${appointment.id}/reschedule`,
                payload,
            );
            setConfirmationData(response);
        } catch (error) {
            const err = error as Error & { status?: number };
            let friendlyMessage =
                err.message || "Não foi possível reagendar a consulta. Tente novamente em instantes.";
            if (err.status === 400) {
                friendlyMessage = "Os dados enviados estão incompletos ou inválidos.";
            } else if (err.status === 401) {
                friendlyMessage = "Sua sessão expirou. Faça login novamente.";
                clearSessionAndRedirect(router);
            } else if (err.status === 404) {
                friendlyMessage = "Consulta não encontrada. Volte para Minhas Consultas e tente novamente.";
            } else if (err.status === 409) {
                friendlyMessage = "Este horário não está mais disponível. Escolha outra opção.";
            }
            setFormError(friendlyMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (appointmentStatus === "loading") {
        return (
            <div className="min-h-screen bg-gray-50">
                <NavBar />
                <div className="mt-40 text-center text-gray-600 text-lg">Carregando consulta...</div>
            </div>
        );
    }

    if (appointmentStatus === "error") {
        return (
            <div className="min-h-screen bg-gray-50">
                <NavBar />
                <div className="mt-32 flex flex-col items-center gap-4 px-4">
                    <p className="text-red-700 text-center max-w-xl">{appointmentError}</p>
                    <Link
                        href="/minhas-consultas"
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                        Voltar para Minhas Consultas
                    </Link>
                </div>
            </div>
        );
    }

    if (!appointment) return null;

    if (confirmationData) {
        const summaryDateTime = confirmationData.dateTime || `${selectedDate}T${selectedTime ?? "00:00"}`;
        const summaryLocation = confirmationData.location || appointment.location || appointment.clinicAddress;
        const summaryValue = confirmationData.value ?? appointment.price ?? appointment.consultationValue ?? 0;

        return (
            <div className="min-h-screen bg-gray-50">
                <NavBar />
                <div className="max-w-4xl mx-auto px-4 py-10 lg:py-16">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Reagendamento concluído</h1>
                        <Link
                            href="/minhas-consultas"
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                            Voltar para Minhas Consultas
                        </Link>
                    </div>

                    <div className="rounded-2xl bg-white shadow-lg border border-emerald-100 p-6 space-y-4">
                        <p className="text-emerald-700 font-semibold">
                            Sua consulta foi reagendada com sucesso!
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SummaryRow label="Médico" value={appointment.doctorName} />
                            <SummaryRow label="Nova data e horário" value={formatDateTime(summaryDateTime)} />
                            <SummaryRow label="Paciente" value={patientForm.name || appointment.patientName} />
                            <SummaryRow label="CPF" value={formatCpf(patientForm.cpf)} />
                            <SummaryRow label="Telefone" value={formatPhone(patientForm.phone)} />
                            <SummaryRow label="Valor da consulta" value={formatCurrency(summaryValue)} />
                            <SummaryRow label="Local" value={summaryLocation ?? "Local não informado"} />
                            <SummaryRow label="Status" value={confirmationData.status ?? "AGENDADA"} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <div className="max-w-5xl mx-auto px-4 py-10 lg:py-16">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Reagendar consulta</h1>
                    <Link
                        href="/minhas-consultas"
                        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
                    >
                        Cancelar
                    </Link>
                </div>

                <section className="mb-10 rounded-2xl bg-white shadow border border-gray-100 p-6">
                    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Agenda de {appointment.doctorName}
                            </h2>
                            <p className="text-gray-600 text-sm">
                                Selecione a nova data e horário disponíveis
                                {schedule?.timezone ? ` (${schedule.timezone})` : ""}
                            </p>
                        </div>
                        {scheduleStatus === "loading" ? (
                            <span className="text-sm text-gray-500">Carregando agenda...</span>
                        ) : null}
                    </header>

                    {scheduleStatus === "error" ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {scheduleError ??
                                "Não foi possível carregar a agenda do médico. Atualize a página e tente novamente."}
                        </div>
                    ) : null}

                    {schedule && schedule.days.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-3">
                                {schedule.days.map((day) => (
                                    <button
                                        key={day.isoDate}
                                        onClick={() => {
                                            setSelectedDate(day.isoDate);
                                            setSelectedTime(null);
                                        }}
                                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                                            selectedDate === day.isoDate
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-gray-800 border-gray-200 hover:border-gray-300"
                                        } ${day.blocked ? "opacity-50 cursor-not-allowed" : ""}`}
                                        disabled={day.blocked}
                                    >
                                        <span className="block text-xs uppercase text-gray-500">{day.label}</span>
                                        <span>{day.isoDate}</span>
                                    </button>
                                ))}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Horários disponíveis</h3>
                                {availableSlots.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot}
                                                onClick={() => setSelectedTime(slot)}
                                                className={`px-3 py-2 rounded-lg border text-sm transition ${
                                                    selectedTime === slot
                                                        ? "bg-blue-600 text-white border-blue-600"
                                                        : "bg-white text-gray-800 border-gray-200 hover:border-gray-300"
                                                }`}
                                            >
                                                {normalizeIsoTime(slot)}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Selecione uma data com horários livres.
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : scheduleStatus === "loading" ? null : (
                        <p className="text-gray-500 text-sm">
                            Nenhuma agenda disponível foi encontrada para este médico.
                        </p>
                    )}
                </section>

                <section className="mb-10 rounded-2xl bg-white shadow border border-gray-100 p-6">
                    <header className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Dados do paciente</h2>
                            <p className="text-sm text-gray-600">
                                Revise seus dados antes de confirmar o reagendamento.
                            </p>
                        </div>
                        {!isEditingPatient ? (
                            <button
                                onClick={handleStartEditPatient}
                                className="text-blue-600 font-medium hover:text-blue-700"
                            >
                                Editar dados
                            </button>
                        ) : null}
                    </header>

                    {isEditingPatient ? (
                        <div className="space-y-4">
                            <PatientInput
                                label="Nome completo"
                                value={patientDraft.name}
                                onChange={(value) => setPatientDraft((prev) => ({ ...prev, name: value }))}
                            />
                            <PatientInput
                                label="CPF"
                                value={formatCpf(patientDraft.cpf)}
                                onChange={(value) =>
                                    setPatientDraft((prev) => ({ ...prev, cpf: value.replace(/\D/g, "") }))
                                }
                            />
                            <PatientInput
                                label="Data de nascimento"
                                placeholder="AAAA-MM-DD"
                                value={patientDraft.birthDate}
                                onChange={(value) => setPatientDraft((prev) => ({ ...prev, birthDate: value }))}
                            />
                            <PatientInput
                                label="Celular"
                                value={formatPhone(patientDraft.phone)}
                                onChange={(value) =>
                                    setPatientDraft((prev) => ({ ...prev, phone: value.replace(/\D/g, "") }))
                                }
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                                    onClick={handleCancelEditPatient}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                    onClick={handleSavePatientData}
                                >
                                    Confirmar dados
                                </button>
                            </div>
                        </div>
                    ) : (
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <SummaryRow label="Nome" value={patientForm.name || appointment.patientName} />
                            <SummaryRow label="CPF" value={formatCpf(patientForm.cpf) || "—"} />
                            <SummaryRow label="Nascimento" value={formatBirthDate(patientForm.birthDate) || "—"} />
                            <SummaryRow label="Celular" value={formatPhone(patientForm.phone) || "—"} />
                        </dl>
                    )}
                </section>

                {formError ? (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {formError}
                    </div>
                ) : null}

                <div className="flex justify-end">
                    <button
                        onClick={handleConfirmReschedule}
                        disabled={!selectedDate || !selectedTime || scheduleStatus !== "success" || isSubmitting}
                        className={`px-6 py-3 rounded-xl text-white font-semibold transition ${
                            !selectedDate || !selectedTime || scheduleStatus !== "success" || isSubmitting
                                ? "bg-blue-300 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {isSubmitting ? "Confirmando..." : "Confirmar reagendamento"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-sm text-gray-500">{label}</dt>
            <dd className="text-base font-medium text-gray-900">{value || "—"}</dd>
        </div>
    );
}

function PatientInput({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="block">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <input
                type="text"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
        </label>
    );
}

function clearSessionAndRedirect(router: ReturnType<typeof useRouter>) {
    try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("role");
    } catch {
        // ignore
    }
    router.replace("/login");
}
