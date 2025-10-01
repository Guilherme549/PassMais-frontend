"use client";

import NavBar from "@/components/NavBar";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type Doctor } from "../types";
import DoctorModal from "./DoctorModal";
import SearchBar from "./SearchBar";

export type { Doctor } from "../types";

interface DoctorCardProps {
  doctor: Doctor;
  onCardClick?: (doctor: Doctor) => void; // Adicionando a prop onCardClick como opcional
}

const DOCTOR_AVATAR_PLACEHOLDER = "/avatar-placeholer.jpeg";

type DoctorLocation = {
  city: string | null;
  state: string | null;
  address: string | null;
};

const joinAddressParts = (...parts: Array<string | null | undefined>) =>
  parts
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0)
    .join(", ");

const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

function normalizeForSearch(value: string | null | undefined) {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim();
}

function parseCityStateFromText(value: string | null | undefined) {
  if (!value) return { city: null as string | null, state: null as string | null };

  const trimmed = value.trim();
  if (trimmed.length === 0) return { city: null, state: null };

  const hyphenRegex = /([A-Za-zÀ-ÖØ-öø-ÿ\s'´-]+?)\s*-\s*([A-Za-z]{2})(?:\s*,|\s*$)/g;
  const hyphenMatches = Array.from(trimmed.matchAll(hyphenRegex));
  if (hyphenMatches.length > 0) {
    const lastMatch = hyphenMatches[hyphenMatches.length - 1];
    const city = lastMatch?.[1]?.trim() ?? null;
    const state = lastMatch?.[2]?.trim().toUpperCase() ?? null;
    if (city && state) return { city, state };
  }

  const commaRegex = /([A-Za-zÀ-ÖØ-öø-ÿ\s'´-]+?),\s*([A-Za-z]{2})(?:\s*,|\s*$)/g;
  const commaMatches = Array.from(trimmed.matchAll(commaRegex));
  if (commaMatches.length > 0) {
    const lastMatch = commaMatches[commaMatches.length - 1];
    const city = lastMatch?.[1]?.trim() ?? null;
    const state = lastMatch?.[2]?.trim().toUpperCase() ?? null;
    if (city && state) return { city, state };
  }

  return { city: trimmed.length > 0 ? trimmed : null, state: null };
}

function getDoctorLocations(doctor: Doctor): DoctorLocation[] {
  const explicitLocations: DoctorLocation[] = (doctor.serviceLocations ?? []).map((location) => ({
    city: location?.city ?? null,
    state: location?.state ?? null,
    address: location?.address ?? null,
  }));

  if (explicitLocations.length > 0) {
    return explicitLocations.map((location) => {
      if (location.city && location.state) return location;

      const fallback = parseCityStateFromText(
        joinAddressParts(location.address ?? undefined, doctor.clinicCity, doctor.clinicState)
      );

      return {
        city: location.city ?? fallback.city ?? doctor.clinicCity ?? null,
        state: location.state ?? fallback.state ?? doctor.clinicState ?? null,
        address: location.address ?? doctor.address ?? null,
      };
    });
  }

  const fallback = parseCityStateFromText(doctor.address ?? doctor.clinicCity ?? undefined);

  const mergedCity = doctor.clinicCity ?? fallback.city;
  const mergedState = doctor.clinicState ?? fallback.state;

  if (!mergedCity && !mergedState) return [];

  return [
    {
      city: mergedCity,
      state: mergedState,
      address: doctor.address ?? joinAddressParts(doctor.clinicStreetAndNumber, doctor.clinicCity, doctor.clinicState),
    },
  ];
}

function matchesAddressFallback(doctor: Doctor, normalizedCity: string, normalizedState: string) {
  if (normalizedCity.length === 0 && normalizedState.length === 0) return true;

  const possibleValues = [
    doctor.address,
    joinAddressParts(doctor.clinicStreetAndNumber, doctor.clinicCity, doctor.clinicState),
    doctor.clinicCity,
    doctor.clinicState,
  ];

  return possibleValues.some((value) => {
    const normalizedValue = normalizeForSearch(value);
    if (normalizedValue.length === 0) return false;

    const cityMatches =
      normalizedCity.length === 0 ||
      normalizedValue.includes(normalizedCity);

    const stateMatches =
      normalizedState.length === 0 ||
      normalizedValue.includes(normalizedState);

    return cityMatches && stateMatches;
  });
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
              src={doctor.photo ?? DOCTOR_AVATAR_PLACEHOLDER}
              alt="Imagem do médico"
              width={192} // Ajuste conforme necessário
              height={192} // Ajuste conforme necessário
              className="rounded-lg object-cover border-4 border-gray-100"
            />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{doctor.name}</h2>
            <p className="text-lg text-gray-600">{doctor.specialty} - CRM {doctor.crm}</p>
            <div className="pt-2">
              <span className="text-lg font-semibold text-gray-900">Biografia:</span>
              <p className="text-lg text-gray-600 leading-relaxed w-[500px]">
                {doctor.bio || "Biografia não informada."}
              </p>
            </div>
            {(doctor.clinicName || doctor.clinicStreetAndNumber || doctor.clinicCity || doctor.clinicPostalCode) && (
              <div className="pt-2 text-gray-600">
                <span className="text-lg font-semibold text-gray-900 block">Local de atendimento:</span>
                <div className="mt-1 space-y-1">
                  {doctor.clinicName && <p className="text-lg">{doctor.clinicName}</p>}
                  {(doctor.clinicStreetAndNumber || doctor.clinicCity) && (
                    <p className="text-lg">{joinAddressParts(doctor.clinicStreetAndNumber, doctor.clinicCity)}</p>
                  )}
                  {doctor.clinicPostalCode && (
                    <p className="text-sm text-gray-500">CEP: {doctor.clinicPostalCode}</p>
                  )}
                </div>
              </div>
            )}
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
  isLoading = false,
  error,
}: {
  doctors: Doctor[] | null;
  isLoading?: boolean;
  error?: string | null;
}) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loadedDoctors, setLoadedDoctors] = useState<Doctor[] | null>(doctors);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[] | null>(doctors);

  useEffect(() => {
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
    const specialtyInput = formData.get("medical-specialty")?.toString().trim() || "";
    const cityRegionInput = formData.get("city-region")?.toString().trim() || "";
    const explicitCity = formData.get("city")?.toString().trim() || "";
    const explicitState = formData.get("state")?.toString().trim() || "";

    const parsedFromCityRegion = parseCityStateFromText(cityRegionInput);
    const desiredCity = explicitCity || parsedFromCityRegion.city || "";
    const desiredState = explicitState || parsedFromCityRegion.state || "";

    const normalizedCity = normalizeForSearch(desiredCity);
    const normalizedState = normalizeForSearch(desiredState);
    const normalizedSpecialty = normalizeForSearch(specialtyInput);
    const hasLocationFilter = normalizedCity.length > 0 || normalizedState.length > 0;

    if (!loadedDoctors) {
      setFilteredDoctors(null);
      return;
    }

    // Filtra os médicos com base nos campos de especialidade e cidade
    const filtered = loadedDoctors.filter((doctor) => {
      const doctorSpecialty = normalizeForSearch(doctor.specialty);
      const matchesSpecialty =
        normalizedSpecialty.length === 0 ||
        doctorSpecialty.includes(normalizedSpecialty);

      if (!matchesSpecialty) return false;

      if (!hasLocationFilter) return true;

      const locations = getDoctorLocations(doctor);
      const locationMatches = locations.some((location) => {
        const locationCity = normalizeForSearch(location.city);
        const locationState = normalizeForSearch(location.state);

        const cityMatches =
          normalizedCity.length === 0 ||
          (locationCity.length > 0 && locationCity.includes(normalizedCity));

        const stateMatches =
          normalizedState.length === 0 ||
          (locationState.length > 0 &&
            (locationState === normalizedState || locationState.includes(normalizedState)));

        return cityMatches && stateMatches;
      });

      if (locationMatches) return true;

      return matchesAddressFallback(doctor, normalizedCity, normalizedState);
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
            {isLoading ? (
              <p className="text-gray-600 text-lg">Carregando médicos...</p>
            ) : error ? (
              <p className="text-red-600 text-lg">{error}</p>
            ) : filteredDoctors && filteredDoctors.length > 0 ? (
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
      <footer className="m-[10px] h-[100px] flex flex-col items-center justify-center text-center text-gray-400 text-xs">
        © Pass+ {new Date().getFullYear()} Todos os direitos reservados.
        <span>www.passmais.com.br</span>
      </footer>
    </div>
  );
}
