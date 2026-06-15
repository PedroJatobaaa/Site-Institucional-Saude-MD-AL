"use client";

import React, { useRef, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import UnidadeLotacaoSelect from '@/components/UnidadeLotacaoSelect';
import VinculosEditor from './VinculosEditor';
import { aoMudarNivelLotacao, lotacaoCompleta } from '@/lib/usuarios/lotacao';
import {
  mascaraCEP,
  mascaraCPF,
  mascaraCNS,
  mascaraPIS,
  mascaraTelefone,
  validarCPF,
  validarCNS,
  validarPisPasep,
} from '@/lib/profissionais/documentos';
import type { ProfissionalCompletoPayload } from '@/lib/profissionais/types';
import {
  CADASTRO_ATUALIZACAO_OPCOES,
  ESCOLARIDADE_OPCOES,
  RACA_COR_OPCOES,
  SEXO_OPCOES,
  SITUACAO_FAMILIAR_OPCOES,
  TREINAMENTO_OPCOES,
  TIPO_CERTIDAO_OPCOES,
  TIPO_LOGRADOURO_OPCOES,
  UFS,
} from '@/lib/profissionais/types';

type Props = {
  data: ProfissionalCompletoPayload;
  onChange: (data: ProfissionalCompletoPayload) => void;
  onSubmit: () => Promise<void>;
  readOnly?: boolean;
  modoEdicao?: boolean;
  loading?: boolean;
  submitLabel?: string;
};

const ABAS = [
  { id: 'identificacao', label: 'Identificação e Documentos' },
  { id: 'endereco', label: 'Endereço e Contato' },
  { id: 'bancario', label: 'Dados Bancários' },
  { id: 'vinculos', label: 'Vínculos (CBO)' },
] as const;

type AbaId = (typeof ABAS)[number]['id'];

export default function ProfissionalForm({
  data,
  onChange,
  onSubmit,
  readOnly,
  modoEdicao,
  loading,
  submitLabel = 'Salvar',
}: Props) {
  const [abaAtiva, setAbaAtiva] = useState<AbaId>('identificacao');
  const [erroAba, setErroAba] = useState('');
  const erroRef = useRef<HTMLDivElement>(null);

  const exibirErroValidacao = (erro: string) => {
    setErroAba(erro);
    setAbaAtiva('identificacao');
    alert(erro);
    requestAnimationFrame(() => {
      erroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const p = data.profissional;
  const doc = data.documentos || {};
  const end = data.endereco || {};
  const banco = data.dadosBancarios || {};

  const inputClass = readOnly
    ? 'w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-600'
    : 'w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none';

  const selectClass = readOnly
    ? 'w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-600'
    : 'w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold focus:ring-2 focus:ring-blue-600 outline-none';

  const setProf = (campo: keyof typeof p, valor: unknown) => {
    onChange({ ...data, profissional: { ...p, [campo]: valor } });
  };

  const setDoc = (campo: string, valor: unknown) => {
    onChange({ ...data, documentos: { ...doc, [campo]: valor } });
  };

  const setEnd = (campo: string, valor: unknown) => {
    onChange({ ...data, endereco: { ...end, [campo]: valor } });
  };

  const setBanco = (campo: string, valor: unknown) => {
    onChange({ ...data, dadosBancarios: { ...banco, [campo]: valor } });
  };

  const estrangeiro = p.nacionalidade && p.nacionalidade !== 'Brasileira';

  const validarAba = (aba: AbaId): string | null => {
    if (aba === 'identificacao') {
      if (!p.nomeProfissional?.trim()) return 'Informe o nome do profissional.';
      if (!p.cpf?.trim()) return 'Informe o CPF.';
      if (!validarCPF(p.cpf)) return 'CPF inválido.';
      if (p.pisPasep && !validarPisPasep(p.pisPasep)) return 'PIS/PASEP inválido.';
      if (p.numeroCns && !validarCNS(p.numeroCns)) return 'CNS inválido.';
      if (!lotacaoCompleta(p.nivelLotacao || '', p.unidadeLotacao || '')) {
        return 'Selecione a categoria e a unidade de lotação.';
      }
    }
    return null;
  };

  const irParaAba = (aba: AbaId) => {
    if (!readOnly && aba !== abaAtiva) {
      const erro = validarAba(abaAtiva);
      if (erro && ABAS.findIndex((a) => a.id === aba) > ABAS.findIndex((a) => a.id === abaAtiva)) {
        setErroAba(erro);
        return;
      }
    }
    setErroAba('');
    setAbaAtiva(aba);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const erro = validarAba('identificacao');
    if (erro) {
      exibirErroValidacao(erro);
      return;
    }
    setErroAba('');
    await onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b border-slate-200">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            type="button"
            onClick={() => irParaAba(aba.id)}
            className={`px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${
              abaAtiva === aba.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {erroAba && (
        <div
          ref={erroRef}
          className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl"
        >
          {erroAba}
        </div>
      )}

      {(modoEdicao || readOnly) && (
        <div className="mx-6 mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-700">Situação e acompanhamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Situação do cadastro</label>
              {readOnly ? (
                <p className={inputClass}>{p.ativo === false ? 'Inativo' : 'Ativo'}</p>
              ) : (
                <select
                  value={p.ativo === false ? 'inativo' : 'ativo'}
                  onChange={(e) => setProf('ativo', e.target.value === 'ativo')}
                  className={selectClass}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Treinamento</label>
              {readOnly ? (
                <p className={inputClass}>
                  {TREINAMENTO_OPCOES.find((opcao) => opcao.value === p.treinamento)?.label || 'Aguardando'}
                </p>
              ) : (
                <select
                  value={p.treinamento || 'aguardando'}
                  onChange={(e) => setProf('treinamento', e.target.value)}
                  className={selectClass}
                >
                  {TREINAMENTO_OPCOES.map((opcao) => (
                    <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Cadastro/Atualização</label>
              {readOnly ? (
                <p className={inputClass}>
                  {CADASTRO_ATUALIZACAO_OPCOES.find((opcao) => opcao.value === p.cadastroAtualizacao)?.label || 'Aguardando'}
                </p>
              ) : (
                <select
                  value={p.cadastroAtualizacao || 'aguardando'}
                  onChange={(e) => setProf('cadastroAtualizacao', e.target.value)}
                  className={selectClass}
                >
                  {CADASTRO_ATUALIZACAO_OPCOES.map((opcao) => (
                    <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          {!readOnly && (
            <p className="text-xs text-slate-500">
              Cadastros inativos permanecem no sistema para fins de auditoria e não podem ser excluídos.
              Ao salvar qualquer alteração nos dados do profissional, o status de Cadastro/Atualização será definido automaticamente como Aguardando.
            </p>
          )}
        </div>
      )}

      <div className="p-6 space-y-6">
        {abaAtiva === 'identificacao' && (
          <>
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Estabelecimento</h3>
              <div className="space-y-4">
                <div className="max-w-xs">
                  <label className="text-xs font-bold text-slate-500 uppercase">CNES</label>
                  <input className={inputClass} value={p.cnes || ''} disabled={readOnly}
                    onChange={(e) => setProf('cnes', e.target.value)} />
                </div>
                <UnidadeLotacaoSelect
                  nivelLotacao={p.nivelLotacao || ''}
                  unidadeLotacao={p.unidadeLotacao || ''}
                  onNivelChange={(nivel) => {
                    const lotacao = aoMudarNivelLotacao(nivel);
                    onChange({
                      ...data,
                      profissional: {
                        ...p,
                        nivelLotacao: lotacao.nivelLotacao,
                        unidadeLotacao: lotacao.unidadeLotacao,
                      },
                    });
                  }}
                  onUnidadeChange={(unidade) => setProf('unidadeLotacao', unidade)}
                  required
                  disabled={readOnly}
                  selectClassName={selectClass}
                  labelClassName="text-xs font-bold text-slate-500 uppercase mb-1"
                />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Dados pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome do profissional *</label>
                  <input className={inputClass} value={p.nomeProfissional} disabled={readOnly} required
                    onChange={(e) => setProf('nomeProfissional', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">CPF *</label>
                  <input className={inputClass} value={p.cpf} disabled={readOnly} required
                    onChange={(e) => setProf('cpf', mascaraCPF(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">CNS</label>
                  <input className={inputClass} value={p.numeroCns || ''} disabled={readOnly}
                    onChange={(e) => setProf('numeroCns', mascaraCNS(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">PIS/PASEP</label>
                  <input className={inputClass} value={p.pisPasep || ''} disabled={readOnly}
                    onChange={(e) => setProf('pisPasep', mascaraPIS(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Sexo</label>
                  <select className={selectClass} value={p.sexo || ''} disabled={readOnly}
                    onChange={(e) => setProf('sexo', e.target.value)}>
                    <option value="">Selecione</option>
                    {SEXO_OPCOES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Data nascimento</label>
                  <input type="date" className={inputClass} value={p.dataNascimento || ''} disabled={readOnly}
                    onChange={(e) => setProf('dataNascimento', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome da mãe</label>
                  <input className={inputClass} value={p.nomeMae || ''} disabled={readOnly}
                    onChange={(e) => setProf('nomeMae', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome do pai</label>
                  <input className={inputClass} value={p.nomePai || ''} disabled={readOnly}
                    onChange={(e) => setProf('nomePai', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Município nascimento</label>
                  <input className={inputClass} value={p.municipioNascimento || ''} disabled={readOnly}
                    onChange={(e) => setProf('municipioNascimento', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Cód. IBGE município nasc.</label>
                  <input className={inputClass} value={p.codigoIbgeMunicipioNascimento || ''} disabled={readOnly}
                    onChange={(e) => setProf('codigoIbgeMunicipioNascimento', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">UF nascimento</label>
                  <select className={selectClass} value={p.ufNascimento || ''} disabled={readOnly}
                    onChange={(e) => setProf('ufNascimento', e.target.value)}>
                    <option value="">UF</option>
                    {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Raça/cor</label>
                  <select className={selectClass} value={p.racaCor || ''} disabled={readOnly}
                    onChange={(e) => setProf('racaCor', e.target.value)}>
                    <option value="">Selecione</option>
                    {RACA_COR_OPCOES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Nacionalidade</label>
                  <input className={inputClass} value={p.nacionalidade || ''} disabled={readOnly}
                    onChange={(e) => setProf('nacionalidade', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">País origem</label>
                  <input className={inputClass} value={p.paisOrigem || ''} disabled={readOnly}
                    onChange={(e) => setProf('paisOrigem', e.target.value)} />
                </div>
                {estrangeiro && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Data entrada Brasil</label>
                      <input type="date" className={inputClass} value={p.dataEntrada || ''} disabled={readOnly}
                        onChange={(e) => setProf('dataEntrada', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Data naturalização</label>
                      <input type="date" className={inputClass} value={p.dataNaturalizacao || ''} disabled={readOnly}
                        onChange={(e) => setProf('dataNaturalizacao', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Nº portaria naturalização</label>
                      <input className={inputClass} value={p.numeroPortaria || ''} disabled={readOnly}
                        onChange={(e) => setProf('numeroPortaria', e.target.value)} />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Escolaridade</label>
                  <select className={selectClass} value={p.escolaridade || ''} disabled={readOnly}
                    onChange={(e) => setProf('escolaridade', e.target.value)}>
                    <option value="">Selecione</option>
                    {ESCOLARIDADE_OPCOES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Situação familiar/conjugal</label>
                  <select className={selectClass} value={p.situacaoFamiliarConjugal || ''} disabled={readOnly}
                    onChange={(e) => setProf('situacaoFamiliarConjugal', e.target.value)}>
                    <option value="">Selecione</option>
                    {SITUACAO_FAMILIAR_OPCOES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={p.frequentaEscola ?? false} disabled={readOnly}
                    onChange={(e) => setProf('frequentaEscola', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                  <label className="text-sm font-bold text-slate-700">Frequenta escola</label>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Documentos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p className="md:col-span-2 text-xs font-bold text-slate-400 uppercase">Certidão</p>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                  <select className={selectClass} value={doc.tipoCertidao || ''} disabled={readOnly}
                    onChange={(e) => setDoc('tipoCertidao', e.target.value)}>
                    <option value="">Selecione</option>
                    {TIPO_CERTIDAO_OPCOES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Cartório</label>
                  <input className={inputClass} value={doc.cartorio || ''} disabled={readOnly}
                    onChange={(e) => setDoc('cartorio', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Livro</label>
                  <input className={inputClass} value={doc.livro || ''} disabled={readOnly}
                    onChange={(e) => setDoc('livro', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Fls</label>
                  <input className={inputClass} value={doc.fls || ''} disabled={readOnly}
                    onChange={(e) => setDoc('fls', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Termo</label>
                  <input className={inputClass} value={doc.termo || ''} disabled={readOnly}
                    onChange={(e) => setDoc('termo', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Data emissão certidão</label>
                  <input type="date" className={inputClass} value={doc.dataEmissaoCertidao || ''} disabled={readOnly}
                    onChange={(e) => setDoc('dataEmissaoCertidao', e.target.value)} />
                </div>

                <p className="md:col-span-2 text-xs font-bold text-slate-400 uppercase mt-2">Identidade (RG)</p>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Número</label>
                  <input className={inputClass} value={doc.rgNumero || ''} disabled={readOnly}
                    onChange={(e) => setDoc('rgNumero', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">UF</label>
                  <select className={selectClass} value={doc.rgUf || ''} disabled={readOnly}
                    onChange={(e) => setDoc('rgUf', e.target.value)}>
                    <option value="">UF</option>
                    {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Órgão emissor</label>
                  <input className={inputClass} value={doc.rgOrgaoEmissor || ''} disabled={readOnly}
                    onChange={(e) => setDoc('rgOrgaoEmissor', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Data emissão RG</label>
                  <input type="date" className={inputClass} value={doc.rgDataEmissao || ''} disabled={readOnly}
                    onChange={(e) => setDoc('rgDataEmissao', e.target.value)} />
                </div>

                <p className="md:col-span-2 text-xs font-bold text-slate-400 uppercase mt-2">Título eleitoral</p>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Título</label>
                  <input className={inputClass} value={doc.tituloEleitor || ''} disabled={readOnly}
                    onChange={(e) => setDoc('tituloEleitor', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Zona</label>
                  <input className={inputClass} value={doc.zona || ''} disabled={readOnly}
                    onChange={(e) => setDoc('zona', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Seção</label>
                  <input className={inputClass} value={doc.secao || ''} disabled={readOnly}
                    onChange={(e) => setDoc('secao', e.target.value)} />
                </div>

                <p className="md:col-span-2 text-xs font-bold text-slate-400 uppercase mt-2">CTPS</p>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Número</label>
                  <input className={inputClass} value={doc.ctpsNumero || ''} disabled={readOnly}
                    onChange={(e) => setDoc('ctpsNumero', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Série</label>
                  <input className={inputClass} value={doc.ctpsSerie || ''} disabled={readOnly}
                    onChange={(e) => setDoc('ctpsSerie', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">UF</label>
                  <select className={selectClass} value={doc.ctpsUf || ''} disabled={readOnly}
                    onChange={(e) => setDoc('ctpsUf', e.target.value)}>
                    <option value="">UF</option>
                    {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Data emissão CTPS</label>
                  <input type="date" className={inputClass} value={doc.ctpsDataEmissao || ''} disabled={readOnly}
                    onChange={(e) => setDoc('ctpsDataEmissao', e.target.value)} />
                </div>
              </div>
            </section>
          </>
        )}

        {abaAtiva === 'endereco' && (
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Endereço e contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Tipo logradouro</label>
                <select className={selectClass} value={end.tipoLogradouro || ''} disabled={readOnly}
                  onChange={(e) => setEnd('tipoLogradouro', e.target.value)}>
                  <option value="">Selecione</option>
                  {TIPO_LOGRADOURO_OPCOES.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Logradouro</label>
                <input className={inputClass} value={end.logradouro || ''} disabled={readOnly}
                  onChange={(e) => setEnd('logradouro', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Número</label>
                <input className={inputClass} value={end.numero || ''} disabled={readOnly}
                  onChange={(e) => setEnd('numero', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Complemento</label>
                <input className={inputClass} value={end.complemento || ''} disabled={readOnly}
                  onChange={(e) => setEnd('complemento', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Bairro/distrito</label>
                <input className={inputClass} value={end.bairroDistrito || ''} disabled={readOnly}
                  onChange={(e) => setEnd('bairroDistrito', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Município residência</label>
                <input className={inputClass} value={end.municipioResidencia || ''} disabled={readOnly}
                  onChange={(e) => setEnd('municipioResidencia', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Cód. IBGE município</label>
                <input className={inputClass} value={end.codigoIbgeMunicipio || ''} disabled={readOnly}
                  onChange={(e) => setEnd('codigoIbgeMunicipio', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">UF</label>
                <select className={selectClass} value={end.uf || ''} disabled={readOnly}
                  onChange={(e) => setEnd('uf', e.target.value)}>
                  <option value="">UF</option>
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">CEP</label>
                <input className={inputClass} value={end.cep || ''} disabled={readOnly}
                  onChange={(e) => setEnd('cep', mascaraCEP(e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                <input className={inputClass} value={end.telefone || ''} disabled={readOnly}
                  onChange={(e) => setEnd('telefone', mascaraTelefone(e.target.value))} />
              </div>
            </div>
          </section>
        )}

        {abaAtiva === 'bancario' && (
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Dados bancários</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Código banco</label>
                <input className={inputClass} value={banco.bancoCodigo || ''} disabled={readOnly}
                  onChange={(e) => setBanco('bancoCodigo', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Nome banco</label>
                <input className={inputClass} value={banco.bancoNome || ''} disabled={readOnly}
                  onChange={(e) => setBanco('bancoNome', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Agência</label>
                <input className={inputClass} value={banco.agencia || ''} disabled={readOnly}
                  onChange={(e) => setBanco('agencia', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Conta corrente</label>
                <input className={inputClass} value={banco.contaCorrente || ''} disabled={readOnly}
                  onChange={(e) => setBanco('contaCorrente', e.target.value)} />
              </div>
            </div>
          </section>
        )}

        {abaAtiva === 'vinculos' && (
          <VinculosEditor
            vinculos={data.vinculos || []}
            onChange={(vinculos) => onChange({ ...data, vinculos })}
            readOnly={readOnly}
          />
        )}
      </div>

      {!readOnly && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {submitLabel}
          </button>
        </div>
      )}
    </form>
  );
}
