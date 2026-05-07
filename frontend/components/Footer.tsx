import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Activity } from 'lucide-react';

export default function Footer() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Grid Principal do Rodapé dividido em 3 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          
          {/* Coluna 1: Identidade */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Activity size={24} />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white leading-tight">Saúde</h2>
                <p className="text-xs text-slate-400 font-medium">Pref. Mal. Deodoro</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Portal Oficial da Secretaria Municipal de Saúde. Nosso compromisso é cuidar de você com transparência e inovação.
            </p>
          </div>

          {/* Coluna 2: Links Rápidos */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Links Rápidos</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="hover:text-blue-400 transition-colors">Início</Link>
              </li>
              <li>
                <Link href="/indicadores" className="hover:text-blue-400 transition-colors">Painel de Indicadores</Link>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">Acesso a Sistemas (e-SUS/PEC)</a>
              </li>
              <li>
                <Link href="/ouvidoria" className="hover:text-blue-400 transition-colors">Ouvidoria da Saúde</Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Contato e Endereço */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Fale Conosco</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <span>
                  Centro Histórico<br />
                  Marechal Deodoro - AL
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-blue-500 shrink-0" />
                <span>(82) 3263-XXXX</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-blue-500 shrink-0" />
                <span>contato.saude@marechaldeodoro.al.gov.br</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Linha de Copyright (Parte inferior) */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {anoAtual} Secretaria Municipal de Saúde de Marechal Deodoro. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Desenvolvido com dedicação pela <span className="text-slate-300 font-medium">Coordenação de TI</span>
          </p>
        </div>
        
      </div>
    </footer>
  );
}