import React from 'react';
import { HeartPulse, Stethoscope, ShieldAlert, Pill, FileText, ArrowRight, Monitor, ExternalLink } from 'lucide-react';
import Carrossel from '@/components/Carrossel';

const iconMap: Record<string, React.ElementType> = {
  HeartPulse,
  Stethoscope,
  ShieldAlert,
  Pill,
  FileText,
  Monitor
};

export default async function PaginaInicial() {
  const resCoord = await fetch('/api/coordenacoes', { cache: 'no-store' });
  const coordenacoes = await resCoord.json();

  const resBanner = await fetch('/api/carrossel', { cache: 'no-store' });
  const banners = await resBanner.json();

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      
      <Carrossel banners={banners} />

      {/* Fundo com um gradiente super sutil para dar profundidade */}
      <section className="py-24 px-4 max-w-7xl mx-auto relative">
        
        {/* Elemento decorativo de fundo (Glow Azul) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

        <div className="mb-16 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Mural das <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Coordenações</span>
          </h2>
          <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto">
            Acompanhe os comunicados oficiais e as últimas atualizações de cada setor da Secretaria Municipal de Saúde.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {coordenacoes.map((coord: any) => {
            const Icone = iconMap[coord.icone] || FileText;

            return (
              // Card super moderno com animações no hover
              <div 
                key={coord.id} 
                className="group relative bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(37,99,235,0.08)] border border-white hover:border-blue-100 transition-all duration-500 flex flex-col h-full hover:-translate-y-1"
              >
                
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    {/* Ícone com mudança de cor no hover */}
                    <div className="bg-slate-50 text-blue-600 p-4 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                      <Icone size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl text-slate-900 tracking-tight">{coord.sigla}</h3>
                      <p className="text-sm font-medium text-slate-500">{coord.nome}</p>
                    </div>
                  </div>
                  
                  {/* Badge sutil mostrando a quantidade de avisos */}
                  {coord.avisos?.length > 0 && (
                    <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full shrink-0">
                      {coord.avisos.length} {coord.avisos.length === 1 ? 'aviso' : 'avisos'}
                    </span>
                  )}
                </div>

                {/* Descrição da Coordenação */}
                <p className="text-slate-600 text-base mb-8 flex-grow leading-relaxed">
                  {coord.descricao}
                </p>

                {/* Área de Avisos Interativa (Acordeão) */}
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Últimas Atualizações
                  </h4>
                  
                  {coord.avisos && coord.avisos.length > 0 ? (
                    <ul className="space-y-4">
                      {coord.avisos.map((aviso: any) => (
                        <li key={aviso.id}>
                          {/* A tag DETAILS cria a mágica de expandir sem precisar de Javascript! */}
                          <details className="group/aviso marker:content-[''] [&::-webkit-details-marker]:hidden">
                            
                            {/* O SUMMARY é a parte que fica sempre visível e clicável */}
                            <summary className="flex items-start gap-3 cursor-pointer list-none select-none">
                              <ArrowRight 
                                size={16} 
                                className="text-slate-300 mt-1 shrink-0 group-hover/aviso:text-blue-600 group-open/aviso:rotate-90 group-open/aviso:text-blue-600 transition-all duration-300" 
                              />
                              <span className="text-sm font-medium text-slate-700 group-hover/aviso:text-blue-600 group-open/aviso:text-blue-600 transition-colors leading-snug">
                                {aviso.titulo}
                              </span>
                            </summary>
                            
                            {/* ESTA DIV É O CONTEÚDO EXPANDIDO */}
                            <div className="pl-7 pr-2 py-3 mt-1 text-sm text-slate-600 border-l-2 border-blue-100 ml-[7px]">
                              
                              {/* Mostra a descrição apenas se ela existir */}
                              {aviso.descricao && (
                                <p className="whitespace-pre-line mb-3 leading-relaxed">
                                  {aviso.descricao}
                                </p>
                              )}
                              
                              {/* Mostra o botão de anexo apenas se existir o link */}
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
          })}
        </div>
      </section>
    </main>
  );
} 