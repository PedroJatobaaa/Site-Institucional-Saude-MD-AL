"use client";

import React, { useEffect, useState, useRef } from 'react';
import {
  Building2,
  Plus,
  Edit,
  X,
  CheckCircle,
  Upload,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { NIVEIS_LOTACAO } from '@/lib/usuarios/lotacao';
import {
  listarUnidadesAdmin,
  criarUnidade,
  atualizarUnidade,
  toggleUnidadeAtiva,
  importarCnesXml,
  type UnidadeSaudeAdmin,
  type CnesImportResult,
} from '@/lib/admin/api';
import { getToken } from '@/lib/auth/session';

type UnidadeForm = {
  cnes: string;
  nome_cnes: string;
  nome_lotacao: string;
  nivel_lotacao: string;
  tipo_unidade: string;
  cnpj: string;
  logradouro: string;
  bairro: string;
  cep: string;
  ativo: boolean;
};

const formVazio = (): UnidadeForm => ({
  cnes: '',
  nome_cnes: '',
  nome_lotacao: '',
  nivel_lotacao: NIVEIS_LOTACAO[0],
  tipo_unidade: '',
  cnpj: '',
  logradouro: '',
  bairro: '',
  cep: '',
  ativo: true,
});

type ImportacaoHistorico = {
  id: string;
  nomeArquivo: string;
  dataReferencia: string | null;
  unidadesCriadas: number;
  unidadesAtualizadas: number;
  profissionaisCriados: number;
  profissionaisAtualizados: number;
  profissionaisInativados: number;
  usuariosCriados: number;
  usuariosAtualizados: number;
  usuariosBloqueados: number;
  usuariosReativados: number;
  createdAt: string;
  usuarioNome: string;
};

export default function AdminUnidadesPage() {
  const [unidades, setUnidades] = useState<UnidadeSaudeAdmin[]>([]);
  const [historico, setHistorico] = useState<ImportacaoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<UnidadeForm>(formVazio());
  const [mensagem, setMensagem] = useState('');
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState<CnesImportResult | null>(null);
  const [busca, setBusca] = useState('');
  const inputArquivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      const [lista, hist] = await Promise.all([
        listarUnidadesAdmin(),
        fetch('/api/admin/cnes/importacoes', {
          headers: { Authorization: `Bearer ${getToken()}` },
        }).then((r) => (r.ok ? r.json() : [])),
      ]);
      setUnidades(lista);
      setHistorico(Array.isArray(hist) ? hist : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const abrirNovo = () => {
    setEditandoId(null);
    setForm(formVazio());
    setModalAberto(true);
  };

  const abrirEdicao = (u: UnidadeSaudeAdmin) => {
    setEditandoId(u.id);
    setForm({
      cnes: u.cnes || '',
      nome_cnes: u.nomeCnes || '',
      nome_lotacao: u.nomeLotacao,
      nivel_lotacao: u.nivelLotacao,
      tipo_unidade: u.tipoUnidade || '',
      cnpj: u.cnpj || '',
      logradouro: u.logradouro || '',
      bairro: u.bairro || '',
      cep: u.cep || '',
      ativo: u.ativo,
    });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!form.nome_lotacao.trim()) {
      alert('Nome de lotação é obrigatório.');
      return;
    }
    try {
      const body = {
        cnes: form.cnes || null,
        nome_cnes: form.nome_cnes || null,
        nome_lotacao: form.nome_lotacao,
        nivel_lotacao: form.nivel_lotacao,
        tipo_unidade: form.tipo_unidade || null,
        cnpj: form.cnpj || null,
        logradouro: form.logradouro || null,
        bairro: form.bairro || null,
        cep: form.cep || null,
        ativo: form.ativo,
      };
      if (editandoId) {
        await atualizarUnidade(editandoId, body);
        setMensagem('Unidade atualizada!');
      } else {
        await criarUnidade(body);
        setMensagem('Unidade criada!');
      }
      setModalAberto(false);
      carregar();
      setTimeout(() => setMensagem(''), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar.');
    }
  };

  const alternarAtivo = async (u: UnidadeSaudeAdmin) => {
    try {
      await toggleUnidadeAtiva(u.id, !u.ativo);
      carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao alterar status.');
    }
  };

  const processarImport = async (arquivo: File) => {
    setImportando(true);
    setResultadoImport(null);
    try {
      const resultado = await importarCnesXml(arquivo);
      setResultadoImport(resultado);
      setMensagem('Importação CNES concluída!');
      carregar();
      setTimeout(() => setMensagem(''), 5000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Falha na importação.');
    } finally {
      setImportando(false);
      if (inputArquivo.current) inputArquivo.current.value = '';
    }
  };

  const unidadesFiltradas = unidades.filter((u) => {
    if (!busca.trim()) return true;
    const t = busca.toLowerCase();
    return (
      u.nomeLotacao.toLowerCase().includes(t) ||
      (u.nomeCnes && u.nomeCnes.toLowerCase().includes(t)) ||
      (u.cnes && u.cnes.includes(t))
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Building2 className="text-emerald-600" size={28} />
          Unidades
        </h2>
        <p className="text-slate-500 mt-1">Cadastro de unidades de saúde e importação semanal CNES.</p>
      </div>

      {mensagem && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle size={20} /> {mensagem}
        </div>
      )}

      {/* Importação CNES */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Upload size={20} className="text-emerald-600" />
          Importar XML CNES
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Envie o arquivo XML exportado do CNES/e-SUS para atualizar unidades, profissionais e usuários do painel.
        </p>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            importando ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
          }`}
        >
          {importando ? (
            <div className="flex flex-col items-center gap-2 text-emerald-700">
              <Loader2 size={32} className="animate-spin" />
              <p className="font-medium">Processando XML...</p>
            </div>
          ) : (
            <>
              <Upload size={32} className="mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600 mb-3">Arraste o arquivo .xml ou clique para selecionar</p>
              <input
                ref={inputArquivo}
                type="file"
                accept=".xml"
                className="hidden"
                id="cnes-upload"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) processarImport(f);
                }}
              />
              <label
                htmlFor="cnes-upload"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium text-sm cursor-pointer"
              >
                Selecionar arquivo XML
              </label>
            </>
          )}
        </div>

        {resultadoImport && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase">Unidades</p>
              <p className="text-sm mt-1">
                {resultadoImport.unidades.criadas} criadas / {resultadoImport.unidades.atualizadas} atualizadas
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase">Profissionais</p>
              <p className="text-sm mt-1">
                {resultadoImport.profissionais.criados} criados / {resultadoImport.profissionais.atualizados}{' '}
                atualizados
                {resultadoImport.profissionais.inativados > 0 && (
                  <span className="text-amber-700"> / {resultadoImport.profissionais.inativados} inativados</span>
                )}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase">Usuários painel</p>
              <p className="text-sm mt-1">
                {resultadoImport.usuarios.criados} criados / {resultadoImport.usuarios.atualizados} atualizados
                {resultadoImport.usuarios.bloqueados > 0 && (
                  <span className="text-amber-700"> / {resultadoImport.usuarios.bloqueados} bloqueados</span>
                )}
                {resultadoImport.usuarios.reativados > 0 && (
                  <span className="text-emerald-700"> / {resultadoImport.usuarios.reativados} reativados</span>
                )}
              </p>
            </div>
          </div>
        )}

        {resultadoImport && resultadoImport.avisos.length > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-bold text-amber-800 flex items-center gap-1 mb-2">
              <AlertTriangle size={16} /> Avisos ({resultadoImport.avisos.length})
            </p>
            <ul className="text-xs text-amber-900 space-y-1 max-h-32 overflow-y-auto">
              {resultadoImport.avisos.slice(0, 20).map((a, i) => (
                <li key={i}>• {a}</li>
              ))}
              {resultadoImport.avisos.length > 20 && (
                <li>... e mais {resultadoImport.avisos.length - 20} avisos</li>
              )}
            </ul>
          </div>
        )}

        {historico.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Últimas importações</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Arquivo</th>
                    <th className="py-3 px-4">Unidades</th>
                    <th className="py-3 px-4">Profissionais</th>
                    <th className="py-3 px-4">Usuários</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historico.slice(0, 5).map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 text-slate-800 font-medium whitespace-nowrap">
                        {new Date(h.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{h.nomeArquivo}</td>
                      <td className="py-3 px-4 text-slate-800">
                        <span className="font-semibold text-emerald-700">+{h.unidadesCriadas}</span>
                        <span className="text-slate-500"> / </span>
                        <span className="font-semibold text-blue-700">~{h.unidadesAtualizadas}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        <span className="font-semibold text-emerald-700">+{h.profissionaisCriados}</span>
                        <span className="text-slate-500"> / </span>
                        <span className="font-semibold text-blue-700">~{h.profissionaisAtualizados}</span>
                        {(h.profissionaisInativados ?? 0) > 0 && (
                          <>
                            <span className="text-slate-500"> / </span>
                            <span className="font-semibold text-amber-700">−{h.profissionaisInativados}</span>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        <span className="font-semibold text-emerald-700">+{h.usuariosCriados}</span>
                        <span className="text-slate-500"> / </span>
                        <span className="font-semibold text-blue-700">~{h.usuariosAtualizados}</span>
                        {(h.usuariosBloqueados ?? 0) > 0 && (
                          <>
                            <span className="text-slate-500"> / </span>
                            <span className="font-semibold text-amber-700">−{h.usuariosBloqueados}</span>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Lista de unidades */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Unidades cadastradas ({unidades.length})</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-48"
            />
            <button
              onClick={abrirNovo}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
            >
              <Plus size={16} /> Nova
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-xs text-slate-500 uppercase">
                <th className="p-3 font-semibold">Nome lotação</th>
                <th className="p-3 font-semibold">CNES / Nome CNES</th>
                <th className="p-3 font-semibold">Nível</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              ) : (
                unidadesFiltradas.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-medium text-slate-800">{u.nomeLotacao}</td>
                    <td className="p-3 text-slate-600">
                      {u.cnes && <span className="font-mono text-xs block">{u.cnes}</span>}
                      {u.nomeCnes && <span className="text-xs text-slate-400">{u.nomeCnes}</span>}
                      {!u.cnes && !u.nomeCnes && '—'}
                    </td>
                    <td className="p-3 text-slate-600">{u.nivelLotacao}</td>
                    <td className="p-3">
                      <button
                        onClick={() => alternarAtivo(u)}
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          u.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {u.ativo ? 'Ativa' : 'Inativa'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => abrirEdicao(u)}
                        className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg inline-flex items-center gap-1"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setModalAberto(false)}
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{editandoId ? 'Editar Unidade' : 'Nova Unidade'}</h3>
              <button onClick={() => setModalAberto(false)}>
                <X size={22} className="text-slate-400" />
              </button>
            </div>

            {[
              { key: 'nome_lotacao', label: 'Nome no sistema (lotação) *' },
              { key: 'nivel_lotacao', label: 'Nível', select: NIVEIS_LOTACAO },
              { key: 'cnes', label: 'CNES' },
              { key: 'nome_cnes', label: 'Nome CNES (NM_FANTA)' },
              { key: 'tipo_unidade', label: 'Tipo de unidade' },
              { key: 'cnpj', label: 'CNPJ' },
              { key: 'logradouro', label: 'Logradouro' },
              { key: 'bairro', label: 'Bairro' },
              { key: 'cep', label: 'CEP' },
            ].map((campo) =>
              'select' in campo && campo.select ? (
                <div key={campo.key}>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{campo.label}</label>
                  <select
                    value={form.nivel_lotacao}
                    onChange={(e) => setForm({ ...form, nivel_lotacao: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 text-sm"
                  >
                    {campo.select.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div key={campo.key}>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{campo.label}</label>
                  <input
                    value={form[campo.key as keyof UnidadeForm] as string}
                    onChange={(e) => setForm({ ...form, [campo.key]: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 text-sm"
                  />
                </div>
              )
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              />
              Unidade ativa
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 text-sm text-slate-600 rounded-xl">
                Cancelar
              </button>
              <button onClick={salvar} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl font-medium">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
