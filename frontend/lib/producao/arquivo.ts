export const EXTENSOES_PRODUCAO = ['.xlsx', '.xls', '.csv'] as const;

export function validarArquivoProducao(arquivo: File): string | null {
  const nome = arquivo.name.toLowerCase();
  const permitido = EXTENSOES_PRODUCAO.some((ext) => nome.endsWith(ext));
  if (!permitido) {
    return 'Formato não permitido. Envie apenas planilhas .xlsx, .xls ou .csv.';
  }
  return null;
}

export async function lerErroApi(res: Response): Promise<string> {
  try {
    const json = await res.json();
    if (typeof json?.erro === 'string') return json.erro;
    if (typeof json?.detalhe === 'string') return json.detalhe;
    return `Erro ${res.status}`;
  } catch {
    return `Erro ${res.status}: resposta inválida do servidor.`;
  }
}
