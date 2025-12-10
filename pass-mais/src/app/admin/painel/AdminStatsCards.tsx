"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MdEventAvailable, MdMedicalServices, MdPeople } from "react-icons/md";

import { jsonGet } from "@/lib/api";

type DashboardStatsResponse = {
  totalClinics: number;
  totalDoctors: number;
  totalAppointments: number;
  totalPatients: number;
  totalReviews: number;
};

type DashboardMetric = {
  title: string;
  value: number;
  subtitle: string;
  highlight: string;
  icon: ReactNode;
};

export default function AdminStatsCards() {
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const response = await jsonGet<DashboardStatsResponse>("/api/admin/dashboard");
        if (!isMounted) return;
        setData(response);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error("Erro ao carregar dashboard admin:", err);
        setError(err instanceof Error ? err.message : "Erro ao carregar as métricas.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo<DashboardMetric[]>(() => {
    return [
      {
        title: "Total de Pacientes Cadastrados",
        value: data?.totalPatients ?? 0,
        icon: <MdPeople />,
        subtitle: "Pacientes ativos na plataforma",
        highlight: "+12% desde o mês passado",
      },
      {
        title: "Total de Médicos Cadastrados",
        value: data?.totalDoctors ?? 0,
        icon: <MdMedicalServices />,
        subtitle: "Médicos verificados e ativos",
        highlight: "+8% desde o mês passado",
      },
      {
        title: "Total de Consultas Agendadas",
        value: data?.totalAppointments ?? 0,
        icon: <MdEventAvailable />,
        subtitle: "Agendamentos registrados",
        highlight: "+5% desde o mês passado",
      },
    ];
  }, [data]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <CardKpi
            key={metric.title}
            title={metric.title}
            value={loading ? "--" : metric.value.toLocaleString()}
            subtitle={metric.subtitle}
            highlight={metric.highlight}
            icon={metric.icon}
          />
        ))}
      </div>
    </div>
  );
}

type CardKpiProps = {
  title: string;
  value: string;
  subtitle: string;
  highlight: string;
  icon: ReactNode;
};

function CardKpi({ title, value, subtitle, highlight, icon }: CardKpiProps) {
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
