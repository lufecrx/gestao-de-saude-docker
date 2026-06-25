'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/services/api';
import { Paciente } from '@/types';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Paciente[]>('/pacientes/');
      setPacientes(data || []);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const formatarCPF = (cpf: string): string => {
    const clean = cpf.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-600 mt-2">Gerencie o cadastro de pacientes do sistema</p>
        </div>
        <Link
          href="/pacientes/novo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition inline-block"
        >
          + Novo Paciente
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-800 font-semibold">Erro</p>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchPacientes}
            className="mt-2 text-red-600 hover:text-red-800 underline font-medium"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg h-16 animate-pulse"></div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && pacientes.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-600 mb-4 text-lg">Nenhum paciente cadastrado</p>
          <Link
            href="/pacientes/novo"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Cadastrar primeiro paciente
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && pacientes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">CPF</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Data de Nascimento</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Telefone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pacientes.map((paciente) => (
                  <tr key={paciente.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{paciente.nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatarCPF(paciente.cpf)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatarData(paciente.data_nascimento)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paciente.telefone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paciente.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <Link
                        href={`/pacientes/${paciente.id}/editar`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
