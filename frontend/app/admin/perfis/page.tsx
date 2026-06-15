"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Edit, Trash2, X, CheckCircle, Users, Search } from 'lucide-react';
import { PERMISSOES_DISPONIVEIS } from '@/lib/admin/permissoes';
import { FILAS_PRODUCAO } from '@/lib/producao/filasProducao';
import {
  GRUPOS_CBO_PERFIL,
  aplicarGrupoCbo,
  detectarGruposAtivos,
  grupoEstaAtivo,
} from '@/lib/admin/gruposCboPerfil';
import {
  listarPerfis,
  obterPerfil,
  criarPerfil,
  atualizarPerfil,
  excluirPerfil,
  buscarCbosAdmin,
  previewVinculoPerfil,
  type PerfilAdmin,
  type CboOcupacao,
} from '@/lib/admin/api';

type PerfilForm = {
  nome: string;
  descricao: string;
  permissoes: string[];
  filasProducao: string[];
  ativo: boolean;
  cbosVinculo: string[];
  prefixosCbo: string[];
};

const formVazio = (): PerfilForm => ({
  nome: '',
  descricao: '',
  permissoes: [],
  filasProducao: [],
  ativo: true,
  cbosVinculo: [],
  prefixosCbo: [],
});

export default function AdminPerfisPage() {
  const [perfis, setPerfis] = useState<PerfilAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<PerfilForm>(formVazio());
  const [usuariosVinculados, setUsuariosVinculados] = useState<{ id: string; nome: string; email: string }[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [buscaCbo, setBuscaCbo] = useState('');
  const [sugestoesCbo, setSugestoesCbo] = useState<CboOcupacao[]>([]);
  const [previewElegiveis, setPreviewElegiveis] = useState<number | null>(null);

  const gruposAtivos = detectarGruposAtivos(form.prefixosCbo, form.cbosVinculo);

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (!modalAberto) return;
    const timer = setTimeout(async () => {
      if (form.cbosVinculo.length === 0 && form.prefixosCbo.length === 0) {
        setPreviewElegiveis(0);
        return;
      }
      try {
        const preview = await previewVinculoPerfil({
          cbos_vinculo: form.cbosVinculo,
          prefixos_cbo: form.prefixosCbo,
        });
        setPreviewElegiveis(preview.totalElegiveis);
      } catch {
        setPreviewElegiveis(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.cbosVinculo, form.prefixosCbo, modalAberto]);

  useEffect(() => {
    if (!buscaCbo.trim()) {
      setSugestoesCbo([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSugestoesCbo(await buscarCbosAdmin(buscaCbo, 15));
      } catch {
        setSugestoesCbo([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaCbo]);

  const carregar = async () => {
    try {
      setPerfis(await listarPerfis());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const abrirNovo = () => {
    setEditandoId(null);
    setForm(formVazio());
    setUsuariosVinculados([]);
    setBuscaCbo('');
    setSugestoesCbo([]);
    setPreviewElegiveis(null);
    setModalAberto(true);
  };

  const abrirEdicao = async (id: string) => {
    try {
      const perfil = await obterPerfil(id);
      setEditandoId(id);
      setForm({
        nome: perfil.nome,
        descricao: perfil.descricao || '',
        permissoes: perfil.permissoes,
        filasProducao: perfil.filasProducao,
        ativo: perfil.ativo,
        cbosVinculo: perfil.cbosVinculo ?? [],
        prefixosCbo: perfil.prefixosCbo ?? [],
      });
      setUsuariosVinculados(
        perfil.usuarios.map((u) => ({ id: u.id, nome: u.nome, email: u.email }))
      );
      setBuscaCbo('');
      setSugestoesCbo([]);
      setPreviewElegiveis(null);
      setModalAberto(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao carregar perfil.');
    }
  };

  const toggleGrupoCbo = (grupoId: string) => {
    const grupo = GRUPOS_CBO_PERFIL.find((g) => g.id === grupoId);
    if (!grupo) return;
    const ativo = grupoEstaAtivo(grupo, form.prefixosCbo, form.cbosVinculo);
    const atualizado = aplicarGrupoCbo(grupo, !ativo, form.prefixosCbo, form.cbosVinculo);
    setForm({ ...form, ...atualizado });
  };

  const adicionarCbo = (code: string) => {
    const normalizado = code.trim().toUpperCase();
    if (!normalizado || form.cbosVinculo.includes(normalizado)) return;
    setForm({ ...form, cbosVinculo: [...form.cbosVinculo, normalizado] });
    setBuscaCbo('');
    setSugestoesCbo([]);
  };

  const removerCbo = (code: string) => {
    setForm({ ...form, cbosVinculo: form.cbosVinculo.filter((c) => c !== code) });
  };

  const removerPrefixo = (prefixo: string) => {
    setForm({ ...form, prefixosCbo: form.prefixosCbo.filter((p) => p !== prefixo) });
  };

  const togglePermissao = (id: string) => {
    const tem = form.permissoes.includes(id);
    const novas = tem ? form.permissoes.filter((p) => p !== id) : [...form.permissoes, id];
    const atualizado = { ...form, permissoes: novas };
    if (id === 'ROLE_UBS' && tem) atualizado.filasProducao = [];
    setForm(atualizado);
  };

  const toggleFila = (filaId: string) => {
    const tem = form.filasProducao.includes(filaId);
    setForm({
      ...form,
      filasProducao: tem ? form.filasProducao.filter((f) => f !== filaId) : [...form.filasProducao, filaId],
    });
  };

  const salvar = async () => {
    if (!form.nome.trim()) {
      alert('Informe o nome do perfil.');
      return;
    }
    if (form.permissoes.includes('ROLE_UBS') && form.filasProducao.length === 0) {
      alert('Selecione ao menos uma fila de produção para perfis com envio UBS.');
      return;
    }

    setSalvando(true);
    try {
      const body = {
        nome: form.nome,
        descricao: form.descricao || null,
        permissoes: form.permissoes,
        filas_producao: form.permissoes.includes('ROLE_UBS') ? form.filasProducao : [],
        ativo: form.ativo,
        cbos_vinculo: form.cbosVinculo,
        prefixos_cbo: form.prefixosCbo,
      };

      let resultado: PerfilAdmin;
      if (editandoId) {
        resultado = await atualizarPerfil(editandoId, body);
        const vinculados = resultado.usuariosVinculados ?? 0;
        setMensagem(
          vinculados > 0
            ? `Perfil atualizado! ${vinculados} usuário(s) vinculado(s) automaticamente.`
            : 'Perfil atualizado com sucesso!'
        );
      } else {
        resultado = await criarPerfil(body);
        const vinculados = resultado.usuariosVinculados ?? 0;
        setMensagem(
          vinculados > 0
            ? `Perfil criado! ${vinculados} usuário(s) vinculado(s) automaticamente.`
            : 'Perfil criado com sucesso!'
        );
      }
      setModalAberto(false);
      carregar();
      setTimeout(() => setMensagem(''), 5000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar perfil.');
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (id: string, nome: string) => {
    if (!window.confirm(`Excluir o perfil "${nome}"?`)) return;
    try {
      await excluirPerfil(id);
      setMensagem('Perfil excluído.');
      carregar();
      setTimeout(() => setMensagem(''), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir perfil.');
    }
  };

  const totalRegrasCbo = form.prefixosCbo.length + form.cbosVinculo.length;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-violet-600" size={28} />
            Perfis
          </h2>
          <p className="text-slate-500 mt-1">Tipos de perfil com permissões reutilizáveis.</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={18} /> Novo Perfil
        </button>
      </div>

      {mensagem && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle size={20} /> {mensagem}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Nome</th>
                <th className="p-4 font-semibold">CBOs</th>
                <th className="p-4 font-semibold">Permissões</th>
                <th className="p-4 font-semibold">Usuários</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              ) : perfis.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Nenhum perfil cadastrado.
                  </td>
                </tr>
              ) : (
                perfis.map((p) => {
                  const qtdCbo = (p.prefixosCbo?.length ?? 0) + (p.cbosVinculo?.length ?? 0);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{p.nome}</div>
                        {p.descricao && <div className="text-sm text-slate-500">{p.descricao}</div>}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {qtdCbo > 0 ? (
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            {qtdCbo} regra{qtdCbo !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Manual</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="bg-violet-50 text-violet-700 px-2 py-1 rounded text-sm font-medium">
                          {p.permissoes.length} módulos
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{p._count?.usuarios ?? 0}</td>
                      <td className="p-4">
                        {p.ativo ? (
                          <span className="text-emerald-600 text-sm font-medium">Ativo</span>
                        ) : (
                          <span className="text-slate-400 text-sm">Inativo</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => abrirEdicao(p.id)}
                          className="text-violet-600 hover:bg-violet-50 p-2 rounded-lg inline-flex items-center gap-1 text-sm font-medium"
                        >
                          <Edit size={16} /> Editar
                        </button>
                        <button
                          onClick={() => remover(p.id, p.nome)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg inline-flex items-center gap-1 text-sm font-medium"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
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
          <div className="relative z-10 w-full max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col bg-white text-slate-900 rounded-2xl shadow-2xl">
            <div className="shrink-0 border-b px-5 py-4 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">{editandoId ? 'Editar Perfil' : 'Novo Perfil'}</h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nome *</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                    className="rounded text-violet-600"
                  />
                  Perfil ativo
                </label>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-800">Vinculação automática por cargo (CBO)</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Só vincula usuários que ainda não têm perfil. O cargo é identificado pelo CBO do cadastro de profissional.
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase mb-2">Grupos prontos</p>
                  <div className="flex flex-wrap gap-2">
                    {GRUPOS_CBO_PERFIL.map((grupo) => {
                      const ativo = gruposAtivos.includes(grupo.id);
                      return (
                        <button
                          key={grupo.id}
                          type="button"
                          onClick={() => toggleGrupoCbo(grupo.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                            ativo
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {grupo.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(form.prefixosCbo.length > 0 || form.cbosVinculo.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Regras ativas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.prefixosCbo.map((prefixo) => (
                        <span
                          key={`p-${prefixo}`}
                          className="inline-flex items-center gap-1 bg-white border border-blue-200 text-blue-800 px-2 py-1 rounded-lg text-xs font-mono"
                        >
                          {prefixo}*
                          <button type="button" onClick={() => removerPrefixo(prefixo)} className="text-blue-400 hover:text-red-500">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      {form.cbosVinculo.map((cbo) => (
                        <span
                          key={`c-${cbo}`}
                          className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-lg text-xs font-mono"
                        >
                          {cbo}
                          <button type="button" onClick={() => removerCbo(cbo)} className="text-slate-400 hover:text-red-500">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Adicionar CBO individual</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={buscaCbo}
                      onChange={(e) => setBuscaCbo(e.target.value)}
                      placeholder="Buscar por código ou nome da ocupação..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-white text-sm"
                    />
                  </div>
                  {sugestoesCbo.length > 0 && (
                    <ul className="mt-1 border border-slate-200 rounded-xl bg-white max-h-36 overflow-y-auto divide-y divide-slate-100">
                      {sugestoesCbo.map((item) => (
                        <li key={item.code}>
                          <button
                            type="button"
                            onClick={() => adicionarCbo(item.code)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-xs"
                          >
                            <span className="font-mono font-bold text-blue-700">{item.code}</span>
                            <span className="text-slate-600 ml-2">{item.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {previewElegiveis !== null && totalRegrasCbo > 0 && (
                  <p className="text-xs text-blue-700 font-medium bg-blue-100/60 rounded-lg px-3 py-2">
                    {previewElegiveis} usuário{previewElegiveis !== 1 ? 's' : ''} sem perfil serão elegíveis para vinculação ao salvar.
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-800 mb-2">Permissões do perfil</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {PERMISSOES_DISPONIVEIS.map((perm) => {
                    if (perm.id === 'ROLE_UBS') {
                      const ativo = form.permissoes.includes('ROLE_UBS');
                      return (
                        <div key={perm.id} className="sm:col-span-2 space-y-2">
                          <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ativo}
                              onChange={() => togglePermissao(perm.id)}
                              className="rounded text-violet-600"
                            />
                            <span className={`text-xs font-medium ${ativo ? 'text-violet-900' : 'text-slate-800'}`}>
                              {perm.nome}
                            </span>
                          </label>
                          {ativo && (
                            <div className="ml-4 grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-32 overflow-y-auto border border-emerald-200 rounded-lg p-2 bg-emerald-50/50">
                              {FILAS_PRODUCAO.map((fila) => {
                                const filaMarcada = form.filasProducao.includes(fila.id);
                                return (
                                  <label key={fila.id} className="flex items-start gap-2 p-1.5 text-xs cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={filaMarcada}
                                      onChange={() => toggleFila(fila.id)}
                                      className="mt-0.5 rounded text-emerald-600"
                                    />
                                    <span className={filaMarcada ? 'text-emerald-900' : 'text-slate-800'}>
                                      <strong>{fila.unidade}</strong>
                                      <br />
                                      <span className={filaMarcada ? 'text-emerald-700' : 'text-slate-600'}>
                                        via {fila.sistema}
                                      </span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                    const marcado = form.permissoes.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => togglePermissao(perm.id)}
                          className="rounded text-violet-600"
                        />
                        <span className={`text-xs font-medium ${marcado ? 'text-violet-900' : 'text-slate-800'}`}>
                          {perm.nome}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {editandoId && usuariosVinculados.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-800 mb-2 flex items-center gap-1">
                    <Users size={14} /> Usuários vinculados ({usuariosVinculados.length})
                  </h4>
                  <ul className="text-sm space-y-1 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                    {usuariosVinculados.map((u) => (
                      <li key={u.id} className="font-medium text-slate-800 leading-snug break-words">
                        {u.nome}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t px-5 py-3 flex justify-end gap-2 bg-slate-50">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium disabled:opacity-70"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
