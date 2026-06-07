"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Megaphone, 
  Users, 
  Activity, 
  Stethoscope, 
  Briefcase, 
  ShieldCheck,
  ChevronRight,
  LogOut,
  FileText,
  Calendar,
  Factory,
  UserCog
} from 'lucide-react';
import { encerrarSessao, getUsuario } from '@/lib/auth/session';

export default function PainelPrincipal() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const user = getUsuario();
    if (!user) {
      router.push('/login');
      return;
    }
    setUsuario(user);
  }, [router]);

  const handleLogout = () => {
    encerrarSessao();
    router.push('/login');
  };

  if (!usuario) return null;

  // ==========================================
  // O CÉREBRO: LISTA DE TODOS OS MÓDULOS
  // ==========================================
  const modulos = [
    {
      id: 'mural',
      titulo: 'Mural de Avisos',
      descricao: 'Publique e gerencie comunicados para a página inicial.',
      icone: <Megaphone size={28} className="text-orange-600" />,
      bgIcone: 'bg-orange-100',
      rota: '/painel/avisos',
      permissaoExigida: 'mural_avisos'
    },
    {
      id: 'esus',
      titulo: 'e-SUS APS / PEC',
      descricao: 'Acesso restrito ao Prontuário Eletrônico do Cidadão.',
      icone: <Stethoscope size={28} className="text-emerald-600" />,
      bgIcone: 'bg-emerald-100',
      rota: 'https://marechaldeodoro-al.datasysconsultoria.com.br/', 
      externo: true,
      permissaoExigida: 'sistemas_esus'
    },
    {
      id: 'admin',
      titulo: 'Gestão de Acessos',
      descricao: 'Painel de controle exclusivo para administradores e TI.',
      icone: <Users size={28} className="text-slate-700" />,
      bgIcone: 'bg-slate-200',
      rota: '/admin', // Olha aqui o link para a tela que VOCÊ já criou!
      permissaoExigida: 'admin'
    },
    {
      id: 'documentos',
      titulo: 'Repositório Digital',
      descricao: 'Acesse ofícios, cartilhas e formulários padrões.',
      icone: <FileText size={28} className="text-cyan-600" />,
      bgIcone: 'bg-cyan-100',
      rota: '/painel/documentos',
      permissaoExigida: 'documentos_leitura' // Basta ter leitura para ver o card
    },
    {
      id: 'upa',
      titulo: 'Unidade UPA',
      descricao: 'Ferramentas e fluxos específicos para a Unidade de Pronto Atendimento.',
      icone: <Stethoscope size={28} className="text-rose-600" />,
      bgIcone: 'bg-rose-100',
      rota: '/painel/upa',
      permissaoExigida: 'upa_acesso'
    },
    {
      id: 'central_marcacoes',
      titulo: 'Central das Marcações',
      descricao: 'Sistema de agendamento de consultas e exames especializados.',
      icone: <Calendar size={28} className="text-indigo-600" />,
      bgIcone: 'bg-indigo-100',
      rota: 'https://chat.smsregulacao.online', // 
      externo: true,
      permissaoExigida: 'central_marcacoes'
    },
    {
      id: 'producoes',
      titulo: 'Módulo de Produções',
      descricao: 'Envio mensal de arquivos de produção das UBS para processamento de dados.',
      icone: <Factory size={28} className="text-violet-600" />,
      bgIcone: 'bg-violet-100',
      rota: '/painel/producoes',
      permissaoExigida: 'ROLE_UBS',
      permissoesAlternativas: ['ROLE_PROCESSAMENTO'],
    },
    {
      id: 'profissionais',
      titulo: 'Cadastro de Profissionais',
      descricao: 'Ficha cadastral de profissionais de saúde conforme modelo SUS.',
      icone: <UserCog size={28} className="text-teal-600" />,
      bgIcone: 'bg-teal-100',
      rota: '/painel/profissionais',
      permissaoExigida: 'profissionais_gerenciar',
    },
    {
      id: 'invig',
      titulo: 'INVIG',
      descricao: 'Relatório e Controle de Investigação de Óbitos.',
      icone: <FileText size={28} className="text-red-600" />,
      bgIcone: 'bg-red-100',
      rota: '/painel/invig',
      permissaoExigida: 'admin' // Altere para a permissão que preferir
    },
  ];

  // Filtra os módulos para mostrar apenas os que o usuário tem permissão.
  // Se ele tiver 'admin', a lógica (opcional) poderia liberar tudo, 
  // mas aqui vamos ser estritos: tem que ter a caixinha marcada lá no seu Admin.
  const modulosPermitidos = modulos.filter((modulo: any) => {
    const alts: string[] = modulo.permissoesAlternativas || [];
    return (
      usuario.permissoes?.includes(modulo.permissaoExigida) ||
      alts.some((p: string) => usuario.permissoes?.includes(p)) ||
      usuario.permissoes?.includes('admin')
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Barra Superior Simples */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-slate-900 leading-tight">Painel do Servidor</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portal da Saúde</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold rounded-xl transition-all"
            >
              <LogOut size={18} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Miolo da Página */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Saudação com os dados reais do usuário logado */}
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
            Olá, {usuario.nome.split(' ')[0]}! 
          </h2>
          <p className="text-slate-500 text-lg">
            Sua função atual é <strong className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase text-sm tracking-wider">{usuario.cargo}</strong>. 
            Estes são os módulos liberados para o seu perfil:
          </p>
        </div>

        {/* Grade de Módulos */}
        {modulosPermitidos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modulosPermitidos.map((modulo) => (
              <Link 
                href={modulo.rota} 
                key={modulo.id}

                target={modulo.externo ? "_blank" : "_self"} 
                rel={modulo.externo ? "noopener noreferrer" : ""}

                className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`${modulo.bgIcone} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    {modulo.icone}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {modulo.titulo}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {modulo.descricao}
                  </p>
                </div>
                
                <div className="mt-8 flex items-center text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                  Acessar Módulo <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center">
            <ShieldCheck size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Sem acesso no momento</h3>
            <p className="text-slate-500">O seu cadastro está em análise ou você não possui permissões atribuídas. Solicite a liberação no TI.</p>
          </div>
        )}

      </main>
    </div>
  );
}