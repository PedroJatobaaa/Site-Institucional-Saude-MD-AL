"use client";

import React from 'react';
import type { ProfissionalHistoricoItem } from '@/lib/profissionais/types';

type Props = {
  historico: ProfissionalHistoricoItem[];
};

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function labelTipo(tipo: ProfissionalHistoricoItem['tipo']) {
  return tipo === 'CRIACAO' ? 'Cadastro criado' : 'Alteração';
}

function formatarValor(valor: string | null) {
  return valor ?? '—';
}

export default function HistoricoProfissional({ historico }: Props) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
      <h2 className="text-lg font-extrabold text-slate-900 mb-6">Linha do tempo</h2>

      <div className="flex-1 overflow-y-auto pr-2 max-h-[640px]">
        {!historico.length ? (
          <p className="text-slate-500 text-sm">Nenhuma alteração registrada.</p>
        ) : (
          <ol className="relative border-l-2 border-slate-200 ml-3 space-y-8">
            {historico.map((ev) => {
              const isCriacao = ev.tipo === 'CRIACAO';
              return (
                <li key={ev.id} className="ml-6 relative">
                  <span
                    className={`absolute -left-[1.65rem] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                      isCriacao ? 'bg-teal-500' : 'bg-blue-500'
                    }`}
                  />
                  <div
                    className={`rounded-2xl border p-4 ${
                      isCriacao
                        ? 'border-teal-200 bg-teal-50/50'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase text-slate-500">
                      {labelTipo(ev.tipo)}
                    </p>
                    <p className="text-xs text-slate-600 mt-2">
                      {formatarDataHora(ev.createdAt)} · {ev.usuarioNome}
                    </p>

                    <ul className="mt-3 space-y-2">
                      {ev.alteracoes.map((alt, idx) => (
                        <li key={idx} className="text-sm text-slate-700">
                          <span className="font-bold text-slate-800">{alt.campo}</span>
                          {alt.valorAnterior !== null || alt.valorNovo !== null ? (
                            <span className="block mt-0.5 text-slate-600">
                              {formatarValor(alt.valorAnterior)} → {formatarValor(alt.valorNovo)}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
