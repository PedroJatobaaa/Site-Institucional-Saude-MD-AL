import type { PrismaClient } from '@prisma/client';
import {
  NIVEIS_LOTACAO,
  UNIDADES_POR_NIVEL,
  inferirNivelPorUnidade,
  type NivelLotacao,
} from './validators/lotacao';

export type UnidadesPorNivel = Record<string, readonly string[]>;

let cache: UnidadesPorNivel | null = null;

export function invalidarCacheUnidades(): void {
  cache = null;
}

export async function carregarUnidadesPorNivel(prisma: PrismaClient): Promise<UnidadesPorNivel> {
  if (cache) return cache;

  try {
    const rows = await prisma.unidadeSaude.findMany({
      where: { ativo: true },
      select: { nomeLotacao: true, nivelLotacao: true },
      orderBy: [{ nivelLotacao: 'asc' }, { nomeLotacao: 'asc' }],
    });

    if (rows.length === 0) {
      cache = { ...UNIDADES_POR_NIVEL };
      return cache;
    }

    const mapa: Record<string, string[]> = {};
    for (const nivel of NIVEIS_LOTACAO) {
      mapa[nivel] = [];
    }
    for (const row of rows) {
      const nome = row.nomeLotacao?.trim();
      if (!nome) continue;
      const nivel = inferirNivelPorUnidade(nome);
      if (!nivel) continue;
      if (!mapa[nivel].includes(nome)) {
        mapa[nivel].push(nome);
      }
    }
    for (const nivel of NIVEIS_LOTACAO) {
      mapa[nivel].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }
    cache = mapa;
    return cache;
  } catch {
    cache = { ...UNIDADES_POR_NIVEL };
    return cache;
  }
}

export function unidadesDoNivelCache(nivel: string, mapa: UnidadesPorNivel): readonly string[] {
  if (!NIVEIS_LOTACAO.includes(nivel as NivelLotacao)) return [];
  return mapa[nivel] ?? UNIDADES_POR_NIVEL[nivel as NivelLotacao] ?? [];
}
