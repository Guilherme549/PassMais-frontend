'use client';

import LoginImage from "@/components/LoginImage";
import { useState } from 'react';
import { IoMdEye, IoMdEyeOff } from "react-icons/io";


export default function Register() {
    const [showPassword, setShowPassword] = useState(false); // Controle da senha
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Controle da confirmação da senha
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '', // Campo de confirmação de senha
        acceptTerms: false
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
        // Aqui você pode fazer o envio do formulário
        console.log('Formulário enviado com sucesso');
    };

    return (
        <div className="flex ">
            <LoginImage />

            <div className="w-[33.75rem] mx-auto ">

                <div className="w-[22.5rem] mx-auto m-[100px]">
                    <h2 className="text-2xl font-semibold mb-[24px] text-center">Criar uma conta</h2>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <div>
                                <label htmlFor="fullName" className="flex flex-col text-sm pl-[16px] pb-[8px]">Nome completo</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                    placeholder="Digite seu nome completo"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="flex flex-col text-sm pl-[16px] pb-[8px]">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                    placeholder="Insira o seu email"
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="flex flex-col text-sm pl-[16px] pb-[8px]">Telefone</label>
                                <input
                                    id="phone"
                                    type="number"
                                    name="phone"
                                    onChange={handleInputChange}
                                    className="outline-none w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                    placeholder="Digite o seu numero de telefone"
                                />
                            </div>

                            <div className='relative'>
                                <label htmlFor="password" className="flex flex-col text-sm pl-[16px] pb-[8px]">Senha</label>
                                <div className='relative mb-[20px]'>
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
                                        onClick={() => setShowPassword(!showPassword)}
                                        type='button'
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Campo de confirmação de senha */}
                            <div className='relative'>
                                <label htmlFor="confirmPassword" className="flex flex-col text-sm pl-[16px] pb-[8px]">Confirme sua senha</label>
                                <div className='relative mb-[20px]'>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"} // Controle separado para a confirmação de senha
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 outline-none transition-colors duration-200 bg-[#E5E5E5]"
                                        placeholder="Confirme sua senha"
                                    />
                                    <button
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Toggling para confirmação de senha
                                        type='button'
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showConfirmPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Exibição de erro se as senhas não coincidirem */}
                            {error && <p className="text-red-500 text-sm">{error}</p>}

                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        id="acceptTerms"
                                        name="acceptTerms"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="ml-3">
                                    <label htmlFor="acceptTerms" className="text-sm text-gray-500">
                                        Li e concordo com os{' '}
                                        <a href="#" className="text-blue-600 hover:text-blue-800">
                                            Termos e condições
                                        </a>{' '}
                                        e{' '}
                                        <a href="#" className="text-blue-600 hover:text-blue-800">
                                            política de privacidade
                                        </a>
                                    </label>
                                </div>
                            </div>

                        </div>
                        <div className="text-center mb-[24px]">
                            <button type="submit" className="bg-[#007AFF] text-white w-full h-[40px] rounded-[6px]">Criar conta</button>
                        </div>

                    </form>
                </div>

            </div>
        </div>
    );
}
