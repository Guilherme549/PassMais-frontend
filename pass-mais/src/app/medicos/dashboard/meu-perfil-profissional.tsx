"use client";

import { ChangeEvent, useState } from "react";

import { Input } from "@/components/ui/input";

type ProfessionalInfo = {
    fullName: string;
    crm: string;
    specialties: string;
    bio: string;
    clinic_name: string;
    clinic_street_number: string;
    clinic_city: string;
    clinic_postal_code: string;
    consultation_price: string;
    phone: string;
};

type EditableField = keyof ProfessionalInfo;

const DEFAULT_PROFESSIONAL_INFO: ProfessionalInfo = {
    fullName: "Dr. Carlos Mendes",
    crm: "CRM-SP 123456",
    specialties: "Cardiologia",
    bio: "Especialista em cardiologia clínica e preventiva. Mais de 15 anos de experiência no tratamento de doenças cardiovasculares.",
    clinic_name: "Clínica Vida Plena",
    clinic_street_number: "Av. Paulista, 1000",
    clinic_city: "São Paulo",
    clinic_postal_code: "01310-100",
    consultation_price: "R$ 250,00",
    phone: "(11) 91234-5678",
};

export default function MeuPerfilProfissional() {
    const [professionalInfo, setProfessionalInfo] = useState<ProfessionalInfo>(DEFAULT_PROFESSIONAL_INFO);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        const field = name as EditableField;

        setProfessionalInfo((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <section className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Editar Perfil</h1>
                    <p className="text-sm text-gray-500">Mantenha suas informações profissionais atualizadas</p>
                </div>
                <button
                    type="button"
                    className="self-end rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 md:self-auto"
                >
                    Editar Perfil
                </button>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white shadow-md">
                <div className="border-b border-gray-200 px-8 py-6">
                    <h2 className="text-lg font-semibold text-gray-900">Informações Profissionais</h2>
                </div>
                <div className="space-y-8 px-8 py-8">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                        <div className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-gray-300 bg-gray-50">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 14a5 5 0 100-10 5 5 0 000 10z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4.5 20.5a8.5 8.5 0 0115 0"
                                />
                            </svg>
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-base font-semibold text-gray-900">Foto</h3>
                            <p className="text-sm text-gray-500">Foto do perfil profissional</p>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Nome</span>
                                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                                    {professionalInfo.fullName}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">CRM</span>
                                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                                    {professionalInfo.crm}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Especialidades</span>
                            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                                {professionalInfo.specialties}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Descrição</span>
                            <div className="rounded-2xl bg-gray-50 px-4 py-4 text-sm leading-relaxed text-gray-700">
                                {professionalInfo.bio}
                            </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label
                                    htmlFor="clinic_name"
                                    className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                >
                                    Nome da clínica onde está atendendo
                                </label>
                                <Input
                                    id="clinic_name"
                                    name="clinic_name"
                                    value={professionalInfo.clinic_name}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Clínica Vida Plena"
                                    className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label
                                    htmlFor="clinic_street_number"
                                    className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                >
                                    Endereço onde está atendendo
                                </label>
                                <Input
                                    id="clinic_street_number"
                                    name="clinic_street_number"
                                    value={professionalInfo.clinic_street_number}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Av. Paulista, 1000"
                                    className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
                                />
                            </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label
                                    htmlFor="clinic_city"
                                    className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                >
                                    Cidade da clínica
                                </label>
                                <Input
                                    id="clinic_city"
                                    name="clinic_city"
                                    value={professionalInfo.clinic_city}
                                    onChange={handleInputChange}
                                    placeholder="Ex: São Paulo"
                                    className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label
                                    htmlFor="clinic_postal_code"
                                    className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                >
                                    CEP
                                </label>
                                <Input
                                    id="clinic_postal_code"
                                    name="clinic_postal_code"
                                    value={professionalInfo.clinic_postal_code}
                                    onChange={handleInputChange}
                                    placeholder="Ex: 01310-100"
                                    className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
                                />
                            </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label
                                    htmlFor="consultation_price"
                                    className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                >
                                    Valor da consulta
                                </label>
                                <Input
                                    id="consultation_price"
                                    name="consultation_price"
                                    value={professionalInfo.consultation_price}
                                    onChange={handleInputChange}
                                    placeholder="Ex: R$ 250,00"
                                    className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Telefone de contato
                                </label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={professionalInfo.phone}
                                    onChange={handleInputChange}
                                    placeholder="Ex: (11) 91234-5678"
                                    className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    );
}
