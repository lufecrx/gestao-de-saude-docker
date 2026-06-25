export interface Paciente {
  id: number;
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone?: string;
  email?: string;
  sexo?: string;
  observacoes?: string;
}

export interface PacienteResumido {
  id: number;
  nome: string;
}

export interface Agendamento {
  id: number;
  paciente_id: number;
  data_hora: string;
  tipo_atendimento: string;
  profissional_responsavel?: string | null;
  status: string;
  observacoes?: string | null;
  paciente: PacienteResumido;
}

export interface CreateAgendamentoRequest {
  paciente_id: number;
  data_hora: string;
  tipo_atendimento: string;
  profissional_responsavel?: string;
  status?: string;
  observacoes?: string;
}

export interface DashboardSummary {
  totalPacientes: number;
  totalAgendamentos: number;
  agendamentosHoje: number;
}

export interface CreatePacienteRequest {
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone?: string;
  email?: string;
  sexo?: string;
  observacoes?: string;
}

export interface UpdatePacienteRequest {
  nome?: string;
  cpf?: string;
  data_nascimento?: string;
  telefone?: string;
  email?: string;
  sexo?: string;
  observacoes?: string;
}
