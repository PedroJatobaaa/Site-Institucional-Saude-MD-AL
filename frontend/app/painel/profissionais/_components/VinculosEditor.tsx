"use client";

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { VinculoPayload } from '@/lib/profissionais/types';

type Props = {
  vinculos: VinculoPayload[];
  onChange: (vinculos: VinculoPayload[]) => void;
  readOnly?: boolean;
};

const vinculoVazio = (): VinculoPayload => ({
  atendimentoSus: false,
  cargaHorariaAmbulatorial: '',
  cargaHorariaHospitalar: '',
  cargaHorariaOutros: '',
});

export default function VinculosEditor({ vinculos, onChange, readOnly }: Props) {
  const atualizar = (index: number, campo: keyof VinculoPayload, valor: unknown) => {
    const nova = vinculos.map((v, i) => (i === index ? { ...v, [campo]: valor } : v));
    onChange(nova);
  };

  const adicionar = () => onChange([...vinculos, vinculoVazio()]);

  const remover = (index: number) => {
    onChange(vinculos.filter((_, i) => i !== index));
  };

  const inputClass = readOnly
    ? 'w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-600'
    : 'w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none';

  return (
    <div className="space-y-4">
      {vinculos.length === 0 && (
        <p className="text-sm text-slate-500 font-medium">
          Nenhum vínculo cadastrado. {readOnly ? '' : 'Clique em "Adicionar vínculo" para incluir.'}
        </p>
      )}

      {vinculos.map((v, index) => (
        <div key={v.id || index} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Vínculo {index + 1}</h4>
            {!readOnly && (
              <button
                type="button"
                onClick={() => remover(index)}
                className="flex items-center gap-1 text-sm font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 size={16} /> Remover
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Registro conselho de classe</label>
              <input className={inputClass} value={v.registroConselhoClasse || ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'registroConselhoClasse', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Órgão emissor</label>
              <input className={inputClass} value={v.orgaoEmissor || ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'orgaoEmissor', e.target.value)} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" checked={v.atendimentoSus ?? false} disabled={readOnly}
                onChange={(e) => atualizar(index, 'atendimentoSus', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600" />
              <label className="text-sm font-bold text-slate-700">Atendimento SUS</label>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Código vinculação</label>
              <input className={inputClass} value={v.codigoVinculacao || ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'codigoVinculacao', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Código tipo</label>
              <input className={inputClass} value={v.codigoTipo || ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'codigoTipo', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Código subtipo</label>
              <input className={inputClass} value={v.codigoSubTipo || ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'codigoSubTipo', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">CBO — código</label>
              <input className={inputClass} value={v.cboCodigo || ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'cboCodigo', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">CBO — descrição</label>
              <input className={inputClass} value={v.cboDescricao || ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'cboDescricao', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">CH ambulatorial (h/semana)</label>
              <input type="number" min={0} className={inputClass} value={v.cargaHorariaAmbulatorial ?? ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'cargaHorariaAmbulatorial', e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">CH hospitalar (h/semana)</label>
              <input type="number" min={0} className={inputClass} value={v.cargaHorariaHospitalar ?? ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'cargaHorariaHospitalar', e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">CH outros (h/semana)</label>
              <input type="number" min={0} className={inputClass} value={v.cargaHorariaOutros ?? ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'cargaHorariaOutros', e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Data entrada</label>
              <input type="date" className={inputClass} value={v.dataEntrada || ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'dataEntrada', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Data desligamento</label>
              <input type="date" className={inputClass} value={v.dataDesligamento || ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'dataDesligamento', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Motivo desligamento</label>
              <input className={inputClass} value={v.motivoDesligamento || ''} disabled={readOnly}
                onChange={(e) => atualizar(index, 'motivoDesligamento', e.target.value)} />
            </div>
          </div>
        </div>
      ))}

      {!readOnly && (
        <button
          type="button"
          onClick={adicionar}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
        >
          <Plus size={18} /> Adicionar vínculo
        </button>
      )}
    </div>
  );
}
