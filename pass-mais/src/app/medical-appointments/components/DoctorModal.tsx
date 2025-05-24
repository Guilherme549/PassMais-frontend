"use client";

import { Star, X } from "lucide-react";
import Image from "next/image";

interface Doctor {
    id: number;
    name: string;
    specialty: string;
    crm: string;
    rating: number;
    reviewsCount: number;
    address: string;
}

interface DoctorModalProps {
    doctor: Doctor;
    onClose: () => void;
}

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
                                src="/doctor.png"
                                alt="Imagem do médico"
                                className="rounded-lg object-cover border-2 border-gray-100 w-full h-full"
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{doctor.name}</h2>
                            <p className="text-lg text-gray-600">{doctor.specialty} - CRM {doctor.crm}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex text-yellow-400">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-5 h-5 ${i < Math.floor(doctor.rating) ? "fill-current" : "text-gray-300"}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-lg text-gray-600">
                                    ({doctor.rating}) • {doctor.reviewsCount} avaliações
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Sobre</h3>
                            <p className="text-gray-600">
                                Dr. {doctor.name.split(" ").slice(1).join(" ")} é um renomado {doctor.specialty.toLowerCase()} com mais de 15 anos de experiência. Formado pela Universidade de São Paulo (USP), ele se dedica a oferecer cuidados de alta qualidade aos seus pacientes, com foco em cirurgias minimamente invasivas.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Endereço</h3>
                            <p className="text-gray-600">{doctor.address}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Contato</h3>
                            <p className="text-gray-600">Telefone: (62) 1234-5678</p>
                            <p className="text-gray-600">Email: contato@clinicaexemplo.com</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Avaliações</h3>
                        <div className="space-y-4">
                            <div className="border-t pt-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex text-yellow-400">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-current" />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600">Maria Silva • 10/05/2025</span>
                                </div>
                                <p className="text-gray-600">
                                    Excelente profissional! Muito atencioso e explicou tudo com clareza. Minha cirurgia foi um sucesso.
                                </p>
                            </div>
                            <div className="border-t pt-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex text-yellow-400">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-current" />
                                        ))}
                                        <Star className="w-4 h-4 text-gray-300" />
                                    </div>
                                    <span className="text-sm text-gray-600">João Pereira • 02/05/2025</span>
                                </div>
                                <p className="text-gray-600">
                                    Ótimo médico, mas a consulta demorou um pouco para começar. No geral, muito satisfeito.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button className="bg-[#5179EF] text-white font-medium px-6 py-3 rounded-lg 
              hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 
              transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer">
                            Agendar Consulta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}