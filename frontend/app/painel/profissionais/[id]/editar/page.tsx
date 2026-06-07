"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserCog } from 'lucide-react';
import ProfissionalForm from '@/app/painel/profissionais/_components/ProfissionalForm';
import HistoricoProfissional from '@/app/painel/profissionais/_components/HistoricoProfissional';
import {
  atualizarProfissional,
  detalheParaPayload,
  obterProfissional,
  prepararPayloadEnvio,
} from '@/lib/profissionais/api';
import {
  profissionalVazio,
  type ProfissionalCompletoPayload,
  type ProfissionalHistoricoItem,
} from '@/lib/profissionais/types';
import { mascaraCPF, mascaraCNS, mascaraPIS } from '@/lib/profissionais/documentos';
import { getUsuario } from '@/lib/auth/session';

function temPermissao(permissoes: string[] | undefined) {
  return permissoes?.includes('profissionais_gerenciar') || permissoes?.includes('admin');
}

export default function EditarProfissionalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [usuario, setUsuario] = useState<any>(null);
  const [data, setData] = useState<ProfissionalCompletoPayload>(profissionalVazio());
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [historico, setHistorico] = useState<ProfissionalHistoricoItem[]>([]);

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

    obterProfissional(id)
      .then((detalhe) => {
        const payload = detalheParaPayload(detalhe);
        payload.profissional.cpf = mascaraCPF(payload.profissional.cpf);
        if (payload.profissional.numeroCns) {
          payload.profissional.numeroCns = mascaraCNS(payload.profissional.numeroCns);
        }
        if (payload.profissional.pisPasep) {
          payload.profissional.pisPasep = mascaraPIS(payload.profissional.pisPasep);
        }
        setData(payload);
        setHistorico(detalhe.historico || []);
      })
      .catch((err) => {
        alert(err.message || 'Profissional não encontrado.');
        router.push('/painel/profissionais');
      })
      .finally(() => setCarregando(false));
  }, [id, router]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await atualizarProfissional(id, prepararPayloadEnvio(data));
      alert('Profissional atualizado com sucesso!');
      router.push(`/painel/profissionais/${id}`);
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  if (!usuario || carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-medium">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <Link href="/painel/profissionais" className="bg-white p-2 rounded-xl border border-slate-200 hover:bg-slate-50">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <UserCog size={24} className="text-teal-600" />
              Editar profissional
            </h1>
            <p className="text-sm text-slate-500 font-medium">{data.profissional.nomeProfissional}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ProfissionalForm
              data={data}
              onChange={setData}
              onSubmit={handleSubmit}
              modoEdicao
              loading={loading}
              submitLabel="Salvar alterações"
            />
          </div>
          <div className="xl:col-span-1">
            <HistoricoProfissional historico={historico} />
          </div>
        </div>
      </main>
    </div>
  );
}
