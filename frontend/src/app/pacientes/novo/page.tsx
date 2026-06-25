'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/services/api';
import { CreatePacienteRequest } from '@/types';

interface FormData {
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  sexo: string;
  observacoes: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function NovoPacientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    cpf: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    sexo: '',
    observacoes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validarCPF = (cpf: string): boolean => {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (clean === clean[0].repeat(11)) return false;
    return true;
  };

  const validarFormulario = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validarCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!formData.data_nascimento) {
      newErrors.data_nascimento = 'Data de nascimento é obrigatória';
    } else {
      const data = new Date(formData.data_nascimento);
      if (data > new Date()) {
        newErrors.data_nascimento = 'Data de nascimento não pode ser no futuro';
      }
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro do campo quando o usuário começa a editar
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validarFormulario()) {
      return;
    }

    // limpar erros de validação anteriores antes do envio
    setErrors({});

    try {
      setLoading(true);

      // Preparar dados para envio (excluir campos vazios opcionais)
      const payload: CreatePacienteRequest = {
        nome: formData.nome.trim(),
        cpf: formData.cpf.replace(/\D/g, ''),
        data_nascimento: formData.data_nascimento,
        telefone: formData.telefone.trim() || undefined,
        email: formData.email.trim() || undefined,
        sexo: formData.sexo || undefined,
        observacoes: formData.observacoes.trim() || undefined,
      };

      await api.post('/pacientes/', payload);

      setSuccess(true);

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/pacientes');
      }, 2000);
    } catch (err) {
      const apiError = err as ApiError;
      // Se a API retornou erros por campo, mostre abaixo dos inputs
      if (apiError.fieldErrors && Object.keys(apiError.fieldErrors).length > 0) {
        setErrors(apiError.fieldErrors as FormErrors);
        setApiError(null);
      } else if (apiError.status === 400) {
        // mensagem genérica sobre CPF duplicado
        if (apiError.message && apiError.message.toLowerCase().includes('cpf')) {
          setErrors({ cpf: apiError.message });
        } else {
          setApiError('CPF já cadastrado. Use um CPF diferente.');
        }
      } else {
        setApiError(apiError.message || 'Erro ao cadastrar paciente');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Novo Paciente</h1>
        <p className="text-gray-600 mt-2">Preencha os dados para cadastrar um novo paciente</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <p className="text-green-800 font-semibold">Sucesso!</p>
          <p className="text-green-700">Paciente cadastrado com sucesso. Redirecionando...</p>
        </div>
      )}

      {/* Error Message */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-800 font-semibold">Erro</p>
          <p className="text-red-700">{apiError}</p>
        </div>
      )}

      {/* Form */}
      {!success && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          {/* Nome */}
          <div className="mb-6">
            <label htmlFor="nome" className="block text-sm font-semibold text-gray-900 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Ex: João Silva Santos"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.nome
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              disabled={loading}
            />
            {errors.nome && <p className="text-red-600 text-sm mt-1">{errors.nome}</p>}
          </div>

          {/* CPF */}
          <div className="mb-6">
            <label htmlFor="cpf" className="block text-sm font-semibold text-gray-900 mb-2">
              CPF *
            </label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              placeholder="Ex: 123.456.789-00"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.cpf
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              disabled={loading}
            />
            {errors.cpf && <p className="text-red-600 text-sm mt-1">{errors.cpf}</p>}
          </div>

          {/* Data de Nascimento */}
          <div className="mb-6">
            <label htmlFor="data_nascimento" className="block text-sm font-semibold text-gray-900 mb-2">
              Data de Nascimento *
            </label>
            <input
              type="date"
              id="data_nascimento"
              name="data_nascimento"
              value={formData.data_nascimento}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.data_nascimento
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              disabled={loading}
            />
            {errors.data_nascimento && (
              <p className="text-red-600 text-sm mt-1">{errors.data_nascimento}</p>
            )}
          </div>

          {/* Telefone */}
          <div className="mb-6">
            <label htmlFor="telefone" className="block text-sm font-semibold text-gray-900 mb-2">
              Telefone *
            </label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="Ex: (11) 98765-4321"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.telefone
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              disabled={loading}
            />
            {errors.telefone && <p className="text-red-600 text-sm mt-1">{errors.telefone}</p>}
          </div>

          {/* Email */}
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ex: joao@example.com"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.email
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              disabled={loading}
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Sexo */}
          <div className="mb-6">
            <label htmlFor="sexo" className="block text-sm font-semibold text-gray-900 mb-2">
              Sexo
            </label>
            <select
              id="sexo"
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={loading}
            >
              <option value="">Não informado</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>

          {/* Observações */}
          <div className="mb-8">
            <label htmlFor="observacoes" className="block text-sm font-semibold text-gray-900 mb-2">
              Observações
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Anotações adicionais sobre o paciente (opcional)"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Paciente'}
            </button>
            <Link
              href="/pacientes"
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-6 rounded-lg transition text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
