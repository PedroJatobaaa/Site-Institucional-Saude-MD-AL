import React from 'react';
import { Calendar, Megaphone } from 'lucide-react';

export type ComunicadoDestaque = {
  id: string;
  titulo: string;
  sigla: string;
  data_publicacao?: string | null;
};

function formatarData(data?: string | null): string {
  if (!data) return '';
  try {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

type ComunicadosDestaqueProps = {
  comunicados: ComunicadoDestaque[];
};

export default function ComunicadosDestaque({ comunicados }: ComunicadosDestaqueProps) {
  return (
    <section id="noticias" className="py-16 md:py-20 bg-slate-50 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-3">
              <Megaphone size={14} />
              Em destaque
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Últimos <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Comunicados</span>
            </h2>
            <p className="text-slate-500 mt-2 text-lg">
              Publicações recentes das coordenações da Secretaria Municipal de Saúde.
            </p>
          </div>
          <a
            href="#coordenacoes"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
          >
            Ver todas as coordenações →
          </a>
        </div>

        {comunicados.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0">
            {comunicados.map((comunicado) => (
              <article
                key={comunicado.id}
                className="snap-start shrink-0 w-[85vw] sm:w-[320px] md:w-auto bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_32px_rgb(37,99,235,0.08)] hover:border-blue-100 transition-all duration-300"
              >
                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  {comunicado.sigla}
                </span>
                <h3 className="font-bold text-slate-800 leading-snug mb-3 line-clamp-3">
                  {comunicado.titulo}
                </h3>
                {comunicado.data_publicacao && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <Calendar size={13} />
                    {formatarData(comunicado.data_publicacao)}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <Megaphone size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Nenhum comunicado publicado no momento.</p>
          </div>
        )}
      </div>
    </section>
  );
}
