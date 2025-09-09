import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authOptions } from "@/lib/auth";
import { MdPeople, MdMedicalServices, MdEventAvailable, MdReviews } from "react-icons/md";

export default async function AdminPainel() {
  const session = await getServerSession(authOptions);
  const cookieRole = cookies().get('role')?.value;
  const sessionRole = session?.user?.role;
  const normalized = (cookieRole || sessionRole || '').toString().trim().toLowerCase();
  const isAdmin = normalized === 'administrator' || normalized === 'admin';

  if (!isAdmin) redirect('/login');

  const stats = {
    pacientes: 2847,
    medicos: 156,
    consultas: 8342,
    avaliacoes: 6891,
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-gray-600 text-sm">Visão geral das estatísticas da plataforma Pass+</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <CardKpi title="Total de Pacientes Cadastrados" value={stats.pacientes.toLocaleString()} icon={<MdPeople />} subtitle="Pacientes ativos na plataforma" highlight="+12% desde o mês passado" />
        <CardKpi title="Total de Médicos Cadastrados" value={stats.medicos.toLocaleString()} icon={<MdMedicalServices />} subtitle="Médicos verificados e ativos" highlight="+8% desde o mês passado" />
        <CardKpi title="Total de Consultas Realizadas" value={stats.consultas.toLocaleString()} icon={<MdEventAvailable />} subtitle="Consultas concluídas com sucesso" highlight="+23% desde o mês passado" />
        <CardKpi title="Total de Avaliações Registradas" value={stats.avaliacoes.toLocaleString()} icon={<MdReviews />} subtitle="Avaliações de pacientes" highlight="Média: 4,7/5 estrelas" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-medium">Atividade Recente</h2>
            </div>
            <ul className="p-4 space-y-3">
              <ActivityItem color="bg-green-500">Novo médico cadastrado <span className="text-gray-500">— Dr. Carlos Silva · Cardiologia</span> <span className="ml-auto text-gray-500">5 min atrás</span></ActivityItem>
              <ActivityItem color="bg-blue-500">Consulta concluída <span className="text-gray-500">— Maria Santos · Dr. Ana Costa</span> <span className="ml-auto text-gray-500">12 min atrás</span></ActivityItem>
              <ActivityItem color="bg-orange-500">Avaliação pendente de moderação <span className="text-gray-500">— Dr. João Lima</span> <span className="ml-auto text-gray-500">25 min atrás</span></ActivityItem>
            </ul>
          </div>
        </section>

        <section>
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-medium">Status do Sistema</h2>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <StatusRow label="Servidor Principal" status="Online" color="bg-emerald-500" />
              <StatusRow label="Base de Dados" status="Operacional" color="bg-emerald-500" />
              <StatusRow label="Sistema de Pagamentos" status="Funcionando" color="bg-emerald-500" />
              <StatusRow label="Notificações" status="Manutenção" color="bg-amber-400" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function CardKpi({ title, value, subtitle, highlight, icon }: { title: string; value: string; subtitle: string; highlight: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{title}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="text-gray-500 text-sm">{subtitle}</div>
      <div className="text-emerald-600 text-xs mt-1">{highlight}</div>
    </div>
  );
}

function ActivityItem({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <li className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition rounded-lg px-4 py-3">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <div className="flex items-center gap-2 text-sm w-full">
        {children}
      </div>
    </li>
  );
}

function StatusRow({ label, status, color }: { label: string; status: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className="flex items-center gap-2 text-gray-700">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        {status}
      </span>
    </div>
  );
}
