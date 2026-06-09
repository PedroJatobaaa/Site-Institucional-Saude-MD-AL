"use client";

import React from 'react';
import { Building } from 'lucide-react';
import {
  NIVEIS_LOTACAO,
  ehSecretariaSaude,
  unidadesDoNivel,
} from '@/lib/usuarios/lotacao';

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
  disabled?: boolean;
  labelCategoria?: string;
  labelUnidade?: string;
  showSecretariaHint?: boolean;
  className?: string;
};

const selectPadrao =
  'w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none appearance-none font-medium text-slate-700';

const labelPadrao = 'block text-[11px] font-bold text-slate-500 uppercase mb-1';

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
  disabled = false,
  labelCategoria = 'Categoria de Lotação',
  labelUnidade = 'Unidade Específica',
  showSecretariaHint = true,
  className = '',
}: Props) {
  const opcoesUnidade = unidadesDoNivel(nivelLotacao);
  const exibirSegundoSelect = nivelLotacao && !ehSecretariaSaude(nivelLotacao);
  const containerClass = compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-4';

  const selectCategoria = (
    <div>
      <label className={labelClassName}>
        {labelCategoria} {required && '*'}
      </label>
      <div className="relative">
        {showIcon && (
          <Building size={18} className="absolute left-3 top-3.5 text-slate-400" />
        )}
        <select
          required={required}
          disabled={disabled}
          value={nivelLotacao}
          onChange={(e) => onNivelChange(e.target.value)}
          className={`${selectClassName} ${showIcon ? 'pl-10' : ''}`}
        >
          <option value="">Selecione a categoria...</option>
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
    <div>
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
        <option value="">Selecione a unidade...</option>
        {opcoesUnidade.map((unidade) => (
          <option key={unidade} value={unidade}>
            {unidade}
          </option>
        ))}
      </select>
    </div>
  ) : null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className={containerClass}>
        {selectCategoria}
        {selectUnidade}
      </div>

      {showSecretariaHint && ehSecretariaSaude(nivelLotacao) && (
        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          Lotação definida automaticamente como <strong>Secretaria de Saúde</strong>.
        </p>
      )}
    </div>
  );
}
