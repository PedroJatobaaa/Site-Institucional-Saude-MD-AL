"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { salvarSessao } from '@/lib/auth/session';
import { limparNumeros, mascaraCPF } from '@/lib/profissionais/documentos';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function Login() {
  const router = useRouter();

  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const [precisaRedefinir, setPrecisaRedefinir] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [tokenTemporario, setTokenTemporario] = useState('');
  const [emailConta, setEmailConta] = useState('');

  const handleLoginChange = (valor: string) => {
    if (valor.includes('@')) {
      setLogin(valor);
      return;
    }

    const digitos = limparNumeros(valor);
    if (digitos.length > 0 && /^\d*$/.test(digitos)) {
      setLogin(mascaraCPF(valor));
      return;
    }

    setLogin(valor);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resposta = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), senha }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        if (dados.precisa_redefinir_senha) {
          setPrecisaRedefinir(true);
          setTokenTemporario(dados.token);
          setEmailConta(dados.email || '');
          setLoading(false);
          return;
        }

        if (dados.token) {
          const usuario = dados.usuario ?? dados;
          salvarSessao(dados.token, usuario);
        }

        setLoading(false);
        router.push('/painel');
      } else {
        setLoading(false);
        alert('⚠️ Acesso negado: ' + (dados.erro || dados.error || dados.mensagem || 'Credenciais inválidas.'));
      }
    } catch (erro) {
      console.error('Erro de conexão:', erro);
      setLoading(false);
      alert('⚠️ Erro de conexão. Verifique se o backend está rodando!');
    }
  };

  const entrarNoPainel = async (identificador: string, senhaLogin: string) => {
    const resposta = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: identificador, senha: senhaLogin }),
    });

    const dados = await resposta.json();

    if (!resposta.ok || !dados.token) {
      throw new Error(dados.erro || dados.error || 'Não foi possível concluir o acesso.');
    }

    salvarSessao(dados.token, dados.usuario ?? dados);
    router.push('/painel');
  };

  const handleAtualizarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      return alert('As senhas não coincidem!');
    }
    if (novaSenha.length < 6) {
      return alert('A nova senha deve ter pelo menos 6 caracteres.');
    }
    if (!emailConta) {
      return alert('Não foi possível identificar a conta. Faça login novamente.');
    }

    setLoading(true);
    try {
      const resposta = await fetch(`${API_URL}/api/auth/redefinir-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTemporario}`,
        },
        body: JSON.stringify({ email: emailConta, novaSenha }),
      });

      if (!resposta.ok) {
        const dados = await resposta.json();
        alert('⚠️ Erro ao atualizar senha: ' + (dados.erro || 'Tente novamente.'));
        return;
      }

      await entrarNoPainel(emailConta, novaSenha);
    } catch (erro) {
      alert(erro instanceof Error ? erro.message : 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 -ml-20 -mt-20"></div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
              <ShieldCheck size={32} className="text-blue-400" />
            </div>
            <h1 className="text-4xl font-black mb-2">
              Portal<span className="text-blue-400">Saúde</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Sistema integrado de gestão em saúde. Acesso restrito para profissionais autorizados.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Profissionais listados no CNES: Entrar em contato com a equipe de TI para liberar seu acesso.
            </p>
          </div>

          <div className="relative z-10">
            <p className="text-xs text-slate-400 mb-2">Ainda não está no sistema?</p>
            <Link
              href="/acesso"
              className="inline-flex items-center gap-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all border border-white/10"
            >
              Solicitar Acesso <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="md:w-1/2 p-10 flex flex-col justify-center">
          {precisaRedefinir ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <KeyRound size={24} className="text-rose-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Atualização de Segurança</h2>
              <p className="text-sm text-slate-500 mb-6">
                Crie uma nova senha pessoal para concluir seu primeiro acesso ao portal.
              </p>

              <form onSubmit={handleAtualizarSenha} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nova Senha</label>
                  <input
                    required
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Confirmar Nova Senha
                  </label>
                  <input
                    required
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Repita a senha"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all mt-2"
                >
                  {loading ? 'Salvando...' : 'Salvar e Acessar'}
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Acesso Restrito</h2>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF ou E-mail</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    <input
                      required
                      type="text"
                      value={login}
                      onChange={(e) => handleLoginChange(e.target.value)}
                      className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                      placeholder="000.000.000-00 ou seu e-mail"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    <input
                      required
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full p-3 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition-all"
                      placeholder="Sua senha"
                      autoComplete="current-password"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl transition-all mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? 'Validando...' : 'Entrar no Sistema'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
