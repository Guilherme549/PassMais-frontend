'use client';

import LoginForm from "@/app/(auth)/components/LoginForm";
import LoginImage from "@/app/(auth)/components/LoginImage";
import Footer from "@/components/Footer";
import Link from 'next/link';

export default function Login() {

    return (
        <div className="flex h-[100vh] w-[100vw]">
            <LoginImage />

            <div className="w-[33.75rem] mx-auto m-[100px] mb-[0px]">

                <div className="w-[22.1rem] mx-auto ">
                    <h2 className="text-2xl font-semibold mb-[24px] text-center">Seja bem-vindo de volta!!</h2>
                    < LoginForm />

                    <div className="size-12 font-regular text-center w-full line-we">
                        <span>Ainda não tem conta?</span>
                        <Link href="/register">
                            <span className="text-[#007AFF]"> Crie uma conta aqui</span>
                        </Link>
                    </div>
                </div>
                <div className="mt-[350px]">
                    <Footer />
                </div>

            </div>

        </div>

    )
}