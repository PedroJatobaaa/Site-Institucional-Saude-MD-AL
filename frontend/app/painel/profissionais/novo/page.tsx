"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserCog } from 'lucide-react';
import ProfissionalForm from '@/app/painel/profissionais/_components/ProfissionalForm';
import { criarProfissional, prepararPayloadEnvio } from '@/lib/profissionais/api';
import { profissionalVazio, type ProfissionalCompletoPayload } from '@/lib/profissionais/types';
import { getUsuario } from '@/lib/auth/session';

function temPermissao(permissoes: string[] | undefined) {
  return permissoes?.includes('profissionais_gerenciar') || permissoes?.includes('admin');
}

export default function NovoProfissionalPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [data, setData] = useState<ProfissionalCompletoPayload>(profissionalVazio());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userObj = getUsuario();
    if (!userObj) {
      router.push('/login');
      return;
    }
    if (!temPermissao(userObj.permissoes)) {
      alert('Sem permissão.');
      router.push('/painel');
      return;
    }
    setUsuario(userObj);
  }, [router]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await criarProfissional(prepararPayloadEnvio(data));
      alert('Profissional cadastrado com sucesso!');
      router.push('/painel/profissionais');
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <Link href="/painel/profissionais" className="bg-white p-2 rounded-xl border border-slate-200 hover:bg-slate-50">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <UserCog size={24} className="text-teal-600" />
              Novo profissional
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfissionalForm
          data={data}
          onChange={setData}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Cadastrar profissional"
        />
      </main>
    </div>
  );
}
