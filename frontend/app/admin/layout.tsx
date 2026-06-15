"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, ChevronLeft } from 'lucide-react';
import { getUsuario } from '@/lib/auth/session';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [autorizado, setAutorizado] = useState(false);
  const ehHub = pathname === '/admin';

  useEffect(() => {
    const user = getUsuario();
    if (!user) {
      router.push('/login');
      return;
    }
    if (!user.permissoes?.includes('admin')) {
      router.push('/painel');
      return;
    }
    setAutorizado(true);
  }, [router]);

  if (!autorizado) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-700 p-2 rounded-xl text-white">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-900 leading-tight">Gestão de Acessos</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administração</p>
            </div>
          </div>
          <Link
            href={ehHub ? '/painel' : '/admin'}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            <ChevronLeft size={16} />
            {ehHub ? 'Voltar ao Painel' : 'Voltar ao Hub'}
          </Link>
        </div>
      </header>
      <main className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-900">{children}</main>
    </div>
  );
}
