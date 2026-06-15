"use client";



import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import Link from 'next/link';

import {
  ArrowLeft, Building2, ChevronLeft, ChevronRight, Eye, FileDown, FilterX, Loader2, Plus, Search, UserCog, Users,
} from 'lucide-react';

import UnidadeLotacaoSelect from '@/components/UnidadeLotacaoSelect';

import { listarProfissionais, obterProfissional } from '@/lib/profissionais/api';

import { gerarPdfProfissional } from '@/lib/profissionais/gerarPdfProfissional';

import type {
  ProfissionalListItem,
  StatusCadastroAtualizacao,
  StatusTreinamento,
} from '@/lib/profissionais/types';

import {
  CADASTRO_ATUALIZACAO_OPCOES,
  PROFISSIONAIS_POR_PAGINA,
  TREINAMENTO_OPCOES,
} from '@/lib/profissionais/types';

import { getUsuario } from '@/lib/auth/session';

import { aoMudarNivelLotacao, ehSecretariaSaude } from '@/lib/usuarios/lotacao';



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

function rotuloOpcao<T extends string>(
  valor: T,
  opcoes: { value: T; label: string }[]
) {
  return opcoes.find((opcao) => opcao.value === valor)?.label ?? valor;
}

const badgeBase = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border';

const coresStatus = {
  vermelho: 'bg-red-50 text-red-700 border-red-200',
  amarelo: 'bg-amber-50 text-amber-700 border-amber-200',
  verde: 'bg-emerald-50 text-emerald-700 border-emerald-200',
} as const;

function BadgeTreinamento({ status }: { status: StatusTreinamento }) {
  const cor = status === 'aguardando'
    ? coresStatus.vermelho
    : status === 'agendado'
      ? coresStatus.amarelo
      : coresStatus.verde;

  return (
    <span className={`${badgeBase} ${cor}`}>
      {rotuloOpcao(status, TREINAMENTO_OPCOES)}
    </span>
  );
}

