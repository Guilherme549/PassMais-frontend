'use client';

import LoginForm from "@/components/LoginForm";
import Image from "next/image";
import Link from 'next/link';
import LoginImage from "../../assets/Login-image.png";

export default function Login() {

    return (
        <div className="flex ">
            <Image
                className="h-full flex-none"
                src={LoginImage}
                alt="#"
                width={1050}
                priority
            />

            <div className="w-[33.75rem] mx-auto ">

                <div className="w-[22.5rem] mx-auto m-[100px]">
                    <h2 className="text-2xl font-semibold mb-[24px] text-center">Seja bem-vindo de volta</h2>
                    < LoginForm />

                    <div className="size-12 font-regular text-center w-full line-we">
                        <span>Ainda não tem conta?</span>
                        <Link href="/register">
                            <span className="text-[#007AFF]"> Crie uma conta aqui</span>
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    )
}