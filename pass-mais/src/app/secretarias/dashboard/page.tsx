"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardList, Clock, MapPin, User2, X } from "lucide-react";

import { useAppointments, useConfirmAttendance, useMyDoctors, type Appointment } from "@/hooks/team";
import { clearTokens, setTokens } from "@/lib/api";

type SexOption = "Feminino" | "Masculino" | "Outro" | "Não informado";

const SEX_OPTIONS: Array<{ value: SexOption; label: string }> = [
    { value: "Feminino", label: "Feminino" },
    { value: "Masculino", label: "Masculino" },
    { value: "Outro", label: "Outro" },
    { value: "Não informado", label: "Não informado" },
];

const STATUS_LABELS: Record<Appointment["status"], string> = {
    agendada: "Agendada",
    confirmada: "Confirmada",
    "em-andamento": "Em andamento",
    concluida: "Finalizada",
    cancelada: "Cancelada",
};

const STATUS_BADGE_TONES: Record<Appointment["status"], string> = {
    agendada: "bg-blue-50 text-blue-700 border-blue-100",
    confirmada: "bg-emerald-50 text-emerald-700 border-emerald-100",
    "em-andamento": "bg-amber-50 text-amber-700 border-amber-100",
    concluida: "bg-gray-100 text-gray-700 border-gray-200",
    cancelada: "bg-rose-50 text-rose-600 border-rose-100",
};

function formatDateTime(iso: string, options: Intl.DateTimeFormatOptions) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("pt-BR", options).format(date);
}

function formatFullDate(iso: string) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `${day} às ${time}`;
}

function sanitizeCpf(value: string) {
    return value.replace(/\D/g, "").slice(0, 11);
}

function maskCpf(value: string) {
    const digits = sanitizeCpf(value);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskBirthDate(value: string) {
    if (!value) return "";
    const trimmed = value.trim();
    if (trimmed.includes("-")) {
        const isoDate = trimmed.split("T")[0];
        const [year, month, day] = isoDate.split("-");
        if (year && month && day) {
            return `${day}/${month}/${year}`;
        }
    }
    const digits = trimmed.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

type PatientFormState = {
    fullName: string;
    cpf: string;
    birthDate: string;
    motherName: string;
    sex: SexOption;
    email: string;
    address: string;
};

const DEFAULT_FORM: PatientFormState = {
    fullName: "",
    cpf: "",
    birthDate: "",
    motherName: "",
    sex: "Não informado",
    email: "",
    address: "",
};

function extractPatientForm(appointment: Appointment): PatientFormState {
    const patient = appointment.patient;
    return {
        fullName: patient.name ?? "",
        cpf: maskCpf(patient.cpf ?? ""),
        birthDate: patient.birthDate ? maskBirthDate(patient.birthDate) : "",
        motherName: patient.motherName ?? "",
        sex: patient.sex ?? "Não informado",
        email: patient.email ?? "",
        address: patient.address ?? "",
    };
}

function normalizeBirthDateInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length === 8) {
        const day = digits.slice(0, 2);
        const month = digits.slice(2, 4);
        const year = digits.slice(4);
        return `${year}-${month}-${day}`;
    }
    return "";
}

type JwtPayload = {
    exp?: number;
    role?: string;
    [key: string]: unknown;
};

function decodeJwtPayload(token: string): JwtPayload | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const normalized = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        const json = atob(normalized);
        return JSON.parse(json) as JwtPayload;
    } catch {
        return null;
    }
}

const tokenExpired = (token: string) => {
    const payload = decodeJwtPayload(token);
    if (payload?.exp) {
        return payload.exp * 1000 <= Date.now();
    }
    return false;
};

