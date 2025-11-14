"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CalendarClock,
    Check,
    CheckCircle2,
    Copy,
    Loader2,
    Mail,
    Plus,
    ShieldAlert,
    UserRoundPlus,
    Users2,
    X,
} from "lucide-react";

import {
    type JoinCode,
    type TeamMember,
    useDoctorTeam,
    useGenerateJoinCode,
    useRemoveMember,
    useRevokeJoinCode,
} from "@/hooks/team";
import { getAccessToken } from "@/lib/api";
import { extractDoctorIdFromToken } from "@/lib/token";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CORPORATE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Banner = {
    id: number;
    type: "success" | "error";
    message: string;
};

type InviteSuccessData = {
    code: string;
    expiresAt: string;
    secretaryName: string;
    secretaryEmail: string;
};

function formatDate(value: string) {
    try {
        const formatter = new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
        return formatter.format(new Date(value));
    } catch {
        return value;
    }
}

function formatStatusBadge(status: JoinCode["status"]) {
    const normalized = typeof status === "string" ? status.toLowerCase() : "";
    switch (normalized) {
        case "ativo":
        case "active":
            return { label: "Ativo", tone: "text-emerald-700 bg-emerald-100" };
        case "expirado":
        case "expired":
            return { label: "Expirado", tone: "text-red-700 bg-red-100" };
        case "sem-usos":
        case "exhausted":
            return { label: "Sem usos", tone: "text-amber-700 bg-amber-100" };
        case "revogado":
        case "revoked":
            return { label: "Revogado", tone: "text-gray-600 bg-gray-200" };
        case "bloqueado":
        case "blocked":
            return { label: "Bloqueado", tone: "text-red-700 bg-red-100" };
        default:
            return { label: status, tone: "text-gray-700 bg-gray-100" };
    }
}

function formatDateTime(value: string) {
    try {
        const formatter = new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
        return formatter.format(new Date(value));
    } catch {
        return value;
    }
}

function SkeletonRow() {
    return (
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-1/4 rounded bg-gray-200" />
        </div>
    );
}

type ConfirmationModalProps = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel?: string;
    isConfirming?: boolean;
    onConfirm: () => void;
    onClose: () => void;
};

function ConfirmationModal({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancelar",
    isConfirming = false,
    onConfirm,
    onClose,
}: ConfirmationModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
                <div className="flex items-center gap-3 text-red-600">
                    <ShieldAlert className="h-6 w-6" />
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                </div>
                <p className="mt-4 text-sm text-gray-600">{description}</p>
                <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isConfirming}
                        className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                        disabled={isConfirming}
                    >
                        {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

type InviteSecretaryModalProps = {
    open: boolean;
    fullName: string;
    email: string;
    isSubmitting: boolean;
    errorMessage?: string | null;
    canSubmit: boolean;
    onFullNameChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
};

function InviteSecretaryModal({
    open,
    fullName,
    email,
    isSubmitting,
    errorMessage,
    canSubmit,
    onFullNameChange,
    onEmailChange,
    onSubmit,
    onClose,
}: InviteSecretaryModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
                <div className="flex items-center gap-3 text-[#5179EF]">
                    <UserRoundPlus className="h-6 w-6" />
                    <h2 className="text-lg font-semibold text-gray-900">Gerar código personalizado</h2>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                    Preencha os dados da secretária para enviar um convite seguro. O código gerado será exclusivo para essa pessoa.
                </p>

                <form
                    className="mt-6 space-y-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSubmit();
                    }}
                >
                    <div className="space-y-2">
                        <Label htmlFor="inviteFullName" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Nome completo da secretária
                        </Label>
                        <Input
                            id="inviteFullName"
                            name="inviteFullName"
                            autoComplete="name"
                            placeholder="Ex: Ana Souza"
                            value={fullName}
                            onChange={(event) => onFullNameChange(event.target.value)}
                            className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="inviteEmail" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            E-mail corporativo
                        </Label>
                        <Input
                            id="inviteEmail"
                            name="inviteEmail"
                            type="email"
                            autoComplete="email"
                            placeholder="secretaria@clinica.com"
                            value={email}
                            onChange={(event) => onEmailChange(event.target.value)}
                            className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
                        />
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                        Os dados serão utilizados apenas para convidar a secretária a operar suas agendas. Lembre-se de registrar o
                        consentimento, conforme LGPD.
                    </div>

                    {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !canSubmit}
                            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                            Gerar código
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

type InviteSuccessModalProps = {
    open: boolean;
    code: string;
    secretaryName: string;
    secretaryEmail: string;
    expiresAt: string;
    onClose: () => void;
};

