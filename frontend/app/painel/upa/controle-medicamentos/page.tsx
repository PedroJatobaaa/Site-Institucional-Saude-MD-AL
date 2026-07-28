"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Upload, CheckCircle2, Package, FileText, Trash2, Plus, RefreshCw, Download
} from 'lucide-react';
import { getToken, getUsuario } from '@/lib/auth/session';
import { temSubmoduloUpa } from '@/lib/admin/permissoes';

type ItemEstoque = {
  id?: number;
  codigo: string;
  nome: string;
  unidade?: string | null;
  quantidade?: number | null;
  ativo?: boolean;
  _delete?: boolean;
};

type EstoqueResumo = {
  id: number;
  data_referencia: string;
  arquivo_path: string;
  arquivo_nome: string;
  status: string;
  enviado_por?: string | null;
  createdAt: string;
  total_itens: number;
};

type EstoqueDetalhe = EstoqueResumo & { itens: ItemEstoque[] };

export default function ControleMedicamentosPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [historico, setHistorico] = useState<EstoqueResumo[]>([]);
  const [estoqueAtivo, setEstoqueAtivo] = useState<EstoqueResumo | null>(null);
  const [rascunho, setRascunho] = useState<EstoqueDetalhe | null>(null);
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const userObj = getUsuario();
    if (!userObj) {
      router.push('/login');
      return;
    }
    if (!temSubmoduloUpa(userObj.permissoes, 'upa_controle_medicamentos')) {
      alert('Acesso restrito ao Controle de Medicamentos da UPA.');
      router.push('/painel/upa');
      return;
    }
    setUsuario(userObj);
    carregarHistorico();
  }, []);

  const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  const carregarHistorico = async () => {
    try {
      const res = await fetch('/api/upa/estoques', { headers: authHeaders() });
      if (!res.ok) return;
      const lista: EstoqueResumo[] = await res.json();
      setHistorico(lista);
      setEstoqueAtivo(lista.find((e) => e.status === 'ATIVO') || null);
    } catch {
      /* ignore */
    }
  };

  const uploadPdf = async (file: File) => {
    setErro('');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('arquivo', file);
      const res = await fetch('/api/upa/estoques', {
        method: 'POST',
        headers: authHeaders(),
        body: form,
      });
      const dados = await res.json();
      if (!res.ok) {
        setErro(dados.erro || 'Falha ao importar PDF.');
        return;
      }
      setRascunho(dados);
      setItens(dados.itens || []);
      await carregarHistorico();
    } catch {
      setErro('Erro de conexão ao enviar o PDF.');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const abrirEstoque = async (id: number) => {
    setErro('');
    setLoading(true);
    try {
      const res = await fetch(`/api/upa/estoques/${id}`, { headers: authHeaders() });
      const dados = await res.json();
      if (!res.ok) {
        setErro(dados.erro || 'Falha ao carregar estoque.');
        return;
      }
      setRascunho(dados);
      setItens(dados.itens || []);
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const atualizarItem = (index: number, campo: keyof ItemEstoque, valor: string) => {
    setItens((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (campo === 'quantidade') {
          const n = valor === '' ? null : Number(valor);
          return { ...item, quantidade: Number.isFinite(n as number) ? (n as number) : null };
        }
        return { ...item, [campo]: valor };
      })
    );
  };

  const removerItem = (index: number) => {
    setItens((prev) => {
      const alvo = prev[index];
      if (alvo.id) {
        return prev.map((item, i) => (i === index ? { ...item, _delete: true } : item));
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const adicionarItem = () => {
    setItens((prev) => [
      ...prev,
      { codigo: `MANUAL-${Date.now()}`, nome: '', unidade: '', quantidade: null, ativo: true },
    ]);
  };

  const salvarEConfirmar = async (confirmar: boolean) => {
    if (!rascunho) return;
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch(`/api/upa/estoques/${rascunho.id}`, {
        method: 'PATCH',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmar,
          itens: rascunho.status === 'RASCUNHO' ? itens : undefined,
        }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErro(dados.erro || 'Falha ao salvar.');
        return;
      }
      setRascunho(dados);
      setItens(dados.itens || []);
      await carregarHistorico();
      if (confirmar) {
        alert('Estoque confirmado e ativado para as prescrições.');
      }
    } catch {
      setErro('Erro de conexão ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const itensVisiveis = itens.filter((item) => {
    if (item._delete) return false;
    if (!filtro.trim()) return true;
    const q = filtro.toLowerCase();
    return item.nome.toLowerCase().includes(q) || item.codigo.toLowerCase().includes(q);
  });

  const formatarData = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/painel/upa"
            className="text-slate-400 hover:text-rose-600 bg-white p-2 rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Package className="text-rose-600" size={28} />
              Controle de Medicamentos
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Importe o PDF diário HÓRUS (Posição de Estoque) e confirme a listagem da unidade.
            </p>
          </div>
          <button
            type="button"
            onClick={carregarHistorico}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-rose-600"
            title="Atualizar"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {estoqueAtivo && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-600" size={22} />
              <div>
                <p className="font-bold text-emerald-900">Estoque ativo</p>
                <p className="text-sm text-emerald-700">
                  Referência {formatarData(estoqueAtivo.data_referencia)} · {estoqueAtivo.total_itens} itens
                  {estoqueAtivo.enviado_por ? ` · ${estoqueAtivo.enviado_por}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => abrirEstoque(estoqueAtivo.id)}
              className="text-sm font-bold text-emerald-700 underline"
            >
              Ver listagem
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Upload size={18} className="text-rose-500" /> Novo upload diário
          </h2>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadPdf(file);
            }}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="w-full md:w-auto px-5 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-60 transition-all"
          >
            {loading ? 'Processando PDF...' : 'Selecionar PDF do estoque'}
          </button>
          {erro && <p className="text-sm text-rose-600 font-medium">{erro}</p>}
        </div>

        {rascunho && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-800">
                  Revisão · {rascunho.arquivo_nome}
                </p>
                <p className="text-xs text-slate-500">
                  Status: {rascunho.status} · Ref. {formatarData(rascunho.data_referencia)} ·{' '}
                  {itens.filter((i) => !i._delete).length} itens
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/arquivos/${rascunho.arquivo_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  <Download size={14} /> PDF
                </a>
                {rascunho.status === 'RASCUNHO' && (
                  <>
                    <button
                      type="button"
                      onClick={adicionarItem}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                    >
                      <Plus size={14} /> Item
                    </button>
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => salvarEConfirmar(false)}
                      className="px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Salvar rascunho
                    </button>
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => salvarEConfirmar(true)}
                      className="px-3 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Confirmar estoque
                    </button>
                  </>
                )}
                {rascunho.status === 'ATIVO' && (
                  <span className="text-xs font-bold text-emerald-600 self-center">Já ativo nas prescrições</span>
                )}
              </div>
            </div>

            <div className="p-3 border-b border-slate-50 space-y-2">
              <input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Filtrar por nome ou código BR..."
                className="w-full max-w-md px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-rose-400"
              />
              <div className="hidden sm:grid grid-cols-[9rem_minmax(0,1fr)_4.5rem_4.5rem_2rem] gap-3 px-0 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <span>Código</span>
                <span>Nome</span>
                <span className="text-center">Unid.</span>
                <span className="text-center">Qtde</span>
                <span />
              </div>
            </div>

            <div className="max-h-[520px] overflow-auto">
              <div className="divide-y divide-slate-100">
                {itensVisiveis.length === 0 && (
                  <p className="p-4 text-sm text-slate-500">Nenhum item correspondente ao filtro.</p>
                )}
                {itensVisiveis.map((item) => {
                  const indexReal = itens.indexOf(item);
                  const editavel = rascunho.status === 'RASCUNHO';
                  return (
                    <div
                      key={`${item.id ?? item.codigo}-${indexReal}`}
                      className="grid grid-cols-1 sm:grid-cols-[9rem_minmax(0,1fr)_4.5rem_4.5rem_2rem] gap-2 sm:gap-3 p-3 hover:bg-slate-50/80 items-start"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-slate-400 sm:hidden mb-0.5">Código</p>
                        {editavel ? (
                          <input
                            value={item.codigo}
                            onChange={(e) => atualizarItem(indexReal, 'codigo', e.target.value)}
                            className="w-full min-w-0 px-2 py-1.5 border border-slate-200 rounded-lg outline-none font-mono text-xs focus:border-rose-300"
                          />
                        ) : (
                          <p className="font-mono text-xs text-slate-500 break-all">{item.codigo}</p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-slate-400 sm:hidden mb-0.5">Nome</p>
                        {editavel ? (
                          <textarea
                            rows={2}
                            value={item.nome}
                            onChange={(e) => atualizarItem(indexReal, 'nome', e.target.value)}
                            className="w-full min-w-0 px-2 py-1.5 border border-slate-200 rounded-lg outline-none text-sm font-medium text-slate-800 resize-y focus:border-rose-300"
                          />
                        ) : (
                          <p className="text-sm font-medium text-slate-800 break-words leading-snug" title={item.nome}>
                            {item.nome}
                          </p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-slate-400 sm:hidden mb-0.5">Unidade</p>
                        {editavel ? (
                          <input
                            value={item.unidade || ''}
                            onChange={(e) => atualizarItem(indexReal, 'unidade', e.target.value)}
                            className="w-full min-w-0 px-2 py-1.5 border border-slate-200 rounded-lg outline-none text-center text-xs focus:border-rose-300"
                          />
                        ) : (
                          <p className="text-xs text-slate-600 text-left sm:text-center">{item.unidade || '—'}</p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-slate-400 sm:hidden mb-0.5">Qtde</p>
                        {editavel ? (
                          <input
                            type="number"
                            value={item.quantidade ?? ''}
                            onChange={(e) => atualizarItem(indexReal, 'quantidade', e.target.value)}
                            className="w-full min-w-0 px-2 py-1.5 border border-slate-200 rounded-lg outline-none text-center text-sm focus:border-rose-300"
                          />
                        ) : (
                          <p className="text-sm text-slate-700 text-left sm:text-center tabular-nums">
                            {item.quantidade != null ? item.quantidade.toLocaleString('pt-BR') : '—'}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end sm:justify-center pt-0.5">
                        {editavel && (
                          <button
                            type="button"
                            onClick={() => removerItem(indexReal)}
                            className="p-1.5 text-slate-300 hover:text-rose-500"
                            title="Remover item"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-slate-400" /> Histórico de uploads
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {historico.length === 0 && (
              <p className="p-4 text-sm text-slate-500">Nenhum PDF importado ainda.</p>
            )}
            {historico.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => abrirEstoque(e.id)}
                className="w-full text-left p-4 hover:bg-slate-50 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <p className="font-bold text-slate-800">{e.arquivo_nome}</p>
                  <p className="text-xs text-slate-500">
                    Ref. {formatarData(e.data_referencia)} · {e.total_itens} itens ·{' '}
                    {new Date(e.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${
                    e.status === 'ATIVO'
                      ? 'bg-emerald-100 text-emerald-700'
                      : e.status === 'RASCUNHO'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {e.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
