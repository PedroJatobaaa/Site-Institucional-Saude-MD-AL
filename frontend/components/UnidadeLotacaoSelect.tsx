"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Building } from 'lucide-react';
import {
  NIVEIS_LOTACAO,
  ehSecretariaSaude,
  organizarUnidadesPorNivel,
  unidadesDoNivel,
  UNIDADES_POR_NIVEL,
} from '@/lib/usuarios/lotacao';
import { listarLotacaoOpcoes, type LotacaoOpcao } from '@/lib/admin/api';

type Props = {
  nivelLotacao: string;
  unidadeLotacao: string;
  onNivelChange: (nivel: string) => void;
  onUnidadeChange: (unidade: string) => void;
  required?: boolean;
  selectClassName?: string;
  labelClassName?: string;
  showIcon?: boolean;
  compact?: boolean;
  inline?: boolean;
  modoFiltro?: boolean;
  disabled?: boolean;
  labelCategoria?: string;
  labelUnidade?: string;
  showSecretariaHint?: boolean;
  className?: string;
};

const selectPadrao =
  'w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none appearance-none font-medium text-slate-700';

const labelPadrao = 'block text-[11px] font-bold text-slate-500 uppercase mb-1';

function mapaFromOpcoes(opcoes: LotacaoOpcao[]): Record<string, readonly string[]> {
  const nomes = opcoes.flatMap((o) => o.unidades);
  if (nomes.length === 0) return UNIDADES_POR_NIVEL;
  return organizarUnidadesPorNivel(nomes);
}

export default function UnidadeLotacaoSelect({
  nivelLotacao,
  unidadeLotacao,
  onNivelChange,
  onUnidadeChange,
  required = false,
  selectClassName = selectPadrao,
  labelClassName = labelPadrao,
  showIcon = true,
  compact = false,
  inline = false,
  modoFiltro = false,
  disabled = false,
  labelCategoria = 'Categoria de Lotação',
  labelUnidade = 'Unidade Específica',
  showSecretariaHint = true,
  className = '',
}: Props) {
  const [mapaUnidades, setMapaUnidades] = useState<Record<string, readonly string[]>>(UNIDADES_POR_NIVEL);

  useEffect(() => {
    listarLotacaoOpcoes()
      .then((opcoes) => {
        if (opcoes.some((o) => o.unidades.length > 0)) {
          setMapaUnidades(mapaFromOpcoes(opcoes));
        }
      })
      .catch(() => {
        /* fallback estático */
      });
  }, []);

  const opcoesUnidade = useMemo(() => {
    if (!nivelLotacao) return [];
    const lista = [...(mapaUnidades[nivelLotacao] ?? unidadesDoNivel(nivelLotacao))];
    if (unidadeLotacao && !lista.includes(unidadeLotacao)) {
      lista.push(unidadeLotacao);
    }
    return lista.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [mapaUnidades, nivelLotacao, unidadeLotacao]);

  const exibirSegundoSelect = nivelLotacao && !ehSecretariaSaude(nivelLotacao);

  const placeholderCategoria = modoFiltro ? 'Todas as categorias' : 'Selecione a categoria...';
  const placeholderUnidade = modoFiltro ? 'Todas as unidades' : 'Selecione a unidade...';

  const campoClass = inline
    ? 'min-w-0'
    : compact && !exibirSegundoSelect
      ? 'sm:col-span-2'
      : '';

  const containerClass = inline
    ? 'contents'
    : compact
      ? exibirSegundoSelect
        ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
        : 'grid grid-cols-1 gap-3'
      : 'space-y-4';

  const wrapperClass = inline ? 'contents' : `space-y-3 ${className}`;

  const selectCategoria = (
    <div className={campoClass}>
      <label className={labelClassName}>
        {labelCategoria} {required && '*'}
      </label>
      <div className="relative">
        {showIcon && <Building size={18} className="absolute left-3 top-3.5 text-slate-400" />}
        <select
          required={required}
          disabled={disabled}
          value={nivelLotacao}
          onChange={(e) => onNivelChange(e.target.value)}
          className={`${selectClassName} ${showIcon ? 'pl-10' : ''}`}
        >
          <option value="">{placeholderCategoria}</option>
          {NIVEIS_LOTACAO.map((nivel) => (
            <option key={nivel} value={nivel}>
              {nivel}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const selectUnidade = exibirSegundoSelect ? (
    <div className={campoClass}>
      <label className={labelClassName}>
        {labelUnidade} {required && '*'}
      </label>
      <select
        required={required}
        disabled={disabled}
        value={unidadeLotacao}
        onChange={(e) => onUnidadeChange(e.target.value)}
        className={selectClassName}
      >
        <option value="">{placeholderUnidade}</option>
        {opcoesUnidade.map((unidade) => (
          <option key={unidade} value={unidade}>
            {unidade}
          </option>
        ))}
      </select>
    </div>
  ) : null;

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        {selectCategoria}
        {selectUnidade}
      </div>

      {!inline && showSecretariaHint && ehSecretariaSaude(nivelLotacao) && (
        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          Lotação definida automaticamente como <strong>Secretaria de Saúde</strong>.
        </p>
      )}
    </div>
  );
}
