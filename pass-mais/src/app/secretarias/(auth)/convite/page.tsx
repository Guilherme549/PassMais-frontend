"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import { Info } from "lucide-react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { jsonPost, setTokens, BASE_URL } from "@/lib/api";

type Mode = "register" | "login";

type RegisterFormData = {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    inviteCode: string;
    consent: boolean;
};

type LoginFormData = {
    email: string;
    password: string;
};

const INITIAL_REGISTER_STATE: RegisterFormData = {
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
    consent: false,
};

const INITIAL_LOGIN_STATE: LoginFormData = {
    email: "",
    password: "",
};

export default function SecretariaConvitePage() {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>("login");
    const [registerForm, setRegisterForm] = useState<RegisterFormData>(INITIAL_REGISTER_STATE);
    const [loginForm, setLoginForm] = useState<LoginFormData>(INITIAL_LOGIN_STATE);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loginInfo, setLoginInfo] = useState<string | null>(null);
    const [registerError, setRegisterError] = useState<string | null>(null);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [rememberLogin, setRememberLogin] = useState(false);

    const handleRegisterChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, type, value, checked } = event.target;
        if (registerError) setRegisterError(null);

        setRegisterForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleLoginChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        if (loginError) setLoginError(null);

        setLoginForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    type LoginAttemptResult = { success: true; message?: string } | { success: false; message?: string };

    const authenticateSecretary = async (email: string, password: string): Promise<LoginAttemptResult> => {
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const fallbackMessage =
                    (typeof data?.message === "string" && data.message) ||
                    (typeof data?.mensagem === "string" && data.mensagem) ||
                    (typeof data?.error === "string" && data.error) ||
                    (response.status === 400 || response.status === 401
                        ? "E-mail ou senha inválidos. Verifique suas credenciais e tente novamente."
                        : "Não foi possível acessar o painel. Tente novamente em instantes.");
                return { success: false, message: fallbackMessage };
            }

            const accessToken = data?.accessToken as string | undefined;
            const role = data?.role as string | undefined;

            if (!accessToken || role !== "SECRETARY") {
                return {
                    success: false,
                    message: "Não foi possível validar seu acesso. Confirme se seus dados estão corretos.",
                };
            }

            try {
                localStorage.setItem("passmais:accessToken", accessToken);
                localStorage.setItem("accessToken", accessToken);
                if (typeof data?.fullName === "string") {
                    localStorage.setItem("passmais:fullName", data.fullName);
                }
                localStorage.setItem("passmais:role", role);
                localStorage.setItem("role", role);
            } catch {
                // Ignora falhas ao persistir credenciais.
            }

            setTokens({ accessToken }, { role: role ?? "SECRETARY" });
            return { success: true };
        } catch {
            return {
                success: false,
                message: "Falha na conexão com o servidor. Tente novamente em alguns instantes.",
            };
        }
    };

    type JoinTeamResponse = {
        message?: string;
        role?: string;
        linkedDoctor?: {
            id: string;
            name: string;
        };
    };

    const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isRegistering) return;

        const fullName = registerForm.fullName.trim();
        const email = registerForm.email.trim();
        const inviteCode = registerForm.inviteCode.trim();
        const password = registerForm.password;

        setIsRegistering(true);
        setRegisterError(null);

        try {
            const joinResponse = await jsonPost<JoinTeamResponse>(
                "/api/teams/join",
                {
                    inviteCode,
                    email,
                    password,
                    name: fullName,
                },
                {
                    rawUrl: `${BASE_URL}/api/teams/join`,
                },
            );

            const loginResult = await authenticateSecretary(email, password);
            if (loginResult.success) {
                router.push("/secretarias/dashboard");
                return;
            }

            setRegisterForm({ ...INITIAL_REGISTER_STATE });
            setShowRegisterPassword(false);
            setShowRegisterConfirmPassword(false);
            setLoginForm((prev) => ({ ...prev, email, password: "" }));
            setLoginError(null);
            const loginFailureMessage = !loginResult.success ? loginResult.message : undefined;
            const successMessage =
                joinResponse?.message ??
                loginFailureMessage ??
                "Conta criada com sucesso! Faça login com suas credenciais para continuar.";
            setLoginInfo(successMessage);
            setMode("login");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Não foi possível concluir o cadastro. Tente novamente.";
            setRegisterError(message);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isLoggingIn) return;

        const email = loginForm.email.trim();
        const password = loginForm.password;

        setIsLoggingIn(true);
        setLoginInfo(null);
        setLoginError(null);

        const result = await authenticateSecretary(email, password);
        if (!result.success) {
            setLoginError(result.message || "Não foi possível acessar o painel. Tente novamente em instantes.");
            setIsLoggingIn(false);
            return;
        }

        setIsLoggingIn(false);
        router.push("/secretarias/dashboard");
    };

    const canSubmitRegister =
        Boolean(registerForm.fullName.trim()) &&
        Boolean(registerForm.email.trim()) &&
        Boolean(registerForm.password.trim()) &&
        registerForm.password === registerForm.confirmPassword &&
        Boolean(registerForm.inviteCode.trim()) &&
        registerForm.consent;

    const canSubmitLogin = Boolean(loginForm.email.trim()) && Boolean(loginForm.password.trim());

    const handleModeToggle = () => {
        const nextMode = mode === "register" ? "login" : "register";
        if (nextMode === "register") {
            setLoginError(null);
            setLoginInfo(null);
        } else {
            setRegisterError(null);
            setRegisterForm({ ...INITIAL_REGISTER_STATE });
            setShowRegisterPassword(false);
            setShowRegisterConfirmPassword(false);
        }
        setMode(nextMode);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f7f8fc] via-white to-[#eef2ff] px-4 py-12">
            <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row">
                <section className="flex flex-1 flex-col justify-between rounded-3xl bg-black px-10 py-12 text-white shadow-xl">
                    <div className="space-y-6">
                        <span className="rounded-full bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-wide text-white/80">
                            Acesso Seguro
                        </span>
                        <div className="space-y-4">
                            <h1 className="text-3xl font-semibold leading-snug">
                                Bem-vinda! Vamos configurar o seu acesso à agenda do médico
                            </h1>
                            <p className="text-base text-white/80">
                                Use o código de convite enviado pelo médico responsável para criar sua conta. Mantenha seu
                                acesso seguro e nunca compartilhe suas credenciais.
                            </p>
                        </div>
                    </div>
                    <div className="mt-12 space-y-4 rounded-2xl bg-white/10 p-5 text-sm text-white/80">
                        <div className="flex items-start gap-3">
                            <Info className="mt-0.5 h-5 w-5" />
                            <p>
                                Os dados cadastrados serão utilizados exclusivamente para gerenciar compromissos, pacientes e
                                notificações autorizadas pelo médico. Tudo conforme a Lei Geral de Proteção de Dados.
                            </p>
                        </div>
                        <p>
                            Precisa de suporte?{" "}
                            <Link href="mailto:suporte@passmais.com" className="font-semibold text-white underline">
                                fale com nosso time
                            </Link>
                            .
                        </p>
                    </div>
                </section>

                <section className="flex flex-1 rounded-3xl border border-gray-200 bg-white shadow-md">
                    <div className="flex w-full flex-col gap-10 p-10">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    {mode === "register" ? "Cadastrar conta de secretária" : "Entrar na plataforma"}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {mode === "register"
                                        ? "Informe os dados necessários para acessar os pacientes e agendas."
                                        : "Digite suas credenciais para acessar o painel da secretária."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleModeToggle}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
                            >
                                {mode === "register" ? "Já tenho acesso" : "Quero me cadastrar"}
                            </button>
                        </div>

                        {mode === "register" ? (
                            <form className="space-y-6" onSubmit={handleRegisterSubmit}>
                                {registerError ? (
                                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                                        {registerError}
                                    </div>
                                ) : null}
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                            Nome completo
                                        </Label>
                                        <Input
                                            id="fullName"
                                            name="fullName"
                                            autoComplete="name"
                                            placeholder="Ex: Ana Souza"
                                            value={registerForm.fullName}
                                            onChange={handleRegisterChange}
                                            className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                            E-mail corporativo
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="seuemail@clinica.com"
                                            value={registerForm.email}
                                            onChange={handleRegisterChange}
                                            className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="inviteCode" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Código de convite
                                    </Label>
                                    <Input
                                        id="inviteCode"
                                        name="inviteCode"
                                        placeholder="Informe o código recebido pelo médico"
                                        value={registerForm.inviteCode}
                                        onChange={handleRegisterChange}
                                        autoComplete="one-time-code"
                                        className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
                                    />
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                            Criar senha
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showRegisterPassword ? "text" : "password"}
                                                autoComplete="new-password"
                                                placeholder="Mínimo 8 caracteres"
                                                value={registerForm.password}
                                                onChange={handleRegisterChange}
                                                className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm text-gray-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegisterPassword((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                                                aria-label={showRegisterPassword ? "Ocultar senha" : "Mostrar senha"}
                                            >
                                                {showRegisterPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="confirmPassword"
                                            className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                        >
                                            Confirmar senha
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showRegisterConfirmPassword ? "text" : "password"}
                                                autoComplete="new-password"
                                                placeholder="Repita a senha"
                                                value={registerForm.confirmPassword}
                                                onChange={handleRegisterChange}
                                                className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm text-gray-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                                                aria-label={
                                                    showRegisterConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"
                                                }
                                            >
                                                {showRegisterConfirmPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                    <label htmlFor="consent" className="flex items-start gap-3">
                                        <input
                                            id="consent"
                                            name="consent"
                                            type="checkbox"
                                            checked={registerForm.consent}
                                            onChange={handleRegisterChange}
                                            className="mt-1 h-4 w-4 rounded border border-gray-300 accent-black"
                                        />
                                        <span>
                                            Declaro que li e concordo com o tratamento dos dados pessoais em conformidade com a LGPD,
                                            limitando o uso às atividades administrativas autorizadas pelo médico responsável.
                                        </span>
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        As informações poderão ser removidas a qualquer momento. Dúvidas sobre privacidade? consulte
                                        nossa{" "}
                                        <Link href="/politica-privacidade" className="font-semibold text-[#5179EF] hover:text-[#3356b3]">
                                            política de privacidade
                                        </Link>
                                        .
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!canSubmitRegister || isRegistering}
                                    className="w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                                >
                                    {isRegistering ? "Ativando..." : "Ativar acesso seguro"}
                                </button>
                            </form>
                        ) : (
                            <form className="space-y-6" onSubmit={handleLoginSubmit}>
                                {loginError ? (
                                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                                        {loginError}
                                    </div>
                                ) : null}
                                {loginInfo ? (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                        {loginInfo}
                                    </div>
                                ) : null}
                                <div className="space-y-2">
                                    <Label htmlFor="loginEmail" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        E-mail
                                    </Label>
                                    <Input
                                        id="loginEmail"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="seuemail@clinica.com"
                                        value={loginForm.email}
                                        onChange={handleLoginChange}
                                        disabled={isLoggingIn}
                                        className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="loginPassword" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Senha
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="loginPassword"
                                            name="password"
                                            type={showLoginPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            placeholder="Digite sua senha"
                                            value={loginForm.password}
                                            onChange={handleLoginChange}
                                            disabled={isLoggingIn}
                                            className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm text-gray-700"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPassword((prev) => !prev)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 disabled:text-gray-300"
                                            aria-label={showLoginPassword ? "Ocultar senha" : "Mostrar senha"}
                                            disabled={isLoggingIn}
                                        >
                                            {showLoginPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col items-start justify-between gap-4 text-sm text-gray-600 md:flex-row md:items-center">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border border-gray-300 accent-black"
                                            disabled={isLoggingIn}
                                            checked={rememberLogin}
                                            onChange={(event) => setRememberLogin(event.target.checked)}
                                        />
                                        Manter-me conectada neste dispositivo
                                    </label>
                                    <Link
                                        href="/secretarias/esqueceu-senha"
                                        className="font-semibold text-[#5179EF] hover:text-[#3356b3]"
                                    >
                                        Esqueci minha senha
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!canSubmitLogin || isLoggingIn}
                                    className="w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                                >
                                    {isLoggingIn ? "Entrando..." : "Acessar painel"}
                                </button>
                            </form>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
