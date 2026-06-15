import { readFileSync } from 'fs';
import { join } from 'path';
import { obterDescricaoCbo } from '../utils/cargoCbo';

type OcupacaoCbo = { code: string; name: string };

let catalogoCbo: OcupacaoCbo[] | null = null;

function carregarCatalogoCbo(): OcupacaoCbo[] {
  if (catalogoCbo) return catalogoCbo;

  try {
    const caminho = join(__dirname, '../data/cbo-ocupacoes.json');
    catalogoCbo = JSON.parse(readFileSync(caminho, 'utf-8')) as OcupacaoCbo[];
  } catch {
    catalogoCbo = [];
  }

  return catalogoCbo;
}

export function buscarOcupacoesCbo(q?: string, limite = 30): { code: string; name: string }[] {
  const catalogo = carregarCatalogoCbo();
  const termo = q?.trim().toLowerCase();

  let filtrados = catalogo;
  if (termo) {
    const termoNumerico = termo.replace(/\D/g, '');
    filtrados = catalogo.filter((item) => {
      const code = item.code.toLowerCase();
      const name = item.name.toLowerCase();
      if (name.includes(termo)) return true;
      if (termoNumerico && code.includes(termoNumerico)) return true;
      return code.includes(termo);
    });
  }

  return filtrados.slice(0, limite).map((item) => ({
    code: item.code,
    name: item.name || obterDescricaoCbo(item.code) || item.code,
  }));
}
