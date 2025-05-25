"use client";

import LoginImage from "@/app/(auth)/components/LoginImage";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useRouter } from "next/navigation";

export default function LoginMedico() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Simulação de login bem-sucedido (substitua por chamada à API real)
    if (formData.email && formData.password) {
      // Redireciona para a página do médico após 1 segundo
      setTimeout(() => {
        router.push("/medico/dashboard");
      }, 1000);
    } else {
      setError("Por favor, preencha todos os campos.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <LoginImage />

        <div className="w-[33.75rem] mx-auto m-[100px] mb-[0px]">
          <div className="w-[22.5rem] mx-auto">
            <h2 className="text-2xl font-semibold mb-[24px] text-center">
              Seja bem-vindo de volta (Médico)
            </h2>

            {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}

            <form onSubmit={handleSubmit}>
              {/* E-mail */}
              <div>
                <label htmlFor="email" className="block text-sm pl-[16px] pb-[8px]">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                  placeholder="Seu e-mail"
                  required
                />
              </div>

              {/* Senha */}
              <div className="relative">
                <label htmlFor="password" className="block text-sm pl-[16px] pb-[8px]">
                  Senha
                </label>
                <div className="relative mb-[16px]">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="outline-none w-full h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                    placeholder="Sua senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                  </button>
                </div>
              </div>

              {/* Botão Entrar */}
              <div className="text-center mb-[24px]">
                <button
                  type="submit"
                  className="bg-[#5179EF] text-white w-full h-[40px] rounded-[6px] cursor-pointer transition transform active:scale-95 duration-100"
                >
                  Entrar
                </button>
              </div>
            </form>

            <hr className="h-[1px] text-[#E5E5E5] w-full" />
            <span className="flex justify-center text-sm text-gray-500 mt-[5px]">ou</span>
            <div className="text-center">
              <Link href="/medicos/register-medico">
                <span className="text-[#5179EF] hover:text-blue-800 text-sm mt-[10px]">
                  Ainda não tem conta? Cadastre-se
                </span>
              </Link>
              <br />
              <Link href="/login/patient">
                <span className="text-[#5179EF] hover:text-blue-800 text-sm mt-[10px]">
                  É um paciente? Faça login aqui
                </span>
              </Link>
            </div>
          </div>
          <div className="mt-[65px]">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}