function BadgeCadastroAtualizacao({ status }: { status: StatusCadastroAtualizacao }) {
  const cor = status === 'aguardando' ? coresStatus.vermelho : coresStatus.verde;

  return (
    <span className={`${badgeBase} ${cor}`}>
      {rotuloOpcao(status, CADASTRO_ATUALIZACAO_OPCOES)}
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
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [busca, setBusca] = useState('');

  const [nivelLotacao, setNivelLotacao] = useState('');

  const [unidadeLotacao, setUnidadeLotacao] = useState('');

  const [filtroTreinamento, setFiltroTreinamento] = useState<StatusTreinamento | ''>('');

  const [filtroCadastroAtualizacao, setFiltroCadastroAtualizacao] = useState<StatusCadastroAtualizacao | ''>('');

  const [incluirInativos, setIncluirInativos] = useState(false);

  const [loading, setLoading] = useState(true);

  const [pdfGerandoId, setPdfGerandoId] = useState<string | null>(null);

  const listaRef = useRef<HTMLDivElement>(null);
  const deveRolarParaLista = useRef(false);

  const temFiltroAtivo = Boolean(
    busca.trim() || nivelLotacao || unidadeLotacao || filtroTreinamento || filtroCadastroAtualizacao || incluirInativos
  );
  const inicioItem = total === 0 ? 0 : (pagina - 1) * PROFISSIONAIS_POR_PAGINA + 1;
  const fimItem = total === 0 ? 0 : Math.min(pagina * PROFISSIONAIS_POR_PAGINA, total);



  const carregar = useCallback(async (filtros?: {

    q?: string;

    nivelLotacao?: string;

    unidadeLotacao?: string;

    treinamento?: StatusTreinamento;

    cadastroAtualizacao?: StatusCadastroAtualizacao;

    pagina?: number;

    incluirInativos?: boolean;

  }) => {

    setLoading(true);

    try {

      const resposta = await listarProfissionais(filtros);

      setProfissionais(resposta.itens);
      setTotal(resposta.total);
      setPagina(resposta.pagina);
      setTotalPaginas(resposta.totalPaginas);

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

    setFiltroTreinamento('');

    setFiltroCadastroAtualizacao('');

    setIncluirInativos(false);

    setPagina(1);

  };

  const irParaPagina = (novaPagina: number) => {
    if (novaPagina < 1 || novaPagina > totalPaginas || novaPagina === pagina || loading) return;
    deveRolarParaLista.current = true;
    setPagina(novaPagina);
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

      alert('Você não tem permissão para acessar o módulo Profissionais.');

      router.push('/painel');

      return;

    }

    setUsuario(userObj);

  }, [router]);

  useEffect(() => {

    if (!usuario) return;

    const timer = setTimeout(() => carregar({

      q: busca,

      nivelLotacao: nivelLotacao || undefined,

      unidadeLotacao: ehSecretariaSaude(nivelLotacao) ? undefined : (unidadeLotacao || undefined),

      treinamento: filtroTreinamento || undefined,

      cadastroAtualizacao: filtroCadastroAtualizacao || undefined,

      pagina,

      incluirInativos: incluirInativos || undefined,

    }), 300);

    return () => clearTimeout(timer);

  }, [busca, nivelLotacao, unidadeLotacao, filtroTreinamento, filtroCadastroAtualizacao, incluirInativos, pagina, usuario, carregar]);

  useEffect(() => {
    if (!loading && deveRolarParaLista.current && listaRef.current) {
      listaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      deveRolarParaLista.current = false;
    }
  }, [loading, profissionais]);



  if (!usuario) return null;



  return (

    <div className="min-h-screen bg-slate-50 font-sans">

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">

        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div className="flex items-center gap-4">

            <Link href="/painel" className="bg-white p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">

              <ArrowLeft size={20} className="text-slate-600" />

            </Link>

            <div>

              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">

                <UserCog size={24} className="text-teal-600" />

                Profissionais

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



      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-8 space-y-6">

        {/* Barra de filtros */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-x-4 gap-y-4 items-end">

            <div className="min-w-0 sm:col-span-2 lg:col-span-1">

              <label className={labelFiltro}>Buscar</label>

              <div className="relative">

                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                <input

                  type="text"

                  placeholder="Nome ou CPF..."

                  value={busca}

                  onChange={(e) => { setBusca(e.target.value); setPagina(1); }}

                  className={inputFiltro}

                />

              </div>

            </div>



            <UnidadeLotacaoSelect

              inline

              modoFiltro

              nivelLotacao={nivelLotacao}

              unidadeLotacao={unidadeLotacao}

              onNivelChange={(nivel) => {

                const lotacao = aoMudarNivelLotacao(nivel);

                setNivelLotacao(lotacao.nivelLotacao);

                setUnidadeLotacao(lotacao.unidadeLotacao);

                setPagina(1);

              }}

              onUnidadeChange={(unidade) => { setUnidadeLotacao(unidade); setPagina(1); }}

              showIcon={false}

              showSecretariaHint={false}

              labelCategoria="Categoria"

              labelUnidade="Unidade"

              selectClassName={selectFiltro}

              labelClassName={labelFiltro}

            />



            <div className="min-w-0">

              <label className={labelFiltro}>Treinamento</label>

              <select

                value={filtroTreinamento}

                onChange={(e) => {

                  setFiltroTreinamento(e.target.value as StatusTreinamento | '');

                  setPagina(1);

                }}

                className={selectFiltro}

              >

                <option value="">Todos</option>

                {TREINAMENTO_OPCOES.map((opcao) => (

                  <option key={opcao.value} value={opcao.value}>{opcao.label}</option>

                ))}

              </select>

            </div>



            <div className="min-w-0">

              <label className={labelFiltro}>Cadastro/Atualização</label>

              <select

                value={filtroCadastroAtualizacao}

                onChange={(e) => {

                  setFiltroCadastroAtualizacao(e.target.value as StatusCadastroAtualizacao | '');

                  setPagina(1);

                }}

                className={selectFiltro}

              >

                <option value="">Todos</option>

                {CADASTRO_ATUALIZACAO_OPCOES.map((opcao) => (

                  <option key={opcao.value} value={opcao.value}>{opcao.label}</option>

                ))}

              </select>

            </div>



            <div className="flex items-end shrink-0 pb-0.5">

              <label className="flex items-center gap-2 h-11 px-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-50">

                <input

                  type="checkbox"

                  checked={incluirInativos}

                  onChange={(e) => {

                    setIncluirInativos(e.target.checked);

                    setPagina(1);

                  }}

                  className="rounded border-slate-300"

                />

                Incluir inativos

              </label>

            </div>



            <div className="flex items-center gap-2 shrink-0 justify-end sm:col-span-2 lg:col-span-1">

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

                  <strong className="text-slate-700">{total}</strong>

                  {total === 1 ? ' profissional encontrado' : ' profissionais encontrados'}

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

        <div ref={listaRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm scroll-mt-24">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1320px] text-left border-collapse">

              <thead>

                <tr className="bg-slate-50/80 border-b border-slate-200">

                  <th className="px-5 xl:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[220px]">Nome</th>

                  <th className="px-5 xl:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[130px]">CPF</th>

                  <th className="px-5 xl:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[90px]">CNES</th>

                  <th className="px-5 xl:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[200px]">Unidade</th>

                  <th className="px-5 xl:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[90px]">Status</th>

                  <th className="px-5 xl:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[130px]">Treinamento</th>

                  <th className="px-5 xl:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[170px]">Cadastro/Atualização</th>

                  <th className="px-5 xl:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap w-32">Ações</th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td colSpan={8} className="px-6 py-16 text-center">

                      <div className="flex flex-col items-center gap-3 text-slate-400">

                        <Loader2 size={28} className="animate-spin text-blue-500" />

                        <span className="font-medium">Carregando profissionais...</span>

                      </div>

                    </td>

                  </tr>

                ) : profissionais.length === 0 ? (

                  <tr>

                    <td colSpan={8} className="px-6 py-16 text-center">

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

                      <td className="px-5 xl:px-6 py-5 align-middle">

                        <span className="font-bold text-slate-800 leading-snug">{p.nomeProfissional}</span>

                      </td>

                      <td className="px-5 xl:px-6 py-5 font-mono text-sm text-slate-600 whitespace-nowrap align-middle">{p.cpf}</td>

                      <td className="px-5 xl:px-6 py-5 font-mono text-sm text-slate-600 whitespace-nowrap align-middle">{p.cnes || '—'}</td>

                      <td className="px-5 xl:px-6 py-5 align-middle">

                        {p.vinculoPrincipal ? (

                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg max-w-full" title={p.vinculoPrincipal}>

                            <Building2 size={13} className="text-teal-600 shrink-0" />

                            <span className="break-words">{p.vinculoPrincipal}</span>

                          </span>

                        ) : (

                          <span className="text-slate-400">—</span>

                        )}

                      </td>

                      <td className="px-5 xl:px-6 py-5 align-middle">

                        <BadgeStatus ativo={p.ativo} />

                      </td>

                      <td className="px-5 xl:px-6 py-5 align-middle">

                        <BadgeTreinamento status={p.treinamento} />

                      </td>

                      <td className="px-5 xl:px-6 py-5 align-middle">

                        <BadgeCadastroAtualizacao status={p.cadastroAtualizacao} />

                      </td>

                      <td className="px-5 xl:px-6 py-5 whitespace-nowrap align-middle">

                        <div className="flex items-center justify-end gap-1 shrink-0">

                          <Link

                            href={`/painel/profissionais/${p.id}`}

                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"

                            title="Visualizar"

                          >

                            <Eye size={18} />

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

          {!loading && total > 0 && (
            <div className="px-5 xl:px-8 py-5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-slate-600 font-medium">
                Mostrando <strong className="text-slate-800">{inicioItem}</strong>–<strong className="text-slate-800">{fimItem}</strong> de{' '}
                <strong className="text-slate-800">{total}</strong>
                <span className="text-slate-400 mx-2">•</span>
                Página <strong className="text-slate-800">{pagina}</strong> de <strong className="text-slate-800">{totalPaginas}</strong>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => irParaPagina(pagina - 1)}
                  disabled={pagina <= 1 || loading}
                  className="h-10 px-4 inline-flex items-center gap-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() => irParaPagina(pagina + 1)}
                  disabled={pagina >= totalPaginas || loading}
                  className="h-10 px-4 inline-flex items-center gap-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  Próxima
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

        </div>

      </main>

    </div>

  );

}


