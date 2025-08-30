"use client";

import LoginImage from "@/app/(auth)/components/LoginImage";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EsqueceuSenhaMedico() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailOk = /.+@.+\..+/.test(email);
    if (!emailOk) {
      setError("Informe um e-mail válido.");
      return;
    }

    try {
      setLoading(true);
      // TODO: substituir por chamada real para enviar e-mail de redefinição
      await new Promise((r) => setTimeout(r, 900));
      setSent(true);
    } catch {
      setError("Não foi possível enviar o e-mail. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6FA]">
      <div className="flex flex-1">
        <LoginImage />

        <div className="w-full max-w-md mx-auto my-20 px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-center">
                Esqueceu a senha (Médico)
              </h2>
            </div>

            {error && (
              <div className="px-6 pt-4">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              {!sent ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: meuemail@exemplo.com"
                      className="h-11"
                      required
                    />
                    <p className="text-[12px] text-gray-500">
                      Enviaremos um link para redefinir sua senha.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-[#5179EF] hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white w-full h-10 rounded-md font-medium transition active:scale-[0.99]"
                    >
                      {loading ? "Enviando..." : "Enviar link de redefinição"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-2 py-2">
                  <p className="text-green-600 font-medium">
                    E-mail enviado!
                  </p>
                  <p className="text-sm text-gray-600">
                    Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <div className="h-px bg-gray-200 w-full" />
                <div className="text-center mt-2">
                  <Link href="/medicos/login-medico" className="text-[#5179EF] hover:text-blue-800 text-sm">
                    Voltar para o login
                  </Link>
                </div>
              </div>
            </form>
          </div>

          
        </div>
      </div>
    </div>
  );
}
