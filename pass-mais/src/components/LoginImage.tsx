"use client";
import Image from "next/image";

export default function LoginImage() {
    return (
        <Image
            className="h-[100vh] w-min flex-none hidden lg:block"
            src="/Login-image.png"
            alt="Imagem da tela de login"
            priority
            width={500}
            height={700}
        />
    );
}
