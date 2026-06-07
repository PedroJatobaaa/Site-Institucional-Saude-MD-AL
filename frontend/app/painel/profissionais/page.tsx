"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Eye, Pencil, Plus, Search, UserCog,
} from 'lucide-react';
import { listarProfissionais } from '@/lib/profissionais/api';
import type { ProfissionalListItem } from '@/lib/profissionais/types';
import { getUsuario } from '@/lib/auth/session';

function temPermissao(permissoes: string[] | undefined) {
  return permissoes?.includes('profissionais_gerenciar') || permissoes?.includes('admin');
}

function BadgeStatus({ ativo }: { ativo: boolean }) {
  return ativo ? (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      Ativo
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
      Inativo
    </span>
  );
}

export default function ProfissionaisListagemPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [profissionais, setProfissionais] = useState<ProfissionalListItem[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const lista = await listarProfissionais(q);
      setProfissionais(lista);
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar profissionais.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userObj = getUsuario();
    if (!userObj) {
      router.push('/login');
      return;
    }
    if (!temPermissao(userObj.permissoes)) {
      alert('Você não tem permissão para acessar o cadastro de profissionais.');
      router.push('/painel');
      return;
    }
    setUsuario(userObj);
    carregar();
  }, [router, carregar]);

  useEffect(() => {
    if (!usuario) return;
    const timer = setTimeout(() => carregar(busca), 300);
    return () => clearTimeout(timer);
  }, [busca, usuario, carregar]);

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/painel" className="bg-white p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <UserCog size={24} className="text-teal-600" />
                Cadastro de Profissionais
              </h1>
              <p className="text-sm text-slate-500 font-medium">Ficha cadastral de estabelecimento de saúde — SUS</p>
            </div>
          </div>
          <Link
            href="/painel/profissionais/novo"
            className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
          >
            <Plus size={18} /> Novo profissional
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">CPF</th>
                  <th className="px-6 py-4">CNS</th>
                  <th className="px-6 py-4">Vínculo principal</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Carregando...
                    </td>
                  </tr>
                ) : profissionais.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Nenhum profissional encontrado.
                    </td>
                  </tr>
                ) : (
                  profissionais.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{p.nomeProfissional}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-600">{p.cpf}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-600">{p.numeroCns || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{p.vinculoPrincipal || '—'}</td>
                      <td className="px-6 py-4">
                        <BadgeStatus ativo={p.ativo} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/painel/profissionais/${p.id}`}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            href={`/painel/profissionais/${p.id}/editar`}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
