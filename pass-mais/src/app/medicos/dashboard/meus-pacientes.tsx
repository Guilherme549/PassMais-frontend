"use client";

import { useState } from "react";

interface MeusPacientesProps {
    patients: { id: number; name: string; cpf: string; lastVisit: string; notes: string }[];
}

export default function MeusPacientes({ patients }: MeusPacientesProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredPatients = patients.filter((patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cpf.includes(searchTerm) ||
        patient.lastVisit.includes(searchTerm)
    );

    return (
        <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Meus Pacientes</h2>
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou data"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-[#5179EF]"
                />
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6">
                <ul className="space-y-4">
                    {filteredPatients.map((patient) => (
                        <li key={patient.id} className="border-b pb-4">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-gray-900 font-medium">{patient.name}</p>
                                    <p className="text-gray-600">CPF: {patient.cpf}</p>
                                    <p className="text-gray-600">Última Visita: {patient.lastVisit}</p>
                                </div>
                                <button className="text-[#5179EF] hover:underline">Ver Histórico</button>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm text-gray-700 mb-2">Anotações</label>
                                <textarea
                                    className="outline-none w-full h-[96px] bg-[#E5E5E5] rounded-[6px] p-4 focus:ring-2 focus:ring-[#5179EF] resize-none"
                                    defaultValue={patient.notes}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}