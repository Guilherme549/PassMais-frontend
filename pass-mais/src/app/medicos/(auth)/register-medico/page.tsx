"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        cpf: "",
        day: "",
        month: "",
        year: "",
        crm: "",
        about: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validação simples
        if (formData.password !== formData.confirmPassword) {
            setError("As senhas não coincidem");
            return;
        }

        console.log("Form submitted:", formData);
        // Adicione aqui a lógica para enviar os dados (ex.: API call)
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Conteúdo principal */}
            <div className="flex flex-1">


                <div className="w-[33.75rem] mx-auto m-[100px] mb-[0px]">
                    <div className="w-[22.5rem] mx-auto">
                        <h2 className="text-2xl font-semibold mb-[24px] text-center">
                            Criar uma conta (Médico)
                        </h2>

                        {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}

                        <form onSubmit={handleSubmit}>
                            {/* Nome completo */}
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
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                    placeholder="Seu nome"
                                    required
                                />
                            </div>

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

                            {/* Telefone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm pl-[16px] pb-[8px]">
                                    Telefone
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="text"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                    placeholder="(11) 91234-5678"
                                    required
                                />
                            </div>

                            {/* CPF */}
                            <div>
                                <label htmlFor="cpf" className="block text-sm pl-[16px] pb-[8px]">
                                    CPF
                                </label>
                                <input
                                    id="cpf"
                                    name="cpf"
                                    type="text"
                                    value={formData.cpf}
                                    onChange={handleInputChange}
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                    placeholder="123.456.789-00"
                                    required
                                />
                            </div>

                            {/* Data de nascimento */}
                            <div>
                                <label className="block text-sm pl-[16px] pb-[8px]">
                                    Data de nascimento
                                </label>
                                <div className="flex gap-4 mb-[16px]">
                                    <input
                                        id="day"
                                        name="day"
                                        type="number"
                                        value={formData.day}
                                        onChange={handleInputChange}
                                        className="outline-none w-1/3 h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                        placeholder="Dia"
                                        required
                                    />
                                    <input
                                        id="month"
                                        name="month"
                                        type="number"
                                        value={formData.month}
                                        onChange={handleInputChange}
                                        className="outline-none w-1/3 h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                        placeholder="Mês"
                                        required
                                    />
                                    <input
                                        id="year"
                                        name="year"
                                        type="number"
                                        value={formData.year}
                                        onChange={handleInputChange}
                                        className="outline-none w-1/3 h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                        placeholder="Ano"
                                        required
                                    />
                                </div>
                            </div>

                            {/* CRM */}
                            <div>
                                <label htmlFor="crm" className="block text-sm pl-[16px] pb-[8px]">
                                    CRM
                                </label>
                                <input
                                    id="crm"
                                    name="crm"
                                    type="text"
                                    value={formData.crm}
                                    onChange={handleInputChange}
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                    placeholder="CRM/SP 123456"
                                    required
                                />
                            </div>

                            {/* Sobre */}
                            <div>
                                <label htmlFor="about" className="block text-sm pl-[16px] pb-[8px]">
                                    Sobre
                                </label>
                                <textarea
                                    id="about"
                                    name="about"
                                    value={formData.about}
                                    onChange={handleInputChange}
                                    className="outline-none w-full h-[96px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] pt-[12px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20 resize-none"
                                    placeholder="Diga um pouco sobre você, sua formação e experiência, caso deseje."
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
                                        placeholder="Crie sua senha"
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

                            {/* Confirmar Senha */}
                            <div className="relative">
                                <label htmlFor="confirmPassword" className="block text-sm pl-[16px] pb-[8px]">
                                    Confirmar senha
                                </label>
                                <div className="relative mb-[16px]">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="outline-none w-full h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                        placeholder="Confirme sua senha"
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

                            {/* Botão Próximo */}
                            <div className="text-center mb-[24px]">
                                <button
                                    type="submit"
                                    className="bg-[#5179EF] text-white w-full h-[40px] rounded-[6px] cursor-pointer transition transform active:scale-95 duration-100"
                                >
                                    Próximo
                                </button>
                            </div>
                        </form>

                        <hr className="h-[1px] text-[#E5E5E5] w-full" />
                        <span className="flex justify-center text-sm text-gray-500 mt-[5px]">ou</span>
                        <div className="text-center">
                            <Link href="/medicos/login-medico">
                                <span className="text-[#5179EF] hover:text-blue-800 text-sm mt-[10px]">
                                    Já tem uma conta? Acesse
                                </span>
                            </Link>
                            <br />
                            <Link href="/register">
                                <span className="text-[#5179EF] hover:text-blue-800 text-sm mt-[10px]">
                                    É um paciente? Faça seu cadastro aqui
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