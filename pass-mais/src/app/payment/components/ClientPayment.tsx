"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClientPaymentProps {
    doctorId: string;
    date: string;
    time: string;
    forWhom: string;
}

export default function ClientPayment({ doctorId, date, time, forWhom }: ClientPaymentProps) {
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!paymentMethod) {
            alert("Por favor, selecione um método de pagamento.");
            return;
        }

        // Redirecionar para a página de confirmação com os dados
        router.push(
            `/confirmation?doctorId=${doctorId}&date=${date}&time=${time}&forWhom=${forWhom}&paymentMethod=${paymentMethod}`
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <div className="h-16"></div>
            <div className="flex justify-center items-center w-full px-4 sm:px-6 lg:px-8 mt-4">
                <div className="w-full max-w-5xl">
                    {/* Botão Fechar */}
                    <div className="flex justify-end mb-4">
                        <Link
                            href="/medical-appointments"
                            className="flex items-center gap-2 bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg 
                hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 
                transition-all duration-200"
                        >
                            Fechar <X size={18} />
                        </Link>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 px-2 tracking-tight">
                        Seleção de Pagamento
                    </h2>

                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Escolha o método de pagamento</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="pix"
                                        checked={paymentMethod === "pix"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">PIX</span>
                                </label>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="card"
                                        checked={paymentMethod === "card"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">Cartão de Crédito/Débito</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSubmit}
                            className="bg-[#5179EF] text-white font-medium px-6 py-3 rounded-lg 
                hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 
                transition-all duration-200"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}