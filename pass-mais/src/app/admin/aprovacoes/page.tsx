import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth';
import { MdVisibility, MdCheck, MdClose } from 'react-icons/md';

type PendingItem = {
  name: string;
  specialty?: string;
  type: 'Médico' | 'Paciente';
  date: string;
  crm?: string;
  status: 'Pendente';
};

const MOCK: PendingItem[] = [
  { name: 'Dr. Roberto Silva', specialty: 'Neurologia', type: 'Médico', date: '15/01/2024', crm: '12345-SP', status: 'Pendente' },
  { name: 'Dra. Mariana Costa', specialty: 'Pediatria', type: 'Médico', date: '14/01/2024', crm: '67890-RJ', status: 'Pendente' },
  { name: 'Carlos Oliveira', type: 'Paciente', date: '13/01/2024', status: 'Pendente' },
  { name: 'Dr. Fernando Alves', specialty: 'Ortopedia', type: 'Médico', date: '12/01/2024', crm: '54321-MG', status: 'Pendente' },
  { name: 'Ana Patricia Santos', type: 'Paciente', date: '11/01/2024', status: 'Pendente' },
];

export default async function AdminAprovacoes() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const cookieRole = cookieStore.get('role')?.value;
  const role = (cookieRole || session?.user?.role || '').toString().trim().toLowerCase();
  const isAdmin = role === 'administrator' || role === 'admin';
  if (!isAdmin) redirect('/login');

  const totalPendentes = MOCK.length;
  const medicosPendentes = MOCK.filter((i) => i.type === 'Médico').length;
  const pacientesPendentes = MOCK.filter((i) => i.type === 'Paciente').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Aprovações de Cadastros</h1>
      </div>

      {/* Resumo */}
      <section className="space-y-3">
        <h2 className="font-medium text-lg">Aprovações Pendentes</h2>
        <p className="text-sm text-gray-600">Gerencie as solicitações de cadastro de médicos e pacientes</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardResumo title="Total Pendentes" value={totalPendentes} subtitle="Aguardando aprovação" />
          <CardResumo title="Médicos Pendentes" value={medicosPendentes} subtitle="Cadastros médicos" />
          <CardResumo title="Pacientes Pendentes" value={pacientesPendentes} subtitle="Cadastros de pacientes" />
        </div>
      </section>

      {/* Tabela */}
      <section>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-medium">Solicitações de Cadastro</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 bg-gray-50">
                  <Th>Nome</Th>
                  <Th>Especialidade/Tipo</Th>
                  <Th>Data de Solicitação</Th>
                  <Th>CRM</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <Td>{item.name}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700">{item.specialty ?? '-'}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          {item.type}
                        </span>
                      </div>
                    </Td>
                    <Td>{item.date}</Td>
                    <Td>{item.crm ?? '-'}</Td>
                    <Td>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-orange-300 text-orange-700 bg-orange-50">
                        {item.status}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-3 text-gray-600">
                        <button className="hover:text-gray-900" aria-label="Visualizar"><MdVisibility /></button>
                        <button className="text-emerald-600 hover:text-emerald-700" aria-label="Aprovar"><MdCheck /></button>
                        <button className="text-rose-500 hover:text-rose-600" aria-label="Rejeitar"><MdClose /></button>
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

function CardResumo({ title, value, subtitle }: { title: string; value: number; subtitle: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="text-gray-700 text-sm">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      <div className="text-gray-500 text-sm">{subtitle}</div>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-5 py-3 font-medium ${className}`}>{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3 text-gray-700 ${className}`}>{children}</td>;
}
