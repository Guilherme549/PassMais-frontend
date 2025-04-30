'use client';

import LoginImage from "@/app/(auth)/components/LoginImage";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState } from 'react';
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        acceptTerms: false,
    });
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }
        setError('');
        console.log('Formulário enviado com sucesso');
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Conteúdo principal */}
            <div className="flex flex-1">
                <LoginImage />

                <div className="w-[33.75rem] mx-auto m-[100px] mb-[0px]">
                    <div className="w-[22.5rem] mx-auto">
                        <h2 className="text-2xl font-semibold mb-[24px] text-center">Criar uma conta</h2>

                        <form onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="fullName" className="block text-sm pl-[16px] pb-[8px]">Nome completo</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                    placeholder="Digite seu nome completo"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm pl-[16px] pb-[8px]">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                    placeholder="Insira o seu email"
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm pl-[16px] pb-[8px]">Telefone</label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="text"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                    placeholder="Digite o seu número de telefone"
                                />
                            </div>

                            <div className="relative">
                                <label htmlFor="password" className="block text-sm pl-[16px] pb-[8px]">Senha</label>
                                <div className="relative mb-[20px]">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 outline-none transition-colors duration-200 bg-[#E5E5E5]"
                                        placeholder="Crie sua senha"
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
                                <label htmlFor="confirmPassword" className="block text-sm pl-[16px] pb-[8px]">Confirme sua senha</label>
                                <div className="relative mb-[20px]">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 outline-none transition-colors duration-200 bg-[#E5E5E5]"
                                        placeholder="Confirme sua senha"
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

                            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

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
                                    Li e concordo com os{' '}
                                    <a href="#" className="text-blue-600 hover:text-blue-800">Termos e condições</a> e{' '}
                                    <a href="#" className="text-blue-600 hover:text-blue-800">política de privacidade</a>
                                </label>
                            </div>

                            <div className="text-center mb-[24px]">
                                <button type="submit" className="bg-[#007AFF] text-white w-full h-[40px] rounded-[6px] cursor-pointer transition transform active:scale-95 duration-100">
                                    Criar conta
                                </button>
                            </div>
                        </form>

                        <hr className="h-[1px] text-[#E5E5E5] w-full" />
                        <span className="flex justify-center text-sm text-gray-500 mt-[5px]">ou</span>
                        <Link href="/">
                            <span className="text-blue-600 hover:text-blue-800 text-sm flex justify-center mt-[10px]"> Faça login em sua conta</span>
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
