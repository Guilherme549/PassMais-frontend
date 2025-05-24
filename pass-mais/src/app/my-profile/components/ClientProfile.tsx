"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import { X } from "lucide-react";

interface Address {
    street: string;
    cep: string;
    neighborhood: string;
    state: string;
}

interface Documents {
    cpf: string;
    rg: string;
}

interface Contact {
    email: string;
    phone: string;
    communicationPreference: string;
}

interface UserProfile {
    name: string;
    gender: string;
    birthDate: string;
    nickname: string;
    maritalStatus: string;
    address: Address;
    documents: Documents;
    contact: Contact;
}

export default function ClientProfile({
    userProfile,
}: {
    userProfile: UserProfile;
}) {
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [isEditingContact, setIsEditingContact] = useState(false);

    const [profile, setProfile] = useState(userProfile);

    const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({
            ...prev,
            address: { ...prev.address, [name]: value },
        }));
    };

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({
            ...prev,
            contact: { ...prev.contact, [name]: value },
        }));
    };

    const savePersonal = () => {
        setIsEditingPersonal(false);
        // Aqui você pode adicionar lógica para salvar os dados (ex.: API call)
    };

    const saveAddress = () => {
        setIsEditingAddress(false);
        // Aqui você pode adicionar lógica para salvar os dados (ex.: API call)
    };

    const saveContact = () => {
        setIsEditingContact(false);
        // Aqui você pode adicionar lógica para salvar os dados (ex.: API call)
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            {/* Espaço reservado para a NavBar */}
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
                        Perfil de {profile.name}
                    </h2>
                    <p className="text-gray-600 mb-10 px-2">
                        Esta é a área do perfil do paciente, aqui você pode alterar seus dados e informações de contato.
                    </p>

                    {/* Dados Pessoais */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Dados Pessoais</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-600"><strong>Nome:</strong> {profile.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-600"><strong>Sexo biológico:</strong> {profile.gender}</p>
                            </div>
                            <div>
                                <p className="text-gray-600"><strong>Data de Nascimento:</strong> {profile.birthDate}</p>
                            </div>
                            <div>
                                <p className="text-gray-600"><strong>Apelido:</strong> {profile.nickname}</p>
                            </div>
                            <div>
                                <p className="text-gray-600"><strong>Estado Civil:</strong> {profile.maritalStatus}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditingPersonal(true)}
                            className="mt-4 bg-[#5179EF] text-white font-medium px-4 py-2 rounded-lg 
                hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 
                transition-all duration-200"
                        >
                            Editar
                        </button>

                        {isEditingPersonal && (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-gray-700">Apelido:</label>
                                    <input
                                        type="text"
                                        name="nickname"
                                        value={profile.nickname}
                                        onChange={handlePersonalChange}
                                        className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                        placeholder="Digite seu apelido"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700">Estado Civil:</label>
                                    <select
                                        name="maritalStatus"
                                        value={profile.maritalStatus}
                                        onChange={handlePersonalChange}
                                        className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                    >
                                        <option value="" disabled>Selecione</option>
                                        <option value="Solteiro">Solteiro</option>
                                        <option value="Casado">Casado</option>
                                        <option value="Divorciado">Divorciado</option>
                                        <option value="Viúvo">Viúvo</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={savePersonal}
                                        className="bg-green-500 text-white font-medium px-4 py-2 rounded-lg 
                      hover:bg-green-600 focus:ring-4 focus:ring-green-200 focus:ring-opacity-50 
                      transition-all duration-200"
                                    >
                                        Salvar
                                    </button>
                                    <button
                                        onClick={() => setIsEditingPersonal(false)}
                                        className="bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg 
                      hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 
                      transition-all duration-200"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Endereço */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Endereço</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-600"><strong>Endereço:</strong> {profile.address.street}</p>
                            </div>
                            <div>
                                <p className="text-gray-600"><strong>CEP:</strong> {profile.address.cep}</p>
                            </div>
                            <div>
                                <p className="text-gray-600"><strong>Bairro:</strong> {profile.address.neighborhood}</p>
                            </div>
                            <div>
                                <p className="text-gray-600"><strong>Estado:</strong> {profile.address.state}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditingAddress(true)}
                            className="mt-4 bg-[#5179EF] text-white font-medium px-4 py-2 rounded-lg 
                hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 
                transition-all duration-200"
                        >
                            Editar
                        </button>

                        {isEditingAddress && (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-gray-700">Endereço:</label>
                                    <input
                                        type="text"
                                        name="street"
                                        value={profile.address.street}
                                        onChange={handleAddressChange}
                                        className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                        placeholder="Digite seu endereço"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700">CEP:</label>
                                    <input
                                        type="text"
                                        name="cep"
                                        value={profile.address.cep}
                                        onChange={handleAddressChange}
                                        className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                        placeholder="Digite seu CEP"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700">Bairro:</label>
                                    <input
                                        type="text"
                                        name="neighborhood"
                                        value={profile.address.neighborhood}
                                        onChange={handleAddressChange}
                                        className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                        placeholder="Digite seu bairro"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700">Estado:</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={profile.address.state}
                                        onChange={handleAddressChange}
                                        className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                        placeholder="Digite seu estado"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={saveAddress}
                                        className="bg-green-500 text-white font-medium px-4 py-2 rounded-lg 
                      hover:bg-green-600 focus:ring-4 focus:ring-green-200 focus:ring-opacity-50 
                      transition-all duration-200"
                                    >
                                        Salvar
                                    </button>
                                    <button
                                        onClick={() => setIsEditingAddress(false)}
                                        className="bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg 
                      hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 
                      transition-all duration-200"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Documentos */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Documentos</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-600"><strong>CPF:</strong> {profile.documents.cpf}</p>
                            </div>
                            <div>
                                <p className="text-gray-600"><strong>RG:</strong> {profile.documents.rg}</p>
                            </div>
                            <p className="text-gray-600 mt-4">
                                Para alterar documentos, ligue para 4090-1510 ou solicite na recepção do Centro Médico.
                            </p>
                        </div>
                    </div>

                    {/* Dados de Contato */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Dados de Contato</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-600"><strong>Email:</strong> {profile.contact.email}</p>
                            </div>
                            <div>
                                <p className="text-gray-600"><strong>Celular:</strong> {profile.contact.phone}</p>
                            </div>
                            <div>
                                <p className="text-gray-600"><strong>Preferência de Comunicação:</strong> {profile.contact.communicationPreference}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditingContact(true)}
                            className="mt-4 bg-[#5179EF] text-white font-medium px-4 py-2 rounded-lg 
                hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 
                transition-all duration-200"
                        >
                            Editar
                        </button>

                        {isEditingContact && (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-gray-700">Email:</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.contact.email}
                                        onChange={handleContactChange}
                                        className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700">Celular:</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={profile.contact.phone}
                                        onChange={handleContactChange}
                                        className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700">Preferência de Comunicação:</label>
                                    <select
                                        name="communicationPreference"
                                        value={profile.contact.communicationPreference}
                                        onChange={handleContactChange}
                                        className="w-full max-w-md border border-gray-300 rounded-lg p-2"
                                    >
                                        <option value="" disabled>Selecione</option>
                                        <option value="Email">Email</option>
                                        <option value="Celular">Celular</option>
                                        <option value="Ambos">Ambos</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={saveContact}
                                        className="bg-green-500 text-white font-medium px-4 py-2 rounded-lg 
                      hover:bg-green-600 focus:ring-4 focus:ring-green-200 focus:ring-opacity-50 
                      transition-all duration-200"
                                    >
                                        Salvar
                                    </button>
                                    <button
                                        onClick={() => setIsEditingContact(false)}
                                        className="bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg 
                      hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 
                      transition-all duration-200"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}