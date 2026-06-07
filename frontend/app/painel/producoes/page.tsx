"use client";



import React, { useCallback, useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import {

  ArrowLeft,

  Paperclip,

  Send,

  Download,

  CalendarClock,

  AlertTriangle,

  Loader2,

  CheckCircle2,

  Clock,

  Layers,

} from 'lucide-react';

import {

  MESES,

  calculateDeadline,

  formatarDataBR,

  formatarDataHoraBR,

} from '@/lib/producao/calculateDeadline';

import {

  obterPerfilProducao,

  temAcessoProducoes,

  isRoleProcessamento,

} from '@/lib/producao/roles';

import {

  STATUS_PRODUCAO,

  labelSituacaoPrazo,

  labelTipoEvento,

  type StatusProducao,

} from '@/lib/producao/statusConfig';

import { EXTENSOES_PRODUCAO, lerErroApi, validarArquivoProducao } from '@/lib/producao/arquivo';

import type { FilaProducao } from '@/lib/producao/filasProducao';

import { getToken, getUsuario } from '@/lib/auth/session';



type Unidade = { id: string; nome: string; codigo?: string | null };

type Evento = {

  id: string;

  tipo: string;

  status?: StatusProducao | null;

  descricao: string;

  usuarioNome: string;

  arquivoNome?: string | null;

  arquivoUrl?: string | null;

  createdAt: string;

};

type Mensagem = {

  id: string;

  texto?: string | null;

  usuarioNome: string;

  usuarioId: string;

  arquivoNome?: string | null;

  arquivoUrl?: string | null;

  createdAt: string;

};

type CompetenciaPayload = {

  entrega: {

    id: string;

    filaId: string;

    status: StatusProducao;

    competenciaMes: number;

    competenciaAno: number;

    prazoFinal: string;

    eventos: Evento[];

    mensagens: Mensagem[];

    unidade: Unidade;

  };

  fila: FilaProducao;

  prazoFinal: string;

  prazoExpirado: boolean;

  situacaoPrazo: string;

  podeEnviar: boolean;

  perfil: 'UBS' | 'PROCESSAMENTO';

};



export default function ModuloProducoes() {

  const router = useRouter();

  const chatRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);



  const [usuario, setUsuario] = useState<any>(null);

  const [filas, setFilas] = useState<FilaProducao[]>([]);

  const [filaId, setFilaId] = useState('');

  const [mes, setMes] = useState(() => {

    const d = new Date();

    const m = d.getMonth();

    return m === 0 ? 12 : m;

  });

  const [ano, setAno] = useState(() => {

    const d = new Date();

    return d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();

  });



  const [dados, setDados] = useState<CompetenciaPayload | null>(null);

  const [loading, setLoading] = useState(true);

  const [enviando, setEnviando] = useState(false);

  const [texto, setTexto] = useState('');

  const [arquivo, setArquivo] = useState<File | null>(null);

  const [novoStatus, setNovoStatus] = useState<StatusProducao>('RECEBIDO');

  const [motivoDevolucao, setMotivoDevolucao] = useState('');



  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const prazoPreview = calculateDeadline(mes, ano);

  const filaSelecionada = filas.find((f) => f.id === filaId) ?? dados?.fila ?? null;



  const carregarCompetencia = useCallback(async () => {

    if (!filaId) return;

    const token = getToken();

    setLoading(true);

    try {

      const res = await fetch(

        `/api/producoes/competencia?filaId=${filaId}&mes=${mes}&ano=${ano}`,

        { headers: { Authorization: `Bearer ${token}` } }

      );

      if (!res.ok) {

        alert(await lerErroApi(res));

        return;

      }

      const json = await res.json();

      setDados(json);

      setNovoStatus(json.entrega.status);

    } catch {

      alert('Erro de conexão. Verifique se o backend está rodando.');

    } finally {

      setLoading(false);

    }

  }, [filaId, mes, ano]);



  useEffect(() => {

    const userObj = getUsuario();

    if (!userObj) {

      router.push('/login');

      return;

    }

    if (!temAcessoProducoes(userObj.permissoes)) {

      alert('Você não tem permissão para o Módulo de Produções.');

      router.push('/painel');

      return;

    }

    setUsuario(userObj);



    const token = getToken();

    fetch('/api/producoes/filas', {

      headers: { Authorization: `Bearer ${token}` },

    })

      .then(async (r) => {

        if (!r.ok) throw new Error(await lerErroApi(r));

        return r.json();

      })

      .then((lista) => {

        if (Array.isArray(lista)) {

          setFilas(lista);

          if (lista.length === 1) {

            setFilaId(lista[0].id);

          }

        }

      })

      .catch((err) => alert(err.message || 'Falha ao carregar filas de envio.'));

  }, [router]);



  useEffect(() => {

    if (filaId) carregarCompetencia();

    else setLoading(false);

  }, [filaId, mes, ano, carregarCompetencia]);



  useEffect(() => {

    if (chatRef.current) {

      chatRef.current.scrollTop = chatRef.current.scrollHeight;

    }

  }, [dados?.entrega.mensagens]);



  const perfil = usuario ? obterPerfilProducao(usuario.permissoes) : null;

  const processamento = usuario ? isRoleProcessamento(usuario.permissoes) : false;

  const prazoExpirado = dados?.prazoExpirado ?? false;

  const podeEnviar = dados?.podeEnviar ?? false;

  const situacao = dados ? labelSituacaoPrazo(dados.situacaoPrazo) : labelSituacaoPrazo('EM_ABERTO');



  const handleEnviarMensagem = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!dados?.entrega.id) return;

    if (!podeEnviar && !processamento) return;

    if (!texto.trim() && !arquivo) return;



    if (arquivo) {

      const erroArquivo = validarArquivoProducao(arquivo);

      if (erroArquivo) {

        alert(erroArquivo);

        return;

      }

    }



    setEnviando(true);

    const token = getToken();

    const formData = new FormData();

    if (texto.trim()) formData.append('texto', texto.trim());

    if (arquivo) formData.append('arquivo', arquivo);



    try {

      const res = await fetch(`/api/producoes/entregas/${dados.entrega.id}/mensagens`, {

        method: 'POST',

        headers: { Authorization: `Bearer ${token}` },

        body: formData,

      });

      if (!res.ok) {

        alert(await lerErroApi(res));

        return;

      }

      setTexto('');

      setArquivo(null);

      if (fileInputRef.current) fileInputRef.current.value = '';

      await carregarCompetencia();

    } catch {

      alert('Erro de conexão. Verifique se o backend está rodando.');

    } finally {

      setEnviando(false);

    }

  };



  const exigeMotivoDevolucao =

    novoStatus === 'DEVOLVIDO_PARA_AJUSTE' &&

    dados?.entrega.status !== 'DEVOLVIDO_PARA_AJUSTE';

  const handleAlterarStatus = async () => {

    if (!dados?.entrega.id || !processamento) return;

    if (exigeMotivoDevolucao && !motivoDevolucao.trim()) {

      alert('Informe o motivo da devolução para ajuste.');

      return;

    }

    const token = getToken();

    try {

      const res = await fetch(`/api/producoes/entregas/${dados.entrega.id}/status`, {

        method: 'PATCH',

        headers: {

          Authorization: `Bearer ${token}`,

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          status: novoStatus,

          ...(exigeMotivoDevolucao ? { motivo: motivoDevolucao.trim() } : {}),

        }),

      });

      if (!res.ok) {

        alert(await lerErroApi(res));

        return;

      }

      setMotivoDevolucao('');

      await carregarCompetencia();

    } catch {

      alert('Erro de conexão. Verifique se o backend está rodando.');

    }

  };



  if (!usuario) return null;



  return (

    <div className="min-h-screen bg-slate-50 font-sans">

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <Link

              href="/painel"

              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"

            >

              <ArrowLeft size={20} />

            </Link>

            <div>

              <h1 className="text-xl font-extrabold text-slate-900">Módulo de Produções</h1>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">

                Envio mensal por fila (Unidade + Sistema)

              </p>

            </div>

          </div>

          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">

            {perfil === 'PROCESSAMENTO' ? 'Processamento' : 'Envio'}

          </span>

        </div>

      </header>



      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">

            <div className="lg:col-span-4">

              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">

                <Layers size={14} /> Selecione a Fila de Envio

              </label>

              {filas.length === 0 ? (

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">

                  Nenhuma fila liberada para sua conta. Solicite ao administrador as permissões de

                  envio de produção.

                </div>

              ) : (

                <select

                  value={filaId}

                  onChange={(e) => setFilaId(e.target.value)}

                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"

                >

                  <option value="">Escolha Unidade / Sistema...</option>

                  {filas.map((fila) => (

                    <option key={fila.id} value={fila.id}>

                      {fila.label}

                    </option>

                  ))}

                </select>

              )}

              {filaSelecionada && (

                <p className="text-xs text-slate-500 mt-2">

                  Enviando para <strong>{filaSelecionada.unidade}</strong> via{' '}

                  <strong>{filaSelecionada.sistema}</strong>

                </p>

              )}

            </div>



            <div className="lg:col-span-3 grid grid-cols-2 gap-3">

              <div>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">

                  <CalendarClock size={14} /> Competência

                </label>

                <select

                  value={mes}

                  onChange={(e) => setMes(Number(e.target.value))}

                  disabled={!filaId}

                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60"

                >

                  {MESES.map((m) => (

                    <option key={m.valor} value={m.valor}>

                      {m.label}

                    </option>

                  ))}

                </select>

              </div>

              <div>

                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block opacity-0">

                  Ano

                </label>

                <select

                  value={ano}

                  onChange={(e) => setAno(Number(e.target.value))}

                  disabled={!filaId}

                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60"

                >

                  {anosDisponiveis.map((a) => (

                    <option key={a} value={a}>

                      {a}

                    </option>

                  ))}

                </select>

              </div>

            </div>



            <div className="lg:col-span-3 bg-slate-50 rounded-2xl border border-slate-200 p-4">

              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Prazo final</p>

              <p className="text-lg font-extrabold text-slate-900">

                {formatarDataBR(prazoPreview)}

              </p>

              <p className="text-xs text-slate-500 mt-1">3º dia útil do mês seguinte</p>

            </div>



            <div className="lg:col-span-2 flex flex-col gap-2">

              <span

                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border ${situacao.classe}`}

              >

                {dados?.situacaoPrazo === 'NO_PRAZO' ? (

                  <CheckCircle2 size={14} />

                ) : dados?.situacaoPrazo === 'ATRASADO' ? (

                  <AlertTriangle size={14} />

                ) : (

                  <Clock size={14} />

                )}

                {situacao.texto}

              </span>

              {dados?.entrega.status && (

                <span

                  className={`inline-flex justify-center px-3 py-2 rounded-xl text-xs font-bold border ${

                    STATUS_PRODUCAO[dados.entrega.status].badge

                  }`}

                >

                  {STATUS_PRODUCAO[dados.entrega.status].label}

                </span>

              )}

            </div>

          </div>



          {prazoExpirado && !processamento && (

            <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800">

              <AlertTriangle className="shrink-0 mt-0.5" size={20} />

              <div>

                <p className="font-bold">Prazo expirado</p>

                <p className="text-sm mt-1">

                  O prazo para envio desta competência encerrou em{' '}

                  {formatarDataBR(dados?.prazoFinal || prazoPreview)}. A situação está{' '}

                  <strong>Atrasada</strong> e novos envios estão bloqueados para esta fila.

                </p>

              </div>

            </div>

          )}



          {processamento && dados && (

            <div className="mt-4 flex flex-wrap items-end gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">

              <div className="flex-1 min-w-[200px]">

                <label className="text-xs font-bold text-blue-800 uppercase mb-1 block">

                  Alterar status da entrega

                </label>

                <select

                  value={novoStatus}

                  onChange={(e) => {

                    const status = e.target.value as StatusProducao;

                    setNovoStatus(status);

                    if (status !== 'DEVOLVIDO_PARA_AJUSTE') {

                      setMotivoDevolucao('');

                    }

                  }}

                  className="w-full rounded-xl border border-blue-200 px-4 py-2.5 font-semibold bg-white"

                >

                  {(Object.keys(STATUS_PRODUCAO) as StatusProducao[]).map((s) => (

                    <option key={s} value={s}>

                      {STATUS_PRODUCAO[s].label}

                    </option>

                  ))}

                </select>

                {exigeMotivoDevolucao && (

                  <div className="mt-3">

                    <label className="text-xs font-bold text-amber-800 uppercase mb-1 block">

                      Motivo da devolução <span className="text-red-600">*</span>

                    </label>

                    <textarea

                      value={motivoDevolucao}

                      onChange={(e) => setMotivoDevolucao(e.target.value)}

                      placeholder="Descreva o que precisa ser corrigido na produção enviada..."

                      rows={3}

                      className="w-full rounded-xl border border-amber-200 px-4 py-2.5 text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-amber-400"

                    />

                    <p className="text-[10px] text-amber-700 mt-1">

                      Obrigatório ao devolver para ajuste. A mensagem será enviada ao responsável pelo envio.

                    </p>

                  </div>

                )}

              </div>

              <button

                type="button"

                onClick={handleAlterarStatus}

                disabled={exigeMotivoDevolucao && !motivoDevolucao.trim()}

                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"

              >

                Atualizar status

              </button>

            </div>

          )}

        </section>



        {!filaId && !loading ? (

          <div className="flex justify-center py-20 text-slate-500 text-sm font-medium">

            {filas.length === 0

              ? 'Aguardando liberação de filas pelo administrador.'

              : 'Selecione a fila de envio (Unidade / Sistema) acima.'}

          </div>

        ) : loading ? (

          <div className="flex justify-center py-20">

            <Loader2 className="animate-spin text-blue-600" size={40} />

          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[520px]">

            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">

              <h2 className="text-lg font-extrabold text-slate-900 mb-6">Linha do tempo</h2>

              <div className="flex-1 overflow-y-auto pr-2">

                {!dados?.entrega.eventos.length ? (

                  <p className="text-slate-500 text-sm">Nenhum evento registrado para esta competência.</p>

                ) : (

                  <ol className="relative border-l-2 border-slate-200 ml-3 space-y-8">

                    {dados.entrega.eventos.map((ev) => {

                      const statusCor = ev.status

                        ? STATUS_PRODUCAO[ev.status]

                        : STATUS_PRODUCAO.RECEBIDO;

                      return (

                        <li key={ev.id} className="ml-6 relative">

                          <span

                            className={`absolute -left-[1.65rem] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${statusCor.dot}`}

                          />

                          <div className={`rounded-2xl border p-4 ${statusCor.timeline}`}>

                            <p className="text-xs font-bold uppercase text-slate-500">

                              {labelTipoEvento(ev.tipo)}

                            </p>

                            <p className="font-bold text-slate-900 mt-1">{ev.descricao}</p>

                            <p className="text-xs text-slate-600 mt-2">

                              {formatarDataHoraBR(ev.createdAt)} · {ev.usuarioNome}

                            </p>

                            {ev.arquivoUrl && (

                              <a

                                href={ev.arquivoUrl}

                                target="_blank"

                                rel="noopener noreferrer"

                                className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-blue-600 hover:underline"

                              >

                                <Download size={16} />

                                {ev.arquivoNome || 'Baixar arquivo'}

                              </a>

                            )}

                          </div>

                        </li>

                      );

                    })}

                  </ol>

                )}

              </div>

            </section>



            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">

              <h2 className="text-lg font-extrabold text-slate-900 p-6 pb-2">Interações</h2>

              <div

                ref={chatRef}

                className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-[320px] max-h-[480px]"

              >

                {!dados?.entrega.mensagens.length ? (

                  <p className="text-slate-500 text-sm text-center py-8">

                    Inicie a conversa ou envie o arquivo de produção (

                    {EXTENSOES_PRODUCAO.join(', ')}).

                  </p>

                ) : (

                  dados.entrega.mensagens.map((msg) => {

                    const minha = usuario.id && msg.usuarioId === usuario.id;

                    return (

                      <div

                        key={msg.id}

                        className={`flex ${minha ? 'justify-end' : 'justify-start'}`}

                      >

                        <div

                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${

                            minha ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'

                          }`}

                        >

                          <p className="text-[10px] font-bold uppercase opacity-80 mb-1">

                            {msg.usuarioNome}

                          </p>

                          {msg.texto && <p className="text-sm whitespace-pre-wrap">{msg.texto}</p>}

                          {msg.arquivoUrl && (

                            <a

                              href={msg.arquivoUrl}

                              target="_blank"

                              rel="noopener noreferrer"

                              className={`inline-flex items-center gap-1 mt-2 text-sm font-bold ${

                                minha ? 'text-blue-100 hover:text-white' : 'text-blue-600'

                              }`}

                            >

                              <Download size={14} />

                              {msg.arquivoNome}

                            </a>

                          )}

                          <p

                            className={`text-[10px] mt-2 ${minha ? 'text-blue-200' : 'text-slate-500'}`}

                          >

                            {formatarDataHoraBR(msg.createdAt)}

                          </p>

                        </div>

                      </div>

                    );

                  })

                )}

              </div>



              <form

                onSubmit={handleEnviarMensagem}

                className="border-t border-slate-200 p-4 bg-slate-50"

              >

                {arquivo && (

                  <p className="text-xs font-semibold text-slate-600 mb-2 truncate">

                    Anexo: {arquivo.name}

                  </p>

                )}

                <div className="flex gap-2 items-end">

                  <input

                    ref={fileInputRef}

                    type="file"

                    accept=".xlsx,.xls,.csv"

                    className="hidden"

                    disabled={!podeEnviar && !processamento}

                    onChange={(e) => {

                      const file = e.target.files?.[0] || null;

                      if (file) {

                        const erro = validarArquivoProducao(file);

                        if (erro) {

                          alert(erro);

                          e.target.value = '';

                          setArquivo(null);

                          return;

                        }

                      }

                      setArquivo(file);

                    }}

                  />

                  <button

                    type="button"

                    disabled={!podeEnviar && !processamento}

                    onClick={() => fileInputRef.current?.click()}

                    className="p-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"

                    title="Anexar .xlsx ou .csv"

                  >

                    <Paperclip size={20} />

                  </button>

                  <textarea

                    value={texto}

                    onChange={(e) => setTexto(e.target.value)}

                    disabled={!podeEnviar && !processamento}

                    placeholder={

                      podeEnviar || processamento

                        ? 'Digite uma mensagem...'

                        : 'Envio bloqueado — prazo expirado'

                    }

                    rows={2}

                    className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-500"

                  />

                  <button

                    type="submit"

                    disabled={enviando || (!podeEnviar && !processamento)}

                    className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"

                  >

                    {enviando ? (

                      <Loader2 size={20} className="animate-spin" />

                    ) : (

                      <Send size={20} />

                    )}

                  </button>

                </div>

              </form>

            </section>

          </div>

        )}

      </main>

    </div>

  );

}

