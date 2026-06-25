'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/services/api';
import { Agendamento, CreateAgendamentoRequest, Paciente } from '@/types';

const PAGE_SIZE = 10;

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

function formatDateTime(value: string): { date: string; time: string } {
  const parsed = new Date(value);

  return {
    date: parsed.toLocaleDateString('pt-BR'),
    time: parsed.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function isValidLocalDateTime(value: string): boolean {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() >= Date.now();
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export default function AgendamentosManager() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [totalPageLoaded, setTotalPageLoaded] = useState(0);
  const [filtroPacienteId, setFiltroPacienteId] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    paciente_id: '',
    data_hora: '',
    tipo_atendimento: 'Consulta Presencial',
    profissional_responsavel: '',
    status: 'Agendado',
    observacoes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const todayRange = getTodayRange();

  useEffect(() => {
    void loadPacientes();
  }, []);

  useEffect(() => {
    void loadAgendamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, filtroPacienteId, filtroStatus]);

  async function loadPacientes() {
    try {
      setLoadingPacientes(true);
      const data = await api.get<Paciente[]>('/pacientes/');
      setPacientes(data ?? []);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Não foi possível carregar os pacientes.');
    } finally {
      setLoadingPacientes(false);
    }
  }

  async function loadAgendamentos() {
    try {
      setLoadingAgendamentos(true);
      setError(null);

      const query = buildQueryString({
        skip,
        limit: PAGE_SIZE,
        paciente_id: filtroPacienteId ? Number(filtroPacienteId) : undefined,
        status: filtroStatus || undefined,
      });

      const data = await api.get<Agendamento[]>(`/agendamentos/${query}`);
      setAgendamentos(data ?? []);
      setTotalPageLoaded(data?.length ?? 0);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Não foi possível carregar os agendamentos.');
    } finally {
      setLoadingAgendamentos(false);
    }
  }

  function handleFormChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.paciente_id) {
      errors.paciente_id = 'Selecione um paciente.';
    }

    if (!formData.data_hora) {
      errors.data_hora = 'Informe a data e hora do agendamento.';
    } else if (!isValidLocalDateTime(formData.data_hora)) {
      errors.data_hora = 'A data e hora devem ser iguais ou posteriores ao momento atual.';
    }

    if (!formData.tipo_atendimento.trim()) {
      errors.tipo_atendimento = 'Informe o tipo de atendimento.';
    }

    if (formData.observacoes.trim().length > 500) {
      errors.observacoes = 'As observações devem ter no máximo 500 caracteres.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const payload: CreateAgendamentoRequest = {
        paciente_id: Number(formData.paciente_id),
        data_hora: new Date(formData.data_hora).toISOString(),
        tipo_atendimento: formData.tipo_atendimento,
        profissional_responsavel: formData.profissional_responsavel.trim() || undefined,
        status: formData.status,
        observacoes: formData.observacoes.trim() || undefined,
      };

      await api.post<Agendamento>('/agendamentos/', payload);
      setSuccessMessage('Agendamento criado com sucesso.');
      setFormData({
        paciente_id: '',
        data_hora: '',
        tipo_atendimento: 'Consulta Presencial',
        profissional_responsavel: '',
        status: 'Agendado',
        observacoes: '',
      });
      setSkip(0);
      await loadAgendamentos();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Falha ao criar agendamento.');
    } finally {
      setSubmitting(false);
    }
  }

  function renderErrorMessage() {
    if (!error) {
      return null;
    }

    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-800">
        <p className="font-semibold">Erro</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  const canGoPrevious = skip > 0;
  const canGoNext = totalPageLoaded >= PAGE_SIZE;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-8 rounded-3xl bg-gradient-to-r from-emerald-700 via-sky-700 to-sky-600 px-6 py-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-[0.2em] text-white/80">VidaPlena</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Agendamentos</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/90 sm:text-base">
          Gestão de consultas, visitas e teleconsultas. O formulário abaixo carrega pacientes
          cadastrados dinamicamente e o painel lista os atendimentos com paginação e filtros.
        </p>
      </section>

      {successMessage && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
          <p className="font-semibold">Sucesso</p>
          <p className="mt-1 text-sm">{successMessage}</p>
        </div>
      )}

      {renderErrorMessage()}

      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Listagem de agendamentos</h2>
              <p className="mt-1 text-sm text-slate-600">
                Filtre por paciente ou status e navegue pelas páginas de resultados.
              </p>
            </div>
            <Link
              href="#form-agendamento"
              className="lg:hidden rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Novo agendamento
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <FilterSelect
              label="Paciente"
              value={filtroPacienteId}
              onChange={setFiltroPacienteId}
              options={[
                { label: 'Todos os pacientes', value: '' },
                ...pacientes.map((paciente) => ({ label: paciente.nome, value: String(paciente.id) })),
              ]}
              disabled={loadingPacientes}
            />
            <FilterSelect
              label="Status"
              value={filtroStatus}
              onChange={setFiltroStatus}
              options={[
                { label: 'Todos os status', value: '' },
                { label: 'Agendado', value: 'Agendado' },
                { label: 'Realizado', value: 'Realizado' },
                { label: 'Cancelado', value: 'Cancelado' },
              ]}
            />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Hoje</p>
              <p className="mt-1 text-sm text-slate-700">{new Date(todayRange.start).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            {loadingAgendamentos ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : agendamentos.length === 0 ? (
              <div className="bg-slate-50 px-6 py-10 text-center">
                <p className="text-lg font-semibold text-slate-900">Nenhum agendamento encontrado</p>
                <p className="mt-1 text-sm text-slate-600">
                  Crie um novo agendamento para começar a usar o módulo clínico.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>Data</Th>
                      <Th>Hora</Th>
                      <Th>Paciente</Th>
                      <Th>Tipo</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {agendamentos.map((agendamento) => {
                      const parsed = formatDateTime(agendamento.data_hora);
                      return (
                        <tr key={agendamento.id} className="hover:bg-slate-50">
                          <Td>{parsed.date}</Td>
                          <Td>{parsed.time}</Td>
                          <Td>
                            <div className="font-medium text-slate-900">{agendamento.paciente?.nome ?? 'Paciente não informado'}</div>
                            <div className="text-xs text-slate-500">ID {agendamento.paciente_id}</div>
                          </Td>
                          <Td>{agendamento.tipo_atendimento}</Td>
                          <Td>
                            <StatusPill status={agendamento.status} />
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Página atual: <span className="font-semibold text-slate-900">{Math.floor(skip / PAGE_SIZE) + 1}</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSkip((current) => Math.max(0, current - PAGE_SIZE))}
                disabled={!canGoPrevious || loadingAgendamentos}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setSkip((current) => current + PAGE_SIZE)}
                disabled={!canGoNext || loadingAgendamentos}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>

        <form
          id="form-agendamento"
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Novo agendamento</h2>
            <p className="mt-1 text-sm text-slate-600">Associe um atendimento a um paciente já cadastrado.</p>
          </div>

          <div className="mt-6 space-y-4">
            <Field
              label="Paciente"
              name="paciente_id"
              value={formData.paciente_id}
              onChange={handleFormChange}
              error={formErrors.paciente_id}
              as="select"
              disabled={loadingPacientes || pacientes.length === 0}
            >
              <option value="">Selecione um paciente</option>
              {pacientes.map((paciente) => (
                <option key={paciente.id} value={paciente.id}>
                  {paciente.nome} - CPF {paciente.cpf}
                </option>
              ))}
            </Field>

            <Field
              label="Data e hora"
              name="data_hora"
              value={formData.data_hora}
              onChange={handleFormChange}
              error={formErrors.data_hora}
              type="datetime-local"
            />

            <Field
              label="Tipo de atendimento"
              name="tipo_atendimento"
              value={formData.tipo_atendimento}
              onChange={handleFormChange}
              error={formErrors.tipo_atendimento}
              as="select"
            >
              <option value="Consulta Presencial">Consulta Presencial</option>
              <option value="Visita Domiciliar">Visita Domiciliar</option>
              <option value="Teleconsulta">Teleconsulta</option>
            </Field>

            <Field
              label="Profissional responsável"
              name="profissional_responsavel"
              value={formData.profissional_responsavel}
              onChange={handleFormChange}
              placeholder="Ex.: Dra. Maria Oliveira"
            />

            <Field
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleFormChange}
              as="select"
            >
              <option value="Agendado">Agendado</option>
              <option value="Realizado">Realizado</option>
              <option value="Cancelado">Cancelado</option>
            </Field>

            <Field
              label="Observações clínicas"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleFormChange}
              error={formErrors.observacoes}
              as="textarea"
              placeholder="Observações curtas sobre a consulta ou preparo do atendimento"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={submitting || loadingPacientes || pacientes.length === 0}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {submitting ? 'Salvando...' : 'Salvar agendamento'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  paciente_id: '',
                  data_hora: '',
                  tipo_atendimento: 'Consulta Presencial',
                  profissional_responsavel: '',
                  status: 'Agendado',
                  observacoes: '',
                });
                setFormErrors({});
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Limpar formulário
            </button>
          </div>

          {loadingPacientes && (
            <p className="mt-4 text-sm text-slate-500">Carregando pacientes cadastrados...</p>
          )}
          {!loadingPacientes && pacientes.length === 0 && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Nenhum paciente cadastrado ainda. Cadastre um paciente para liberar o agendamento.
              <div className="mt-2">
                <Link href="/pacientes/novo" className="font-semibold text-amber-900 underline">
                  Ir para cadastro de paciente
                </Link>
              </div>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 text-sm text-slate-700">{children}</td>;
}

function StatusPill({ status }: { status: string }) {
  const classes: Record<string, string> = {
    Agendado: 'bg-sky-100 text-sky-700',
    Realizado: 'bg-emerald-100 text-emerald-700',
    Cancelado: 'bg-rose-100 text-rose-700',
  };

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes[status] ?? 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-2 w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
      >
        {options.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  as = 'input',
  type = 'text',
  placeholder,
  disabled = false,
  children,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  error?: string;
  as?: 'input' | 'select' | 'textarea';
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const baseClassName = `mt-2 w-full rounded-xl border px-4 py-2 text-sm outline-none transition focus:ring-2 ${
    error ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-sky-500'
  }`;

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {as === 'select' ? (
        <select name={name} value={value} onChange={onChange} disabled={disabled} className={baseClassName}>
          {children}
        </select>
      ) : as === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          rows={4}
          className={baseClassName}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={baseClassName}
        />
      )}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </label>
  );
}
