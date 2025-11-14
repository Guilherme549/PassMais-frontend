"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import Image from "next/image";
import { Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type {
    Doctor as DoctorSummary,
    DoctorSchedule,
    DoctorScheduleDay,
} from "@/app/medical-appointments/types";
import { decodeAccessTokenPayload } from "@/lib/token";

type ScheduleStatus = "idle" | "loading" | "success" | "error";

interface Doctor extends DoctorSummary {
    consultationFee?: number | null;
}

interface ClientDoctorProfileProps {
    doctor: Doctor;
    schedule: DoctorSchedule | null;
    scheduleStatus: ScheduleStatus;
    scheduleError: string | null;
    onRetrySchedule: () => void;
    initialDate?: string | null;
    initialTime?: string | null;
}

const DOCTOR_AVATAR_PLACEHOLDER = "/avatar-placeholer.jpeg";
const REASON_MAX_LENGTH = 200;

const joinAddressParts = (...parts: Array<string | null | undefined>) =>
    parts
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
        .join(", ");

const stripDigits = (value: string) => value.replace(/\D/g, "");

const normalizeComparable = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

const formatCpfValue = (value: string) => {
    const digits = stripDigits(value).slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) {
        return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }
    if (digits.length <= 9) {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

const formatPhoneValue = (value: string) => {
    const digits = stripDigits(value).slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

function zonedTimeToUtc(isoDate: string, time: string, timeZone: string) {
    try {
        const [year, month, day] = isoDate.split("-").map(Number);
        const [hour, minute] = time.split(":").map(Number);
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
        const parts = formatter.formatToParts(candidate);
        const data: Record<string, string> = {};
        for (const part of parts) {
            data[part.type] = part.value;
        }
        const tzDate = new Date(
            Date.UTC(
                Number(data.year),
                Number(data.month) - 1,
                Number(data.day),
                Number(data.hour),
                Number(data.minute),
                Number(data.second)
            )
        );
        const offset = tzDate.getTime() - candidate.getTime();
        return new Date(candidate.getTime() - offset);
    } catch {
        return null;
    }
}

function isSlotPast(day: DoctorScheduleDay, slot: string, schedule: DoctorSchedule | null) {
    if (!schedule) return false;
    const utcDate = zonedTimeToUtc(day.isoDate, slot, schedule.timezone);
    if (!utcDate) return false;
    return utcDate.getTime() <= Date.now();
}

function formatIsoDateLabel(isoDate: string, schedule: DoctorSchedule | null) {
    if (!schedule) return isoDate;
    const [year, month, day] = isoDate.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12));
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: schedule.timezone,
        weekday: "long",
        day: "2-digit",
        month: "long",
    }).format(utcDate);
}

function formatScheduleRange(schedule: DoctorSchedule | null) {
    if (!schedule) return null;
    const formatDate = (isoDate: string) => {
        const [year, month, day] = isoDate.split("-").map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day, 12));
        return new Intl.DateTimeFormat("pt-BR", {
            timeZone: schedule.timezone,
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(utcDate);
    };
    return `${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}`;
}

