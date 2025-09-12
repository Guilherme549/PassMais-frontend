import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';

type AdminUser = {
  name: string;
  email: string;
  role: 'Super Admin' | 'Moderador' | 'Suporte';
  status: 'Ativo' | 'Inativo';
  lastLogin: string; // dd/mm/yyyy HH:mm
};

const MOCK: AdminUser[] = [
  { name: 'João Silva', email: 'joao.silva@passplus.com', role: 'Super Admin', status: 'Ativo', lastLogin: '15/01/2024 14:30' },
  { name: 'Maria Santos', email: 'maria.santos@passplus.com', role: 'Moderador', status: 'Ativo', lastLogin: '15/01/2024 10:15' },
  { name: 'Carlos Oliveira', email: 'carlos.oliveira@passplus.com', role: 'Suporte', status: 'Ativo', lastLogin: '14/01/2024 16:45' },
  { name: 'Ana Costa', email: 'ana.costa@passplus.com', role: 'Moderador', status: 'Inativo', lastLogin: '10/01/2024 09:20' },
];

export default async function AdminAdministradores() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const cookieRole = cookieStore.get('role')?.value;
  const role = (cookieRole || session?.user?.role || '').toString().trim().toLowerCase();
  const isAdmin = role === 'administrator' || role === 'admin';
  if (!isAdmin) redirect('/login');

  const total = MOCK.length;
  const ativos = MOCK.filter((u) => u.status === 'Ativo').length;
  const superAdmins = MOCK.filter((u) => u.role === 'Super Admin').length;
  const moderadores = MOCK.filter((u) => u.role === 'Moderador').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gerenciar Administradores</h1>
          <p className="text-sm text-gray-600">Gerencie os usuários administrativos da plataforma</p>
        </div>
        <button className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-black text-white hover:bg-gray-800 transition">
          <MdAdd />
          Criar Novo Administrador
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total de Admins" value={total} />
        <Card title="Admins Ativos" value={ativos} valueClass="text-emerald-600" />
        <Card title="Super Admins" value={superAdmins} valueClass="text-rose-600" />
        <Card title="Moderadores" value={moderadores} valueClass="text-indigo-600" />
      </div>

      {/* Lista */}
      <section>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-medium">Lista de Administradores</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 bg-gray-50">
                  <Th>Nome</Th>
                  <Th>E-mail</Th>
                  <Th>Cargo</Th>
                  <Th>Status</Th>
                  <Th>Último Login</Th>
                  <Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK.map((u, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">{u.name.split(' ').map(p=>p[0]).slice(0,2).join('')}</span>
                        <span className="text-gray-800">{u.name}</span>
                      </div>
                    </Td>
                    <Td>{u.email}</Td>
                    <Td>
                      <Badge color={u.role === 'Super Admin' ? 'bg-rose-100 text-rose-700 border-rose-200' : u.role === 'Moderador' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}>
                        {u.role}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge color={u.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
                        {u.status}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="whitespace-nowrap">
                        {u.lastLogin.split(' ')[0]}
                        <div className="text-xs text-gray-500">{u.lastLogin.split(' ')[1]}</div>
                      </div>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-3 text-gray-600">
                        <button className="hover:text-gray-900" aria-label="Editar"><MdEdit /></button>
                        <button className="text-rose-500 hover:text-rose-600" aria-label="Excluir"><MdDelete /></button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({ title, value, valueClass = '' }: { title: string; value: number; valueClass?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="text-gray-700 text-sm">{title}</div>
      <div className={`text-2xl font-semibold mt-1 ${valueClass}`}>{value}</div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>{children}</span>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-5 py-3 font-medium ${className}`}>{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3 text-gray-700 ${className}`}>{children}</td>;
}
