"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type BannerCarrossel = {
  id: string;
  imagem_url: string;
  titulo: string;
};

const BANNERS_FALLBACK: BannerCarrossel[] = [
  {
    id: 'fallback-1',
    imagem_url: 'bemvindo.png',
    titulo: 'Portal da Saúde — Marechal Deodoro',
  },
  {
    id: 'fallback-2',
    imagem_url: 'vacina.webp',
    titulo: 'Campanhas de vacinação e prevenção em toda a rede municipal',
  },
];

type CarrosselProps = {
  banners?: BannerCarrossel[];
};

export default function Carrossel({ banners: bannersProp = [] }: CarrosselProps) {
  const banners =
    bannersProp.length > 0 ? bannersProp : BANNERS_FALLBACK;

  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const intervalo = setInterval(() => {
      setAtual((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(intervalo);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const proximo = () => setAtual(atual === banners.length - 1 ? 0 : atual + 1);
  const anterior = () => setAtual(atual === 0 ? banners.length - 1 : atual - 1);

  return (
    <div className="relative w-full">
      <div className="relative w-full h-[360px] md:h-[480px] bg-slate-900 overflow-hidden">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === atual ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={banner.imagem_url}
              alt={banner.titulo || 'Banner institucional'}
              className="w-full h-full object-cover scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end">
              <div className="p-8 md:p-16 max-w-7xl mx-auto w-full pb-12 md:pb-16">
                {banner.titulo && (
                  <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-extrabold drop-shadow-lg max-w-3xl leading-tight tracking-tight">
                    {banner.titulo}
                  </h2>
                )}
              </div>
            </div>
          </div>
        ))}

        {banners.length > 1 && (
          <>
            <button
              onClick={anterior}
              aria-label="Banner anterior"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/90 p-3 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-lg"
            >
              <ChevronLeft className="text-white hover:text-slate-900" size={24} />
            </button>
            <button
              onClick={proximo}
              aria-label="Próximo banner"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/90 p-3 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-lg"
            >
              <ChevronRight className="text-white hover:text-slate-900" size={24} />
            </button>

            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Ir para banner ${idx + 1}`}
                  onClick={() => setAtual(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === atual ? 'w-8 bg-blue-400' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
