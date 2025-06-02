'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const result = await signIn("credentials", {
            redirect: false,
            email,
            password,
            callbackUrl: "/medical-appointments", // Define o redirecionamento após login
        });

        if (result?.error) {
            setError("Credenciais inválidas. Tente novamente.");
        } else {
            setSuccess("Login realizado com sucesso!");
            setTimeout(() => {
                window.location.href = "/medical-appointments"; // Redirecionamento manual como fallback
            }, 1000);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {success && (
                <div className="flex items-center justify-center bg-green-100 text-green-800 text-base font-semibold p-4 mb-4 rounded-lg shadow-md animate-fade-in">
                    <FaCheckCircle className="mr-2 text-green-600" size={20} />
                    {success}
                </div>
            )}
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div>
                <label htmlFor="email" className="block text-sm pl-[16px] pb-[8px]">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                    placeholder="Insira o seu email"
                    required
                />
            </div>
            <div className="relative">
                <label htmlFor="password" className="block text-sm pl-[16px] pb-[8px]">
                    Senha
                </label>
                <div className="relative mb-[20px]">
                    <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 outline-none transition-colors duration-200 bg-[#E5E5E5]"
                        placeholder="Digite sua senha"
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
            <div className="text-center mb-[24px]">
                <button
                    type="submit"
                    className="bg-[#007AFF] text-white w-full h-[40px] rounded-[6px] cursor-pointer transition transform active:scale-95 duration-100"
                >
                    Entrar
                </button>
            </div>
        </form>
    );
}