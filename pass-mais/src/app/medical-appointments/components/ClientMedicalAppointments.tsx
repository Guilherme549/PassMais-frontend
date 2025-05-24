"use client";

import NavBar from "@/components/NavBar";
import { useEffect, useState } from "react";
import DoctorCard from "./DoctorCard";
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

export default function ClientMedicalAppointments({
  doctors,
}: {
  doctors: Doctor[] | null;
}) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loadedDoctors, setLoadedDoctors] = useState<Doctor[] | null>(doctors);

  useEffect(() => {
    console.log("Doctors recebidos em ClientMedicalAppointments:", doctors);
    setLoadedDoctors(doctors);
  }, [doctors]);

  const handleCardClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleCloseModal = () => {
    setSelectedDoctor(null);
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
            <SearchBar />
            {loadedDoctors && loadedDoctors.length > 0 ? (
              loadedDoctors.map((doctor) => (
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