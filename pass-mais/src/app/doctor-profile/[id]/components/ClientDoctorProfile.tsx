"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import Image from "next/image";
import { Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Doctor as DoctorSummary } from "@/app/medical-appointments/types";

interface AvailableSlot {
    date: string;
    times: string[];
}

interface Doctor extends DoctorSummary {
    consultationFee?: number | null;
    availableSlots: AvailableSlot[];
}

interface ClientDoctorProfileProps {
    doctor: Doctor;
}

const DOCTOR_AVATAR_PLACEHOLDER = "/avatar-placeholer.jpeg";

const joinAddressParts = (...parts: Array<string | null | undefined>) =>
    parts
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
        .join(", ");

export default function ClientDoctorProfile({ doctor }: ClientDoctorProfileProps) {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [forWhom, setForWhom] = useState<string>("self");

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const handleDateSelect = (date: string) => {
        setSelectedDate(date);
        setSelectedTime(null); // Resetar o horário ao mudar a data
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
    };

    const handleSubmit = () => {
        if (!selectedDate || !selectedTime) {
            alert("Por favor, selecione uma data e um horário.");
            return;
        }

        // Redirecionar para a página de pagamento com os dados do agendamento
        router.push(
            `/payment?doctorId=${doctor.id}&date=${selectedDate}&time=${selectedTime}&forWhom=${forWhom}`
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
                        Perfil do Médico
                    </h2>

                    {/* Perfil do Médico */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-6 mb-4">
                            <div className="relative w-32 h-32 flex-shrink-0">
                                <Image
                                    src={doctor.photo ?? DOCTOR_AVATAR_PLACEHOLDER}
                                    alt={`Foto de ${doctor.name}`}
                                    fill
                                    className="rounded-xl object-cover border-4 border-gray-100"
                                />
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-2">{doctor.name}</h3>
                                <p className="text-gray-600 mb-2">{doctor.specialty}</p>
                                <p className="text-gray-600 mb-2">CRM: {doctor.crm}</p>
                                <div className="flex items-center gap-1 mb-2">
                                    <Star className="text-yellow-400" size={16} />
                                    <span className="text-gray-600">
                                        {(doctor.averageRating ?? 0).toFixed(1)} ({doctor.reviewsCount ?? 0} avaliações)
                                    </span>
                                </div>
                            </div>
                        </div>
                        {(doctor.clinicName || doctor.clinicStreetAndNumber || doctor.clinicCity || doctor.address) && (
                            <div className="text-gray-600 mb-2">
                                <p className="font-semibold text-gray-700">Local de atendimento</p>
                                <div className="space-y-1">
                                    {doctor.clinicName && <p>{doctor.clinicName}</p>}
                                    {(doctor.clinicStreetAndNumber || doctor.clinicCity) && (
                                        <p>{joinAddressParts(doctor.clinicStreetAndNumber, doctor.clinicCity)}</p>
                                    )}
                                    {doctor.clinicPostalCode && <p>CEP: {doctor.clinicPostalCode}</p>}
                                    {!doctor.clinicName && !doctor.clinicStreetAndNumber && !doctor.clinicCity && doctor.address && (
                                        <p>{doctor.address}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        <p className="text-gray-600 mb-4">{doctor.bio || "Biografia não informada."}</p>
                        <p className="text-gray-600 font-semibold">
                            Valor da consulta: {formatCurrency(doctor.consultationFee ?? 0)}
                        </p>
                    </div>

                    {/* Agenda */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Agenda</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Selecione a data:</label>
                                <div className="flex flex-wrap gap-2">
                                    {doctor.availableSlots.map((slot) => (
                                        <button
                                            key={slot.date}
                                            onClick={() => handleDateSelect(slot.date)}
                                            className={`px-4 py-2 rounded-lg border ${selectedDate === slot.date
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                                } transition-all duration-200`}
                                        >
                                            {new Date(slot.date).toLocaleDateString("pt-BR", {
                                                weekday: "short",
                                                day: "2-digit",
                                                month: "short",
                                            })}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedDate && (
                                <div>
                                    <label className="block text-gray-700 mb-2">Selecione o horário:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {doctor.availableSlots
                                            .find((slot) => slot.date === selectedDate)
                                            ?.times.map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => handleTimeSelect(time)}
                                                    className={`px-4 py-2 rounded-lg border ${selectedTime === time
                                                            ? "bg-blue-600 text-white border-blue-600"
                                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                                        } transition-all duration-200`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Para quem será a consulta */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Para quem será a consulta?</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Selecione uma opção:</label>
                                <select
                                    value={forWhom}
                                    onChange={(e) => setForWhom(e.target.value)}
                                    className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                >
                                    <option value="self">Para mim (Guilherme)</option>
                                    <option value="other">Outra pessoa</option>
                                </select>
                            </div>
                            {forWhom === "other" && (
                                <div>
                                    <label className="block text-gray-700 mb-2">Selecione a pessoa:</label>
                                    <select
                                        className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                    >
                                        <option value="" disabled>
                                            Selecione uma pessoa
                                        </option>
                                        <option value="person1">João Silva (Dependente)</option>
                                        <option value="person2">Maria Oliveira (Dependente)</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botão Continuar */}
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
