import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from "@/lib/auth";

export default async function AdminPainel() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    redirect('/login');
  }

  const stats = {
    pacientes: 100,
    medicos: 50,
    consultas: 200,
    avaliacoes: 320,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="flex justify-center items-center w-full mt-10 px-4">
        <div className="w-full max-w-6xl bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[#2563EB] mb-6 uppercase">
            Painel Administrativo
          </h2>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 border border-gray-300 rounded-lg text-center">
              <p className="text-xl font-semibold">{stats.pacientes}</p>
              <p className="text-gray-600">Pacientes</p>
            </div>
            <div className="p-4 border border-gray-300 rounded-lg text-center">
              <p className="text-xl font-semibold">{stats.medicos}</p>
              <p className="text-gray-600">Médicos</p>
            </div>
            <div className="p-4 border border-gray-300 rounded-lg text-center">
              <p className="text-xl font-semibold">{stats.consultas}</p>
              <p className="text-gray-600">Consultas</p>
            </div>
            <div className="p-4 border border-gray-300 rounded-lg text-center">
              <p className="text-xl font-semibold">{stats.avaliacoes}</p>
              <p className="text-gray-600">Avaliações</p>
            </div>
          </div>

          {/* Ações administrativas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/admin/aprovacoes"
              className="w-full h-12 bg-[#5179EF] text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              Aprovar Cadastros
            </a>
            <a
              href="/admin/moderacao"
              className="w-full h-12 bg-[#5179EF] text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              Moderar Avaliações
            </a>
            <a
              href="/admin/logs"
              className="w-full h-12 bg-[#5179EF] text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              Logs de Auditoria
            </a>
            <a
              href="/admin/filas"
              className="w-full h-12 bg-[#5179EF] text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              Controle de Filas Online
            </a>
            <a
              href="/admin/gerenciar"
              className="w-full h-12 bg-[#5179EF] text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              Gerenciar Administradores
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