export default function SecretaryDashboardPage() {
    const router = useRouter();
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"todos" | Appointment["status"]>("todos");
    const [patientNameFilter, setPatientNameFilter] = useState<string>("");
    const [patientCpfFilter, setPatientCpfFilter] = useState<string>("");
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [formState, setFormState] = useState<PatientFormState>(DEFAULT_FORM);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const { data: doctors } = useMyDoctors();

    useEffect(() => {
        try {
            const storedToken =
                localStorage.getItem("passmais:accessToken") || localStorage.getItem("accessToken");
            const storedRole = localStorage.getItem("passmais:role") || localStorage.getItem("role");
            const payload = storedToken ? decodeJwtPayload(storedToken) : null;
            const tokenRole = typeof payload?.role === "string" ? (payload.role as string) : null;
            const isSecretary = tokenRole === "SECRETARY" || storedRole === "SECRETARY";

            if (
                !storedToken ||
                tokenExpired(storedToken) ||
                !isSecretary
            ) {
                clearTokens();
                try {
                    localStorage.removeItem("passmais:accessToken");
                    localStorage.removeItem("passmais:role");
                    localStorage.removeItem("passmais:fullName");
                } catch {}
                router.replace("/secretarias/convite");
                return;
            }

            setTokens({ accessToken: storedToken });
        } catch {
            clearTokens();
            router.replace("/secretarias/convite");
        }
    }, [router]);

    const todayIso = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return startOfDay.toISOString();
    }, []);

    const appointmentFilters = useMemo(
        () => ({
            doctorIds: selectedDoctor ? [selectedDoctor] : undefined,
            from: todayIso,
        }),
        [selectedDoctor, todayIso],
    );

    const { data: appointments, isLoading, error, refetch } = useAppointments(appointmentFilters, {
        enabled: true,
    });

    useEffect(() => {
        if (!error) return;
        const status = (error as Error & { status?: number }).status;
        if (status === 401) {
            clearTokens();
            try {
                localStorage.removeItem("passmais:accessToken");
                localStorage.removeItem("passmais:role");
                localStorage.removeItem("passmais:fullName");
            } catch {}
            router.replace("/secretarias/convite");
        }
    }, [error, router]);

    const { mutateAsync: confirmAttendance, isPending: isConfirming } = useConfirmAttendance({
        onSuccess: () => {
            setSuccessMessage("Presença confirmada com sucesso!");
        },
        onError: (err) => {
            const status = (err as Error & { status?: number }).status;
            if (status === 401) {
                clearTokens();
                try {
                    localStorage.removeItem("passmais:accessToken");
                    localStorage.removeItem("passmais:role");
                    localStorage.removeItem("passmais:fullName");
                } catch {}
                router.replace("/secretarias/convite");
            }
        },
    });

    const upcomingAppointments = useMemo(() => {
        const normalizedNameFilter = patientNameFilter
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
        const normalizedCpfFilter = sanitizeCpf(patientCpfFilter);

        return appointments
            .filter((appointment) => {
                if (statusFilter !== "todos" && appointment.status !== statusFilter) {
                    return false;
                }

                if (normalizedNameFilter.length > 0) {
                    const normalizedPatientName = appointment.patient.name
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/\s+/g, " ")
                        .trim()
                        .toLowerCase();
                    if (!normalizedPatientName.includes(normalizedNameFilter)) {
                        return false;
                    }
                }

                if (normalizedCpfFilter.length > 0) {
                    const patientCpf = sanitizeCpf(appointment.patient.cpf ?? "");
                    if (!patientCpf.includes(normalizedCpfFilter)) {
                        return false;
                    }
                }

                const scheduledTime = new Date(appointment.scheduledAt).getTime();
                return scheduledTime >= new Date(todayIso).getTime();
            })
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }, [appointments, statusFilter, todayIso, patientNameFilter, patientCpfFilter]);

    const handleOpenModal = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setFormState(extractPatientForm(appointment));
        setFormError(null);
        setSuccessMessage(null);
    };

    const handleCloseModal = () => {
        if (isConfirming) return;
        setSelectedAppointment(null);
        setFormState(DEFAULT_FORM);
        setFormError(null);
        setSuccessMessage(null);
    };

    const handleFieldChange = (field: keyof PatientFormState, value: string) => {
        setFormState((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {
        if (!selectedAppointment) return;

        const trimmed = {
            fullName: formState.fullName.trim(),
            cpf: sanitizeCpf(formState.cpf),
            birthDate: normalizeBirthDateInput(formState.birthDate),
            motherName: formState.motherName.trim(),
            sex: formState.sex,
            email: formState.email.trim(),
            address: formState.address.trim(),
        };

        if (!trimmed.fullName || !trimmed.cpf || trimmed.cpf.length !== 11) {
            setFormError("Informe o nome completo e um CPF válido para o paciente.");
            return;
        }
        if (!trimmed.birthDate) {
            setFormError("Informe a data de nascimento no formato dd/mm/aaaa.");
            return;
        }
        if (!trimmed.motherName) {
            setFormError("Informe o nome da mãe do paciente.");
            return;
        }
        if (!trimmed.address) {
            setFormError("Informe o endereço completo do paciente.");
            return;
        }

        try {
            const updatedAppointment = await confirmAttendance({
                appointmentId: selectedAppointment.id,
                fullName: trimmed.fullName,
                cpf: trimmed.cpf,
                birthDate: trimmed.birthDate,
                motherName: trimmed.motherName,
                sex: trimmed.sex,
                email: trimmed.email || null,
                address: trimmed.address,
            });
            await refetch();
            if (updatedAppointment) {
                setSelectedAppointment(updatedAppointment);
                setFormState(extractPatientForm(updatedAppointment));
            }
        } catch (err) {
            setFormError(
                err instanceof Error
                    ? err.message
                    : "Não foi possível confirmar a presença. Tente novamente ou contate o suporte.",
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12">
            <div className="mx-auto flex max-w-6xl flex-col gap-8">
                <header className="space-y-2">
                    <div className="flex items-center gap-2 text-[#5179EF]">
                        <ClipboardList className="h-5 w-5" />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                            Painel da Secretaria
                        </span>
                    </div>
                    <h1 className="text-3xl font-semibold text-gray-900">
                        Consultas do dia e próximas agendas
                    </h1>
                    <p className="text-sm text-gray-500">
                        Confirme a presença dos pacientes e mantenha os dados cadastrais sempre atualizados
                        antes do encaminhamento ao médico.
                    </p>
                </header>

                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Selecionar médico
                            </p>
                            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                                <User2 className="h-4 w-4 text-gray-400" />
                                <select
                                    value={selectedDoctor ?? ""}
                                    onChange={(event) =>
                                        setSelectedDoctor(event.target.value || null)
                                    }
                                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                                >
                                    <option value="">Todos os médicos</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            {doctor.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Status da consulta
                            </p>
                            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(
                                            event.target.value as "todos" | Appointment["status"],
                                        )
                                    }
                                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                                >
                                    <option value="todos">Todos</option>
                                    <option value="agendada">Agendadas</option>
                                    <option value="confirmada">Confirmadas</option>
                                    <option value="em-andamento">Em andamento</option>
                                    <option value="concluida">Finalizadas</option>
                                    <option value="cancelada">Canceladas</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Paciente
                            </p>
                            <input
                                value={patientNameFilter}
                                onChange={(event) => setPatientNameFilter(event.target.value)}
                                placeholder="Buscar por nome completo"
                                className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                            />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                CPF
                            </p>
                            <input
                                value={patientCpfFilter}
                                onChange={(event) => setPatientCpfFilter(maskCpf(event.target.value))}
                                placeholder="000.000.000-00"
                                className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">Agendamentos</h2>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
                        >
                            Atualizar
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="mt-6 space-y-3">
                            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                        </div>
                    ) : error ? (
                        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
                            <p>{error.message || "Não foi possível carregar os agendamentos."}</p>
                        </div>
                    ) : upcomingAppointments.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                            <p className="text-sm font-semibold text-gray-700">
                                Nenhuma consulta encontrada para o filtro selecionado.
                            </p>
                        </div>
                    ) : (
                        <ul className="mt-6 space-y-4">
                            {upcomingAppointments.map((appointment) => (
                                <li
                                    key={appointment.id}
                                    className="rounded-2xl border border-gray-100 p-5 shadow-sm"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {appointment.patient.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Médico: {appointment.doctorName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatFullDate(appointment.scheduledAt)}
                                            </p>
                                            <p className="flex items-center gap-2 text-xs text-gray-400">
                                                <MapPin className="h-4 w-4" />
                                                {appointment.location}
                                            </p>
                                            <span
                                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                                    STATUS_BADGE_TONES[appointment.status]
                                                }`}
                                            >
                                                {STATUS_LABELS[appointment.status]}
                                                {appointment.checkInAt ? (
                                                    <span className="font-normal text-gray-500">
                                                        · check-in às{" "}
                                                        {formatDateTime(appointment.checkInAt, {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-start gap-2 md:items-end">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenModal(appointment)}
                                                className="inline-flex items-center gap-2 rounded-full bg-[#5179EF] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3f63d6] disabled:cursor-not-allowed disabled:bg-gray-400"
                                                disabled={appointment.status !== "agendada"}
                                            >
                                                Confirmar presença
                                            </button>
                                            {appointment.status === "confirmada" ? (
                                                <p className="flex items-center gap-2 text-xs text-emerald-600">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Presença confirmada
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {selectedAppointment ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Confirmar presença de {selectedAppointment.patient.name}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Valide o nome e CPF, atualize a ficha e confirme a chegada do paciente.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
                                disabled={isConfirming}
                                aria-label="Fechar"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600">
                            <p>
                                <span className="font-semibold text-gray-800">Consulta:</span>{" "}
                                {formatFullDate(selectedAppointment.scheduledAt)}
                            </p>
                            <p>
                                <span className="font-semibold text-gray-800">Médico:</span>{" "}
                                {selectedAppointment.doctorName}
                            </p>
                            <p>
                                <span className="font-semibold text-gray-800">Local:</span>{" "}
                                {selectedAppointment.location}
                            </p>
                        </div>

                        <form
                            className="mt-6 space-y-5 text-sm text-gray-700"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void handleSubmit();
                            }}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Nome completo
                                    </label>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        value={formState.fullName}
                                        onChange={(event) => handleFieldChange("fullName", event.target.value)}
                                        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="cpf" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        CPF
                                    </label>
                                    <input
                                        id="cpf"
                                        name="cpf"
                                        value={formState.cpf}
                                        onChange={(event) => handleFieldChange("cpf", maskCpf(event.target.value))}
                                        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="birthDate" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Data de nascimento
                                    </label>
                                    <input
                                        id="birthDate"
                                        name="birthDate"
                                        value={formState.birthDate}
                                        onChange={(event) => handleFieldChange("birthDate", maskBirthDate(event.target.value))}
                                        placeholder="dd/mm/aaaa"
                                        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="motherName" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Nome da mãe
                                    </label>
                                    <input
                                        id="motherName"
                                        name="motherName"
                                        value={formState.motherName}
                                        onChange={(event) => handleFieldChange("motherName", event.target.value)}
                                        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="sex" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Sexo
                                    </label>
                                    <select
                                        id="sex"
                                        name="sex"
                                        value={formState.sex}
                                        onChange={(event) => handleFieldChange("sex", event.target.value as SexOption)}
                                        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                        required
                                    >
                                        {SEX_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        E-mail (opcional)
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formState.email}
                                        onChange={(event) => handleFieldChange("email", event.target.value)}
                                        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="address" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Endereço completo
                                </label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formState.address}
                                    onChange={(event) => handleFieldChange("address", event.target.value)}
                                    rows={3}
                                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                    required
                                />
                            </div>

                            {formError ? (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                    {formError}
                                </div>
                            ) : null}
                            {successMessage ? (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                    {successMessage}
                                </div>
                            ) : null}

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:text-gray-400"
                                    disabled={isConfirming}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-full bg-[#5179EF] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#3f63d6] disabled:cursor-not-allowed disabled:bg-gray-400"
                                    disabled={isConfirming}
                                >
                                    {isConfirming ? "Confirmando..." : "Confirmar presença"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
