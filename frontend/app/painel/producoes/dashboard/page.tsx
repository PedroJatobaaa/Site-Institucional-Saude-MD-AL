"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  Filter,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MESES, formatarDataBR, formatarDataHoraBR } from '@/lib/producao/calculateDeadline';
import { isAdminProducaoDashboard } from '@/lib/producao/roles';
import {
  STATUS_PRODUCAO,
  labelSituacaoPrazo,
  type StatusProducao,
} from '@/lib/producao/statusConfig';
import { FILAS_PRODUCAO } from '@/lib/producao/filasProducao';
import { getToken, getUsuario } from '@/lib/auth/session';

type FilaDetalhe = {
  filaId: string;
  label: string;
  unidade: string;
  sistema: string;
  enviado: boolean;
  situacaoPrazo: string;
  status: StatusProducao | null;
  dataPrimeiroEnvio: string | null;
  prazoFinal: string;
  prazoExpirado: boolean;
};

type DashboardPayload = {
  competencia: { mes: number; ano: number };
  resumo: {
    totalFilas: number;
    enviadas: number;
    naoEnviadas: number;
    pctEnviadas: number;
    pctNaoEnviadas: number;
    noPrazo: number;
    foraDoPrazo: number;
    atrasadas: number;
    emAberto: number;
    porStatus: Record<StatusProducao, number>;
  };
  filas: FilaDetalhe[];
};

const CORES_ENVIO = ['#10b981', '#94a3b8'];
const CORES_PRAZO = ['#10b981', '#f59e0b', '#ef4444', '#cbd5e1'];
const CORES_STATUS = ['#10b981', '#3b82f6', '#f97316', '#059669'];

const LABELS_PRAZO: Record<string, string> = {
  NO_PRAZO: 'No prazo',
  FORA_DO_PRAZO: 'Fora do prazo',
  ATRASADO: 'Atrasado',
  EM_ABERTO: 'Em aberto',
};

const unidadesDisponiveis = [...new Set(FILAS_PRODUCAO.map((f) => f.unidade))].sort((a, b) =>
  a.localeCompare(b, 'pt-BR')
);
const sistemasDisponiveis = [...new Set(FILAS_PRODUCAO.map((f) => f.sistema))].sort((a, b) =>
  a.localeCompare(b, 'pt-BR')
);

