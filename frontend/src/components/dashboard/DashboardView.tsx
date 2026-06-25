'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/services/api';
import { Agendamento, DashboardSummary, Paciente } from '@/types';

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function CardSkeleton() {
  return <div className="h-32 rounded-2xl bg-white/70 animate-pulse border border-slate-200" />;
}

export default function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalPacientes: 0,
    totalAgendamentos: 0,
    agendamentosHoje: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayRange = getTodayRange();

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        setLoading(true);
        setError(null);

        const [pacientes, agendamentos, agendamentosHoje] = await Promise.all([
          api.get<Paciente[]>('/pacientes/'),
          api.get<Agendamento[]>('/agendamentos/?skip=0&limit=1000'),
          api.get<Agendamento[]>(`/agendamentos/?skip=0&limit=1000&data_inicio=${encodeURIComponent(todayRange.start)}&data_fim=${encodeURIComponent(todayRange.end)}`),
        ]);

        if (!isMounted) {
          return;
        }

        setSummary({
          totalPacientes: pacientes.length,
          totalAgendamentos: agendamentos.length,
          agendamentosHoje: agendamentosHoje.length,
        });
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const apiError = err as ApiError;
        setError(apiError.message || 'Não foi possível carregar o resumo do dashboard.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, [todayRange.end, todayRange.start]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-8 rounded-3xl bg-gradient-to-r from-sky-700 via-sky-600 to-emerald-600 px-6 py-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-[0.2em] text-white/80">VidaPlena</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Dashboard clínico e gerencial</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/90 sm:text-base">
          Bem-vindo ao painel de controle do VidaPlena! Aqui você pode acompanhar os indicadores principais do sistema: pacientes cadastrados, agendamentos totais e agendamentos previstos para hoje.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/pacientes/novo"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
          >
            Novo paciente
          </Link>
          <Link
            href="/agendamentos"
            className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Ver agendamentos
          </Link>
        </div>
      </section>

      {error && (
        <div className="mb-8 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-800">
          <p className="font-semibold">Falha ao carregar dados</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard
              title="Total de Pacientes"
              value={summary.totalPacientes}
              description="Pacientes cadastrados no sistema"
              accent="sky"
            />
            <SummaryCard
              title="Total de Agendamentos"
              value={summary.totalAgendamentos}
              description="Registros agendados na base"
              accent="emerald"
            />
            <SummaryCard
              title="Hoje"
              value={summary.agendamentosHoje}
              description={`Agendamentos previstos para ${formatDate(new Date())}`}
              accent="teal"
            />
          </>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Acesso rápido</h2>
          <p className="mt-1 text-sm text-slate-600">Fluxos mais usados.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <QuickActionCard
              href="/pacientes"
              title="Pacientes"
              description="Listar, criar e acompanhar cadastros."
              borderClass="border-sky-500"
            />
            <QuickActionCard
              href="/agendamentos"
              title="Agendamentos"
              description="Marcar e consultar atendimentos."
              borderClass="border-emerald-500"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Objetivo do sistema</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>• Gerenciamento de pacientes com cadastro e edição de dados.</li>
            <li>• Controle integrado de agendamentos e consultas.</li>
            <li>• Exibir uma base clínica simples.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  accent,
}: {
  title: string;
  value: number;
  description: string;
  accent: 'sky' | 'emerald' | 'teal';
}) {
  const accentClasses: Record<typeof accent, string> = {
    sky: 'from-sky-500 to-sky-600',
    emerald: 'from-emerald-500 to-emerald-600',
    teal: 'from-teal-500 to-teal-600',
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`h-2 bg-gradient-to-r ${accentClasses[accent]}`} />
      <div className="p-6">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 text-4xl font-bold text-slate-900">{value}</p>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  borderClass,
}: {
  href: string;
  title: string;
  description: string;
  borderClass: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border-l-4 ${borderClass} bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </Link>
  );
}