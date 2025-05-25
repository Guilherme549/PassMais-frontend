"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  crm: string;
  rating: number;
  reviewsCount: number;
  address: string;
}

interface DoctorCardProps {
  doctor: Doctor;
  onCardClick?: (doctor: Doctor) => void; // Prop opcional para lidar com o clique no card
}

function DoctorCard({ doctor, onCardClick }: DoctorCardProps) {
  // Função para lidar com o clique no card
  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(doctor); // Chama a função passada como prop, se existir
    }
  };

  // Função para lidar com o clique no botão "Agendar Consulta" no card
  const handleScheduleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation(); // Impede que o evento de clique se propague para o elemento pai
  };

  if (!doctor) {
    return (
      <div className="mt-20 w-full max-w-5xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden p-8 text-gray-500">
        Dados do médico não disponíveis.
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="mt-20 w-full max-w-5xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row justify-between p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="relative w-48 h-48 flex-shrink-0">
            <Image
              src="/doctor.png"
              alt="Imagem do médico"
              width={192} // Ajuste conforme necessário
              height={192} // Ajuste conforme necessário
              className="rounded-lg object-cover border-4 border-gray-100"
            />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{doctor.name}</h2>
            <p className="text-lg text-gray-600">{doctor.specialty} - CRM {doctor.crm}</p>
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(doctor.rating) ? "fill-current" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-lg text-gray-600">({doctor.rating}) • {doctor.reviewsCount} avaliações</span>
            </div>
            <div className="pt-2">
              <span className="text-lg font-semibold text-gray-900">Endereço:</span>
              <p className="text-lg text-gray-600 leading-relaxed w-[500px]">{doctor.address}</p>
            </div>
          </div>
        </div>
        <div className="flex items-end mt-6 sm:mt-0">
          <Link href={`/doctor-profile/${doctor.id}`} onClick={handleScheduleClick}>
            <button
              className="bg-[#5179EF] text-white font-medium px-6 py-3 rounded-lg 
                hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 
                transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
            >
              Agendar Consulta
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

interface ClientMedicalAppointmentsProps {
  doctors: Doctor[]; // Definimos a prop doctors como um array de Doctor
}

export default function ClientMedicalAppointments({ doctors }: ClientMedicalAppointmentsProps) {
  // Função de exemplo para lidar com o clique no card
  const handleCardClick = (doctor: Doctor) => {
    console.log("Clicou no card do médico:", doctor.name);
    // Adicione aqui a lógica para abrir o modal ou redirecionar, se necessário
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Médicos Disponíveis</h1>
        <div className="space-y-6">
          {doctors.length > 0 ? (
            doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onCardClick={handleCardClick}
              />
            ))
          ) : (
            <p className="text-gray-500">Nenhum médico disponível no momento.</p>
          )}
        </div>
      </div>
    </div>
  );
}