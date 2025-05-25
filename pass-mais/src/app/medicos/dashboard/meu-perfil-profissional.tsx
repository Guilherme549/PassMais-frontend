"use client";

import { useState } from "react";

export default function MeuPerfilProfissional() {
    const [profile, setProfile] = useState({
        fullName: "Dr. João Silva",
        specialty: "Cardiologia",
        crm: "CRM/SP 123456",
        bio: "Médico cardiologista com 10 anos de experiência, formado pela USP.",
    });
    const [schedule, setSchedule] = useState({ day: "", startTime: "", endTime: "" });
    const [unavailability, setUnavailability] = useState({ startDate: "", endDate: "" });

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Perfil atualizado:", profile);
    };

    const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSchedule((prev) => ({ ...prev, [name]: value }));
    };

    const handleScheduleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Horário adicionado:", schedule);
    };

    const handleUnavailabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUnavailability((prev) => ({ ...prev, [name]: value }));
    };

    const handleUnavailabilitySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Indisponibilidade configurada:", unavailability);
    };

    return (
        <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Meu Perfil Profissional</h2>
            <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Perfil</h3>
                <form onSubmit={handleProfileSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="fullName" className="block text-sm pl-[16px] pb-[8px]">
                                Nome completo
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={profile.fullName}
                                onChange={handleProfileChange}
                                className="outline-none w-full h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                            />
                        </div>
                        <div>
                            <label htmlFor="specialty" className="block text-sm pl-[16px] pb-[8px]">
                                Especialidade
                            </label>
                            <input
                                id="specialty"
                                name="specialty"
                                type="text"
                                value={profile.specialty}
                                onChange={handleProfileChange}
                                className="outline-none w-full h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                            />
                        </div>
                        <div>
                            <label htmlFor="crm" className="block text-sm pl-[16px] pb-[8px]">
                                CRM
                            </label>
                            <input
                                id="crm"
                                name="crm"
                                type="text"
                                value={profile.crm}
                                onChange={handleProfileChange}
                                className="outline-none w-full h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                            />
                        </div>
                    </div>
                    <div className="mt-6">
                        <label htmlFor="bio" className="block text-sm pl-[16px] pb-[8px]">
                            Bio
                        </label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={profile.bio}
                            onChange={handleProfileChange}
                            className="outline-none w-full h-[96px] bg-[#E5E5E5] rounded-[6px] pl-[16px] pt-[12px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20 resize-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="mt-6 bg-[#5179EF] text-white w-full h-[40px] rounded-[6px] cursor-pointer transition transform active:scale-95 duration-100"
                    >
                        Salvar Alterações
                    </button>
                </form>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Horários de Atendimento</h3>
                <form onSubmit={handleScheduleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="day" className="block text-sm pl-[16px] pb-[8px]">
                                Dia da Semana
                            </label>
                            <select
                                id="day"
                                name="day"
                                value={schedule.day}
                                onChange={handleScheduleChange}
                                className="outline-none w-full h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                required
                            >
                                <option value="">Selecione o dia</option>
                                <option value="Segunda-feira">Segunda-feira</option>
                                <option value="Terça-feira">Terça-feira</option>
                                <option value="Quarta-feira">Quarta-feira</option>
                                <option value="Quinta-feira">Quinta-feira</option>
                                <option value="Sexta-feira">Sexta-feira</option>
                                <option value="Sábado">Sábado</option>
                                <option value="Domingo">Domingo</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="startTime" className="block text-sm pl-[16px] pb-[8px]">
                                Horário de Início
                            </label>
                            <input
                                id="startTime"
                                name="startTime"
                                type="time"
                                value={schedule.startTime}
                                onChange={handleScheduleChange}
                                className="outline-none w-full h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="endTime" className="block text-sm pl-[16px] pb-[8px]">
                                Horário de Término
                            </label>
                            <input
                                id="endTime"
                                name="endTime"
                                type="time"
                                value={schedule.endTime}
                                onChange={handleScheduleChange}
                                className="outline-none w-full h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-6 bg-[#5179EF] text-white w-full h-[40px] rounded-[6px] cursor-pointer transition transform active:scale-95 duration-100"
                    >
                        Adicionar Horário
                    </button>
                </form>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurar Indisponibilidades</h3>
                <form onSubmit={handleUnavailabilitySubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="startDate" className="block text-sm pl-[16px] pb-[8px]">
                                Data de Início
                            </label>
                            <input
                                id="startDate"
                                name="startDate"
                                type="date"
                                value={unavailability.startDate}
                                onChange={handleUnavailabilityChange}
                                className="outline-none w-full h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm pl-[16px] pb-[8px]">
                                Data de Término
                            </label>
                            <input
                                id="endDate"
                                name="endDate"
                                type="date"
                                value={unavailability.endDate}
                                onChange={handleUnavailabilityChange}
                                className="outline-none w-full h-[48px] bg-[#E5E5E5] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-6 bg-[#5179EF] text-white w-full h-[40px] rounded-[6px] cursor-pointer transition transform active:scale-95 duration-100"
                    >
                        Configurar Indisponibilidade
                    </button>
                </form>
            </div>
        </section>
    );
}