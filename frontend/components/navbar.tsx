"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, UserCircle, LogOut, Shield, LayoutDashboard, ChevronDown } from 'lucide-react';
import { encerrarSessao, getUsuario } from '@/lib/auth/session';

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  
  const router = useRouter();
  const pathname = usePathname(); // Sensor de qual página estamos

  useEffect(() => {
    setUsuario(getUsuario());
  }, [pathname]);

  const handleLogout = () => {
    encerrarSessao();
    setUsuario(null);
    router.push('/login');
  };

  // ==========================================
  // A MÁGICA: Oculta a Navbar nas áreas restritas
  // ==========================================
  if (pathname.startsWith('/painel') || pathname.startsWith('/admin') || pathname.startsWith('/acesso')) {
    return null; 
  }

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Lado Esquerdo: Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
            <div className="bg-blue-600 text-white p-2.5 rounded-xl group-hover:rotate-3 transition-transform shadow-lg shadow-blue-600/20">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-slate-900 leading-tight">Portal Saúde</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Marechal Deodoro - AL</p>
            </div>
          </Link>

          {/* Centro: Links de Navegação (Desktop) */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link href="/" className="text-slate-600 hover:text-blue-600 px-4 py-2 rounded-lg font-medium transition-all hover:bg-blue-50">Início</Link>
            <Link href="#coordenacoes" className="text-slate-600 hover:text-blue-600 px-4 py-2 rounded-lg font-medium transition-all hover:bg-blue-50">Coordenações</Link>
            
            {/* SUBMENU DE SISTEMAS (Dropdown Animado) */}
            <div className="relative group">
              <button className="text-slate-600 hover:text-blue-600 px-4 py-2 rounded-lg font-medium transition-all hover:bg-blue-50 flex items-center gap-1">
                Sistemas
                <ChevronDown size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:rotate-180 transition-all duration-300" />
              </button>

              {/* Caixa Suspensa */}
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left scale-95 group-hover:scale-100 overflow-hidden">
                <div className="p-2 flex flex-col gap-1">
                <Link 
                  href="https://marechaldeodoro-al.datasysconsultoria.com.br/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                >
                  e-SUS APS / PEC
                </Link>
              </div>
              </div>
            </div>

            <Link href="#noticias" className="text-slate-600 hover:text-blue-600 px-4 py-2 rounded-lg font-medium transition-all hover:bg-blue-50">Comunicados</Link>
          </div>

          {/* Lado Direito: Perfil / Acesso */}
          <div className="hidden lg:flex items-center gap-4">
            {usuario ? (
              <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 leading-none mb-1">{usuario.nome}</p>
                  <p className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider">
                    {usuario.cargo}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* NOVO BOTÃO: Voltar para o Painel para TODOS logados */}
                  <Link href="/painel" className="px-4 py-2 text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all border border-blue-100 flex items-center gap-2">
                    <LayoutDashboard size={18} /> Meu Painel
                  </Link>
                  
                  <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Encerrar Sessão">
                    <LogOut size={22} />
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/10 active:scale-95">
                <UserCircle size={20} />
                Acesso Restrito
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="lg:hidden flex items-center">
            <button onClick={() => setMenuAberto(!menuAberto)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              {menuAberto ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {menuAberto && (
        <div className="lg:hidden bg-white border-t border-slate-100 animate-in slide-in-from-top duration-300 shadow-xl overflow-y-auto max-h-[85vh]">
          <div className="px-4 py-6 space-y-2">
            
            {usuario && (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
                <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                  <UserCircle size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{usuario.nome}</p>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{usuario.cargo}</p>
                </div>
              </div>
            )}

            <Link href="/" onClick={() => setMenuAberto(false)} className="block px-4 py-3 rounded-xl text-slate-700 font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors">Início</Link>
            <Link href="#noticias" onClick={() => setMenuAberto(false)} className="block px-4 py-3 rounded-xl text-slate-700 font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors">Comunicados</Link>
            <Link href="#coordenacoes" onClick={() => setMenuAberto(false)} className="block px-4 py-3 rounded-xl text-slate-700 font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors">Coordenações</Link>
            
            {/* SUBMENU SISTEMAS MOBILE */}
            <div className="px-4 py-2">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Sistemas</p>
              <div className="flex flex-col pl-3 border-l-2 border-slate-100 gap-1">
                <Link href="https://marechaldeodoro-al.datasysconsultoria.com.br/" onClick={() => setMenuAberto(false)} className="py-2.5 px-3 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl">e-SUS APS / PEC</Link>

              </div>
            </div>
            
            {/* NOVO BOTÃO: Aparece para todos os logados no mobile também */}
            {usuario && (
              <Link href="/painel" onClick={() => setMenuAberto(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-blue-600 font-bold bg-blue-50 border border-blue-100 mt-2">
                <LayoutDashboard size={20} /> Meu Painel
              </Link>
            )}

            <div className="pt-4 mt-4 border-t border-slate-100">
              {usuario ? (
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-4 rounded-2xl font-bold hover:bg-red-100 transition-colors">
                  <LogOut size={20} /> Sair do Sistema
                </button>
              ) : (
                <Link href="/login" onClick={() => setMenuAberto(false)} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20">
                  <UserCircle size={20} /> Acesso Restrito
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}