"use client";

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Metadados */}
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Pass+ - Consultas no Conforto da Sua Casa</title>
      </Head>

      {/* Conteúdo */}
      <div className="font-sans text-gray-900">
        {/* Cabeçalho (Header) */}
        <header className="bg-white shadow-md fixed w-full top-0 z-50">
          <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="text-2xl font-bold text-[#5179EF]">Pass+</div>
            {/* Menu de Navegação */}
            <div className="flex items-center space-x-6">
              <Link href="#inicio" className="text-gray-600 hover:text-[#5179EF] transition-colors">
                Início
              </Link>
              <Link href="#funcionalidades" className="text-gray-600 hover:text-[#5179EF] transition-colors">
                Funcionalidades
              </Link>
              <Link href="#como-funciona" className="text-gray-600 hover:text-[#5179EF] transition-colors">
                Como Funciona
              </Link>
              <Link href="#para-pacientes" className="text-gray-600 hover:text-[#5179EF] transition-colors">
                Para Pacientes
              </Link>
              <Link href="/medicos" className="text-gray-600 hover:text-[#5179EF] transition-colors">
                Para Médicos
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-[#5179EF] transition-colors">
                Entrar
              </Link>
              <Link
                href="/register"
                className="bg-[#5179EF] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
              >
                Cadastrar-se
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section id="inicio" className="min-h-screen bg-gray-100 flex items-center justify-center pt-20">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
            {/* Texto */}
            <div className="flex-1 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Marque suas consultas médicas em segundos com o Pass+
              </h1>
              <p className="text-lg text-gray-600">
                Gerencie suas consultas, encontre médicos e otimize seu tempo — tudo em um só lugar.
              </p>
              <Link
                href="/register"
                className="inline-block bg-[#5179EF] text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
              >
                Criar Conta Grátis
              </Link>
            </div>
            {/* Imagem */}
            <div className="flex-1">
              <Image
                src="/peopleUsingTheSite..png" // Certifique-se de que a imagem está na pasta public
                alt="Pessoa usando o app no celular"
                width={500} // Ajuste conforme o tamanho real da imagem
                height={500} // Ajuste conforme o tamanho real da imagem
                className="w-full max-w-md mx-auto"
              />
            </div>
          </div>
        </section>

        {/* Consultas no Conforto da Sua Casa */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Consultas no conforto da sua casa</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Com o Pass+, você tem a liberdade de cuidar da sua saúde onde e quando desejar. Aproveite consultas
              ilimitadas e tenha acesso a um atendimento personalizado.
            </p>
            <div className="mt-8 space-x-4">
              <Link
                href="/register"
                className="inline-block bg-[#5179EF] text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
              >
                Cadastre-se
              </Link>
              <Link
                href="#funcionalidades"
                className="inline-block bg-gray-200 text-gray-900 font-medium px-6 py-3 rounded-lg hover:bg-gray-300 transition-all"
              >
                Saiba mais
              </Link>
            </div>
          </div>
        </section>

        {/* Funcionalidades Principais */}
        <section id="funcionalidades" className="py-16 bg-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Funcionalidades Principais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Card 1 */}
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Agendamento Online</h3>
                <p className="text-gray-600">Marque consultas médicas de forma rápida.</p>
              </div>
              {/* Card 2 */}
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                <div className="text-4xl mb-4">🏥</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestão de Consultas</h3>
                <p className="text-gray-600">Visualize, reagende ou cancele com facilidade.</p>
              </div>
              {/* Card 3 */}
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                <div className="text-4xl mb-4">👨‍⚕️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Perfis Médicos Detalhados</h3>
                <p className="text-gray-600">Veja especializações e avaliações.</p>
              </div>
              {/* Card 4 */}
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                <div className="text-4xl mb-4">🔔</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Lembretes Automatizados</h3>
                <p className="text-gray-600">Alertas por e-mail e notificação.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section id="como-funciona" className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Como Funciona</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-[#5179EF] mb-4">1</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Crie sua conta</h3>
                <p className="text-gray-600">Cadastre-se em poucos minutos.</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-[#5179EF] mb-4">2</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Escolha a especialidade</h3>
                <p className="text-gray-600">Encontre médicos por especialidade.</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-[#5179EF] mb-4">3</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Marque sua consulta</h3>
                <p className="text-gray-600">Selecione o melhor horário para você.</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-[#5179EF] mb-4">4</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Receba confirmação</h3>
                <p className="text-gray-600">Confirmação e lembretes automáticos.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section id="para-pacientes" className="py-16 bg-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Benefícios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Para Pacientes */}
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Para Pacientes</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>✔ Evite filas</li>
                  <li>✔ Controle total da agenda</li>
                  <li>✔ Histórico de consultas</li>
                </ul>
              </div>
              {/* Para Clínicas */}
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Para Clínicas</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>✔ Redução de faltas</li>
                  <li>✔ Organização de agenda médica</li>
                  <li>✔ Visibilidade online para atrair mais pacientes</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Segurança e Privacidade */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Segurança e Privacidade</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Seus dados estão seguros conosco. O Pass+ segue as diretrizes da LGPD para garantir a privacidade das
              suas informações.
            </p>
          </div>
        </section>

        {/* Depoimentos */}
        <section className="py-16 bg-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">O que nossos usuários dizem</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <p className="text-gray-600 italic mb-4">
                  “Desde que comecei a usar o Pass+, nunca mais perdi uma consulta!”
                </p>
                <p className="text-gray-900 font-semibold">– João, 28 anos</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <p className="text-gray-600 italic mb-4">
                  “Facilitou a gestão da minha clínica de forma surpreendente.”
                </p>
                <p className="text-gray-900 font-semibold">– Dra. Carla, Ginecologista</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Final */}
        <section className="py-16 bg-[#5179EF] text-white text-center">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">
              Comece agora e transforme sua experiência com consultas médicas!
            </h2>
            <Link
              href="/register"
              className="inline-block bg-white text-[#5179EF] font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-all"
            >
              Experimente Grátis
            </Link>
          </div>
        </section>

        {/* Rodapé (Footer) */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Links */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Links Úteis</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/termos" className="hover:text-[#5179EF] transition-colors">
                      Termos de Uso
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacidade" className="hover:text-[#5179EF] transition-colors">
                      Política de Privacidade
                    </Link>
                  </li>
                  <li>
                    <Link href="/contato" className="hover:text-[#5179EF] transition-colors">
                      Contato: contato@passmais.com.br
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="hover:text-[#5179EF] transition-colors">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/suporte" className="hover:text-[#5179EF] transition-colors">
                      Suporte Técnico
                    </Link>
                  </li>
                </ul>
              </div>
              {/* Redes Sociais */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Siga-nos</h3>
                <div className="flex space-x-4">
                  <Link href="#" className="text-2xl hover:text-[#5179EF] transition-colors">
                    📘
                  </Link>
                  <Link href="#" className="text-2xl hover:text-[#5179EF] transition-colors">
                    🐦
                  </Link>
                  <Link href="#" className="text-2xl hover:text-[#5179EF] transition-colors">
                    📸
                  </Link>
                </div>
              </div>
              {/* Logo */}
              <div className="text-center md:text-right">
                <div className="text-2xl font-bold text-[#5179EF] mb-4">Pass+</div>
                <p className="text-gray-400">© 2025 Pass+. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}