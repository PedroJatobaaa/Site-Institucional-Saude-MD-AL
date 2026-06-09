"use client";



import React, { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import Link from 'next/link';

import {

  ArrowLeft, Building2, Eye, FileDown, FilterX, Loader2, Pencil, Plus, Search, UserCog, Users,

} from 'lucide-react';

import UnidadeLotacaoSelect from '@/components/UnidadeLotacaoSelect';

import { listarProfissionais, obterProfissional } from '@/lib/profissionais/api';

import { gerarPdfProfissional } from '@/lib/profissionais/gerarPdfProfissional';

import type { ProfissionalListItem } from '@/lib/profissionais/types';

import { getUsuario } from '@/lib/auth/session';

import { aoMudarNivelLotacao } from '@/lib/usuarios/lotacao';



function temPermissao(permissoes: string[] | undefined) {

  return permissoes?.includes('profissionais_gerenciar') || permissoes?.includes('admin');

}



function BadgeStatus({ ativo }: { ativo: boolean }) {

  return ativo ? (

    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">

      Ativo

    </span>

  ) : (

    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">

      Inativo

    </span>

  );

}



const inputFiltro =

  'w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-shadow';



const labelFiltro = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5';



const selectFiltro =

  'w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none appearance-none transition-shadow';



export default function ProfissionaisListagemPage() {

  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);

  const [profissionais, setProfissionais] = useState<ProfissionalListItem[]>([]);

  const [busca, setBusca] = useState('');

  const [nivelLotacao, setNivelLotacao] = useState('');

  const [unidadeLotacao, setUnidadeLotacao] = useState('');

  const [loading, setLoading] = useState(true);

  const [pdfGerandoId, setPdfGerandoId] = useState<string | null>(null);



  const temFiltroAtivo = Boolean(busca.trim() || nivelLotacao || unidadeLotacao);



  const carregar = useCallback(async (filtros?: {

    q?: string;

    nivelLotacao?: string;

    unidadeLotacao?: string;

  }) => {

    setLoading(true);

    try {

      const lista = await listarProfissionais(filtros);

      setProfissionais(lista);

    } catch (error) {

      console.error(error);

      alert('Erro ao carregar profissionais.');

    } finally {

      setLoading(false);

    }

  }, []);



  const limparFiltros = () => {

    setBusca('');

    setNivelLotacao('');

    setUnidadeLotacao('');

  };



  const gerarPdf = async (id: string) => {

    if (pdfGerandoId) return;

    setPdfGerandoId(id);

    try {

      const detalhe = await obterProfissional(id);

      gerarPdfProfissional(detalhe);

    } catch (error: unknown) {

      const mensagem = error instanceof Error ? error.message : 'Erro ao gerar PDF.';

      alert(mensagem);

    } finally {

      setPdfGerandoId(null);

    }

  };



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

    const timer = setTimeout(() => carregar({

      q: busca,

      nivelLotacao: nivelLotacao || undefined,

      unidadeLotacao: unidadeLotacao || undefined,

    }), 300);

    return () => clearTimeout(timer);

  }, [busca, nivelLotacao, unidadeLotacao, usuario, carregar]);



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

            className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm"

          >

            <Plus size={18} /> Novo profissional

          </Link>

        </div>

      </header>



      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">

        {/* Barra de filtros */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

          <div className="flex flex-wrap items-end gap-x-4 gap-y-4">

            <div className="flex-[1.4] min-w-[220px]">

              <label className={labelFiltro}>Buscar</label>

              <div className="relative">

                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                <input

                  type="text"

                  placeholder="Nome ou CPF..."

                  value={busca}

                  onChange={(e) => setBusca(e.target.value)}

                  className={inputFiltro}

                />

              </div>

            </div>



            <div className="flex-[2] min-w-[280px]">

              <UnidadeLotacaoSelect

                nivelLotacao={nivelLotacao}

                unidadeLotacao={unidadeLotacao}

                onNivelChange={(nivel) => {

                  const lotacao = aoMudarNivelLotacao(nivel);

                  setNivelLotacao(lotacao.nivelLotacao);

                  setUnidadeLotacao(lotacao.unidadeLotacao);

                }}

                onUnidadeChange={setUnidadeLotacao}

                compact

                showIcon={false}

                showSecretariaHint={false}

                labelCategoria="Categoria"

                labelUnidade="Unidade"

                selectClassName={selectFiltro}

                labelClassName={labelFiltro}

                className="!space-y-0"

              />

            </div>



            <div className="flex items-center gap-2 shrink-0">

              {temFiltroAtivo && (

                <button

                  type="button"

                  onClick={limparFiltros}

                  className="h-11 flex items-center gap-2 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors"

                >

                  <FilterX size={16} />

                  Limpar

                </button>

              )}

            </div>

          </div>



          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">

            <span className="text-slate-500 font-medium flex items-center gap-2">

              <Users size={16} className="text-slate-400" />

              {loading ? 'Atualizando lista...' : (

                <>

                  <strong className="text-slate-700">{profissionais.length}</strong>

                  {profissionais.length === 1 ? ' profissional encontrado' : ' profissionais encontrados'}

                </>

              )}

            </span>

            {temFiltroAtivo && !loading && (

              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">

                Filtros ativos

              </span>

            )}

          </div>

        </div>



        {/* Tabela */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-left border-collapse">

              <thead>

                <tr className="bg-slate-50/80 border-b border-slate-200">

                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Nome</th>

                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">CPF</th>

                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">CNES</th>

                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Unidade</th>

                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>

                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td colSpan={6} className="px-6 py-16 text-center">

                      <div className="flex flex-col items-center gap-3 text-slate-400">

                        <Loader2 size={28} className="animate-spin text-blue-500" />

                        <span className="font-medium">Carregando profissionais...</span>

                      </div>

                    </td>

                  </tr>

                ) : profissionais.length === 0 ? (

                  <tr>

                    <td colSpan={6} className="px-6 py-16 text-center">

                      <div className="flex flex-col items-center gap-3">

                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">

                          <Users size={26} className="text-slate-300" />

                        </div>

                        <div>

                          <p className="font-bold text-slate-700">Nenhum profissional encontrado</p>

                          <p className="text-sm text-slate-500 mt-1">

                            {temFiltroAtivo

                              ? 'Tente ajustar os filtros ou limpar a busca.'

                              : 'Cadastre o primeiro profissional clicando em "Novo profissional".'}

                          </p>

                        </div>

                        {temFiltroAtivo && (

                          <button

                            type="button"

                            onClick={limparFiltros}

                            className="mt-1 text-sm font-bold text-blue-600 hover:text-blue-700"

                          >

                            Limpar filtros

                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                ) : (

                  profissionais.map((p, i) => (

                    <tr

                      key={p.id}

                      className={`border-b border-slate-100 last:border-0 hover:bg-blue-50/30 transition-colors ${

                        i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'

                      }`}

                    >

                      <td className="px-6 py-4">

                        <span className="font-bold text-slate-800">{p.nomeProfissional}</span>

                      </td>

                      <td className="px-6 py-4 font-mono text-sm text-slate-600">{p.cpf}</td>

                      <td className="px-6 py-4 font-mono text-sm text-slate-600">{p.cnes || '—'}</td>

                      <td className="px-6 py-4">

                        {p.vinculoPrincipal ? (

                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg max-w-[220px] truncate" title={p.vinculoPrincipal}>

                            <Building2 size={13} className="text-teal-600 shrink-0" />

                            {p.vinculoPrincipal}

                          </span>

                        ) : (

                          <span className="text-slate-400">—</span>

                        )}

                      </td>

                      <td className="px-6 py-4">

                        <BadgeStatus ativo={p.ativo} />

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex items-center justify-end gap-1">

                          <Link

                            href={`/painel/profissionais/${p.id}`}

                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"

                            title="Visualizar"

                          >

                            <Eye size={18} />

                          </Link>

                          <Link

                            href={`/painel/profissionais/${p.id}/editar`}

                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"

                            title="Editar"

                          >

                            <Pencil size={18} />

                          </Link>

                          <button

                            type="button"

                            onClick={() => gerarPdf(p.id)}

                            disabled={pdfGerandoId === p.id}

                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"

                            title="Gerar PDF"

                          >

                            {pdfGerandoId === p.id ? (

                              <Loader2 size={18} className="animate-spin" />

                            ) : (

                              <FileDown size={18} />

                            )}

                          </button>

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


