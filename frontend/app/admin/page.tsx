"use client";

import React from 'react';
import Link from 'next/link';
import { Users, ShieldCheck, Building2, ChevronRight } from 'lucide-react';

const modulos = [
  {
    id: 'usuarios',
    titulo: 'Usuários',
    descricao: 'Gerenciar contas, status, lotação e permissões dos usuários do painel.',
    icone: <Users size={28} className="text-blue-600" />,
    bgIcone: 'bg-blue-100',
    rota: '/admin/usuarios',
  },
  {
    id: 'perfis',
    titulo: 'Perfis',
    descricao: 'Criar tipos de perfil com acessos personalizados e vincular usuários.',
    icone: <ShieldCheck size={28} className="text-violet-600" />,
    bgIcone: 'bg-violet-100',
    rota: '/admin/perfis',
  },
  {
    id: 'unidades',
    titulo: 'Unidades',
    descricao: 'Cadastro de unidades de saúde e importação semanal do XML CNES.',
    icone: <Building2 size={28} className="text-emerald-600" />,
    bgIcone: 'bg-emerald-100',
    rota: '/admin/unidades',
  },
];

export default function AdminHubPage() {
  return (
    <div>
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Painel de Controle</h2>
        <p className="text-slate-500 text-lg">
          Selecione um módulo para gerenciar usuários, perfis de acesso ou unidades de saúde.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modulos.map((modulo) => (
          <Link
            key={modulo.id}
            href={modulo.rota}
            className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div
                className={`${modulo.bgIcone} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                {modulo.icone}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                {modulo.titulo}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">{modulo.descricao}</p>
            </div>
            <div className="mt-6 flex items-center text-blue-600 font-bold text-sm">
              Acessar <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
