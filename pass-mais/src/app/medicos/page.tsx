import Link from "next/link";
import NavBarMedicos from "./components/NavBarMedicos";

export default function Medicos() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* NavBar */}
            <NavBarMedicos />

            {/* Cabeçalho */}
            <section className="bg-gradient-to-r from-[#5179EF] to-blue-600 text-white py-20 mt-[80px]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                        Junte-se ao Pass+ e Conecte-se com Seus Pacientes
                    </h1>
                    <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-8">
                        Amplie sua visibilidade, gerencie seus agendamentos e construa uma relação mais próxima com seus pacientes.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            href="/medicos/register-medico"
                            className="bg-white text-[#5179EF] font-medium px-8 py-4 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            Cadastrar
                        </Link>
                        <Link
                            href="/medicos/login-medico"
                            className="bg-transparent border-2 border-white text-white font-medium px-8 py-4 rounded-lg hover:bg-white hover:text-[#5179EF] focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            Entrar
                        </Link>
                    </div>
                </div>
            </section>

            {/* Benefícios */}
            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
                        Por que Escolher o Pass+?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Benefício 1 */}
                        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
                            <div className="text-[#5179EF] mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Maior Visibilidade</h3>
                            <p className="text-gray-600">
                                Seja encontrado por pacientes que buscam sua especialidade na sua região.
                            </p>
                        </div>
                        {/* Benefício 2 */}
                        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
                            <div className="text-[#5179EF] mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Agendamento Simplificado</h3>
                            <p className="text-gray-600">
                                Gerencie suas consultas de forma prática e eficiente, tudo em um só lugar.
                            </p>
                        </div>
                        {/* Benefício 3 */}
                        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
                            <div className="text-[#5179EF] mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Conexão com Pacientes</h3>
                            <p className="text-gray-600">
                                Construa uma relação de confiança com seus pacientes através de avaliações e feedbacks.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Final */}
            <section className="bg-gray-100 py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                        Pronto para Começar?
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                        Faça parte da plataforma Pass+ e leve sua prática médica para o próximo nível.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            href="/medicos/register-medico"
                            className="bg-[#5179EF] text-white font-medium px-8 py-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            Cadastrar
                        </Link>
                        <Link
                            href="/medicos/login-medico"
                            className="bg-transparent border-2 border-[#5179EF] text-[#5179EF] font-medium px-8 py-4 rounded-lg hover:bg-[#5179EF] hover:text-white focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            Entrar
                        </Link>
                    </div>
                </div>
            </section>

            {/* Rodapé */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Pass+</h3>
                            <p className="text-gray-400">
                                Conectando médicos e pacientes para uma saúde mais acessível e eficiente.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Links Úteis</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/#inicio" className="text-gray-400 hover:text-white transition-colors">
                                        Início
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/#funcionalidades" className="text-gray-400 hover:text-white transition-colors">
                                        Funcionalidades
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/#como-funciona" className="text-gray-400 hover:text-white transition-colors">
                                        Como Funciona
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Contato</h3>
                            <p className="text-gray-400">Email: suporte@passmais.com</p>
                            <p className="text-gray-400">Telefone: (62) 1234-5678</p>
                        </div>
                    </div>
                    <div className="mt-8 text-center text-gray-400">
                        © 2025 Pass+. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}