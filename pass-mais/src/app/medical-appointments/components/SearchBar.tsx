"use client";

import { ChevronDown, Search } from "lucide-react";

export default function SearchBar() {
    return (
        <div className="w-full flex px-1">
            <form className="w-full max-w-5xl flex flex-col md:flex-row gap-4 md:gap-3">
                {/* Campo de Especialidade Médica */}
                <div className="flex flex-col w-full">
                    <label
                        htmlFor="medical-specialty"
                        className="text-lg md:text-xl text-gray-600 mb-2"
                    >
                        Especialidade médica:
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            name="medical-specialty"
                            placeholder="Selecione um especialista"
                            className="w-full h-12 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 outline-none transition-colors duration-200 pl-5 pr-10 bg-white border border-gray-300 shadow-sm text-base md:text-lg"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <ChevronDown size={18} />
                        </span>
                    </div>
                </div>

                {/* Campo de Cidade ou Região */}
                <div className="flex flex-col w-full">
                    <label
                        htmlFor="city-region"
                        className="text-lg md:text-xl text-gray-600 mb-2"
                    >
                        Cidade ou região:
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            name="city-region"
                            placeholder="Cidade ou região"
                            className="w-full h-12 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 outline-none transition-colors duration-200 pl-5 pr-10 bg-white border border-gray-300 shadow-sm text-base md:text-lg"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <ChevronDown size={18} />
                        </span>
                    </div>
                </div>

                {/* Botão de Pesquisa */}
                <div className="flex items-end">
                    <button
                        className="bg-[#5179EF] text-white font-medium px-6 py-3 rounded-lg 
                        hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 
                        transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                    >
                        <Search size={18} className="mr-1" />
                        <span>Pesquisar</span>
                    </button>
                </div>
            </form>
        </div>
    );
}