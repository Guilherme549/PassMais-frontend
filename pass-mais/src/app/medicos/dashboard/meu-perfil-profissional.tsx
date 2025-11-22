"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { jsonGet, jsonPut } from "@/lib/api";
import { extractDoctorIdFromToken } from "@/lib/token";

type ProfessionalInfo = {
    fullName: string;
    crm: string;
    specialty: string;
    bio: string;
    clinicName: string;
    clinicStreetAndNumber: string;
    clinicCity: string;
    clinicPostalCode: string;
    consultationPrice: string;
    phone: string;
    photoUrl: string;
};

const EMPTY_PROFESSIONAL_INFO: ProfessionalInfo = {
    fullName: "",
    crm: "",
    specialty: "",
    bio: "",
    clinicName: "",
    clinicStreetAndNumber: "",
    clinicCity: "",
    clinicPostalCode: "",
    consultationPrice: "",
    phone: "",
    photoUrl: "",
};

interface DoctorProfileResponse {
    id?: string;
    name?: string;
    crm?: string;
    specialty?: string;
    bio?: string;
    photoUrl?: string;
    consultationPrice?: number;
    clinicName?: string;
    clinicStreetAndNumber?: string;
    clinicCity?: string;
    clinicPostalCode?: string;
}

export default function MeuPerfilProfissional() {
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const [professionalInfo, setProfessionalInfo] = useState<ProfessionalInfo>(EMPTY_PROFESSIONAL_INFO);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("accessToken");
        setDoctorId(extractDoctorIdFromToken(token));
    }, []);

    useEffect(() => {
        const loadDoctorProfile = async () => {
            if (!doctorId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const response = await jsonGet<DoctorProfileResponse>(`/api/doctors/${doctorId}`);
                setProfessionalInfo((prev) => ({
                    ...prev,
                    fullName: response.name ?? prev.fullName,
                    crm: response.crm ?? prev.crm,
                    specialty: response.specialty ?? prev.specialty,
                    bio: response.bio ?? prev.bio,
                    photoUrl: response.photoUrl ?? prev.photoUrl,
                    consultationPrice:
                        typeof response.consultationPrice === "number" ? response.consultationPrice.toString() : prev.consultationPrice,
                    clinicName: response.clinicName ?? prev.clinicName,
                    clinicStreetAndNumber: response.clinicStreetAndNumber ?? prev.clinicStreetAndNumber,
                    clinicCity: response.clinicCity ?? prev.clinicCity,
                    clinicPostalCode: response.clinicPostalCode ?? prev.clinicPostalCode,
                }));
            } catch (error) {
                const err = error as Error;
                setErrorMessage(err.message || "Não foi possível carregar os dados do médico.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadDoctorProfile();
    }, [doctorId]);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setProfessionalInfo((prev) => ({ ...prev, [name]: value }));
    };

    const toggleEditing = () => {
        setFeedbackMessage(null);
        setErrorMessage(null);
        setIsEditing((prev) => !prev);
    };

    const normalizePrice = (value: string) => {
        const numeric = value.replace(/[^0-9,.-]/g, "").replace(",", ".");
        const parsed = Number(numeric);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const handleSave = async () => {
        if (!doctorId) {
            setErrorMessage("Não foi possível identificar o médico autenticado. Faça login novamente.");
            return;
        }
        setIsSaving(true);
        setErrorMessage(null);
        setFeedbackMessage(null);

        try {
            const payload = {
                id: doctorId,
                crm: professionalInfo.crm,
                specialty: professionalInfo.specialty,
                bio: professionalInfo.bio,
                photoUrl: professionalInfo.photoUrl || null,
                consultationPrice: normalizePrice(professionalInfo.consultationPrice),
                clinicName: professionalInfo.clinicName,
                clinicStreetAndNumber: professionalInfo.clinicStreetAndNumber,
                clinicCity: professionalInfo.clinicCity,
                clinicPostalCode: professionalInfo.clinicPostalCode,
            };
            await jsonPut(`/api/doctors/${doctorId}`, payload);
            setFeedbackMessage("Perfil atualizado com sucesso.");
            setIsEditing(false);
        } catch (error) {
            const err = error as Error;
            setErrorMessage(err.message || "Não foi possível atualizar o perfil. Tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    const inputBaseClass =
        "h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-700 focus:border-[#5179EF] focus:outline-none focus:ring-2 focus:ring-[#5179EF]/20 disabled:bg-gray-50 disabled:text-gray-500";
    const textareaBaseClass =
        "min-h-[140px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-[#5179EF] focus:outline-none focus:ring-2 focus:ring-[#5179EF]/20 disabled:bg-gray-50 disabled:text-gray-500";

    return (
        <section className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Meu Perfil Profissional</h1>
                    <p className="text-sm text-gray-500">
                        Os dados são carregados do seu cadastro oficial e permanecem bloqueados até você optar por editar.
                    </p>
                </div>
                <div className="flex gap-3">
                    {isEditing && (
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                    )}
                    {isEditing && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-full bg-[#5179EF] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#395fd3] disabled:cursor-not-allowed disabled:bg-[#a8b7f0]"
                        >
                            {isSaving ? "Salvando..." : "Salvar"}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={toggleEditing}
                        disabled={isLoading}
                        className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-600"
                    >
                        {isEditing ? "Bloquear edição" : "Editar Perfil"}
                    </button>
                </div>
            </div>

            {feedbackMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {feedbackMessage}
                </div>
            )}
            {errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                </div>
            )}

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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14a5 5 0 100-10 5 5 0 000 10z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 20.5a8.5 8.5 0 0115 0" />
                            </svg>
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-base font-semibold text-gray-900">Foto</h3>
                            <p className="text-sm text-gray-500">Foto do perfil profissional (atualize via URL ou upload em breve).</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <p className="text-sm text-gray-500">Carregando dados do perfil...</p>
                    ) : (
                        <div className="grid gap-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Nome</span>
                                    <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                                        {professionalInfo.fullName || "—"}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-400" htmlFor="crm">
                                        CRM
                                    </label>
                                    <Input
                                        id="crm"
                                        name="crm"
                                        value={professionalInfo.crm}
                                        onChange={handleInputChange}
                                        placeholder="CRM"
                                        disabled={!isEditing}
                                        className={inputBaseClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400" htmlFor="specialty">
                                    Especialidade
                                </label>
                                <Input
                                    id="specialty"
                                    name="specialty"
                                    value={professionalInfo.specialty}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Cardiologia"
                                    disabled={!isEditing}
                                    className={inputBaseClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400" htmlFor="bio">
                                    Descrição
                                </label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={professionalInfo.bio}
                                    onChange={handleInputChange}
                                    placeholder="Compartilhe sua experiência clínica..."
                                    disabled={!isEditing}
                                    className={textareaBaseClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400" htmlFor="photoUrl">
                                    URL da foto
                                </label>
                                <Input
                                    id="photoUrl"
                                    name="photoUrl"
                                    value={professionalInfo.photoUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://..."
                                    disabled={!isEditing}
                                    className={inputBaseClass}
                                />
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-400" htmlFor="clinicName">
                                        Nome da clínica
                                    </label>
                                    <Input
                                        id="clinicName"
                                        name="clinicName"
                                        value={professionalInfo.clinicName}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Clínica Vida Plena"
                                        disabled={!isEditing}
                                        className={inputBaseClass}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label
                                        className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                        htmlFor="clinicStreetAndNumber"
                                    >
                                        Endereço
                                    </label>
                                    <Input
                                        id="clinicStreetAndNumber"
                                        name="clinicStreetAndNumber"
                                        value={professionalInfo.clinicStreetAndNumber}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Av. Paulista, 1000"
                                        disabled={!isEditing}
                                        className={inputBaseClass}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-400" htmlFor="clinicCity">
                                        Cidade
                                    </label>
                                    <Input
                                        id="clinicCity"
                                        name="clinicCity"
                                        value={professionalInfo.clinicCity}
                                        onChange={handleInputChange}
                                        placeholder="Ex: São Paulo"
                                        disabled={!isEditing}
                                        className={inputBaseClass}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label
                                        className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                        htmlFor="clinicPostalCode"
                                    >
                                        CEP
                                    </label>
                                    <Input
                                        id="clinicPostalCode"
                                        name="clinicPostalCode"
                                        value={professionalInfo.clinicPostalCode}
                                        onChange={handleInputChange}
                                        placeholder="Ex: 01310-100"
                                        disabled={!isEditing}
                                        className={inputBaseClass}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label
                                        className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                                        htmlFor="consultationPrice"
                                    >
                                        Valor da consulta (R$)
                                    </label>
                                    <Input
                                        id="consultationPrice"
                                        name="consultationPrice"
                                        value={professionalInfo.consultationPrice}
                                        onChange={handleInputChange}
                                        placeholder="Ex: 250"
                                        disabled={!isEditing}
                                        className={inputBaseClass}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Telefone (interno)
                                    </label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={professionalInfo.phone}
                                        onChange={handleInputChange}
                                        placeholder="Ex: (11) 91234-5678"
                                        disabled={!isEditing}
                                        className={inputBaseClass}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
