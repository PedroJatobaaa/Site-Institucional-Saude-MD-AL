"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 👇 Removemos a propriedade "banners" que vinha do banco
export default function Carrossel() {
  
  // ==========================================
  // 🖼️ LISTA FIXA DE BANNERS (Edite aqui!)
  // Coloque as imagens na pasta "frontend/public"
  // ==========================================
  const banners = [
    { 
      id: '1', 
      imagem_url: 'bemvindo.png', 
      titulo: '' 
    },
    { 
      id: '2', 
      imagem_url: 'vacina.webp', 
      titulo: '‘Dia D’ de vacinação contra a Influenza neste sábado (18 / 04)' 
    },
   
  ];

  const [atual, setAtual] = useState(0);

  // Efeito para passar o banner automaticamente a cada 5 segundos
  useEffect(() => {
    if (banners.length <= 1) return;
    const intervalo = setInterval(() => {
      setAtual((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(intervalo);
  }, []); // <-- Ajuste sutil aqui também

  if (banners.length === 0) return null;

  const proximo = () => setAtual(atual === banners.length - 1 ? 0 : atual + 1);
  const anterior = () => setAtual(atual === 0 ? banners.length - 1 : atual - 1);

  return (
    <div className="relative w-full h-[300px] md:h-[400px] bg-slate-200 overflow-hidden">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === atual ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Imagem do Banner */}
          <img
            src={banner.imagem_url}
            alt={banner.titulo}
            className="w-full h-full object-cover"
          />
          
          {/* Degradê escuro sobre a imagem para o título ficar legível */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
            <div className="p-8 md:p-16 max-w-7xl mx-auto w-full">
              <h2 className="text-white text-3xl md:text-5xl font-bold drop-shadow-md max-w-2xl">
                {banner.titulo}
              </h2>
            </div>
          </div>
        </div>
      ))}

      {/* Botões de controle */}
      {banners.length > 1 && (
        <>
          <button
            onClick={anterior}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/80 p-2 rounded-full backdrop-blur transition-all"
          >
            <ChevronLeft className="text-slate-800" size={28} />
          </button>
          <button
            onClick={proximo}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/80 p-2 rounded-full backdrop-blur transition-all"
          >
            <ChevronRight className="text-slate-800" size={28} />
          </button>
          
          {/* Bolinhas indicadoras */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setAtual(idx)} // Deixei as bolinhas clicáveis!
                className={`h-2 rounded-full transition-all ${
                  idx === atual ? 'w-8 bg-blue-500' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}