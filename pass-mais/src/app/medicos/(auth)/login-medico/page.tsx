"use client";

import LoginImage from "@/app/(auth)/components/LoginImage";
import Link from "next/link";
import { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginMedico() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    if (!formData.email || !formData.password) {
      return "Por favor, preencha todos os campos.";
    }
    const emailOk = /.+@.+\..+/.test(formData.email);
    if (!emailOk) return "Informe um e-mail válido.";
    if (formData.password.length < 6)
      return "A senha deve ter pelo menos 6 caracteres.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setLoading(true);
      // TODO: substituir por chamada à API real
      await new Promise((r) => setTimeout(r, 800));
      router.push("/medicos/dashboard/visao-geral");
    } catch {
      setError("Falha ao entrar. Tente novamente.");
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

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="ex: meuemail@exemplo.com"
                  className={`h-11 ${hasError ? "" : ""}`}
                  required
                />
                <p className="text-[12px] text-gray-500">exemplo@exemplo.com</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Sua senha"
                    className="h-11 pr-10"
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

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Lembrar de mim
                </label>
                <Link href="/medicos/esqueceu-senha" className="text-sm text-[#5179EF] hover:text-blue-800">
                  Esqueceu a senha?
                </Link>
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

              <div className="pt-2">
                <div className="h-px bg-gray-200 w-full" />
                <span className="flex justify-center text-sm text-gray-500 mt-2">
                  ou
                </span>
                <div className="text-center">
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
              </div>
            </form>
          </div>

          
        </div>
      </div>
    </div>
  );
}
