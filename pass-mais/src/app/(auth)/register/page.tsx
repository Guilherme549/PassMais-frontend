'use client';

import LoginImage from "@/app/(auth)/components/LoginImage";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaCheckCircle } from "react-icons/fa";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

export default function Register() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        acceptTerms: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validação: Verificar se as senhas coincidem
        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        // Validação: Verificar se os termos foram aceitos
        if (!formData.acceptTerms) {
            setError('Você deve aceitar os termos e condições');
            return;
        }

        // Dados a serem enviados
        const userData = {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
        };

        try {
            const response = await fetch('http://3.85.78.106:3333/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar conta');
            }

            // Sucesso: Exibir mensagem e redirecionar após 2 segundos
            setSuccess('Usuário criado com sucesso!');
            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (err: unknown) {
            // Type guard para lidar com erros
            let errorMessage = 'Ocorreu um erro. Tente novamente.';
            if (err instanceof Error) {
                errorMessage = err.message.includes('Failed to fetch')
                    ? 'Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.'
                    : err.message;

                console.log(err)
            }
            setError(errorMessage);
            console.error('Erro na requisição:', err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Conteúdo principal */}
            <div className="flex flex-1">
                <LoginImage />

                <div className="w-[33.75rem] mx-auto m-[100px] mb-[0px]">
                    <div className="w-[22.5rem] mx-auto">
                        <h2 className="text-2xl font-semibold mb-[24px] text-center">Criar uma conta</h2>

                        {success && (
                            <div className="flex items-center justify-center bg-green-100 text-green-800 text-base font-semibold p-4 mb-4 rounded-lg shadow-md animate-fade-in">
                                <FaCheckCircle className="mr-2 text-green-600" size={20} />
                                {success}
                            </div>
                        )}
                        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

                        <form onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="fullName" className="block text-sm pl-[16px] pb-[8px]">Nome completo</label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                    placeholder="Digite seu nome completo"
                                    required
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
                                    required
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
                                    required
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
                        <Link href="/login">
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