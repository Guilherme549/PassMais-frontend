"use client";

import LoginImage from "@/app/(auth)/components/LoginImage";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

const NAME_REGEX = /^[A-Za-zÀ-ÿ'`\-\s]{3,100}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PHONE_REGEX = /^\(\d{2}\) \d{5}-\d{4}$/;

const MIN_PASSWORD_LENGTH = 6;

function onlyDigits(value: string) {
    return value.replace(/\D+/g, "");
}

function formatPhone(value: string) {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length < 3) return digits;
    if (digits.length <= 7) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function Register() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        acceptTerms: false,
    });
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setErrors([]);

        if (type === "checkbox") {
            setFormData((prev) => ({ ...prev, [name]: checked }));
            return;
        }

        let nextValue = value;
        if (name === "phone") {
            nextValue = formatPhone(value);
        }

        setFormData((prev) => ({
            ...prev,
            [name]: nextValue,
        }));
    };

    const passwordIsStrong = (password: string) => {
        return password.length >= MIN_PASSWORD_LENGTH;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        setSuccess("");

        const validationErrors: string[] = [];
        const fullName = formData.fullName.trim();
        const email = formData.email.trim();
        const phone = formData.phone.trim();
        const password = formData.password;
        const confirmPassword = formData.confirmPassword;

        if (!fullName) {
            validationErrors.push("Informe seu nome completo.");
        } else if (!NAME_REGEX.test(fullName)) {
            validationErrors.push("O nome deve conter apenas letras e espaços.");
        }

        if (!email) {
            validationErrors.push("Informe um e-mail válido.");
        } else if (!EMAIL_REGEX.test(email)) {
            validationErrors.push("Formato de e-mail inválido.");
        }

        if (!phone) {
            validationErrors.push("Informe um telefone para contato.");
        } else if (!PHONE_REGEX.test(phone)) {
            validationErrors.push("Telefone deve seguir o formato (11) 91234-5678.");
        }

        if (!password) {
            validationErrors.push("Informe uma senha.");
        } else if (!passwordIsStrong(password)) {
            validationErrors.push("A senha deve ter no mínimo 6 caracteres.");
        }

        if (!confirmPassword) {
            validationErrors.push("Confirme a senha.");
        } else if (password !== confirmPassword) {
            validationErrors.push("As senhas devem ser iguais.");
        }

        if (!formData.acceptTerms) {
            validationErrors.push("É necessário aceitar os termos e condições.");
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        const userData = {
            name: fullName,
            email,
            password,
            role: "PATIENT",
            lgpdAccepted: formData.acceptTerms === true,
            phone: onlyDigits(phone),
        };

        try {
            // Usa rota da própria aplicação para evitar CORS
            const response = await fetch(`/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const text = await response.text(); // Obter o texto bruto
                let errorMessage = "Erro ao criar conta";
                try {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    errorMessage = "Resposta inválida do servidor";
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(data)
            setSuccess("Usuário criado com sucesso!");
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (err: unknown) {
            let errorMessage = "Ocorreu um erro. Tente novamente.";
            if (err instanceof Error) {
                errorMessage = err.message.includes("Failed to fetch")
                    ? "Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde."
                    : err.message;
            }
            setErrors([errorMessage]);
            console.error("Erro na requisição:", err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex flex-1">
                <LoginImage />
                <div className="w-[33.75rem] mx-auto m-[100px] mb-[0px]">
                    <div className="w-[22.5rem] mx-auto">
                        <h2 className="text-2xl font-semibold mb-[24px] text-center">
                            Criar uma conta
                        </h2>
                        {errors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
                                <p className="font-semibold">Por favor, corrija os seguintes pontos:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    {errors.map((msg) => (
                                        <li key={msg}>{msg}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center justify-center bg-green-100 text-green-800 text-base font-semibold p-4 mb-4 rounded-lg shadow-md animate-fade-in">
                                <FaCheckCircle className="mr-2 text-green-600" size={20} />
                                {success}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="fullName" className="block text-sm pl-[16px] pb-[8px]">
                                    Nome completo
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                    placeholder="Digite seu nome completo"
                                    autoComplete="name"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm pl-[16px] pb-[8px]">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                    placeholder="Insira o seu email"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm pl-[16px] pb-[8px]">
                                    Telefone
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                    placeholder="Digite o seu número de telefone"
                                    autoComplete="tel"
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
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 outline-none transition-colors duration-200 bg-[#E5E5E5]"
                                        placeholder="Crie sua senha"
                                        autoComplete="new-password"
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
                            <div className="relative">
                                <label htmlFor="confirmPassword" className="block text-sm pl-[16px] pb-[8px]">
                                    Confirme sua senha
                                </label>
                                <div className="relative mb-[20px]">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 outline-none transition-colors duration-200 bg-[#E5E5E5]"
                                        placeholder="Confirme sua senha"
                                        autoComplete="new-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showConfirmPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-start mb-4">
                                <input
                                    type="checkbox"
                                    id="acceptTerms"
                                    name="acceptTerms"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={formData.acceptTerms}
                                    onChange={handleInputChange}
                                />
                                <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-500">
                                    Li e concordo com os{" "}
                                    <a href="#" className="text-blue-600 hover:text-blue-800">
                                        Termos e condições
                                    </a>{" "}
                                    e{" "}
                                    <a href="#" className="text-blue-600 hover:text-blue-800">
                                        política de privacidade
                                    </a>
                                </label>
                            </div>
                            <div className="text-center mb-[24px]">
                                <button
                                    type="submit"
                                    className="bg-[#007AFF] text-white w-full h-[40px] rounded-[6px] cursor-pointer transition transform active:scale-95 duration-100"
                                >
                                    Criar conta
                                </button>
                            </div>
                        </form>
                        <hr className="h-[1px] text-[#E5E5E5] w-full" />
                        <span className="flex justify-center text-sm text-gray-500 mt-[5px]">
                            ou
                        </span>
                        <Link href="/login">
                            <span className="text-blue-600 hover:text-blue-800 text-sm flex justify-center mt-[10px]">
                                Faça login em sua conta
                            </span>
                        </Link>
                    </div>
                    <div className="mt-[65px]">
                        <Footer />
                    </div>
                </div>
            </div>
        </div>
    );
}
