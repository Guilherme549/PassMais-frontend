"use client";

import LoginImage from "@/app/(auth)/components/LoginImage";
import Link from "next/link";
import { useState, useEffect } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { jsonPost, setTokens } from "@/lib/api";
import { extractDoctorIdFromToken } from "@/lib/token";

// Tipos
interface FormData {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  role?: string;
  doctorId?: string;
  user?: { role?: string; id?: string; doctorId?: string };
  roles?: string[];
  userId?: string;
}

export default function LoginMedico() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const router = useRouter();

  // Verifica se o usuário já está logado
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.push("/medicos/dashboard/visao-geral");
    }
  }, [router]);

  // Manipula mudanças nos inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Valida os dados do formulário
  const validate = (): string => {
    if (!formData.email || !formData.password) {
      return "Por favor, preencha todos os campos.";
    }
    const emailOk = /.+@.+\..+/.test(formData.email);
    if (!emailOk) return "Informe um e-mail válido.";
    if (formData.password.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
    return "";
  };

  // Envia o formulário para a API
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const data: AuthResponse = await jsonPost<AuthResponse>(`/api/auth/login`, {
        email: formData.email,
        password: formData.password,
      });
      const { accessToken, refreshToken } = data;

      if (!accessToken) {
        throw new Error("Token de acesso ausente na resposta da API.");
      }

      setTokens({ accessToken, refreshToken });

      const explicitDoctorId =
        data.doctorId ||
        data.user?.doctorId ||
        data.user?.id ||
        data.userId;
      let doctorId = explicitDoctorId ? String(explicitDoctorId) : null;
      if (!doctorId) {
        doctorId = extractDoctorIdFromToken(accessToken);
      }
      if (doctorId) {
        try {
          localStorage.setItem("doctorId", doctorId);
        } catch {
          // ignore quota errors
        }
      }

      const role = (data.role || data.user?.role || (Array.isArray(data.roles) ? data.roles[0] : undefined))?.toLowerCase();
      if (role) localStorage.setItem("role", role);
      console.log("Role detectada:", role);

      setSuccess("Login realizado com sucesso! Redirecionando...");
      const redirectPath = role === "administrator"
        ? "/admin/painel"
        : role === "patient"
        ? "/medical-appointments"
        : "/medicos/dashboard/visao-geral";
      setTimeout(() => router.push(redirectPath), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const hasError = Boolean(error);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6FA]">
      <div className="flex flex-1">
        <LoginImage />
        <div className="w-full max-w-md mx-auto my-20 px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-center">
                Seja bem-vindo de volta (Médico)
              </h2>
            </div>
            {hasError && (
              <div className="px-6 pt-4">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}
            {success && (
              <div className="px-6 pt-4">
                <p className="text-green-600 text-sm text-center font-medium">{success}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  E-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="ex: meuemail@exemplo.com"
                  className={`h-11 ${hasError ? "border-red-500" : ""}`}
                  autoComplete="email"
                  required
                />
                <p className="text-[12px] text-gray-500">exemplo@exemplo.com</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Sua senha"
                    className={`h-11 pr-10 ${hasError ? "border-red-500" : ""}`}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                  </button>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#5179EF] hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white w-full h-10 rounded-md font-medium transition active:scale-[0.99]"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </div>
              <div className="pt-2 text-center">
                <Link href="/medicos/esqueceu-senha" className="text-sm text-[#5179EF] hover:text-blue-800">
                  Esqueceu a senha?
                </Link>
                <div className="h-px bg-gray-200 w-full my-2" />
                <Link href="/medicos/register-medico">
                  <span className="text-[#5179EF] hover:text-blue-800 text-sm mt-2 inline-block">
                    Ainda não tem conta? Cadastre-se
                  </span>
                </Link>
                <br />
                <Link href="/login">
                  <span className="text-[#5179EF] hover:text-blue-800 text-sm mt-2 inline-block">
                    É um paciente? Faça login aqui
                  </span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
