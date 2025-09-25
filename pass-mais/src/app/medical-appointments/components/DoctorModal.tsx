"use client";

import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type Doctor } from "../types";

interface DoctorModalProps {
    doctor: Doctor;
    onClose: () => void;
}

const DOCTOR_AVATAR_PLACEHOLDER = "/avatar-placeholer.jpeg";

const joinAddressParts = (...parts: Array<string | null | undefined>) =>
    parts
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
        .join(", ");

export default function DoctorModal({ doctor, onClose }: DoctorModalProps) {
    if (!doctor) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                    <X size={24} className="cursor-pointer" />
                </button>

                <div className="space-y-6">
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 flex-shrink-0">
                            <Image
                                fill
                                src={doctor.photo ?? DOCTOR_AVATAR_PLACEHOLDER}
                                alt="Imagem do médico"
                                className="rounded-lg object-cover border-2 border-gray-100 w-full h-full"
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{doctor.name}</h2>
                            <p className="text-lg text-gray-600">{doctor.specialty} - CRM {doctor.crm}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Sobre</h3>
                            <p className="text-gray-600 whitespace-pre-line">{doctor.bio || "Biografia não informada."}</p>
                        </div>
                        {(doctor.clinicName || doctor.clinicStreetAndNumber || doctor.clinicCity || doctor.clinicPostalCode || doctor.address) && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Local de atendimento</h3>
                                <div className="text-gray-600 space-y-1">
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
                    </div>

                    <div className="flex justify-end">
                        <Link
                            href={`/doctor-profile/${doctor.id}`}
                            className="bg-[#5179EF] text-white font-medium px-6 py-3 rounded-lg 
              hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 
              transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
                        >
                            Agendar Consulta
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
