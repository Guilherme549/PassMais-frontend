"use client";

import { useEffect, useState } from 'react';
import { MdVisibility, MdCheck, MdClose } from 'react-icons/md';
import { jsonGet } from '@/lib/api';

type PendingDoctor = {
  id: string;
  name: string;
  specialty: string | null;
  crm: string | null;
  created_at: string;
  approved_at: string | null;
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
                        <button className="hover:text-gray-900" aria-label="Visualizar"><MdVisibility /></button>
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

