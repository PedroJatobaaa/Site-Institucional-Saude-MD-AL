import React from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Megaphone, ShieldCheck } from 'lucide-react';

const LINK_ESUS = 'https://marechaldeodoro-al.datasysconsultoria.com.br/';

export default function HeroInstitucional() {
  return (
    <section className="relative z-10 mt-0 pt-8 md:pt-10 px-4 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white shadow-2xl shadow-black/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-15 -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 p-8 md:p-12 lg:p-14 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300 mb-6">
              <ShieldCheck size={14} />
              Marechal Deodoro — AL
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4">
              Secretaria Municipal de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Saúde
              </span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              Portal oficial de comunicados, serviços digitais e informações das coordenações da SMS.
              Acompanhe as atualizações e acesse os sistemas autorizados para profissionais de saúde.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30"
            >
              Acesso Restrito
              <ArrowRight size={18} />
            </Link>
            <a
              href="#noticias"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-xl transition-all border border-white/10"
            >
              <Megaphone size={18} />
              Ver comunicados
            </a>
            <a
              href={LINK_ESUS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold px-6 py-3.5 rounded-xl transition-all border border-emerald-500/20"
            >
              e-SUS APS / PEC
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
