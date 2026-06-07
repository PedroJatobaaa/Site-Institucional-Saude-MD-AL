import React from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, LogIn, Stethoscope, UserPlus } from 'lucide-react';

const LINK_ESUS = 'https://marechaldeodoro-al.datasysconsultoria.com.br/';

const atalhos = [
  {
    titulo: 'Portal do Servidor',
    descricao: 'Acesse módulos internos, documentos e ferramentas do dia a dia.',
    icone: LogIn,
    href: '/login',
    externo: false,
    cor: 'blue',
  },
  {
    titulo: 'e-SUS APS / PEC',
    descricao: 'Prontuário Eletrônico do Cidadão e sistemas da Atenção Primária.',
    icone: Stethoscope,
    href: LINK_ESUS,
    externo: true,
    cor: 'emerald',
  },
  {
    titulo: 'Solicitar acesso',
    descricao: 'Cadastre-se para obter credenciais junto à equipe de TI.',
    icone: UserPlus,
    href: '/acesso',
    externo: false,
    cor: 'violet',
  },
  {
    titulo: 'Comunicados oficiais',
    descricao: 'Veja avisos e atualizações de todas as coordenações.',
    icone: FileText,
    href: '#coordenacoes',
    externo: false,
    cor: 'amber',
  },
] as const;

const coresIcone: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
  emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
  violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
  amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
};

export default function AcessoRapido() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Acesso <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Rápido</span>
          </h2>
          <p className="text-slate-500 mt-3 text-lg max-w-2xl mx-auto">
            Atalhos para os principais serviços digitais da Secretaria Municipal de Saúde.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {atalhos.map((item) => {
            const Icone = item.icone;
            const classes = `group flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-[1.5rem] p-6 border border-slate-100 hover:border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(37,99,235,0.08)] transition-all duration-500 hover:-translate-y-1`;

            const conteudo = (
              <>
                <div
                  className={`${coresIcone[item.cor]} p-4 rounded-2xl w-fit mb-5 transition-colors duration-500 shadow-sm`}
                >
                  <Icone size={26} strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.titulo}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-grow">{item.descricao}</p>
                {item.externo && (
                  <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-slate-400 group-hover:text-blue-600">
                    Link externo <ExternalLink size={12} />
                  </span>
                )}
              </>
            );

            if (item.externo) {
              return (
                <a
                  key={item.titulo}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes}
                >
                  {conteudo}
                </a>
              );
            }

            if (item.href.startsWith('#')) {
              return (
                <a key={item.titulo} href={item.href} className={classes}>
                  {conteudo}
                </a>
              );
            }

            return (
              <Link key={item.titulo} href={item.href} className={classes}>
                {conteudo}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
