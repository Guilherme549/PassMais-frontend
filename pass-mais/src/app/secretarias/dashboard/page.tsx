"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, ClipboardList, Clock, LogOut, MapPin, User2, X } from "lucide-react";

import { useConfirmAttendance, useDoctorAppointments, useMyDoctors, type Appointment } from "@/hooks/team";
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

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_APPOINTMENT_SORT = "dateTime,asc";

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

function formatCurrency(value: number | null | undefined) {
    if (value == null) return "-";
    try {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    } catch {
        return value.toString();
    }
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

function formatCellPhone(value: string | null | undefined) {
    if (!value) return "-";
    const digits = value.replace(/\D/g, "");
    if (digits.length === 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 9) {
        return `${digits.slice(0, 1)} ${digits.slice(1, 5)}-${digits.slice(5)}`;
    }
    return value;
}

function sanitizePhone(value: string) {
    return value.replace(/\D/g, "").slice(0, 11);
}

function maskPhone(value: string) {
    const digits = sanitizePhone(value);
    if (digits.length === 0) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

type PatientFormState = {
    fullName: string;
    cpf: string;
    birthDate: string;
    motherName: string;
    sex: SexOption;
    email: string;
    phone: string;
    address: string;
    insuranceProvider: string;
    insuranceNumber: string;
};

const DEFAULT_FORM: PatientFormState = {
    fullName: "",
    cpf: "",
    birthDate: "",
    motherName: "",
    sex: "Não informado",
    email: "",
    phone: "",
    address: "",
    insuranceProvider: "",
    insuranceNumber: "",
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
        phone: maskPhone(patient.cellPhone ?? ""),
        insuranceProvider: appointment.patient.insuranceProvider ?? "",
        insuranceNumber: appointment.patient.insuranceNumber ?? "",
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
    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

    const {
        data: doctors,
        isLoading: isLoadingDoctors,
        error: doctorsError,
        refetch: refetchDoctors,
    } = useMyDoctors();

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
            void refetchDoctors();
        } catch {
            clearTokens();
            router.replace("/secretarias/convite");
        }
    }, [router, refetchDoctors]);

    useEffect(() => {
        if (isLoadingDoctors) return;
        if (!doctors || doctors.length === 0) {
            setSelectedDoctor(null);
            return;
        }
        if (selectedDoctor && doctors.some((doctor) => doctor.id === selectedDoctor)) {
            return;
        }
        if (doctors.length === 1) {
            setSelectedDoctor(doctors[0].id);
            return;
        }
        if (!selectedDoctor) {
            setSelectedDoctor(doctors[0].id);
        }
    }, [doctors, isLoadingDoctors, selectedDoctor]);

    useEffect(() => {
        setPage(0);
        setSelectedAppointment(null);
    }, [selectedDoctor]);

    const {
        data: appointments,
        isLoading,
        error,
        refetch,
        totalElements,
        page: currentPage,
        pageSize: currentPageSize,
    } = useDoctorAppointments({
        doctorId: selectedDoctor,
        page,
        pageSize,
        sort: DEFAULT_APPOINTMENT_SORT,
        enabled: Boolean(selectedDoctor),
    });

    useEffect(() => {
        if (typeof currentPage === "number" && currentPage !== page) {
            setPage(currentPage);
        }
    }, [currentPage, page]);

    useEffect(() => {
        if (typeof currentPageSize === "number" && currentPageSize > 0 && currentPageSize !== pageSize) {
            setPageSize(currentPageSize);
        }
    }, [currentPageSize, pageSize]);

    const effectivePageSize = currentPageSize > 0 ? currentPageSize : pageSize || DEFAULT_PAGE_SIZE;
    const totalPages =
        selectedDoctor && effectivePageSize > 0
            ? Math.ceil((totalElements ?? 0) / effectivePageSize)
            : 0;

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

    const filteredAppointments = useMemo(() => {
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
                return true;
            })
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }, [appointments, statusFilter, patientNameFilter, patientCpfFilter]);

    const safeTotalPages = totalPages > 0 ? totalPages : filteredAppointments.length > 0 ? 1 : 0;
    const displayPage = safeTotalPages === 0 ? 0 : Math.min(page + 1, safeTotalPages);
    const totalItems = selectedDoctor
        ? (totalElements >= 0 ? totalElements : filteredAppointments.length)
        : 0;

    const appointmentDetailItems = useMemo(() => {
        if (!selectedAppointment) return [];
        return [
            {
                label: "Motivo da consulta",
                value: selectedAppointment.reason || "Não informado",
            },
            {
                label: "Observações",
                value: selectedAppointment.observations || "Sem observações registradas",
            },
            {
                label: "Notas pré-consulta",
                value: selectedAppointment.preConsultNotes || "Sem notas adicionadas",
            },
            {
                label: "Duração dos sintomas",
                value: selectedAppointment.symptomDuration || "Não informado",
            },
            {
                label: "Valor da consulta",
                value: formatCurrency(selectedAppointment.value ?? null),
            },
            {
                label: "Agendado em",
                value: selectedAppointment.bookedAt ? formatFullDate(selectedAppointment.bookedAt) : "-",
            },
            {
                label: "Criado em",
                value: selectedAppointment.createdAt ? formatFullDate(selectedAppointment.createdAt) : "-",
            },
            {
                label: "Finalizado em",
                value: selectedAppointment.finalizedAt ? formatFullDate(selectedAppointment.finalizedAt) : "-",
            },
            {
                label: "CPF do paciente",
                value: selectedAppointment.patient.cpf ? maskCpf(selectedAppointment.patient.cpf) : "-",
            },
            {
                label: "Nascimento do paciente",
                value: selectedAppointment.patient.birthDate
                    ? maskBirthDate(selectedAppointment.patient.birthDate)
                    : "-",
            },
            {
                label: "Celular do paciente",
                value: formatCellPhone(selectedAppointment.patient.cellPhone),
            },
            {
                label: "Convênio",
                value: selectedAppointment.patient.insuranceProvider || "Não informado",
            },
            {
                label: "Número do convênio",
                value: selectedAppointment.patient.insuranceNumber || "-",
            },
            {
                label: "Código do dependente",
                value: selectedAppointment.dependentId || "-",
            },
            {
                label: "Reagendado de",
                value: selectedAppointment.rescheduledFromId || "-",
            },
        ];
    }, [selectedAppointment]);

    const canConfirmPresence = selectedAppointment?.status === "agendada";

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

    const goToPreviousPage = () => {
        setPage((prev) => Math.max(prev - 1, 0));
        setSelectedAppointment(null);
    };

    const goToNextPage = () => {
        if (safeTotalPages === 0) return;
        setPage((prev) => Math.min(prev + 1, safeTotalPages - 1));
        setSelectedAppointment(null);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setPage(0);
        setSelectedAppointment(null);
    };

    const handleSubmit = async () => {
        if (!selectedAppointment || !canConfirmPresence) return;

        const trimmed = {
            fullName: formState.fullName.trim(),
            cpf: sanitizeCpf(formState.cpf),
            birthDate: normalizeBirthDateInput(formState.birthDate),
            motherName: formState.motherName.trim(),
            sex: formState.sex,
            email: formState.email.trim(),
            phone: sanitizePhone(formState.phone),
            address: formState.address.trim(),
            insuranceProvider: formState.insuranceProvider.trim(),
            insuranceNumber: formState.insuranceNumber.trim(),
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
        if (!trimmed.phone || trimmed.phone.length < 10) {
            setFormError("Informe um telefone de contato válido (DDD + número).");
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
                phone: trimmed.phone,
                address: trimmed.address,
                insuranceProvider: trimmed.insuranceProvider || null,
                insuranceNumber: trimmed.insuranceNumber || null,
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

    const handleLogout = () => {
        clearTokens();
        try {
            localStorage.removeItem("passmais:accessToken");
            localStorage.removeItem("passmais:role");
            localStorage.removeItem("passmais:fullName");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("role");
        } catch {}
        router.replace("/secretarias/convite");
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12">
            <div className="mx-auto flex max-w-6xl flex-col gap-8">
                <header className="space-y-2 md:space-y-0 md:rounded-3xl md:border md:border-gray-200 md:bg-white md:p-6 md:shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[#5179EF]">
                                <ClipboardList className="h-5 w-5" />
                                <span className="text-xs font-semibold uppercase tracking-wide">
                                    Painel da Secretaria
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl font-semibold text-gray-900">
                                    Consultas do dia e próximas agendas
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Confirme a presença dos pacientes e mantenha os dados cadastrais sempre atualizados
                                    antes do encaminhamento ao médico.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 self-start rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
                        >
                            <LogOut className="h-4 w-4" />
                            Sair
                        </button>
                    </div>
                </header>

                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Selecionar médico
                            </p>
                            <div className="mt-2">
                                {isLoadingDoctors ? (
                                    <div className="flex flex-col gap-2">
                                        <span className="h-10 w-full animate-pulse rounded-full bg-gray-100" />
                                        <span className="h-10 w-3/4 animate-pulse rounded-full bg-gray-100" />
                                    </div>
                                ) : doctorsError ? (
                                    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs text-amber-700">
                                        <p>Não foi possível carregar os médicos vinculados a este acesso.</p>
                                        <button
                                            type="button"
                                            onClick={() => void refetchDoctors()}
                                            className="inline-flex items-center gap-2 rounded-full border border-amber-200 px-3 py-1 font-semibold text-amber-700 transition hover:border-amber-300 hover:text-amber-800"
                                        >
                                            Tentar novamente
                                        </button>
                                    </div>
                                ) : doctors.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                                        Nenhum médico vinculado ao seu acesso. Confirme o vínculo com o responsável da equipe.
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                                        <User2 className="h-4 w-4 text-gray-400" />
                                        <select
                                            value={selectedDoctor ?? doctors[0]?.id ?? ""}
                                            onChange={(event) => setSelectedDoctor(event.target.value)}
                                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                                        >
                                            {doctors.map((doctor) => (
                                                <option key={doctor.id} value={doctor.id}>
                                                    {doctor.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
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
                            disabled={!selectedDoctor || isLoading}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                    ) : !selectedDoctor && doctors.length > 0 ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                            <p className="text-sm font-semibold text-gray-700">
                                Selecione um médico para visualizar os agendamentos.
                            </p>
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                            <p className="text-sm font-semibold text-gray-700">
                                Nenhum agendamento para este médico.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-6">
                            <ul className="space-y-4">
                                {filteredAppointments.map((appointment) => {
                                    const dayLabel = formatDateTime(appointment.scheduledAt, {
                                        weekday: "short",
                                    });
                                    const dateLabel = formatDateTime(appointment.scheduledAt, {
                                        day: "2-digit",
                                        month: "long",
                                    });
                                    const timeLabel = formatDateTime(appointment.scheduledAt, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    });

                                    return (
                                        <li key={appointment.id}>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenModal(appointment)}
                                                className="group w-full rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#5179EF]/40 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5179EF]"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col items-start rounded-2xl border border-[#5179EF]/20 bg-[#5179EF]/10 px-4 py-3 text-[#5179EF]">
                                                            <span className="text-[11px] font-semibold uppercase tracking-wide">
                                                                {dayLabel}
                                                            </span>
                                                            <span className="text-lg font-semibold leading-tight">
                                                                {dateLabel}
                                                            </span>
                                                            <span className="text-xs font-medium text-[#5179EF]/80">
                                                                {timeLabel}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-base font-semibold text-gray-900">
                                                                {appointment.patient.name || "Paciente sem nome"}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                                                <span>
                                                                    Médico:{" "}
                                                                    <span className="font-medium text-gray-700">
                                                                        {appointment.doctorName}
                                                                    </span>
                                                                </span>
                                                                <span className="hidden md:inline text-gray-300">•</span>
                                                                <span className="flex items-center gap-1 text-gray-500">
                                                                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                                    {appointment.location || "Local não informado"}
                                                                </span>
                                                            </div>
                                                            {appointment.status === "confirmada" && appointment.checkInAt ? (
                                                                <p className="flex items-center gap-2 text-xs text-emerald-600">
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                    Check-in realizado às{" "}
                                                                    {formatDateTime(appointment.checkInAt, {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    })}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-3">
                                                        <span
                                                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                                                STATUS_BADGE_TONES[appointment.status]
                                                            }`}
                                                        >
                                                            {STATUS_LABELS[appointment.status]}
                                                        </span>
                                                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#5179EF] transition group-hover:translate-x-1">
                                                            Ver detalhes
                                                            <ChevronRight className="h-4 w-4" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={goToPreviousPage}
                                    disabled={isLoading || page === 0}
                                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Anterior
                                </button>
                                <button
                                    type="button"
                                    onClick={goToNextPage}
                                    disabled={isLoading || safeTotalPages === 0 || page + 1 >= safeTotalPages}
                                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Próxima
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 md:text-sm">
                                <span>
                                    Página {safeTotalPages === 0 ? 0 : displayPage} de {safeTotalPages}
                                </span>
                                <span className="hidden md:inline">·</span>
                                <span>Total de {totalItems} agendamentos</span>
                                <label className="flex items-center gap-2">
                                    Itens por página
                                    <select
                                        value={pageSize}
                                        onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                                        className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700 outline-none transition hover:border-gray-300 focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                    >
                                        {PAGE_SIZE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            </div>
                        </div>
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

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                    Horário e local
                                </p>
                                <p className="mt-2 text-base font-semibold text-gray-900">
                                    {formatFullDate(selectedAppointment.scheduledAt)}
                                </p>
                                <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    {selectedAppointment.location || "Local não informado"}
                                </p>
                            </div>
                            <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                    Status e médico responsável
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <span
                                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                            STATUS_BADGE_TONES[selectedAppointment.status]
                                        }`}
                                    >
                                        {STATUS_LABELS[selectedAppointment.status]}
                                    </span>
                                    <div className="min-w-[12rem] space-y-1 text-sm text-gray-600">
                                        <p className="font-semibold text-gray-900">
                                            {selectedAppointment.doctorName}
                                        </p>
                                        {selectedAppointment.doctorCrm ? (
                                            <p>CRM: {selectedAppointment.doctorCrm}</p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {appointmentDetailItems.length > 0 ? (
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                {appointmentDetailItems.map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-3xl border border-gray-100 bg-white px-5 py-4 text-sm text-gray-700"
                                    >
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                            {item.label}
                                        </p>
                                        <p className="mt-2 whitespace-pre-line text-sm text-gray-800">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <div className="mt-8 space-y-2">
                            <h3 className="text-sm font-semibold text-gray-900">Ficha do paciente</h3>
                            <p className="text-sm text-gray-500">
                                Crie ou atualize os dados do paciente para manter o cadastro em dia antes da consulta.
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
                            <div className="grid gap-4 md:grid-cols-3">
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
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Telefone de contato
                                    </label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        value={formState.phone}
                                        onChange={(event) => handleFieldChange("phone", maskPhone(event.target.value))}
                                        placeholder="(11) 98888-7777"
                                        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                        required
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
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="insuranceProvider" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Convênio
                                    </label>
                                    <input
                                        id="insuranceProvider"
                                        name="insuranceProvider"
                                        value={formState.insuranceProvider}
                                        onChange={(event) => handleFieldChange("insuranceProvider", event.target.value)}
                                        placeholder="Nome do convênio"
                                        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="insuranceNumber" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Número da carteirinha
                                    </label>
                                    <input
                                        id="insuranceNumber"
                                        name="insuranceNumber"
                                        value={formState.insuranceNumber}
                                        onChange={(event) => handleFieldChange("insuranceNumber", event.target.value)}
                                        placeholder="Código do convênio"
                                        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                                    />
                                </div>
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

                            {!canConfirmPresence ? (
                                <p className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-500">
                                    A presença só pode ser confirmada para consultas com status{" "}
                                    <span className="uppercase text-gray-700">agendada</span>.
                                </p>
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
                                    disabled={isConfirming || !canConfirmPresence}
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
