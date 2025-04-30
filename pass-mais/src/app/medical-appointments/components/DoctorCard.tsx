'use client';

import { Calendar } from 'lucide-react';
import Image from 'next/image';
import PropTypes from 'prop-types';

// Componente funcional exportado como default
export default function DoctorCard({ doctor }) {
    return (
        <div className="w-full max-w-md bg-white shadow-md rounded-lg p-4 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-6">
            {/* Imagem do médico */}
            <div className="flex-shrink-0">
                <Image
                    src="/placeholder-doctor.png"
                    alt={`Foto de ${doctor.name}`}
                    width={120}
                    height={120}
                    className="rounded-lg object-cover"
                />
            </div>

            {/* Informações do médico */}
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    {/* Nome e especialidade */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 uppercase">
                                {doctor.name}
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                {doctor.specialty} - CRM {doctor.crm}
                            </p>
                        </div>
                        <p className="text-lg sm:text-xl font-semibold text-gray-800">
                            R$ {doctor.price.toFixed(2).replace('.', ',')}
                        </p>
                    </div>

                    {/* Avaliação */}
                    <div className="flex items-center mt-2">
                        {[...Array(5)].map((_, i) => (
                            <svg
                                key={i}
                                className={`w-4 sm:w-5 h-4 sm:h-5 ${i < Math.floor(doctor.rating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                    }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                        <span className="ml-2 text-gray-600 text-sm">
                            ({doctor.rating.toFixed(1).replace('.', ',')}) - {doctor.reviews} avaliações
                        </span>
                    </div>

                    {/* Endereço */}
                    <p className="text-gray-600 text-sm mt-3">
                        <span className="font-semibold uppercase">Endereço:</span>{' '}
                        {doctor.address}
                    </p>

                    {/* Sobre mim */}
                    <p className="text-gray-600 text-sm mt-3">
                        <span className="font-semibold uppercase">Sobre mim:</span>{' '}
                        {doctor.about}
                    </p>
                </div>

                {/* Botão Agendar Consulta */}
                <div className="mt-4">
                    <button
                        aria-label={`Agendar consulta com ${doctor.name}`}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                    >
                        <Calendar size={16} className="sm:size-18" />
                        Agendar consulta
                    </button>
                </div>
            </div>
        </div>
    );
}

// Validação de props com PropTypes
DoctorCard.propTypes = {
    doctor: PropTypes.shape({
        name: PropTypes.string.isRequired,
        specialty: PropTypes.string.isRequired,
        crm: PropTypes.string.isRequired,
        rating: PropTypes.number.isRequired,
        reviews: PropTypes.number.isRequired,
        price: PropTypes.number.isRequired,
        address: PropTypes.string.isRequired,
        about: PropTypes.string.isRequired,
        image: PropTypes.string,
    }).isRequired,
};

// Exemplo de uso:
// <DoctorCard
//     doctor={{
//         name: "Juscelino Ambrósio Santana",
//         specialty: "Cirurgião geral",
//         crm: "00.0000",
//         rating: 4.5,
//         reviews: 127,
//         price: 250.00,
//         address: "R. Ana Luiza Souza, Qd. 24 - Lt. 288 - Jundiaí, Anápolis - GO, 75110-030",
//         about: "Ser médico é uma jornada de aprendizado constante, responsabilidade e dedicação. O comprometimento com o bem-estar físico e emocional dos meus pacientes é o que me motiva, sempre buscando aprimorar meus conhecimentos, habilidades e oferecer o melhor cuidado possível.",
//         image: "/path-to-doctor-image.jpg"
//     }}
// />