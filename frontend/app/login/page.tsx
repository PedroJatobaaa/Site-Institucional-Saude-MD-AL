"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Bate na porta do seu Backend REAL
      const resposta = await fetch('http://localhost:3333/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }), // Manda o email e senha que você digitou
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        if (dados.usuario) {
          localStorage.setItem('saude_usuario', JSON.stringify(dados.usuario));
        } else {
          localStorage.setItem('saude_usuario', JSON.stringify(dados));
        }
        
        if (dados.token) {
          localStorage.setItem('token', dados.token);
          
          // 👇 ADICIONE ESTA LINHA AQUI 👇
          localStorage.setItem('saude_token', dados.token); 
          
          document.cookie = `token=${dados.token}; path=/; max-age=86400; SameSite=Strict`;
        }
        
        setLoading(false);
        
        // 3. Entra no painel com tudo liberado e dados na tela!
        router.push('/painel'); 
      } else {
        // Se errar a senha, mostra a mensagem de erro que o próprio banco mandou
        setLoading(false);
        alert("⚠️ Acesso negado: " + (dados.error || dados.mensagem || "Credenciais inválidas."));
      }
    } catch (erro) {
      console.error("Erro de conexão:", erro);
      setLoading(false);
      alert("⚠️ Erro de conexão. Verifique se o backend (porta 3333) está rodando no terminal!");
    }
  };


  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* LADO ESQUERDO - BEM VINDO */}
        <div className="md:w-1/2 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Efeito visual Azul */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 -ml-20 -mt-20"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
              <ShieldCheck size={32} className="text-blue-400" />
            </div>
            <h1 className="text-4xl font-black mb-2">Portal<span className="text-blue-400">Saúde</span></h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              Sistema integrado de gestão em saúde. Acesso restrito para profissionais autorizados.
            </p>
          </div>

          <div className="relative z-10">
            <p className="text-xs text-slate-400 mb-2">Ainda não tem acesso?</p>
            {/* LINK MANDA PARA A TELA DE ACESSO */}
            <Link 
              href="/acesso" 
              className="inline-flex items-center gap-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all border border-white/10"
            >
              Solicitar Acesso <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* LADO DIREITO - FORMULÁRIO DE LOGIN */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Acesso Restrito</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail Profissional</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  required type="email" 
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                  placeholder="seu.nome@saude.gov.br" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  required 
                  type={mostrarSenha ? "text" : "password"} 
                  value={senha} onChange={(e) => setSenha(e.target.value)}
                  className="w-full p-3 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all" 
                  placeholder="Sua senha" 
                />
                <button 
                  type="button" 
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <button type="button" className="text-xs font-bold text-blue-600 hover:underline">Esqueci minha senha</button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl transition-all mt-4 flex items-center justify-center gap-2"
            >
              {loading ? 'Validando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}