export default function DashboardProducoesPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<{ permissoes?: string[] } | null>(null);
  const [mes, setMes] = useState(() => {
    const d = new Date();
    const m = d.getMonth();
    return m === 0 ? 12 : m;
  });
  const [ano, setAno] = useState(() => {
    const d = new Date();
    return d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
  });
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroSistema, setFiltroSistema] = useState('');
  const [dados, setDados] = useState<DashboardPayload | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    const userObj = getUsuario();
    if (!userObj) {
      router.push('/login');
      return;
    }
    if (!isAdminProducaoDashboard(userObj.permissoes)) {
      alert('Apenas administradores podem acessar o dashboard de produções.');
      router.push('/painel');
      return;
    }
    setUsuario(userObj);
  }, [router]);

  const carregarDashboard = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setCarregando(true);
    setErro('');

    const params = new URLSearchParams({
      mes: String(mes),
      ano: String(ano),
    });
    if (filtroUnidade) params.set('unidade', filtroUnidade);
    if (filtroSistema) params.set('sistema', filtroSistema);

    try {
      const res = await fetch(`/api/producoes/dashboard?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || 'Falha ao carregar dashboard.');
        setDados(null);
        return;
      }
      setDados(json);
    } catch {
      setErro('Erro de conexão ao carregar dashboard.');
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }, [mes, ano, filtroUnidade, filtroSistema]);

  useEffect(() => {
    if (usuario) carregarDashboard();
  }, [usuario, carregarDashboard]);

  const dadosEnvio = useMemo(() => {
    if (!dados) return [];
    return [
      { nome: 'Enviadas', valor: dados.resumo.enviadas, pct: dados.resumo.pctEnviadas },
      { nome: 'Não enviadas', valor: dados.resumo.naoEnviadas, pct: dados.resumo.pctNaoEnviadas },
    ].filter((d) => d.valor > 0);
  }, [dados]);

  const dadosPrazo = useMemo(() => {
    if (!dados) return [];
    return [
      { nome: LABELS_PRAZO.NO_PRAZO, valor: dados.resumo.noPrazo },
      { nome: LABELS_PRAZO.FORA_DO_PRAZO, valor: dados.resumo.foraDoPrazo },
      { nome: LABELS_PRAZO.ATRASADO, valor: dados.resumo.atrasadas },
      { nome: LABELS_PRAZO.EM_ABERTO, valor: dados.resumo.emAberto },
    ].filter((d) => d.valor > 0);
  }, [dados]);

  const dadosStatus = useMemo(() => {
    if (!dados) return [];
    return (Object.keys(STATUS_PRODUCAO) as StatusProducao[])
      .map((status) => ({
        nome: STATUS_PRODUCAO[status].label,
        valor: dados.resumo.porStatus[status],
      }))
      .filter((d) => d.valor > 0);
  }, [dados]);

  if (!usuario) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/painel/producoes"
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 size={22} className="text-blue-600" />
                Dashboard de Produções
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Visão geral por competência
              </p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
            Admin
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-4">
            <Filter size={14} /> Filtros
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                <CalendarClock size={14} /> Mês
              </label>
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {MESES.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Ano</label>
              <select
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {anosDisponiveis.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Unidade</label>
              <select
                value={filtroUnidade}
                onChange={(e) => setFiltroUnidade(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todas</option>
                {unidadesDisponiveis.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Sistema</label>
              <select
                value={filtroSistema}
                onChange={(e) => setFiltroSistema(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todos</option>
                {sistemasDisponiveis.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {erro && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {erro}
          </div>
        )}

        {carregando && (
          <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
            <Loader2 className="animate-spin" size={24} />
            Carregando dados...
          </div>
        )}

        {!carregando && dados && dados.resumo.totalFilas === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-8 text-center text-amber-800">
            Nenhuma fila encontrada com os filtros selecionados.
          </div>
        )}

        {!carregando && dados && dados.resumo.totalFilas > 0 && (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard
                titulo="Total de filas"
                valor={String(dados.resumo.totalFilas)}
                icone={<BarChart3 size={18} className="text-blue-600" />}
                cor="bg-blue-50 border-blue-100"
              />
              <KpiCard
                titulo="Enviadas"
                valor={`${dados.resumo.pctEnviadas}%`}
                subtitulo={`${dados.resumo.enviadas} fila(s)`}
                icone={<CheckCircle2 size={18} className="text-emerald-600" />}
                cor="bg-emerald-50 border-emerald-100"
              />
              <KpiCard
                titulo="Não enviadas"
                valor={`${dados.resumo.pctNaoEnviadas}%`}
                subtitulo={`${dados.resumo.naoEnviadas} fila(s)`}
                icone={<XCircle size={18} className="text-slate-600" />}
                cor="bg-slate-50 border-slate-200"
              />
              <KpiCard
                titulo="Atrasadas"
                valor={String(dados.resumo.atrasadas)}
                icone={<AlertTriangle size={18} className="text-red-600" />}
                cor="bg-red-50 border-red-100"
              />
              <KpiCard
                titulo="Em aberto"
                valor={String(dados.resumo.emAberto)}
                icone={<Clock size={18} className="text-slate-600" />}
                cor="bg-slate-50 border-slate-200"
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GraficoCard titulo="Enviado vs Não enviado">
                {dadosEnvio.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={dadosEnvio}
                        dataKey="valor"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        label={({ nome, pct }) => `${nome}: ${pct}%`}
                      >
                        {dadosEnvio.map((_, i) => (
                          <Cell key={i} fill={CORES_ENVIO[i % CORES_ENVIO.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v} fila(s)`, 'Quantidade']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </GraficoCard>

              <GraficoCard titulo="Situação de prazo">
                {dadosPrazo.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={dadosPrazo}
                        dataKey="valor"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {dadosPrazo.map((_, i) => (
                          <Cell key={i} fill={CORES_PRAZO[i % CORES_PRAZO.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v} fila(s)`, 'Quantidade']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </GraficoCard>

              <GraficoCard titulo="Status do fluxo">
                {dadosStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={dadosStatus} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="nome" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [`${v} fila(s)`, 'Quantidade']} />
                      <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                        {dadosStatus.map((_, i) => (
                          <Cell key={i} fill={CORES_STATUS[i % CORES_STATUS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart mensagem="Nenhuma entrega registrada nesta competência." />
                )}
              </GraficoCard>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Detalhamento por fila</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Competência: {MESES.find((m) => m.valor === dados.competencia.mes)?.label}{' '}
                  {dados.competencia.ano}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase">
                      <th className="px-6 py-3">Fila</th>
                      <th className="px-6 py-3">Unidade</th>
                      <th className="px-6 py-3">Sistema</th>
                      <th className="px-6 py-3">Envio</th>
                      <th className="px-6 py-3">Prazo</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Data envio</th>
                      <th className="px-6 py-3">Prazo final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dados.filas.map((fila) => {
                      const prazo = labelSituacaoPrazo(fila.situacaoPrazo);
                      const statusCfg = fila.status ? STATUS_PRODUCAO[fila.status] : null;
                      return (
                        <tr key={fila.filaId} className="hover:bg-slate-50/80">
                          <td className="px-6 py-3 font-semibold text-slate-800">{fila.label}</td>
                          <td className="px-6 py-3 text-slate-600">{fila.unidade}</td>
                          <td className="px-6 py-3 text-slate-600">{fila.sistema}</td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                                fila.enviado
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {fila.enviado ? 'Enviado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-full border ${prazo.classe}`}
                            >
                              {prazo.texto}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            {statusCfg ? (
                              <span
                                className={`text-xs font-bold px-2 py-1 rounded-full border ${statusCfg.badge}`}
                              >
                                {statusCfg.label}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-slate-600">
                            {fila.dataPrimeiroEnvio
                              ? formatarDataHoraBR(fila.dataPrimeiroEnvio)
                              : '—'}
                          </td>
                          <td className="px-6 py-3 text-slate-600">
                            {formatarDataBR(fila.prazoFinal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function KpiCard({
  titulo,
  valor,
  subtitulo,
  icone,
  cor,
}: {
  titulo: string;
  valor: string;
  subtitulo?: string;
  icone: React.ReactNode;
  cor: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${cor}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase">{titulo}</span>
        {icone}
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{valor}</p>
      {subtitulo && <p className="text-xs text-slate-500 mt-1">{subtitulo}</p>}
    </div>
  );
}

function GraficoCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <h3 className="font-bold text-slate-900 mb-4">{titulo}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ mensagem = 'Sem dados para exibir.' }: { mensagem?: string }) {
  return (
    <div className="h-[240px] flex items-center justify-center text-sm text-slate-400">{mensagem}</div>
  );
}
