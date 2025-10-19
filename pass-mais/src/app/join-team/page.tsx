"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2, LogIn, Shield, TriangleAlert } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useJoinTeam } from "@/hooks/team";

type Toast = {
    id: number;
    type: "success" | "error";
    message: string;
};

export default function JoinTeamPage() {
    const router = useRouter();

    const [code, setCode] = useState("");
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [feedback, setFeedback] = useState<Toast[]>([]);

    const canSubmit = Boolean(code.trim()) && acceptTerms;

    const pushToast = (toast: Omit<Toast, "id">) => {
        setFeedback((prev) => [...prev, { ...toast, id: Date.now() + Math.random() }]);
    };

    useEffect(() => {
        if (feedback.length === 0) return;

        const timer = setTimeout(() => {
            setFeedback((prev) => prev.slice(1));
        }, 5000);

        return () => clearTimeout(timer);
    }, [feedback]);

    const { mutateAsync: joinTeam, isPending } = useJoinTeam({
        onSuccess: (payload) => {
            pushToast({
                type: "success",
                message: "Tudo certo! Redirecionando para o painel da agenda.",
            });
            const destination = payload.redirectTo || "/agendas";
            setTimeout(() => {
                router.push(destination);
            }, 1200);
        },
        onError: (joinError) => {
            pushToast({
                type: "error",
                message:
                    joinError.message ||
                    "Não foi possível validar o código. Confira com o médico se o código ainda está ativo.",
            });
        },
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            await joinTeam({ code: code.trim(), acceptTerms });
        } catch {
            // handled via hook toast
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f7f8fc] via-white to-[#eef2ff] px-4 py-12">
            <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row">
                <section className="flex flex-1 flex-col justify-between rounded-3xl bg-black px-10 py-12 text-white shadow-xl">
                    <div className="space-y-6">
                        <span className="rounded-full bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-wide text-white/80">
                            Acesso seguro
                        </span>
                        <div className="space-y-4">
                            <h1 className="text-3xl font-semibold leading-snug">
                                Entre na equipe do médico com o código compartilhado
                            </h1>
                            <p className="text-base text-white/80">
                                Depois de ingressar, você poderá visualizar agendas, confirmar consultas e manter o fluxo de
                                pacientes sempre atualizado.
                            </p>
                        </div>
                    </div>
                    <div className="mt-12 space-y-4 rounded-2xl bg-white/10 p-5 text-sm text-white/80">
                        <div className="flex items-start gap-3">
                            <Shield className="mt-0.5 h-5 w-5" />
                            <p>
                                O acesso é pessoal e intransferível. Caso precise acessar agendas de outro médico, solicite um
                                novo código para ele.
                            </p>
                        </div>
                        <p>
                            Código expirado?{" "}
                            <span className="font-semibold">
                                Peça ao médico que gere um novo código na área &quot;Equipe&quot; do dashboard.
                            </span>
                        </p>
                    </div>
                </section>

                <section className="flex flex-1 flex-col rounded-3xl border border-gray-200 bg-white shadow-md">
                    <div className="border-b border-gray-100 px-10 py-8">
                        <div className="flex items-center gap-3 text-[#5179EF]">
                            <LogIn className="h-5 w-5" />
                            <p className="text-xs font-semibold uppercase tracking-wide">Entrar em uma equipe</p>
                        </div>
                        <h2 className="mt-3 text-2xl font-semibold text-gray-900">Use o código enviado pelo médico</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Siga as orientações e mantenha seus dados sempre alinhados com a LGPD.
                        </p>
                    </div>

                    <div className="flex flex-1 flex-col justify-between px-10 py-8">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="inviteCode" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Código de entrada
                                </Label>
                                <Input
                                    id="inviteCode"
                                    name="inviteCode"
                                    placeholder="Ex: 9F3K-PASS"
                                    autoComplete="one-time-code"
                                    value={code}
                                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                                    className="h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 placeholder:text-gray-400"
                                />
                            </div>

                            <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                <label htmlFor="terms" className="flex items-start gap-3">
                                    <input
                                        id="terms"
                                        name="terms"
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(event) => setAcceptTerms(event.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border border-gray-300 accent-black"
                                    />
                                    <span>
                                        Confirmo que recebi autorização do médico responsável e concordo com a{" "}
                                        <Link
                                            href="/politica-privacidade"
                                            className="font-semibold text-[#5179EF] hover:text-[#3356b3]"
                                        >
                                            Política de Privacidade
                                        </Link>{" "}
                                        e os termos de tratamento de dados pessoais conforme a LGPD.
                                    </span>
                                </label>
                                <p className="text-xs text-gray-500">
                                    Você pode sair da equipe a qualquer momento solicitando ao médico que revogue seu acesso.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={!canSubmit || isPending}
                                className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                                Entrar na equipe
                            </button>
                        </form>

                        <div className="mt-8 space-y-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500">
                            <div className="flex items-start gap-3">
                                <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-500" />
                                <p>
                                    Só compartilhe o código com pessoas autorizadas. O uso indevido pode expor dados sensíveis de
                                    pacientes e agendas.
                                </p>
                            </div>
                            <p className="text-xs text-gray-400">
                                Erro frequente: códigos vencem após a data limite ou quando atingem o número máximo de usos.
                                Solicite um novo caso isso aconteça.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {feedback.length > 0 ? (
                <div className="fixed bottom-6 right-6 space-y-3">
                    {feedback.map((toast) => (
                        <div
                            key={toast.id}
                            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg ${
                                toast.type === "success"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-red-50 text-red-700"
                            }`}
                        >
                            {toast.type === "success" ? (
                                <CheckCircle2 className="h-5 w-5" />
                            ) : (
                                <TriangleAlert className="h-5 w-5" />
                            )}
                            <p>{toast.message}</p>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
