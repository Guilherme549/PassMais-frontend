'use client';

import LoginForm from "@/app/(auth)/components/LoginForm";
import LoginImage from "@/app/(auth)/components/LoginImage";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function Login() {
  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <LoginImage />

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl border border-gray-100 px-8 py-10">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Seja bem-vindo de volta</h2>
            <p className="mt-2 text-sm text-gray-500">
              Acesse sua conta com o e-mail e senha cadastrados para continuar.
            </p>
          </header>

          <LoginForm />

          <div className="mt-6 text-center text-sm text-gray-600">
            <span className="mr-1">Ainda não tem conta?</span>
            <Link href="/register" className="text-[#007AFF] font-medium hover:text-blue-700">
              Crie uma conta
            </Link>
          </div>

          <div className="mt-8 rounded-lg bg-gray-50 border border-gray-100 p-4 text-sm text-gray-500">
            <p className="font-medium text-gray-600">Dicas rápidas</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Use o e-mail cadastrado que foi colocado durante a criação da conta.</li>
              <li>Se esquecer a senha, clique em "Esqueceu a senha?" para recuperar.</li>
            </ul>
          </div>

          <div className="mt-10 text-center text-xs text-gray-400">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
