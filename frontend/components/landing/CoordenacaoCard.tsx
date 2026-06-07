import React from 'react';
import {
  HeartPulse,
  Stethoscope,
  ShieldAlert,
  Pill,
  FileText,
  Monitor,
  ArrowRight,
  ExternalLink,
  Calendar,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  HeartPulse,
  Stethoscope,
  ShieldAlert,
  Pill,
  FileText,
  Monitor,
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

type Aviso = {
  id: string;
  titulo: string;
  descricao?: string | null;
  link_anexo?: string | null;
  data_publicacao?: string | null;
};

type CoordenacaoCardProps = {
  coord: {
    id: string;
    sigla: string;
    nome: string;
    descricao: string;
    icone: string;
    avisos?: Aviso[];
  };
};

export default function CoordenacaoCard({ coord }: CoordenacaoCardProps) {
  const Icone = iconMap[coord.icone] || FileText;

  return (
    <div className="group relative bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(37,99,235,0.08)] border border-white hover:border-blue-100 transition-all duration-500 flex flex-col h-full hover:-translate-y-1">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 text-blue-600 p-4 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-sm">
            <Icone size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-bold text-2xl text-slate-900 tracking-tight">{coord.sigla}</h3>
            <p className="text-sm font-medium text-slate-500">{coord.nome}</p>
          </div>
        </div>

        {coord.avisos && coord.avisos.length > 0 && (
          <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full shrink-0">
            {coord.avisos.length} {coord.avisos.length === 1 ? 'aviso' : 'avisos'}
          </span>
        )}
      </div>

      <p className="text-slate-600 text-base mb-8 flex-grow leading-relaxed">{coord.descricao}</p>

      <div className="pt-6 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Últimas Atualizações
        </h4>

        {coord.avisos && coord.avisos.length > 0 ? (
          <ul className="space-y-4">
            {coord.avisos.map((aviso) => (
              <li key={aviso.id}>
                <details className="group/aviso marker:content-[''] [&::-webkit-details-marker]:hidden">
                  <summary className="flex items-start gap-3 cursor-pointer list-none select-none">
                    <ArrowRight
                      size={16}
                      className="text-slate-300 mt-1 shrink-0 group-hover/aviso:text-blue-600 group-open/aviso:rotate-90 group-open/aviso:text-blue-600 transition-all duration-300"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-700 group-hover/aviso:text-blue-600 group-open/aviso:text-blue-600 transition-colors leading-snug block">
                        {aviso.titulo}
                      </span>
                      {aviso.data_publicacao && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-slate-400">
                          <Calendar size={11} />
                          {formatarData(aviso.data_publicacao)}
                        </span>
                      )}
                    </div>
                  </summary>

                  <div className="pl-7 pr-2 py-3 mt-1 text-sm text-slate-600 border-l-2 border-blue-100 ml-[7px]">
                    {aviso.descricao && (
                      <p className="whitespace-pre-line mb-3 leading-relaxed">{aviso.descricao}</p>
                    )}

                    {aviso.link_anexo && (
                      <a
                        href={aviso.link_anexo}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors shadow-sm"
                      >
                        <ExternalLink size={14} />
                        Acessar Anexo / Link
                      </a>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 italic flex items-center gap-2">
            Nenhum comunicado recente.
          </p>
        )}
      </div>
    </div>
  );
}
