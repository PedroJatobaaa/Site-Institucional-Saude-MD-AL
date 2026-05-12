import React from 'react';
import { MapPin, Phone, Mail, Activity } from 'lucide-react';

export default function Footer() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-6 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Layout Principal - Lado a Lado para economizar altura */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 mb-6">
          
          {/* Lado Esquerdo: Identidade */}
          <div className="flex flex-col gap-3 max-w-md text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white leading-tight">Saúde</h2>
                <p className="text-xs text-slate-400 font-medium">Pref. Mal. Deodoro</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Portal Oficial da Secretaria Municipal de Saúde. 
            </p>
          </div>

          {/* Lado Direito: Contato e Endereço */}
          <div className="flex flex-col justify-center">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-center md:justify-start gap-3">
                <MapPin size={16} className="text-blue-500 shrink-0" />
                <span>Centro Histórico, Marechal Deodoro - AL</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3">
                <Mail size={16} className="text-blue-500 shrink-0" />
                <span>smstimd@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Linha de Copyright (Mais compacta) */}
        <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <p>© {anoAtual} Secretaria Municipal de Saúde. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Desenvolvido com dedicação pela <span className="text-slate-300 font-medium">Coordenação de TI</span>
          </p>
        </div>
        
      </div>
    </footer>
  );
}