function InviteSuccessModal({ open, code, secretaryName, secretaryEmail, expiresAt, onClose }: InviteSuccessModalProps) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!open) {
            setCopied(false);
        }
    }, [open]);

    if (!open) return null;

    const handleCopy = async () => {
        try {
            if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(code);
            } else {
                throw new Error("Clipboard API indisponível");
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
                <div className="flex items-center gap-3 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                    <h2 className="text-lg font-semibold text-gray-900">Código gerado com sucesso!</h2>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                    Compartilhe o código com a secretária informada. Ele estará válido apenas pelas próximas 3 horas.
                </p>

                <div className="mt-6 space-y-4">
                    <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Código</p>
                            <p className="mt-1 text-xl font-semibold text-gray-900">{code}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
                        >
                            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copiado!" : "Copiar código"}
                        </button>
                    </div>

                    <div className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">Vinculado a:</span>{" "}
                            {secretaryName} ({secretaryEmail})
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">Expiração:</span>{" "}
                            {expiresAt ? (
                                <span>
                                    {formatDateTime(expiresAt)}{" "}
                                    <span className="block text-xs text-gray-400">{expiresAt}</span>
                                </span>
                            ) : (
                                "Sem expiração definida"
                            )}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <p className="font-semibold text-amber-900">Atenção!</p>
                        <p className="mt-1 text-xs sm:text-sm">
                            O código gerado está atrelado ao nome e e-mail informados. A secretária só poderá se cadastrar
                            utilizando esses dados exatamente. Caso haja divergência, o vínculo não será criado.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DoctorTeamPage() {
    const { data, isLoading, error, refetch, isRefetching } = useDoctorTeam();
    const isBusy = isLoading || isRefetching;
    const [banners, setBanners] = useState<Banner[]>([]);
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
    const [codeToRevoke, setCodeToRevoke] = useState<JoinCode | null>(null);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteFullName, setInviteFullName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccessData, setInviteSuccessData] = useState<InviteSuccessData | null>(null);
    const inviteFullNameTrimmed = inviteFullName.trim();
    const inviteEmailTrimmed = inviteEmail.trim();
    const canSubmitInvite = Boolean(inviteFullNameTrimmed) && CORPORATE_EMAIL_REGEX.test(inviteEmailTrimmed);

    const pushBanner = (banner: Omit<Banner, "id">) => {
        setBanners((prev) => [...prev, { ...banner, id: Date.now() + Math.random() }]);
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        let resolvedDoctorId: string | null = null;

        try {
            const storedId = window.localStorage.getItem("doctorId");
            const trimmedStoredId = storedId?.trim();
            if (trimmedStoredId) {
                resolvedDoctorId = trimmedStoredId;
            } else {
                const storedToken =
                    window.localStorage.getItem("accessToken") ??
                    window.localStorage.getItem("passmais:accessToken") ??
                    null;
                const derived = extractDoctorIdFromToken(storedToken);
                if (derived) {
                    resolvedDoctorId = derived;
                    try {
                        window.localStorage.setItem("doctorId", derived);
                    } catch {
                        // ignore storage quota errors
                    }
                }
            }
        } catch {
            // ignore storage access errors
        }

        if (!resolvedDoctorId) {
            const fallbackToken = getAccessToken();
            const derived = extractDoctorIdFromToken(fallbackToken);
            if (derived) {
                resolvedDoctorId = derived;
            }
        }

        if (resolvedDoctorId) {
            setDoctorId(resolvedDoctorId);
        }
    }, []);

    useEffect(() => {
        if (banners.length === 0) return;

        const timeout = setTimeout(() => {
            setBanners((prev) => prev.slice(1));
        }, 6000);

        return () => {
            clearTimeout(timeout);
        };
    }, [banners]);

    const members = useMemo(() => data?.members ?? [], [data?.members]);
    const joinCodes = useMemo(() => data?.joinCodes ?? [], [data?.joinCodes]);

    const { mutateAsync: generateJoinCode, isPending: isGeneratingCode } = useGenerateJoinCode();

    const { mutateAsync: revokeJoinCode, isPending: isRevokingCode } = useRevokeJoinCode({
        onSuccess: (result) => {
            pushBanner({
                type: "success",
                message: result?.message ?? "Código revogado. Quem tentar utilizá-lo não conseguirá entrar na equipe.",
            });
            void refetch();
        },
        onError: (mutationError) => {
            pushBanner({
                type: "error",
                message: mutationError.message || "Não foi possível revogar o código.",
            });
        },
        onSettled: () => setCodeToRevoke(null),
    });

    const { mutateAsync: removeMember, isPending: isRemovingMember } = useRemoveMember({
        onSuccess: (result) => {
            const fallbackMessage = memberToRemove?.fullName
                ? `Acesso de ${memberToRemove.fullName} removido.`
                : "Secretária removida. O acesso às suas agendas foi revogado imediatamente.";
            pushBanner({
                type: "success",
                message: result?.message ?? fallbackMessage,
            });
            void refetch();
        },
        onError: (mutationError) => {
            pushBanner({
                type: "error",
                message: mutationError.message || "Não foi possível remover a secretária.",
            });
        },
        onSettled: () => setMemberToRemove(null),
    });

    const openInviteModal = () => {
        setInviteFullName("");
        setInviteEmail("");
        setInviteError(null);
        setInviteModalOpen(true);
    };

    const closeInviteModal = () => {
        if (isGeneratingCode) return;
        setInviteModalOpen(false);
        setInviteFullName("");
        setInviteEmail("");
        setInviteError(null);
    };

    const handleInviteSubmit = async () => {
        if (!inviteFullNameTrimmed || !inviteEmailTrimmed) {
            setInviteError("Informe o nome completo e o e-mail corporativo da secretária.");
            return;
        }

        if (!CORPORATE_EMAIL_REGEX.test(inviteEmailTrimmed)) {
            setInviteError("Digite um e-mail corporativo válido.");
            return;
        }

        try {
            const expirationIso = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
            const response = await generateJoinCode({
                fullName: inviteFullNameTrimmed,
                email: inviteEmailTrimmed,
                maxUses: 1,
                expiresAt: expirationIso,
            });
            const expiresAt = response.expiresAt ?? expirationIso;
            setInviteSuccessData({
                code: response.code,
                expiresAt,
                secretaryName: response.secretaryFullName ?? inviteFullNameTrimmed,
                secretaryEmail: response.secretaryCorporateEmail ?? inviteEmailTrimmed,
            });
            pushBanner({
                type: "success",
                message: `Código ${response.code} gerado para ${inviteFullNameTrimmed}. Compartilhe com segurança.`,
            });
            closeInviteModal();
            await refetch();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Não foi possível gerar o código. Tente novamente.";
            setInviteError(message);
        }
    };

    const handleRemoveMember = (member: TeamMember) => {
        setMemberToRemove(member);
    };

    const confirmRemoveMember = async () => {
        if (!memberToRemove) return;
        const resolvedDoctorId = doctorId?.trim();
        if (!resolvedDoctorId) {
            pushBanner({
                type: "error",
                message:
                    "Não foi possível identificar o médico autenticado. Faça login novamente antes de remover o acesso.",
            });
            return;
        }
        try {
            await removeMember({ doctorId: resolvedDoctorId, secretaryId: memberToRemove.id });
        } catch {
            // handled in hook
        }
    };

    const confirmRevokeCode = async () => {
        if (!codeToRevoke) return;
        try {
            await revokeJoinCode(codeToRevoke.code);
        } catch {
            // handled in hook
        }
    };

    const handleDismissBanner = (id: number) => {
        setBanners((prev) => prev.filter((banner) => banner.id !== id));
    };

    return (
        <div className="space-y-8">
            {banners.length > 0 ? (
                <div className="space-y-3">
                    {banners.map((banner) => (
                        <div
                            key={banner.id}
                            className={`flex items-start justify-between gap-4 rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                banner.type === "success"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-red-50 text-red-700"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {banner.type === "success" ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5" />
                                ) : (
                                    <AlertTriangle className="mt-0.5 h-5 w-5" />
                                )}
                                <p>{banner.message}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleDismissBanner(banner.id)}
                                className="rounded-full p-1 hover:bg-black/10"
                                aria-label="Fechar aviso"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : null}

            <header className="space-y-2">
                <h1 className="text-3xl font-semibold text-gray-900">Equipe</h1>
                <p className="text-sm text-gray-500">
                    Gerencie as secretárias que podem operar suas agendas, além dos códigos de convite ativos. Lembre-se de
                    revogar acessos que não são mais necessários.
                </p>
            </header>

            <section className="grid gap-6 lg:grid-cols-5">
                <article className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:col-span-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <Users2 className="h-5 w-5 text-[#5179EF]" />
                                Minhas Secretárias
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Quem verá e poderá atuar em toda a sua agenda, independentemente da clínica.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openInviteModal}
                            disabled={isGeneratingCode}
                            className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                            {isGeneratingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Gerar código
                        </button>
                    </div>

                    <div className="mt-6 space-y-4">
                        {isBusy ? (
                            <>
                                <SkeletonRow />
                                <SkeletonRow />
                                <SkeletonRow />
                            </>
                        ) : error ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
                                <p>{error.message || "Não foi possível carregar a equipe no momento."}</p>
                                <button
                                    type="button"
                                    onClick={() => refetch()}
                                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:text-red-800"
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        ) : members.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                                <p className="text-sm font-semibold text-gray-700">Você ainda não adicionou secretárias</p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Gere um código e compartilhe com quem precisa operar sua agenda.
                                </p>
                                <button
                                    type="button"
                                    onClick={openInviteModal}
                                    disabled={isGeneratingCode}
                                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                                >
                                    {isGeneratingCode ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                    Gerar primeiro código
                                </button>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {members.map((member) => (
                                    <li
                                        key={member.id}
                                        className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 transition hover:border-gray-300 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{member.fullName}</p>
                                            <p className="text-xs text-gray-500">{member.email}</p>
                                            <p className="text-xs text-gray-400">
                                                {member.phone ? `Telefone: ${member.phone} · ` : null}
                                                Desde {formatDate(member.joinedAt)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMember(member)}
                                            className="self-start rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:text-red-800 sm:self-auto"
                                        >
                                            Remover acesso
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </article>

                <article className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:col-span-2">
                    <div>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                    <CalendarClock className="h-5 w-5 text-[#5179EF]" />
                                    Códigos de Entrada
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Cada código só pode ser usado pelo número de vezes configurado.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            {isBusy ? (
                                <>
                                    <SkeletonRow />
                                    <SkeletonRow />
                                </>
                            ) : joinCodes.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-6 text-center text-sm text-gray-600">
                                    Nenhum código ativo.
                                    <button
                                        type="button"
                                        onClick={openInviteModal}
                                        disabled={isGeneratingCode}
                                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                                    >
                                        {isGeneratingCode ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4" />
                                        )}
                                        Criar código
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {joinCodes.map((code) => {
                                        const status = formatStatusBadge(code.status);
                                        const normalizedStatus =
                                            typeof code.status === "string" ? code.status.toLowerCase() : "";
                                        const canRevoke = normalizedStatus === "ativo" || normalizedStatus === "active";
                                        return (
                                            <div
                                                key={code.id}
                                                className="rounded-2xl border border-gray-200 p-4 transition hover:border-gray-300"
                                            >
                                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{code.code}</p>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                            <span>
                                                                Expira em:{" "}
                                                                {code.expiresAt ? formatDate(code.expiresAt) : "Sem validade"}
                                                            </span>
                                                            <span>•</span>
                                                            <span>Usos restantes: {code.usesLeft}</span>
                                                        </div>
                                                        {code.secretaryName ? (
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                Destinatária: {code.secretaryName}
                                                                {code.secretaryEmail ? ` • ${code.secretaryEmail}` : ""}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}
                                                        >
                                                            {status.label}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCodeToRevoke(code)}
                                                            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-red-200 hover:text-red-600"
                                                            disabled={!canRevoke}
                                                        >
                                                            Revogar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                        <p className="font-semibold">Alerta LGPD</p>
                        <p className="mt-1 text-amber-700">
                            Quem usar este código verá todas as suas agendas, independentemente da clínica. Compartilhe apenas
                            com pessoas autorizadas e revogue acessos quando não forem mais necessários.
                        </p>
                    </div>
                </article>
            </section>

            <InviteSecretaryModal
                open={inviteModalOpen}
                fullName={inviteFullName}
                email={inviteEmail}
                isSubmitting={isGeneratingCode}
                errorMessage={inviteError}
                canSubmit={canSubmitInvite}
                onFullNameChange={(value) => {
                    setInviteFullName(value);
                    if (inviteError) setInviteError(null);
                }}
                onEmailChange={(value) => {
                    setInviteEmail(value);
                    if (inviteError) setInviteError(null);
                }}
                onSubmit={handleInviteSubmit}
                onClose={closeInviteModal}
            />

            <InviteSuccessModal
                open={Boolean(inviteSuccessData)}
                code={inviteSuccessData?.code ?? ""}
                secretaryName={inviteSuccessData?.secretaryName ?? ""}
                secretaryEmail={inviteSuccessData?.secretaryEmail ?? ""}
                expiresAt={inviteSuccessData?.expiresAt ?? ""}
                onClose={() => setInviteSuccessData(null)}
            />

            <ConfirmationModal
                open={Boolean(memberToRemove)}
                title="Remover secretária da equipe"
                description={
                    memberToRemove
                        ? `Ao confirmar, ${memberToRemove.fullName} perderá acesso imediato à sua agenda e notificações.`
                        : ""
                }
                confirmLabel="Remover agora"
                isConfirming={isRemovingMember}
                onConfirm={confirmRemoveMember}
                onClose={() => setMemberToRemove(null)}
            />

            <ConfirmationModal
                open={Boolean(codeToRevoke)}
                title="Revogar código de entrada"
                description={
                    codeToRevoke
                        ? `O código ${codeToRevoke.code} deixará de funcionar imediatamente. Secretárias que ainda não utilizaram precisarão de um novo código.`
                        : ""
                }
                confirmLabel="Revogar código"
                isConfirming={isRevokingCode}
                onConfirm={confirmRevokeCode}
                onClose={() => setCodeToRevoke(null)}
            />
        </div>
    );
}
