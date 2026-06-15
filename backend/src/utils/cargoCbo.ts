import { readFileSync } from 'fs';
import { join } from 'path';
import type { PrismaClient } from '@prisma/client';

type OcupacaoCbo = { code: string; name: string };

/** Códigos alfanuméricos usados pelo CNES/SUS fora da tabela CBO padrão */
const OCUPACOES_CNES: Record<string, string> = {
  '2231F8': 'Médico em medicina preventiva e social',
  '2231F9': 'Médico residente',
  '2241E1': 'Profissional de educação física na saúde',
};

let mapaOficial: Map<string, string> | null = null;

export function normalizarCodigoCbo(codigo: string): string {
  return codigo.trim().toUpperCase();
}

function carregarMapaOficial(): Map<string, string> {
  if (mapaOficial) return mapaOficial;

  mapaOficial = new Map<string, string>();

  try {
    const caminho = join(__dirname, '../data/cbo-ocupacoes.json');
    const conteudo = readFileSync(caminho, 'utf-8');
    const ocupacoes = JSON.parse(conteudo) as OcupacaoCbo[];
    for (const item of ocupacoes) {
      if (item.code && item.name) {
        mapaOficial.set(normalizarCodigoCbo(item.code), item.name);
      }
    }
  } catch {
    // Se o arquivo não estiver disponível, segue apenas com extensões CNES.
  }

  for (const [code, name] of Object.entries(OCUPACOES_CNES)) {
    mapaOficial.set(normalizarCodigoCbo(code), name);
  }

  return mapaOficial;
}

export function obterDescricaoCbo(codigo: string | null | undefined): string | null {
  if (!codigo?.trim()) return null;
  return carregarMapaOficial().get(normalizarCodigoCbo(codigo)) ?? null;
}

export function resolverCargoCbo(
  cboCodigo: string | null | undefined,
  cboDescricao: string | null | undefined,
  mapaDescricoes?: Map<string, string>
): string | null {
  const descricao = cboDescricao?.trim();
  if (descricao) return descricao;

  const codigo = cboCodigo?.trim();
  if (!codigo) return null;

  const codigoNormalizado = normalizarCodigoCbo(codigo);

  const doMapaDb = mapaDescricoes?.get(codigoNormalizado) ?? mapaDescricoes?.get(codigo);
  if (doMapaDb) return doMapaDb;

  const doCatalogo = obterDescricaoCbo(codigoNormalizado);
  if (doCatalogo) return doCatalogo;

  return null;
}

export async function carregarMapaDescricoesCbo(prisma: PrismaClient): Promise<Map<string, string>> {
  const vinculos = await prisma.vinculoProfissional.findMany({
    where: {
      cboCodigo: { not: null },
      cboDescricao: { not: null },
    },
    select: { cboCodigo: true, cboDescricao: true },
    distinct: ['cboCodigo'],
  });

  const mapa = new Map<string, string>();
  for (const v of vinculos) {
    if (v.cboCodigo && v.cboDescricao) {
      mapa.set(normalizarCodigoCbo(v.cboCodigo), v.cboDescricao);
    }
  }
  return mapa;
}

export function vinculoPrincipalAtivo<
  T extends { cboCodigo: string | null; cboDescricao: string | null; dataDesligamento: Date | null },
>(vinculos: T[]): T | null {
  if (vinculos.length === 0) return null;
  const ativos = vinculos.filter((v) => !v.dataDesligamento);
  return ativos[0] ?? vinculos[0];
}
