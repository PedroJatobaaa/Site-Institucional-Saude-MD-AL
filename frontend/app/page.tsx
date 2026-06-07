import React from 'react';
import Carrossel, { type BannerCarrossel } from '@/components/Carrossel';
import HeroInstitucional from '@/components/landing/HeroInstitucional';
import AcessoRapido from '@/components/landing/AcessoRapido';
import ComunicadosDestaque, { type ComunicadoDestaque } from '@/components/landing/ComunicadosDestaque';
import CoordenacaoCard from '@/components/landing/CoordenacaoCard';

type Coordenacao = {
  id: string;
  sigla: string;
  nome: string;
  descricao: string;
  icone: string;
  avisos?: {
    id: string;
    titulo: string;
    descricao?: string | null;
    link_anexo?: string | null;
    data_publicacao?: string | null;
  }[];
};

function derivarComunicadosRecentes(coordenacoes: Coordenacao[], limite = 6): ComunicadoDestaque[] {
  const todos = coordenacoes.flatMap((coord) =>
    (coord.avisos ?? []).map((aviso) => ({
      id: aviso.id,
      titulo: aviso.titulo,
      sigla: coord.sigla,
      data_publicacao: aviso.data_publicacao,
    }))
  );

  return todos
    .sort((a, b) => {
      const dataA = a.data_publicacao ? new Date(a.data_publicacao).getTime() : 0;
      const dataB = b.data_publicacao ? new Date(b.data_publicacao).getTime() : 0;
      return dataB - dataA;
    })
    .slice(0, limite);
}

export default async function PaginaInicial() {
  const apiBaseUrl =
    typeof window === 'undefined'
      ? 'http://backend:3333'
      : process.env.NEXT_PUBLIC_API_URL;

  let coordenacoes: Coordenacao[] = [];
  let banners: BannerCarrossel[] = [];

  try {
    const [resCoord, resCarrossel] = await Promise.all([
      fetch(`${apiBaseUrl}/api/coordenacoes`, { cache: 'no-store' }),
      fetch(`${apiBaseUrl}/api/carrossel`, { cache: 'no-store' }),
    ]);

    if (resCoord.ok) {
      const dados = await resCoord.json();
      coordenacoes = Array.isArray(dados) ? dados : [];
    }

    if (resCarrossel.ok) {
      const dados = await resCarrossel.json();
      banners = Array.isArray(dados) ? dados : [];
    }
  } catch {
    // Mantém arrays vazios; componentes usam fallback ou estado vazio
  }

  const comunicadosRecentes = derivarComunicadosRecentes(coordenacoes);

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <Carrossel banners={banners} />

      <HeroInstitucional />

      <AcessoRapido />

      <ComunicadosDestaque comunicados={comunicadosRecentes} />

      <section
        id="coordenacoes"
        className="py-16 md:py-24 px-4 max-w-7xl mx-auto relative scroll-mt-24"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none z-0" />

        <div className="mb-16 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Mural das{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Coordenações
            </span>
          </h2>
          <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto">
            Acompanhe os comunicados oficiais e as últimas atualizações de cada setor da Secretaria
            Municipal de Saúde.
          </p>
        </div>

        {coordenacoes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {coordenacoes.map((coord) => (
              <CoordenacaoCard key={coord.id} coord={coord} />
            ))}
          </div>
        ) : (
          <div className="relative z-10 bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-slate-500 font-medium">
              Não foi possível carregar as coordenações no momento. Tente novamente mais tarde.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
