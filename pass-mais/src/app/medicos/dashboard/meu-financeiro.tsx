"use client";

import { useState } from "react";

interface MeuFinanceiroProps {
    financials: { id: number; date: string; type: string; value: number; status: string }[];
}

export default function MeuFinanceiro({ financials }: MeuFinanceiroProps) {
    const [financialFilter, setFinancialFilter] = useState("todos");

    const filteredFinancials = financials.filter((fin) =>
        financialFilter === "todos" || fin.status === financialFilter
    );

    return (
        <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Meu Financeiro</h2>
            <div className="mb-6">
                <label className="mr-4">Filtrar por status:</label>
                <select
                    value={financialFilter}
                    onChange={(e) => setFinancialFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5179EF]"
                >
                    <option value="todos">Todos</option>
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                </select>
                <button className="ml-4 bg-[#5179EF] text-white px-4 py-2 rounded-lg">
                    Exportar Relatório
                </button>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Recebimentos</h3>
                <ul className="space-y-4">
                    {filteredFinancials.map((fin) => (
                        <li key={fin.id} className="flex justify-between border-b pb-2">
                            <div>
                                <p className="text-gray-900 font-medium">{fin.type}</p>
                                <p className="text-gray-600">{fin.date} - R$ {fin.value.toFixed(2)} - {fin.status}</p>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900">Saldo a Receber</h3>
                    <p className="text-2xl font-bold text-[#5179EF]">
                        R$ {financials.filter((fin) => fin.status === "pendente").reduce((sum, fin) => sum + fin.value, 0).toFixed(2)}
                    </p>
                </div>
            </div>
        </section>
    );
}