export default function ClientDoctorProfile({
    doctor,
    schedule,
    scheduleStatus,
    scheduleError,
    onRetrySchedule,
    initialDate = null,
    initialTime = null,
}: ClientDoctorProfileProps) {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [forWhom, setForWhom] = useState<string>("self");
    const [initialSelectionApplied, setInitialSelectionApplied] = useState(false);
    const [patientName, setPatientName] = useState("");
    const [cpf, setCpf] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [phone, setPhone] = useState("");
    const [appointmentReason, setAppointmentReason] = useState("");
    const [otherPatientName, setOtherPatientName] = useState("");
    const [otherCpf, setOtherCpf] = useState("");
    const [otherBirthDate, setOtherBirthDate] = useState("");
    const [otherPhone, setOtherPhone] = useState("");
    const [fieldErrors, setFieldErrors] = useState<{
        name?: string;
        cpf?: string;
        birthDate?: string;
        phone?: string;
        otherName?: string;
        otherCpf?: string;
        otherBirthDate?: string;
        otherPhone?: string;
    }>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [tokenSynced, setTokenSynced] = useState(false);

    useEffect(() => {
        if (tokenSynced) return;
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (!token) {
            setTokenSynced(true);
            return;
        }
        const payload = decodeAccessTokenPayload(token);
        if (!payload) {
            setTokenSynced(true);
            return;
        }

        const getString = (...keys: string[]) => {
            for (const key of keys) {
                const candidate = payload?.[key];
                if (typeof candidate === "string") {
                    const trimmed = candidate.trim();
                    if (trimmed.length > 0) return trimmed;
                }
            }
            return undefined;
        };

        if (!patientName) {
            const resolvedName =
                getString("fullName", "full_name", "name") ??
                (() => {
                    const given = getString("given_name", "givenName");
                    const family = getString("family_name", "familyName");
                    if (given && family) return `${given} ${family}`.trim();
                    return undefined;
                })();
            if (resolvedName) {
                setPatientName(resolvedName);
            }
        }

        if (!cpf) {
            const resolvedCpf = getString(
                "cpf",
                "taxId",
                "tax_id",
                "document",
                "documentNumber",
                "document_number"
            );
            if (resolvedCpf) {
                setCpf(formatCpfValue(resolvedCpf));
            }
        }

        if (!phone) {
            const resolvedPhone = getString(
                "phone",
                "phoneNumber",
                "phone_number",
                "mobile",
                "mobilePhone",
                "mobile_phone",
                "cellphone",
                "cell_phone",
                "contact",
                "contactPhone",
                "contact_phone"
            );
            if (resolvedPhone) {
                setPhone(formatPhoneValue(resolvedPhone));
            }
        }

        if (!birthDate) {
            const resolvedBirthRaw = getString(
                "birthDate",
                "birth_date",
                "dateOfBirth",
                "date_of_birth",
                "dob"
            );
            if (resolvedBirthRaw) {
                const normalized = (() => {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(resolvedBirthRaw)) return resolvedBirthRaw;
                    if (/^\d{2}\/\d{2}\/\d{4}$/.test(resolvedBirthRaw)) {
                        const [day, month, year] = resolvedBirthRaw.split("/");
                        return `${year}-${month}-${day}`;
                    }
                    const parsed = new Date(resolvedBirthRaw);
                    if (!Number.isNaN(parsed.getTime())) {
                        const yy = parsed.getFullYear();
                        const mm = String(parsed.getMonth() + 1).padStart(2, "0");
                        const dd = String(parsed.getDate()).padStart(2, "0");
                        return `${yy}-${mm}-${dd}`;
                    }
                    return "";
                })();
                if (normalized) {
                    setBirthDate(normalized);
                }
            }
        }

        setTokenSynced(true);
    }, [tokenSynced, patientName, cpf, birthDate, phone]);

    const upcomingDays = useMemo(() => {
        const baseDays = schedule?.days ?? [];
        if (!schedule) return baseDays;
        return baseDays.filter((day) => day.slots.some((slot) => !isSlotPast(day, slot, schedule)));
    }, [schedule]);
    const availableDays = useMemo(
        () => upcomingDays.filter((day) => !day.blocked && day.slots.length > 0),
        [upcomingDays]
    );
    const selectedDay = useMemo(
        () => upcomingDays.find((day) => day.isoDate === selectedDate) ?? null,
        [upcomingDays, selectedDate]
    );
    const scheduleRangeLabel = useMemo(() => formatScheduleRange(schedule), [schedule]);

    const normalizedPatientNameComparable = useMemo(() => {
        const value = patientName.trim();
        return value.length > 0 ? normalizeComparable(value) : "";
    }, [patientName]);

    const normalizedOtherNameComparable = useMemo(() => {
        const value = otherPatientName.trim();
        return value.length > 0 ? normalizeComparable(value) : "";
    }, [otherPatientName]);

    const primaryCpfDigits = useMemo(() => stripDigits(cpf), [cpf]);
    const primaryPhoneDigits = useMemo(() => stripDigits(phone), [phone]);
    const otherCpfDigitsValue = useMemo(() => stripDigits(otherCpf), [otherCpf]);

    const isOtherNameSameAsPatient =
        forWhom === "other" &&
        normalizedPatientNameComparable.length > 0 &&
        normalizedOtherNameComparable.length > 0 &&
        normalizedPatientNameComparable === normalizedOtherNameComparable;

    const isOtherCpfSameAsPatient =
        forWhom === "other" &&
        otherCpfDigitsValue.length === 11 &&
        primaryCpfDigits.length === 11 &&
        otherCpfDigitsValue === primaryCpfDigits;

    useEffect(() => {
        setInitialSelectionApplied(false);
    }, [initialDate, initialTime]);

    useEffect(() => {
        if (!schedule || availableDays.length === 0) {
            setSelectedDate(null);
            setSelectedTime(null);
            setInitialSelectionApplied(false);
            return;
        }

        if (!initialSelectionApplied) {
            const preferredDate =
                initialDate && availableDays.some((day) => day.isoDate === initialDate)
                    ? initialDate
                    : availableDays[0]?.isoDate ?? null;

            setSelectedDate(preferredDate);

            if (preferredDate && initialDate === preferredDate && initialTime) {
                const day = availableDays.find((day) => day.isoDate === preferredDate);
                if (day?.slots.includes(initialTime)) {
                    setSelectedTime(initialTime);
                } else {
                    setSelectedTime(null);
                }
            } else {
                setSelectedTime(null);
            }

            setInitialSelectionApplied(true);
            return;
        }

        setSelectedDate((prev) => {
            if (prev && availableDays.some((day) => day.isoDate === prev)) {
                return prev;
            }
            return availableDays[0]?.isoDate ?? null;
        });
    }, [schedule, availableDays, initialDate, initialTime, initialSelectionApplied]);

    useEffect(() => {
        if (!schedule || !selectedDate) {
            setSelectedTime(null);
            return;
        }

        const day = availableDays.find((item) => item.isoDate === selectedDate);
        if (!day) {
            setSelectedTime(null);
            return;
        }

        setSelectedTime((prev) => {
            if (!prev) return null;
            return day.slots.includes(prev) ? prev : null;
        });
    }, [selectedDate, availableDays, schedule]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const handleDateSelect = (isoDate: string) => {
        setSelectedDate(isoDate);
        setSelectedTime(null);
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
    };

    const handleSubmit = () => {
        if (!selectedDate || !selectedTime) {
            alert("Por favor, selecione uma data e um horário.");
            return;
        }

        if (!schedule?.timezone) {
            alert("Não foi possível identificar o fuso da agenda do médico.");
            return;
        }

        const errors: {
            name?: string;
            cpf?: string;
            birthDate?: string;
            phone?: string;
            otherName?: string;
            otherCpf?: string;
            otherBirthDate?: string;
            otherPhone?: string;
        } = {};
        const normalizedName = patientName.trim();

        if (normalizedName.length === 0) {
            errors.name = "Informe o nome completo do paciente.";
        }

        if (primaryCpfDigits.length === 0) {
            errors.cpf = "Informe o CPF do paciente.";
        } else if (primaryCpfDigits.length !== 11) {
            errors.cpf = "CPF inválido. É necessário informar 11 dígitos.";
        }

        if (!birthDate) {
            errors.birthDate = "Informe a data de nascimento do paciente.";
        } else {
            const parsedBirth = new Date(`${birthDate}T00:00:00`);
            if (Number.isNaN(parsedBirth.getTime())) {
                errors.birthDate = "Data de nascimento inválida.";
            } else {
                const today = new Date();
                let age = today.getFullYear() - parsedBirth.getFullYear();
                const monthDiff = today.getMonth() - parsedBirth.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedBirth.getDate())) {
                    age -= 1;
                }
                if (age < 18) {
                    errors.birthDate =
                        "Agendamentos para menores de 18 anos devem ser realizados por um responsável legal.";
                }
            }
        }

        if (primaryPhoneDigits.length === 0) {
            errors.phone = "Informe um telefone de contato.";
        } else if (primaryPhoneDigits.length < 10) {
            errors.phone = "Telefone inválido. Informe DDD + número.";
        }

        let otherPatientNameValue: string | null = null;
        let otherCpfDigits: string | null = null;
        let otherBirthDateValue: string | null = null;
        let otherPhoneDigits: string | null = null;

        if (forWhom === "other") {
            otherPatientNameValue = otherPatientName.trim();
            otherCpfDigits = stripDigits(otherCpf);
            otherBirthDateValue = otherBirthDate;
            otherPhoneDigits = stripDigits(otherPhone);

            if (otherPatientNameValue.length === 0) {
                errors.otherName = "Informe o nome completo da pessoa que receberá a consulta.";
            }
            if (
                otherPatientNameValue.length > 0 &&
                normalizedName.length > 0 &&
                normalizeComparable(otherPatientNameValue) === normalizeComparable(normalizedName)
            ) {
                errors.otherName =
                    "O nome da pessoa que receberá a consulta deve ser diferente do titular da conta.";
            }

            if (!otherCpfDigits) {
                errors.otherCpf = "Informe o CPF da pessoa que receberá a consulta.";
            } else if (otherCpfDigits.length !== 11) {
                errors.otherCpf = "CPF inválido. É necessário informar 11 dígitos.";
            } else if (otherCpfDigits === primaryCpfDigits) {
                errors.otherCpf =
                    "O CPF da pessoa que receberá a consulta deve ser diferente do CPF informado nos dados principais.";
            }

            if (!otherBirthDateValue) {
                errors.otherBirthDate = "Informe a data de nascimento da pessoa que receberá a consulta.";
            } else {
                const parsed = new Date(`${otherBirthDateValue}T00:00:00`);
                if (Number.isNaN(parsed.getTime())) {
                    errors.otherBirthDate = "Data de nascimento inválida.";
                }
            }

            if (!otherPhoneDigits) {
                errors.otherPhone = "Informe o telefone da pessoa que receberá a consulta.";
            } else if (otherPhoneDigits.length < 10) {
                errors.otherPhone = "Telefone inválido. Informe DDD + número.";
            }
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setFormError("Revise as informações do paciente para continuar.");
            return;
        }

        setFieldErrors({});
        setFormError(null);

        const trimmedReason = appointmentReason.trim();
        const locationLabel = (() => {
            const locationPieces: string[] = [];
            if (doctor.clinicName) {
                locationPieces.push(doctor.clinicName);
            } else if (doctor.address) {
                locationPieces.push(doctor.address);
            }
            const addressPieces = joinAddressParts(
                doctor.clinicStreetAndNumber,
                doctor.clinicCity,
                doctor.clinicState,
                doctor.clinicPostalCode
            );
            if (addressPieces.length > 0 && !locationPieces.includes(addressPieces)) {
                locationPieces.push(addressPieces);
            }
            return locationPieces.join(" - ");
        })();

        const params = new URLSearchParams({
            doctorId: doctor.id,
            date: selectedDate,
            time: selectedTime,
            forWhom,
            timezone: schedule.timezone,
            patientName: normalizedName,
            cpf: primaryCpfDigits,
            birthDate,
        });
        if (locationLabel.length > 0) {
            params.set("location", locationLabel);
        }
        if (typeof doctor.consultationFee === "number") {
            params.set("consultationValue", String(doctor.consultationFee));
        }
        if (primaryPhoneDigits.length >= 10) {
            params.set("phone", primaryPhoneDigits);
        }

        if (
            forWhom === "other" &&
            otherPatientNameValue &&
            otherCpfDigits &&
            otherBirthDateValue &&
            otherPhoneDigits &&
            otherPhoneDigits.length >= 10
        ) {
            params.set("otherPatientName", otherPatientNameValue);
            params.set("otherPatientCpf", otherCpfDigits);
            params.set("otherPatientBirthDate", otherBirthDateValue);
            params.set("otherPatientPhone", otherPhoneDigits);
        }

        if (trimmedReason.length > 0) {
            params.set("reason", trimmedReason);
        }

        router.push(`/payment?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <div className="h-16"></div>
            <div className="flex justify-center items-center w-full px-4 sm:px-6 lg:px-8 mt-4">
                <div className="w-full max-w-5xl">
                    {/* Botão Fechar */}
                    <div className="flex justify-end mb-4">
                        <Link
                            href="/medical-appointments"
                            className="flex items-center gap-2 bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg 
                hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 
                transition-all duration-200"
                        >
                            Fechar <X size={18} />
                        </Link>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 px-2 tracking-tight">
                        Perfil do Médico
                    </h2>

                    {/* Perfil do Médico */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-6 mb-4">
                            <div className="relative w-32 h-32 flex-shrink-0">
                                <Image
                                    src={doctor.photo ?? DOCTOR_AVATAR_PLACEHOLDER}
                                    alt={`Foto de ${doctor.name}`}
                                    fill
                                    className="rounded-xl object-cover border-4 border-gray-100"
                                />
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-2">{doctor.name}</h3>
                                <p className="text-gray-600 mb-2">{doctor.specialty}</p>
                                <p className="text-gray-600 mb-2">CRM: {doctor.crm}</p>
                                <div className="flex items-center gap-1 mb-2">
                                    <Star className="text-yellow-400" size={16} />
                                    <span className="text-gray-600">
                                        {(doctor.averageRating ?? 0).toFixed(1)} ({doctor.reviewsCount ?? 0} avaliações)
                                    </span>
                                </div>
                            </div>
                        </div>
                        {(doctor.clinicName || doctor.clinicStreetAndNumber || doctor.clinicCity || doctor.address) && (
                            <div className="text-gray-600 mb-2">
                                <p className="font-semibold text-gray-700">Local de atendimento</p>
                                <div className="space-y-1">
                                    {doctor.clinicName && <p>{doctor.clinicName}</p>}
                                    {(doctor.clinicStreetAndNumber || doctor.clinicCity) && (
                                        <p>{joinAddressParts(doctor.clinicStreetAndNumber, doctor.clinicCity)}</p>
                                    )}
                                    {doctor.clinicPostalCode && <p>CEP: {doctor.clinicPostalCode}</p>}
                                    {!doctor.clinicName && !doctor.clinicStreetAndNumber && !doctor.clinicCity && doctor.address && (
                                        <p>{doctor.address}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        <p className="text-gray-600 mb-4">{doctor.bio || "Biografia não informada."}</p>
                        <p className="text-gray-600 font-semibold">
                            Valor da consulta: {formatCurrency(doctor.consultationFee ?? 0)}
                        </p>
                    </div>

                    {/* Agenda */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Agenda</h3>
                        {scheduleRangeLabel && (
                            <p className="mb-4 text-sm text-gray-500">
                                Agenda disponível entre {scheduleRangeLabel} ({schedule?.timezone})
                            </p>
                        )}
                        <div className="space-y-4">
                            {scheduleStatus === "loading" || scheduleStatus === "idle" ? (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#5179EF]" />
                                    <span>Carregando agenda...</span>
                                </div>
                            ) : scheduleStatus === "error" ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    <p>{scheduleError ?? "Não foi possível carregar a agenda."}</p>
                                    <button
                                        type="button"
                                        onClick={onRetrySchedule}
                                        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1 font-medium hover:bg-red-100"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            ) : availableDays.length === 0 ? (
                                <p className="text-gray-600">Nenhum horário disponível.</p>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-gray-700 mb-2">Selecione a data:</label>
                                        <div className="flex flex-wrap gap-2">
                                            {upcomingDays.map((day) => {
                                                const hasSlots = !day.blocked && day.slots.length > 0;
                                                return (
                                                    <button
                                                        key={day.isoDate}
                                                        type="button"
                                                        onClick={() => hasSlots && handleDateSelect(day.isoDate)}
                                                        disabled={!hasSlots}
                                                        className={`rounded-lg border px-4 py-2 text-sm transition ${
                                                            selectedDate === day.isoDate
                                                                ? "border-[#5179EF] bg-[#F3F6FF] text-[#1E3D8F]"
                                                                : hasSlots
                                                                ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                                                : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                                        }`}
                                                    >
                                                        {formatIsoDateLabel(day.isoDate, schedule)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {selectedDate && selectedDay && (
                                        <div>
                                            <label className="block text-gray-700 mb-2">Selecione o horário:</label>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedDay.slots.map((time) => {
                                                    const past = isSlotPast(selectedDay, time, schedule);
                                                    return (
                                                        <button
                                                            key={time}
                                                            type="button"
                                                            onClick={() => !past && handleTimeSelect(time)}
                                                            disabled={past}
                                                            className={`rounded-lg border px-4 py-2 text-sm transition ${
                                                                selectedTime === time
                                                                    ? "border-[#5179EF] bg-[#F3F6FF] text-[#1E3D8F]"
                                                                    : past
                                                                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                                            }`}
                                                        >
                                                            {time}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Para quem será a consulta */}
                    {forWhom !== "other" && (
                        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Dados do paciente</h3>
                            <p className="text-sm text-gray-500 mb-2">
                                Informe ou confirme os dados pessoais do paciente para prosseguir com o agendamento.
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex flex-col">
                                    <label htmlFor="patient-name" className="mb-2 text-gray-700">
                                        Nome completo
                                    </label>
                                    <input
                                        id="patient-name"
                                        name="patient-name"
                                        type="text"
                                        value={patientName}
                                        onChange={(event) => {
                                            setPatientName(event.target.value);
                                            setFieldErrors((prev) => ({ ...prev, name: undefined }));
                                            setFormError(null);
                                        }}
                                        placeholder="Nome completo do paciente"
                                        className={`w-full rounded-lg border px-4 py-2 text-gray-700 transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20 ${
                                            fieldErrors.name ? "border-red-400" : "border-gray-300"
                                        }`}
                                    />
                                    {fieldErrors.name && (
                                        <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="patient-cpf" className="mb-2 text-gray-700">
                                        CPF
                                    </label>
                                    <input
                                        id="patient-cpf"
                                        name="patient-cpf"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        value={cpf}
                                        onChange={(event) => {
                                            setCpf(formatCpfValue(event.target.value));
                                            setFieldErrors((prev) => ({ ...prev, cpf: undefined }));
                                            setFormError(null);
                                        }}
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                        className={`w-full rounded-lg border px-4 py-2 text-gray-700 transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20 ${
                                            fieldErrors.cpf ? "border-red-400" : "border-gray-300"
                                        }`}
                                    />
                                    {fieldErrors.cpf && (
                                        <p className="mt-1 text-sm text-red-600">{fieldErrors.cpf}</p>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="patient-phone" className="mb-2 text-gray-700">
                                        Telefone
                                    </label>
                                    <input
                                        id="patient-phone"
                                        name="patient-phone"
                                        type="tel"
                                        inputMode="tel"
                                        value={phone}
                                        onChange={(event) => {
                                            setPhone(formatPhoneValue(event.target.value));
                                            setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                                            setFormError(null);
                                        }}
                                        placeholder="(00) 00000-0000"
                                        maxLength={16}
                                        className={`w-full rounded-lg border px-4 py-2 text-gray-700 transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20 ${
                                            fieldErrors.phone ? "border-red-400" : "border-gray-300"
                                        }`}
                                    />
                                    {fieldErrors.phone && (
                                        <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="patient-birthdate" className="mb-2 text-gray-700">
                                        Data de nascimento
                                    </label>
                                    <input
                                        id="patient-birthdate"
                                        name="patient-birthdate"
                                        type="date"
                                        value={birthDate}
                                        onChange={(event) => {
                                            setBirthDate(event.target.value);
                                            setFieldErrors((prev) => ({ ...prev, birthDate: undefined }));
                                            setFormError(null);
                                        }}
                                        className={`w-full rounded-lg border px-4 py-2 text-gray-700 transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20 ${
                                            fieldErrors.birthDate ? "border-red-400" : "border-gray-300"
                                        }`}
                                    />
                                    {fieldErrors.birthDate && (
                                        <p className="mt-1 text-sm text-red-600">{fieldErrors.birthDate}</p>
                                    )}
                                </div>
                                <div className="flex flex-col md:col-span-2">
                                    <label htmlFor="appointment-reason" className="mb-2 text-gray-700">
                                        Motivo da consulta (opcional)
                                    </label>
                                    <textarea
                                        id="appointment-reason"
                                        name="appointment-reason"
                                        value={appointmentReason}
                                        onChange={(event) => {
                                            setAppointmentReason(event.target.value);
                                            setFormError(null);
                                        }}
                                        maxLength={REASON_MAX_LENGTH}
                                        rows={4}
                                        placeholder="Compartilhe o que motivou o agendamento, sintomas ou orientações adicionais."
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                    />
                                    <div className="mt-1 flex flex-col gap-1">
                                        <p className="text-sm text-gray-500">
                                            Essa informação é opcional e auxilia o médico a se preparar para a consulta.
                                        </p>
                                        <p
                                            className={`text-xs ${
                                                appointmentReason.length >= REASON_MAX_LENGTH
                                                    ? "text-red-600"
                                                    : "text-gray-500"
                                            }`}
                                        >
                                            {appointmentReason.length >= REASON_MAX_LENGTH
                                                ? `Você atingiu o limite de ${REASON_MAX_LENGTH} caracteres.`
                                                : `Restam ${REASON_MAX_LENGTH - appointmentReason.length} caracteres.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Para quem será a consulta */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Para quem será a consulta?</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Selecione uma opção:</label>
                                <select
                                    value={forWhom}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setForWhom(value);
                                        setFieldErrors((prev) => ({
                                            ...prev,
                                            otherName: undefined,
                                            otherCpf: undefined,
                                            otherBirthDate: undefined,
                                            otherPhone: undefined,
                                        }));
                                        setFormError(null);
                                        if (value !== "other") {
                                            setOtherPatientName("");
                                            setOtherCpf("");
                                            setOtherBirthDate("");
                                            setOtherPhone("");
                                        }
                                    }}
                                    className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                >
                                    <option value="self">
                                        {patientName ? `Para mim (${patientName})` : "Para mim"}
                                    </option>
                                    <option value="other">Outra pessoa</option>
                                </select>
                            </div>
                            {forWhom === "other" && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">
                                        Informe os dados da pessoa que receberá a consulta.
                                    </p>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="flex flex-col md:col-span-3">
                                            <label htmlFor="other-patient-name" className="mb-2 text-gray-700">
                                                Nome completo
                                            </label>
                                            <input
                                                id="other-patient-name"
                                                name="other-patient-name"
                                                type="text"
                                                value={otherPatientName}
                                                onChange={(event) => {
                                                    setOtherPatientName(event.target.value);
                                                    setFieldErrors((prev) => ({ ...prev, otherName: undefined }));
                                                    setFormError(null);
                                                }}
                                                placeholder="Nome completo do paciente"
                                                className={`w-full rounded-lg border px-4 py-2 text-gray-700 transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20 ${
                                                    fieldErrors.otherName ? "border-red-400" : "border-gray-300"
                                                }`}
                                            />
                                            {fieldErrors.otherName ? (
                                                <p className="mt-1 text-sm text-red-600">{fieldErrors.otherName}</p>
                                            ) : isOtherNameSameAsPatient ? (
                                                <p className="mt-1 text-sm text-red-600">
                                                    Utilize o campo acima apenas para o titular. Informe o nome da outra
                                                    pessoa aqui.
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="other-patient-cpf" className="mb-2 text-gray-700">
                                                CPF
                                            </label>
                                            <input
                                                id="other-patient-cpf"
                                                name="other-patient-cpf"
                                                type="text"
                                                value={otherCpf}
                                                onChange={(event) => {
                                                    setOtherCpf(formatCpfValue(event.target.value));
                                                    setFieldErrors((prev) => ({ ...prev, otherCpf: undefined }));
                                                    setFormError(null);
                                                }}
                                                placeholder="000.000.000-00"
                                                maxLength={14}
                                                className={`w-full rounded-lg border px-4 py-2 text-gray-700 transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20 ${
                                                    fieldErrors.otherCpf ? "border-red-400" : "border-gray-300"
                                                }`}
                                            />
                                            {fieldErrors.otherCpf && (
                                                <p className="mt-1 text-sm text-red-600">{fieldErrors.otherCpf}</p>
                                            )}
                                            {!fieldErrors.otherCpf && isOtherCpfSameAsPatient && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    Informe um CPF diferente do cadastrado nos dados principais.
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="other-patient-birthdate" className="mb-2 text-gray-700">
                                                Data de nascimento
                                            </label>
                                            <input
                                                id="other-patient-birthdate"
                                                name="other-patient-birthdate"
                                                type="date"
                                                value={otherBirthDate}
                                                onChange={(event) => {
                                                    setOtherBirthDate(event.target.value);
                                                    setFieldErrors((prev) => ({ ...prev, otherBirthDate: undefined }));
                                                    setFormError(null);
                                                }}
                                                className={`w-full rounded-lg border px-4 py-2 text-gray-700 transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20 ${
                                                    fieldErrors.otherBirthDate ? "border-red-400" : "border-gray-300"
                                                }`}
                                            />
                                            {fieldErrors.otherBirthDate && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {fieldErrors.otherBirthDate}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="other-patient-phone" className="mb-2 text-gray-700">
                                                Telefone
                                            </label>
                                            <input
                                                id="other-patient-phone"
                                                name="other-patient-phone"
                                                type="tel"
                                                inputMode="tel"
                                                value={otherPhone}
                                                onChange={(event) => {
                                                    setOtherPhone(formatPhoneValue(event.target.value));
                                                    setFieldErrors((prev) => ({ ...prev, otherPhone: undefined }));
                                                    setFormError(null);
                                                }}
                                                placeholder="(00) 00000-0000"
                                                maxLength={16}
                                                className={`w-full rounded-lg border px-4 py-2 text-gray-700 transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20 ${
                                                    fieldErrors.otherPhone ? "border-red-400" : "border-gray-300"
                                                }`}
                                            />
                                            {fieldErrors.otherPhone && (
                                                <p className="mt-1 text-sm text-red-600">{fieldErrors.otherPhone}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="appointment-reason" className="mb-2 text-gray-700">
                                            Motivo da consulta (opcional)
                                        </label>
                                        <textarea
                                            id="appointment-reason"
                                            name="appointment-reason"
                                            value={appointmentReason}
                                            onChange={(event) => {
                                                setAppointmentReason(event.target.value);
                                                setFormError(null);
                                            }}
                                            maxLength={REASON_MAX_LENGTH}
                                            rows={4}
                                            placeholder="Compartilhe por que essa pessoa precisa da consulta."
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                        />
                                        <div className="mt-1 flex flex-col gap-1">
                                            <p className="text-sm text-gray-500">
                                                Essa informação ajuda o médico a se preparar para o atendimento da outra
                                                pessoa.
                                            </p>
                                            <p
                                                className={`text-xs ${
                                                    appointmentReason.length >= REASON_MAX_LENGTH
                                                        ? "text-red-600"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                {appointmentReason.length >= REASON_MAX_LENGTH
                                                    ? `Você atingiu o limite de ${REASON_MAX_LENGTH} caracteres.`
                                                    : `Restam ${REASON_MAX_LENGTH - appointmentReason.length} caracteres.`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botão Continuar */}
                    {formError && (
                        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            {formError}
                        </div>
                    )}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSubmit}
                            className="bg-[#5179EF] text-white font-medium px-6 py-3 rounded-lg 
                hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 
                transition-all duration-200"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
