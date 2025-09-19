"use client";

import { FormEvent, useEffect, useRef, useState } from 'react';
import { MdVisibility, MdCheck, MdClose } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { jsonGet, jsonPost } from '@/lib/api';

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

type ApproveDoctorResponse = {
  message?: string;
  doctor?: {
    id: string;
    approved_at?: string;
  };
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
  const router = useRouter();
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [data, setData] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<DoctorProfile | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionDoctorId, setActionDoctorId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rejectDoctor, setRejectDoctor] = useState<PendingDoctor | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  useEffect(() => () => {
    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
  }, []);

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

  const handleApprove = async (item: PendingDoctor) => {
    if (!item?.id) return;
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    setActionError(null);
    setSuccessMessage(null);
    setActionDoctorId(item.id);
    try {
      const response = await jsonPost<ApproveDoctorResponse>(`/api/admin/approve/doctor/${item.id}`, {});
      const message = response?.message || 'Médico aprovado com sucesso.';
      setSuccessMessage(message);
      setData((prev) => prev.filter((doc) => doc.id !== item.id));
      setShowDetail(false);
      redirectTimeoutRef.current = setTimeout(() => {
        router.replace('/admin/aprovacoes');
        router.refresh();
      }, 1500);
    } catch (e: any) {
      setActionError(e?.message || 'Falha ao aprovar médico.');
    } finally {
      setActionDoctorId(null);
    }
  };

  const openRejectModal = (item: PendingDoctor) => {
    setRejectDoctor(item);
    setRejectReason('');
    setRejectError(null);
  };

  const closeRejectModal = () => {
    if (rejectLoading) return;
    setRejectDoctor(null);
    setRejectReason('');
    setRejectError(null);
  };

  const handleRejectSubmit = async () => {
    if (!rejectDoctor?.id) return;
    if (!rejectReason.trim()) {
      setRejectError('Informe o motivo da reprovação.');
      return;
    }
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    setRejectLoading(true);
    setRejectError(null);
    setSuccessMessage(null);
    try {
      const response = await jsonPost<{ message?: string }>(`/api/admin/reject/doctor/${rejectDoctor.id}`, {
        description: rejectReason.trim(),
      });
      const message = response?.message || 'Médico reprovado com sucesso.';
      setSuccessMessage(message);
      setData((prev) => prev.filter((doc) => doc.id !== rejectDoctor.id));
      setShowDetail(false);
      setRejectDoctor(null);
      setRejectReason('');
      redirectTimeoutRef.current = setTimeout(() => {
        router.replace('/admin/aprovacoes');
        router.refresh();
      }, 1500);
    } catch (e: any) {
      setRejectError(e?.message || 'Falha ao reprovar médico.');
    } finally {
      setRejectLoading(false);
    }
  };

  const totalPendentes = data.length;
  const medicosPendentes = data.length;
  const pacientesPendentes = 0; // Endpoint atual retorna somente médicos

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}
      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}
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
                          className="hover:text-gray-900 cursor-pointer"
                          aria-label="Visualizar"
                        >
                          <MdVisibility />
                        </button>
                        <button
                          onClick={() => handleApprove(item)}
                          disabled={actionDoctorId === item.id}
                          className="text-emerald-600 hover:text-emerald-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Aprovar"
                        >
                          <MdCheck className={actionDoctorId === item.id ? 'animate-pulse' : undefined} />
                        </button>
                        <button
                          onClick={() => openRejectModal(item)}
                          className="text-rose-500 hover:text-rose-600 cursor-pointer"
                          aria-label="Reprovar Médico"
                        >
                          <MdClose />
                        </button>
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
      {rejectDoctor && (
        <RejectDoctorModal
          doctor={rejectDoctor}
          reason={rejectReason}
          loading={rejectLoading}
          error={rejectError}
          onChangeReason={setRejectReason}
          onClose={closeRejectModal}
          onSubmit={handleRejectSubmit}
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

function RejectDoctorModal({
  doctor,
  reason,
  loading,
  error,
  onChangeReason,
  onClose,
  onSubmit,
}: {
  doctor: PendingDoctor;
  reason: string;
  loading: boolean;
  error: string | null;
  onChangeReason: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loading) onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onClose} />
      <div className="relative bg-white w-full max-w-lg mx-4 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-lg">Reprovar Médico</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar modal"
          >
            <MdClose size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="text-sm text-gray-500">Médico selecionado</div>
            <div className="text-base font-medium text-gray-900">{doctor.name}</div>
            {doctor.specialty && (
              <div className="text-sm text-gray-600">{doctor.specialty}</div>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="reject-reason" className="text-sm font-medium text-gray-700">
              Motivo da reprovação
            </label>
            <textarea
              id="reject-reason"
              name="reject-reason"
              className="w-full min-h-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-gray-100"
              placeholder="Descreva o motivo da reprovação"
              value={reason}
              onChange={(event) => onChangeReason(event.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">Esta informação será enviada ao médico.</p>
          </div>
          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

async function fetchDoctorDetails(id: string): Promise<DoctorProfile> {
  const list = await jsonGet<DoctorProfile[]>(`/api/admin/doctor-profiles`);
  const found = Array.isArray(list) ? list.find((d) => d.id === id) : undefined;
  if (!found) throw new Error('Médico não encontrado nos perfis.');
  return found;
}
