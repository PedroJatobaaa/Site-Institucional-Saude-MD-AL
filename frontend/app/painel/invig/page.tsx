"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, FileDown, Trash2, X, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

interface Obito {
  id: string;
  numDo: string;
  falecido: string;
  idade: string;
  mae: string;
  tipo: string;
  data: string;
  ubsMed: string;
  ret: string;
}

export default function PainelInvig() {
  const [semana, setSemana] = useState('');
  const [ubs, setUbs] = useState('');
  const [tipoProf, setTipoProf] = useState('Enfermeiro(a)');
  const [nomeProf, setNomeProf] = useState('');

  const [obitos, setObitos] = useState<Obito[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const [novoObito, setNovoObito] = useState<Partial<Obito>>({});
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleAdicionarObito = (e: React.FormEvent) => {
    e.preventDefault();
    const obitoCompleto = { ...novoObito, id: Date.now().toString() } as Obito;
    setObitos([...obitos, obitoCompleto]);
    setNovoObito({});
    setModalAberto(false);
  };

  const limparTudo = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados da tela?')) {
      setSemana('');
      setUbs('');
      setTipoProf('Enfermeiro(a)');
      setNomeProf('');
      setObitos([]);
    }
  };

  const gerarPDF = async () => {
    if (!pdfRef.current) return;
    setLoadingPdf(true);

    try {
      const dataUrl = await toPng(pdfRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF('l', 'mm', 'a4'); 
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (pdfRef.current.offsetHeight * pdfWidth) / pdfRef.current.offsetWidth;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio_INVIG_${semana.replace(/\//g, '-') || 'Semana'}.pdf`);
    } catch (error: any) {
      console.error("Erro completo do PDF:", error);
      alert(`Ocorreu um erro técnico: ${error.message}`);
    } finally {
      setLoadingPdf(false);
    }
  };

  const dataHoje = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Voltar e Título */}
        <div className="flex items-center gap-3">
          <Link href="/painel" className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm hover:text-blue-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Relatório INVIG</h1>
            <p className="text-slate-500 mt-1">Controle de Investigação de Óbitos</p>
          </div>
        </div>

        {/* Barra Superior de Inputs */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap md:flex-nowrap gap-4 items-center">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sem. Epidem.</label>
            <input type="text" placeholder="Ex: 16/2026" value={semana} onChange={e => setSemana(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unidade (UBS)</label>
            <input type="text" placeholder="Ex: Poeira" value={ubs} onChange={e => setUbs(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cargo</label>
            <select value={tipoProf} onChange={e => setTipoProf(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium">
              <option value="Enfermeiro(a)">Enfermeiro(a)</option>
              <option value="Médico(a)">Médico(a)</option>
            </select>
          </div>
          <div className="flex-[2] min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do Profissional</label>
            <input type="text" placeholder="Responsável pelo preenchimento..." value={nomeProf} onChange={e => setNomeProf(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium" />
          </div>
        </div>

        {/* Área Principal da Tabela */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          {obitos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                <AlertCircle size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Nenhum óbito registrado</h3>
              <p className="text-slate-500 max-w-md">Ao gerar o PDF agora, o relatório será exportado com a marca de "SEM OCORRÊNCIA".</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4 font-semibold">Nº DO</th>
                    <th className="p-4 font-semibold">Falecido(a)</th>
                    <th className="p-4 font-semibold">Idade</th>
                    <th className="p-4 font-semibold">Mãe</th>
                    <th className="p-4 font-semibold">Tipo</th>
                    <th className="p-4 font-semibold">Data</th>
                    <th className="p-4 font-semibold">UBS/MED</th>
                    <th className="p-4 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {obitos.map((obito) => (
                    <tr key={obito.id} className="hover:bg-slate-50/80 transition-colors text-sm text-slate-700 font-medium">
                      <td className="p-4 uppercase">{obito.numDo}</td>
                      <td className="p-4 uppercase">{obito.falecido}</td>
                      <td className="p-4 uppercase">{obito.idade}</td>
                      <td className="p-4 uppercase">{obito.mae}</td>
                      <td className="p-4 uppercase">{obito.tipo}</td>
                      <td className="p-4 uppercase">{obito.data}</td>
                      <td className="p-4 uppercase">{obito.ubsMed}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => setObitos(obitos.filter(o => o.id !== obito.id))} className="text-slate-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all" title="Remover">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botões de Ação Redesenhados */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <button onClick={limparTudo} className="text-slate-400 hover:text-red-600 hover:bg-red-50 px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-sm">
            Limpar Dados
          </button>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setModalAberto(true)} className="bg-white border border-slate-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-sm">
              <Plus size={18} /> Adicionar Óbito
            </button>
            <button onClick={gerarPDF} disabled={loadingPdf} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 text-sm">
              <FileDown size={18} /> {loadingPdf ? 'Processando PDF...' : 'Exportar Relatório PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Adicionar Novo Óbito (Refinado) */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Registrar Óbito</h3>
                <p className="text-sm text-slate-500 mt-1">Preencha os dados da Declaração de Óbito.</p>
              </div>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleAdicionarObito} className="grid grid-cols-2 gap-4">
              <input required placeholder="Nº DO" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm" onChange={e => setNovoObito({...novoObito, numDo: e.target.value})} />
              <input required placeholder="FALECIDO (A)" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm" onChange={e => setNovoObito({...novoObito, falecido: e.target.value})} />
              <input required placeholder="IDADE" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm" onChange={e => setNovoObito({...novoObito, idade: e.target.value})} />
              <input required placeholder="MÃE" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm" onChange={e => setNovoObito({...novoObito, mae: e.target.value})} />
              <input required placeholder="TIPO (Ex: Fetal, Infantil...)" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm" onChange={e => setNovoObito({...novoObito, tipo: e.target.value})} />
              <input required type="date" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-600" onChange={e => setNovoObito({...novoObito, data: e.target.value.split('-').reverse().join('/')})} />
              <input required placeholder="UBS/MED" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm" onChange={e => setNovoObito({...novoObito, ubsMed: e.target.value})} />
              <input placeholder="RET (Opcional)" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm" onChange={e => setNovoObito({...novoObito, ret: e.target.value})} />
              
              <div className="col-span-2 border-t border-slate-100 pt-6 mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setModalAberto(false)} className="px-6 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-sm transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors">Salvar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ÁREA ESCONDIDA (MOLDE DO PDF EM PAISAGEM) */}
      <div className="absolute top-[-10000px] left-[-10000px]">
        <div ref={pdfRef} className="w-[1123px] h-[794px] bg-white p-12 text-black flex flex-col justify-between font-sans">
          
          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col">
              <img src="/logo.png" alt="Prefeitura de Marechal Deodoro" className="h-16 object-contain" />
            </div>

            <div className="text-center font-bold text-sm leading-tight">
              <p>SECRETARIA MUNICIPAL DE SAÚDE - MARECHAL DEODORO / AL</p>
              <p>SETOR DE VIGILÂNCIA EPIDEMIOLÓGICA</p>
              <p className="mt-4 text-base">RELATÓRIO/CONTROLE DE INVESTIGAÇÃO DE ÓBITOS - INVIG</p>
            </div>

            <div className="border-2 border-black p-2 w-64 text-xs font-bold space-y-1">
              <p>S.E: <span className="font-normal">{semana || '____/____'}</span></p>
              <p>UBS: <span className="font-normal uppercase">{ubs || 'NÃO INFORMADA'}</span></p>
            </div>
          </div>

          <div className="relative flex-1">
            <table className="w-full border-collapse border-2 border-black text-xs text-center">
              <thead className="bg-white">
                <tr>
                  <th className="border-2 border-black p-2 w-16">Nº DO</th>
                  <th className="border-2 border-black p-2">FALECIDO (A)</th>
                  <th className="border-2 border-black p-2 w-16">IDADE</th>
                  <th className="border-2 border-black p-2">MÃE</th>
                  <th className="border-2 border-black p-2 w-20">TIPO</th>
                  <th className="border-2 border-black p-2 w-24">DATA</th>
                  <th className="border-2 border-black p-2 w-32">UBS/MED</th>
                  <th className="border-2 border-black p-2 w-16">RET</th>
                </tr>
              </thead>
              <tbody>
                {obitos.length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="h-10">
                      <td className="border-2 border-black"></td><td className="border-2 border-black"></td>
                      <td className="border-2 border-black"></td><td className="border-2 border-black"></td>
                      <td className="border-2 border-black"></td><td className="border-2 border-black"></td>
                      <td className="border-2 border-black"></td><td className="border-2 border-black"></td>
                    </tr>
                  ))
                ) : (
                  obitos.map((o) => (
                    <tr key={o.id} className="h-10">
                      <td className="border-2 border-black uppercase">{o.numDo}</td>
                      <td className="border-2 border-black uppercase">{o.falecido}</td>
                      <td className="border-2 border-black uppercase">{o.idade}</td>
                      <td className="border-2 border-black uppercase">{o.mae}</td>
                      <td className="border-2 border-black uppercase">{o.tipo}</td>
                      <td className="border-2 border-black uppercase">{o.data}</td>
                      <td className="border-2 border-black uppercase">{o.ubsMed}</td>
                      <td className="border-2 border-black uppercase">{o.ret}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {obitos.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <span className="text-[100px] font-black tracking-widest text-slate-800 rotate-[-5deg]">SEM OCORRÊNCIA</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between items-end">
            <div className="border-2 border-black p-3 w-[450px] text-[10px] font-medium leading-relaxed">
              <p className="font-bold mb-1">Observação - INDICADORES:</p>
              <p>• Proporção de Causa mal definida investigados</p>
              <p>• Proporção de Óbitos fetais investigados</p>
              <p>• Proporção de Óbitos infantis investigados</p>
              <p>• Proporção de MIF investigados</p>
            </div>

            <div className="text-right text-xs font-bold">
              <p className="mb-8">ENVIADO WHATSAPP EM: {dataHoje}</p>
              <div className="border-t border-black pt-1 w-80 ml-auto">
                <p>Carimbo e assinatura do Enfº ou Médico (a)</p>
                <p className="uppercase mt-1 text-sm">{nomeProf || 'NÃO INFORMADO'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}