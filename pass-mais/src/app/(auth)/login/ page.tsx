'use client';

import Image from "next/image";
import Link from 'next/link';
import { useState } from 'react';
import { IoMdEye, IoMdEyeOff } from "react-icons/io";


import LoginImage from "../../assets/Login-image.png";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        acceptTerms: false
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="flex ">
            <Image
                className="h-screen flex-none"
                src={LoginImage}
                alt="#"
                width={1050}
            />

            <div className="w-[33.75rem] mx-auto ">

                <div className="w-[22.5rem] mx-auto m-[100px]">
                    <h2 className="text-2xl font-semibold mb-[24px] text-center">Seja bem-vindo de volta</h2>
                    <form>
                        <div>
                            <div>
                                <label htmlFor="email" className="flex flex-col text-sm pl-[16px] pb-[8px]">Email</label>
                                <input id="email" type="email" className="outline-none  w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20" placeholder="Insira o seu email" />
                            </div>

                            <div className='relative'>
                                <label htmlFor="password" className="flex flex-col text-sm pl-[16px] pb-[8px]">Senha</label>
                                <div className='relative mb-[20px]'>
                                    <input id="password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 outline-none transition-colors duration-200 bg-[#E5E5E5] " placeholder="Insira sua senha" />
                                    <button onClick={() => setShowPassword(!showPassword)} type='button' className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                        {showPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}

                                    </button>
                                </div>

                            </div>

                            <div className="text-center mb-[32px]">
                                <Link href="/register">
                                    <span className="text-[#007AFF]">Esqueceu a senha?</span>
                                </Link>
                            </div>

                        </div>
                        <div className="text-center mb-[24px]">
                            <button className="bg-[#007AFF] text-white w-full h-[40px] rounded-[6px]">Acessar conta</button>
                        </div>

                        <div className="size-12 font-regular text-center w-full line-we">
                            <span>Ainda não tem conta?</span>
                            <Link href="/register">
                                <span className="text-[#007AFF]"> Crie uma conta aqui</span>
                            </Link>
                        </div>

                    </form>
                </div>

            </div>
        </div>
    )
}