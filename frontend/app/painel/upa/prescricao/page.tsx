"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Plus, Trash2, Search, UserPlus, X, CheckCircle2, Edit3, Save } from 'lucide-react';
import Link from 'next/link';
import { ReceitaPDF } from './ReceitaPDF';

export default function NovaPrescricao() {
  const router = useRouter();

  // Estados do Paciente e Busca
  const [busca, setBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  
  // Estados do Modal de Cadastro
  const [modalAberto, setModalAberto] = useState(false);
  const [loadingCadastro, setLoadingCadastro] = useState(false);
  const [novoPaciente, setNovoPaciente] = useState({ cpf: '', nome: '', data_nascimento: '', sexo: '', registro_hc: '' });

  // Estados da Prescrição
  const [setor, setSetor] = useState('');
  const [leito, setLeito] = useState('');
  const [custo, setCusto] = useState(''); // NOVO: Campo de Custo
  const [itens, setItens] = useState([
    { id: Date.now(), tipo: 'MEDICAMENTO', descricao: '', horario: '', dev: '' } // DEV incluído
  ]);

  // Função para aplicar a máscara de CPF (000.000.000-00)
  const mascaraCPF = (valor: string) => {
    let v = valor.replace(/\D/g, ""); // Remove tudo o que não é dígito
    if (v.length > 11) v = v.substring(0, 11); // Limita a 11 números
    
    // Coloca os pontos e o traço
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    
    return v;
  };

  // Motor de Impressão PDF
  const contentRef = useRef<HTMLDivElement>(null);
  
  const gerarPDF = useReactToPrint({
    contentRef,
    documentTitle: `Prescricao_${pacienteSelecionado?.nome || 'Paciente'}`,
  });

  const handlePrint = () => {
    // 1. Verifica se tem paciente selecionado
    if (!pacienteSelecionado) {
      alert("Por favor, selecione ou cadastre um paciente antes de gerar o PDF.");
      return;
    }

    // 2. NOVA TRAVA: Verifica se o paciente tem CPF
    if (!pacienteSelecionado.cpf || pacienteSelecionado.cpf.trim() === '') {
      alert(" ATENÇÃO: É obrigatório informar o CPF do paciente para gerar a prescrição.");
      setEditando(true); // Já abre os campos para o médico digitar o CPF!
      return;
    }

    // 3. Se passou pelas duas travas, gera o PDF
    gerarPDF();
  };

  // 1. Efeito de Busca Inteligente
  useEffect(() => {
    if (busca.length < 3) {
      setResultadosBusca([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('saude_token');
        const res = await fetch(`http://localhost:3333/api/upa/pacientes?q=${busca}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dados = await res.json();
        if (Array.isArray(dados)) setResultadosBusca(dados);
      } catch (error) {
        console.error("Erro ao buscar pacientes", error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [busca]);

  // 2. Selecionar Paciente
  const selecionarPaciente = (paciente: any) => {
    setPacienteSelecionado(paciente);
    setBusca('');
    setResultadosBusca([]);
    setEditando(false);
  };

  // 3. Salvar Edição do Paciente
  const salvarEdicaoPaciente = async () => {
    try {
      const token = localStorage.getItem('saude_token');
      const res = await fetch(`http://localhost:3333/api/upa/pacientes/${pacienteSelecionado.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          nome: pacienteSelecionado.nome,
          cpf: pacienteSelecionado.cpf,
          cns: pacienteSelecionado.cns,
          data_nascimento: pacienteSelecionado.data_nascimento,
          registro_hc: pacienteSelecionado.registro_hc // Incluído na edição
        })
      });

      const dados = await res.json();

      if (res.ok) {
        setPacienteSelecionado(dados);
        setEditando(false);
        alert("Dados atualizados com sucesso!");
      } else {
        alert(dados.erro || "Erro ao atualizar.");
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  // 4. Cadastrar Novo Paciente
  const handleCadastrarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCadastro(true);
    const token = localStorage.getItem('saude_token');

    try {
      const res = await fetch('http://localhost:3333/api/upa/pacientes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(novoPaciente)
      });

      const dados = await res.json();

      if (res.ok) {
        setPacienteSelecionado(dados);
        setModalAberto(false);
        setNovoPaciente({ cpf: '', nome: '', data_nascimento: '', sexo: '', registro_hc: '' });
      } else {
        alert(dados.erro || "Erro ao cadastrar.");
      }
    } catch (error) {
      alert("Erro de conexão com o servidor.");
    } finally {
      setLoadingCadastro(false);
    }
  };

  // Funções da Tabela
  const adicionarLinha = () => setItens([...itens, { id: Date.now(), tipo: 'MEDICAMENTO', descricao: '', horario: '', dev: '' }]);
  const removerLinha = (id: number) => { if (itens.length > 1) setItens(itens.filter(item => item.id !== id)); };
  const atualizarItem = (id: number, campo: string, valor: string) => {
    setItens(itens.map(item => item.id === id ? { ...item, [campo]: valor } : item));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* TOPO */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <Link href="/painel/upa" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft size={20} className="text-slate-500" />
            </Link>
            <h1 className="text-xl font-bold text-slate-800">Nova Prescrição Médica</h1>
          </div>
          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-sm"
          >
            <Printer size={18} /> Gerar PDF
          </button>
        </div>

        {/* IDENTIFICAÇÃO DO PACIENTE */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Search size={16} /> Identificação do Paciente
            </h2>
            {pacienteSelecionado && (
               <button 
                onClick={() => editando ? salvarEdicaoPaciente() : setEditando(true)}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-lg transition-all ${editando ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {editando ? <><Save size={14} /> Salvar Alterações</> : <><Edit3 size={14} /> Editar Cadastro</>}
              </button>
            )}
          </div>
          
          {!pacienteSelecionado ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              <div className="md:col-span-2 relative">
                <input 
                  type="text" 
                  placeholder="Digite o Nome ou CPF do paciente..." 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                
                {resultadosBusca.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                    {resultadosBusca.map(pac => (
                      <button 
                        key={pac.id}
                        onClick={() => selecionarPaciente(pac)}
                        className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{pac.nome}</p>
                          <p className="text-xs text-slate-500">CPF: {pac.cpf || 'Não informado'} • Nasc: {pac.data_nascimento}</p>
                        </div>
                        <Plus size={18} className="text-rose-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button 
                onClick={() => setModalAberto(true)}
                className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all font-bold"
              >
                <UserPlus size={20} /> Novo Cadastro
              </button>
            </div>
          ) : (
            <div className={`transition-all duration-300 p-4 rounded-xl border ${editando ? 'bg-white border-emerald-500 shadow-md' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-emerald-600 uppercase">Nome Completo</label>
                      <input 
                        disabled={!editando}
                        className={`w-full bg-transparent font-bold text-emerald-900 text-lg outline-none border-b-2 ${editando ? 'border-emerald-500' : 'border-transparent'}`}
                        value={pacienteSelecionado.nome}
                        onChange={(e) => setPacienteSelecionado({...pacienteSelecionado, nome: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-emerald-600 uppercase">Registro (Prontuário)</label>
                      <input 
                        disabled={!editando}
                        placeholder="Nº Registro..."
                        className={`w-full bg-transparent font-bold text-emerald-900 text-lg outline-none border-b-2 ${editando ? 'border-emerald-500' : 'border-transparent'}`}
                        value={pacienteSelecionado.registro_hc || ''}
                        onChange={(e) => setPacienteSelecionado({...pacienteSelecionado, registro_hc: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-emerald-600 uppercase">CPF</label>
                      <input 
                        disabled={!editando}
                        placeholder="000.000.000-00"
                        className={`w-full bg-transparent font-medium text-emerald-700 outline-none border-b-2 ${editando ? 'border-emerald-500' : 'border-transparent'}`}
                        value={pacienteSelecionado.cpf || ''}
                        onChange={(e) => setPacienteSelecionado({...pacienteSelecionado, cpf: mascaraCPF(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-emerald-600 uppercase">Cartão SUS (CNS)</label>
                      <input 
                        disabled={!editando}
                        placeholder="Adicionar CNS..."
                        className={`w-full bg-transparent font-medium text-emerald-700 outline-none border-b-2 ${editando ? 'border-emerald-500' : 'border-transparent'}`}
                        value={pacienteSelecionado.cns || ''}
                        onChange={(e) => setPacienteSelecionado({...pacienteSelecionado, cns: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-emerald-600 uppercase">Data de Nascimento</label>
                      <input 
                        disabled={!editando}
                        className={`w-full bg-transparent font-medium text-emerald-700 outline-none border-b-2 ${editando ? 'border-emerald-500' : 'border-transparent'}`}
                        value={pacienteSelecionado.data_nascimento || ''}
                        onChange={(e) => setPacienteSelecionado({...pacienteSelecionado, data_nascimento: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end justify-start">
                  {!editando ? (
                    <button 
                      onClick={() => setPacienteSelecionado(null)}
                      className="text-emerald-600 hover:text-emerald-800 text-xs font-bold underline flex items-center gap-1"
                    >
                      <X size={14} /> Trocar Paciente
                    </button>
                  ) : (
                    <button 
                      onClick={() => setEditando(false)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold underline"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dados Adicionais da Receita (Setor, Leito, Custo) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase">Setor</label>
               <input 
                 type="text" 
                 value={setor} onChange={(e) => setSetor(e.target.value)}
                 className="w-full border-b border-slate-200 py-1 outline-none focus:border-rose-500 font-medium" 
                 placeholder="Ex: Emergência" 
               />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase">Leito</label>
               <input 
                 type="text" 
                 value={leito} onChange={(e) => setLeito(e.target.value)}
                 className="w-full border-b border-slate-200 py-1 outline-none focus:border-rose-500 font-medium" 
                 placeholder="Ex: 04" 
               />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase">Custo</label>
               <input 
                 type="text" 
                 value={custo} onChange={(e) => setCusto(e.target.value)}
                 className="w-full border-b border-slate-200 py-1 outline-none focus:border-rose-500 font-medium" 
                 placeholder="Ex: Operacional" 
               />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase">Data</label>
               <div className="py-1 font-medium text-slate-700">{new Date().toLocaleDateString('pt-BR')}</div>
             </div>
          </div>
        </div>

        {/* CORPO DA PRESCRIÇÃO */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-[11px] font-black text-slate-400 uppercase w-16 text-center">Nº</th>
                <th className="p-4 text-[11px] font-black text-slate-400 uppercase w-20 text-center">DEV</th>
                <th className="p-4 text-[11px] font-black text-slate-400 uppercase">Prescrição</th>
                <th className="p-4 text-[11px] font-black text-slate-400 uppercase w-48 text-center">Horários</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {itens.map((item, index) => (
                <tr key={item.id} className="group hover:bg-slate-50/50">
                  <td className="p-4 text-center font-bold text-slate-400">{index + 1}</td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      className="w-full p-2 bg-transparent outline-none text-center focus:bg-white focus:ring-1 focus:ring-rose-100 rounded-lg transition-all font-bold text-slate-700"
                      placeholder="-"
                      value={item.dev} onChange={(e) => atualizarItem(item.id, 'dev', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <textarea 
                      className="w-full p-2 bg-transparent outline-none resize-none focus:bg-white focus:ring-1 focus:ring-rose-100 rounded-lg transition-all font-medium text-slate-700"
                      placeholder="Ex: DIPIRONA 1G EV..." rows={1}
                      value={item.descricao} onChange={(e) => atualizarItem(item.id, 'descricao', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      className="w-full p-2 bg-transparent outline-none text-center focus:bg-white focus:ring-1 focus:ring-rose-100 rounded-lg transition-all font-medium text-slate-700"
                      placeholder="Ex: 6/6h"
                      value={item.horario} onChange={(e) => atualizarItem(item.id, 'horario', e.target.value)}
                    />
                  </td>
                  <td className="p-4">
                    <button onClick={() => removerLinha(item.id)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <button onClick={adicionarLinha} className="flex items-center gap-2 text-rose-600 font-bold text-sm hover:bg-rose-100 px-4 py-2 rounded-xl transition-all">
              <Plus size={18} /> Adicionar Item
            </button>
          </div>
        </div>

      </div>

      {/* MODAL NOVO PACIENTE */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><UserPlus size={20} className="text-rose-600"/> Cadastrar Paciente</h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleCadastrarPaciente} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo *</label>
                <input required type="text" value={novoPaciente.nome} onChange={e => setNovoPaciente({...novoPaciente, nome: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF *</label>
                  <input 
                    required 
                    type="text" 
                    value={novoPaciente.cpf} 
                    onChange={e => setNovoPaciente({...novoPaciente, cpf: mascaraCPF(e.target.value)})} 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" 
                    placeholder="000.000.000-00" 
                  />
                </div> 
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nascimento</label>
                  <input type="date" value={novoPaciente.data_nascimento} onChange={e => setNovoPaciente({...novoPaciente, data_nascimento: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
              </div>
              <button type="submit" disabled={loadingCadastro} className="w-full mt-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70">
                {loadingCadastro ? 'Salvando...' : 'Salvar e Selecionar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MOLDE A4 INVISÍVEL PARA IMPRESSÃO */}
      <div className="hidden">
        <ReceitaPDF 
          ref={contentRef}
          paciente={pacienteSelecionado} 
          setor={setor} 
          leito={leito} 
          custo={custo}
          itens={itens} 
        />
      </div>
    </div>
  );
}