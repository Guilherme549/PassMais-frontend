import NavBar from '@/components/NavBar'; // Ajuste se o caminho for diferente (ex.: '../../components/NavBar')
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AdminPainel() {
  const session = await getServerSession(authOptions); 

  if (!session || session.user?.role !== 'admin') {
    redirect('/login');
  }

  const stats = {
    pacientes: 100,
    medicos: 50,
    consultas: 200,
  };

  return (
    <div>
      <NavBar />
      <div className="flex justify-center items-center w-full mt-10 px-4">
        <div className="w-full max-w-5xl bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[#2563EB] mb-6 uppercase">Painel Administrativo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
          <div className="mt-6 flex flex-col gap-4">
            <a href="/admin/aprovacoes" className="w-full h-12 bg-[#5179EF] text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
              Aprovar Cadastros
            </a>
            <a href="/admin/moderacao" className="w-full h-12 bg-[#5179EF] text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
              Moderar Avaliações
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}