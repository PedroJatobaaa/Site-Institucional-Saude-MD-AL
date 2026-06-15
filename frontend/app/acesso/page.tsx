"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Lock, Briefcase, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import UnidadeLotacaoSelect from '@/components/UnidadeLotacaoSelect';
import {
  aoMudarNivelLotacao,
  lotacaoCompleta,
} from '@/lib/usuarios/lotacao';

export default function SolicitarAcesso() {
  const router = useRouter();

  // Estados do Formulário
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    nivelLotacao: '',
    unidadeLotacao: '',
    cargo: '',
    email: '',
    senha: '',
    confirmaSenha: '',
    aceitaTermos: false
  });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmaSenha, setMostrarConfirmaSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  // Máscara de CPF
  const mascaraCPF = (valor: string) => {
    let v = valor.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return v;
  };

  const handleMudanca = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let valorFinal = value;
    if (name === 'cpf') valorFinal = mascaraCPF(value);
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
      return;
    }

    setFormData({ ...formData, [name]: valorFinal });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.senha !== formData.confirmaSenha) {
      alert("⚠️ As senhas não coincidem. Por favor, verifique.");
      return;
    }
    if (formData.senha.length < 6) {
      alert("⚠️ A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (formData.cpf.length !== 14) {
      alert("⚠️ Por favor, informe um CPF completo e válido.");
      return;
    }
    if (!formData.aceitaTermos) {
      alert("⚠️ É necessário aceitar o Termo de Sigilo para solicitar o acesso.");
      return;
    }
    if (!lotacaoCompleta(formData.nivelLotacao, formData.unidadeLotacao)) {
      alert("⚠️ Selecione a categoria e a unidade de lotação.");
      return;
    }

    setLoading(true);

    try {
      // Fazendo a chamada REAL para o seu banco de dados na porta 3333!
      const resposta = await fetch('/api/auth/registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          cargo: formData.cargo,
          cpf: formData.cpf,
          nivel_lotacao: formData.nivelLotacao,
          unidade_lotacao: formData.unidadeLotacao,
        }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        // Se o banco responder com sucesso, mostra a mensagem e manda pro login
        alert("✅ " + (dados.mensagem || "Solicitação enviada com sucesso!"));
        setLoading(false);
        router.push('/login');
      } else {
        // Se der erro (ex: E-mail já cadastrado), avisa o usuário
        alert("⚠️ Erro: " + (dados.erro || "Não foi possível realizar o cadastro."));
        setLoading(false);
      }
      
    } catch (error) {
      console.error("Erro ao enviar cadastro:", error);
      alert("⚠️ Erro de conexão com o servidor. O backend da porta 3333 está ligado?");
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        
        {/* TOPO DA TELA */}
        <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
           <h1 className="text-3xl font-black relative z-10">Portal<span className="text-blue-400">Saúde</span></h1>
           <p className="text-slate-300 mt-2 relative z-10">
             Solicitação de Acesso Institucional
           </p>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <div className="p-8">
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Já consta na base do CNES? Não solicite acesso aqui — vá direto ao{' '}
            <Link href="/login" className="font-bold underline hover:text-blue-700">
              login
            </Link>{' '}
            com seu CPF e a senha inicial informada pela administração.
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* BLOCO 1: DADOS PESSOAIS */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                <User size={14} /> 1. Dados Pessoais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nome Completo *</label>
                  <input 
                    required type="text" name="nome" 
                    value={formData.nome} onChange={handleMudanca}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                    placeholder="Ex: Ana Maria Silva" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">CPF *</label>
                  <input 
                    required type="text" name="cpf" 
                    value={formData.cpf} onChange={handleMudanca}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium" 
                    placeholder="000.000.000-00" 
                  />
                </div>
              </div>
            </div>

            {/* BLOCO 2: VÍNCULO INSTITUCIONAL */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                <Briefcase size={14} /> 2. Vínculo Institucional
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <UnidadeLotacaoSelect
                    required
                    nivelLotacao={formData.nivelLotacao}
                    unidadeLotacao={formData.unidadeLotacao}
                    onNivelChange={(nivel) => {
                      const lotacao = aoMudarNivelLotacao(nivel);
                      setFormData({
                        ...formData,
                        nivelLotacao: lotacao.nivelLotacao,
                        unidadeLotacao: lotacao.unidadeLotacao,
                      });
                    }}
                    onUnidadeChange={(unidade) =>
                      setFormData({ ...formData, unidadeLotacao: unidade })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cargo / Função *</label>
                  <input 
                    required type="text" name="cargo" 
                    value={formData.cargo} onChange={handleMudanca}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                    placeholder="Ex: Médico, Enfermeiro, Recepção..." 
                  />
                </div>
              </div>
            </div>

            {/* BLOCO 3: CREDENCIAIS DE ACESSO */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                <Lock size={14} /> 3. Credenciais de Acesso
              </h3>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">E-mail Profissional *</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3.5 text-slate-400" />
                  <input 
                    required type="email" name="email" 
                    value={formData.email} onChange={handleMudanca}
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                    placeholder="seuemail@email.com" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SENHA */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Crie uma Senha *</label>
                  <div className="relative">
                    <input 
                      required 
                      type={mostrarSenha ? "text" : "password"} 
                      name="senha" 
                      value={formData.senha} onChange={handleMudanca}
                      className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium" 
                      placeholder="Mínimo 6 caracteres" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* CONFIRMAÇÃO DE SENHA */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Confirme a Senha *</label>
                  <div className="relative">
                    <input 
                      required 
                      type={mostrarConfirmaSenha ? "text" : "password"} 
                      name="confirmaSenha" 
                      value={formData.confirmaSenha} onChange={handleMudanca}
                      className={`w-full p-3 pr-10 bg-slate-50 border rounded-xl outline-none font-medium transition-all
                        ${formData.confirmaSenha && formData.senha !== formData.confirmaSenha 
                          ? 'border-red-400 focus:ring-2 focus:ring-red-400' 
                          : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white'}`} 
                      placeholder="Repita sua senha" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setMostrarConfirmaSenha(!mostrarConfirmaSenha)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {mostrarConfirmaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.confirmaSenha && formData.senha !== formData.confirmaSenha && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">As senhas não coincidem.</p>
                  )}
                </div>
              </div>
            </div>

            {/* TERMOS DE SIGILO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-6 flex items-start gap-3">
              <input 
                type="checkbox" 
                name="aceitaTermos"
                id="aceitaTermos"
                checked={formData.aceitaTermos} onChange={handleMudanca}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="aceitaTermos" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                Declaro que as informações acima são verdadeiras. Concordo em manter <strong>absoluto sigilo</strong> sobre os dados de pacientes acessados nesta plataforma, conforme as diretrizes da Lei Geral de Proteção de Dados (LGPD).
              </label>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* LINK MANDA DE VOLTA PARA A TELA DE LOGIN */}
              <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                Voltar para o Login
              </Link>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? 'Processando...' : 'Solicitar Acesso'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}