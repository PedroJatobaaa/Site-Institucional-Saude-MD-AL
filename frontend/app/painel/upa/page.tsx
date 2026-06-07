"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowLeft, ClipboardList } from 'lucide-react';
import { getUsuario } from '@/lib/auth/session';

export default function ModuloUPA() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const userObj = getUsuario();
    if (!userObj) {
      router.push('/login');
      return;
    }
    if (!userObj.permissoes?.includes('upa_acesso') && !userObj.permissoes?.includes('admin')) {
      alert("Acesso restrito aos servidores da UPA.");
      router.push('/painel');
      return;
    }

    setUsuario(userObj);
  }, []);

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* CABEÇALHO */}
        <div className="flex items-center gap-4">
          <Link href="/painel" className="text-slate-400 hover:text-rose-600 bg-white p-2 rounded-xl border border-slate-200 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Activity className="text-rose-600" size={32} />
              Portal UPA
            </h1>
            <p className="text-slate-500 mt-1">Ferramentas de suporte à Urgência e Emergência.</p>
          </div>
        </div>

        {/* ÁREA DAS FERRAMENTAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* BOTÃO DA PRESCRIÇÃO MÉDICA */}
          <Link 
            href="/painel/upa/prescricao" 
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-rose-300 transition-all group flex flex-col items-start gap-4"
          >
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-105 transition-transform">
              <ClipboardList size={32} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-xl">Prescrição Médica</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Busca de pacientes, receituário digital dinâmico e geração de PDF.
              </p>
            </div>
          </Link>

        </div>

      </div>
    </div>
  );
}