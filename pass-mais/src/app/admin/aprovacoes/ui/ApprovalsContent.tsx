"use client";

import { useEffect, useState } from 'react';
import { MdVisibility, MdCheck, MdClose } from 'react-icons/md';
import { jsonGet } from '@/lib/api';

type PendingDoctor = {
  id: string;
  name: string;
  specialty?: string | null;
  crm?: string | null;
  created_at?: string;
  approved_at?: string | null;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  birthDate?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  photo?: string | null; // fallback key
};

type DoctorProfile = {
  id: string;
  userName: string;
  userEmail: string;
  userRole: string;
  crm: string | null;
  specialty: string | null;
  bio: string | null;
  phone: string | null;
  cpf: string | null;
  birthDate: string | null; // YYYY-MM-DD
  photoUrl: string | null;
  consultationPrice: number | null;
  approved: boolean;
  approvedAt: string | null; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
}

export default function ApprovalsContent() {
  const [data, setData] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<DoctorProfile | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await jsonGet<PendingDoctor[]>("/api/doctors/pending");
        if (mounted) setData(Array.isArray(items) ? items : []);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Falha ao carregar aprovações.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openDetail = async (item: PendingDoctor) => {
    setShowDetail(true);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const d = await fetchDoctorDetails(item.id);
      setDetail(d || null);
    } catch (e: any) {
      setDetailError(e?.message || 'Falha ao carregar detalhes.');
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPendentes = data.length;
  const medicosPendentes = data.length;
  const pacientesPendentes = 0; // Endpoint atual retorna somente médicos

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-medium text-lg">Aprovações Pendentes</h2>
        <p className="text-sm text-gray-600">Gerencie as solicitações de cadastro de médicos e pacientes</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardResumo title="Total Pendentes" value={totalPendentes} subtitle="Aguardando aprovação" />
          <CardResumo title="Médicos Pendentes" value={medicosPendentes} subtitle="Cadastros médicos" />
          <CardResumo title="Pacientes Pendentes" value={pacientesPendentes} subtitle="Cadastros de pacientes" />
        </div>
      </section>

      <section>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium">Solicitações de Cadastro</h3>
            {loading && <span className="text-sm text-gray-500">Carregando...</span>}
            {error && <span className="text-sm text-rose-600">{error}</span>}
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
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <Td>{item.name}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700">{item.specialty || '-'}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          Médico
                        </span>
                      </div>
                    </Td>
                    <Td>{formatDate(item.created_at)}</Td>
                    <Td>{item.crm || '-'}</Td>
                    <Td>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-orange-300 text-orange-700 bg-orange-50">
                        Pendente
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-3 text-gray-600">
                    <button
                      onClick={() => openDetail(item)}
                      className="hover:text-gray-900"
                      aria-label="Visualizar"
                    >
                      <MdVisibility />
                    </button>
                        <button className="text-emerald-600 hover:text-emerald-700" aria-label="Aprovar"><MdCheck /></button>
                        <button className="text-rose-500 hover:text-rose-600" aria-label="Rejeitar"><MdClose /></button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {!loading && !error && data.length === 0 && (
                  <tr>
                    <Td className="py-6 text-center text-gray-500" colSpan={6}>
                      Nenhuma solicitação pendente.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showDetail && (
        <DoctorDetailModal
          loading={detailLoading}
          error={detailError}
          doctor={detail}
          onClose={() => setShowDetail(false)}
        />
      )}
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

function Td({ children, className = '', colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td className={`px-5 py-3 text-gray-700 ${className}`} colSpan={colSpan}>{children}</td>;
}

function DoctorDetailModal({ doctor, loading, error, onClose }: { doctor: DoctorProfile | null; loading: boolean; error: string | null; onClose: () => void }) {
  const close = () => onClose();
  const photo = doctor?.photoUrl || '';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative bg-white w-full max-w-3xl mx-4 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-lg">Detalhes do Médico</h3>
          <button onClick={close} className="text-gray-500 hover:text-gray-700" aria-label="Fechar">
            <MdClose size={20} />
          </button>
        </div>
        <div className="p-5 min-h-[200px]">
          {loading && (
            <div className="text-sm text-gray-600">Carregando...</div>
          )}
          {!loading && error && (
            <div className="text-sm text-rose-600">{error}</div>
          )}
          {!loading && !error && doctor && (
            <div className="space-y-5">
              <div className="flex gap-5 items-start">
                <div className="w-28 h-28 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={`Foto de ${doctor.userName}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sem foto</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xl font-semibold text-gray-900">{doctor.userName}</div>
                  <div className="text-gray-600">{doctor.specialty || '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <Info label="E-mail" value={doctor.userEmail} />
                <Info label="CRM" value={doctor.crm} />
                <Info label="Telefone" value={doctor.phone} />
                <Info label="CPF" value={doctor.cpf} />
                <Info label="Nascimento" value={doctor.birthDate ? formatDate(doctor.birthDate) : undefined} />
                <Info label="Preço da Consulta" value={doctor.consultationPrice != null ? `R$ ${Number(doctor.consultationPrice).toFixed(2)}` : undefined} />
                <Info label="Status de Aprovação" value={doctor.approved ? 'Aprovado' : 'Pendente'} />
                <Info label="Aprovado em" value={doctor.approvedAt ? formatDate(doctor.approvedAt) : '-'} />
                <Info label="Criado em" value={doctor.createdAt ? formatDate(doctor.createdAt) : '-'} />
                <Info label="Atualizado em" value={doctor.updatedAt ? formatDate(doctor.updatedAt) : '-'} />
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Biografia</div>
                <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[64px]">
                  {doctor.bio || 'Sem descrição.'}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={close} className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-gray-800 mt-0.5 break-words">{value || '-'}</div>
    </div>
  );
}

async function fetchDoctorDetails(id: string): Promise<DoctorProfile> {
  const list = await jsonGet<DoctorProfile[]>(`/api/admin/doctor-profiles`);
  const found = Array.isArray(list) ? list.find((d) => d.id === id) : undefined;
  if (!found) throw new Error('Médico não encontrado nos perfis.');
  return found;
}
