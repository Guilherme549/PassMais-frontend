"use client";

import NavBar from "@/components/NavBar";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import DoctorModal from "./DoctorModal";
import SearchBar from "./SearchBar";

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
  onCardClick?: (doctor: Doctor) => void; // Adicionando a prop onCardClick como opcional
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

export default function ClientMedicalAppointments({
  doctors,
}: {
  doctors: Doctor[] | null;
}) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loadedDoctors, setLoadedDoctors] = useState<Doctor[] | null>(doctors);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[] | null>(doctors);

  useEffect(() => {
    console.log("Doctors recebidos em ClientMedicalAppointments:", doctors);
    setLoadedDoctors(doctors);
    setFilteredDoctors(doctors); // Inicializa os médicos filtrados com todos os médicos
  }, [doctors]);

  const handleCardClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleCloseModal = () => {
    setSelectedDoctor(null);
  };

  // Função para lidar com a submissão do formulário de busca
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const specialty = formData.get("medical-specialty")?.toString() || "";
    const city = formData.get("city-region")?.toString() || "";

    if (!loadedDoctors) {
      setFilteredDoctors(null);
      return;
    }

    // Filtra os médicos com base nos campos de especialidade e cidade
    const filtered = loadedDoctors.filter((doctor) => {
      const matchesSpecialty =
        specialty === "" ||
        doctor.specialty.toLowerCase().includes(specialty.toLowerCase());
      const matchesCity =
        city === "" ||
        doctor.address.toLowerCase().includes(city.toLowerCase());
      return matchesSpecialty && matchesCity;
    });

    setFilteredDoctors(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="flex justify-center items-center w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-[100px] mb-10 px-2 tracking-tight">
            Encontre seu médico
          </h2>
          <div className="space-y-8">
            <SearchBar onSubmit={handleSearch} />
            {filteredDoctors && filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onCardClick={handleCardClick}
                />
              ))
            ) : (
              <p className="text-gray-600 text-lg">Nenhum médico encontrado ou dados não carregados.</p>
            )}
          </div>
        </div>
      </div>
      {selectedDoctor && (
        <DoctorModal doctor={selectedDoctor} onClose={handleCloseModal} />
      )}
    </div>
  );
}