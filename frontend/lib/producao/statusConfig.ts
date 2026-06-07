export type StatusProducao =
  | 'RECEBIDO'
  | 'PROCESSANDO'
  | 'DEVOLVIDO_PARA_AJUSTE'
  | 'TRANSMITIDO';

export const STATUS_PRODUCAO: Record<
  StatusProducao,
  { label: string; badge: string; timeline: string; dot: string }
> = {
  RECEBIDO: {
    label: 'Recebido',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    timeline: 'border-emerald-500 bg-emerald-50',
    dot: 'bg-emerald-500',
  },
  PROCESSANDO: {
    label: 'Processando',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    timeline: 'border-blue-500 bg-blue-50',
    dot: 'bg-blue-500',
  },
  DEVOLVIDO_PARA_AJUSTE: {
    label: 'Devolvido para ajuste',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    timeline: 'border-orange-500 bg-orange-50',
    dot: 'bg-orange-500',
  },
  TRANSMITIDO: {
    label: 'Transmitido',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    timeline: 'border-emerald-600 bg-emerald-50',
    dot: 'bg-emerald-600',
  },
};

export function labelSituacaoPrazo(situacao: string): { texto: string; classe: string } {
  switch (situacao) {
    case 'NO_PRAZO':
      return { texto: 'Entregue dentro do prazo', classe: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'ATRASADO':
      return { texto: 'Atrasado', classe: 'bg-red-100 text-red-800 border-red-200' };
    case 'FORA_DO_PRAZO':
      return { texto: 'Entregue fora do prazo', classe: 'bg-amber-100 text-amber-800 border-amber-200' };
    default:
      return { texto: 'Em aberto', classe: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function labelTipoEvento(tipo: string): string {
  const mapa: Record<string, string> = {
    ENVIO_ARQUIVO: 'Envio do arquivo',
    PROCESSAMENTO: 'Processamento',
    DEVOLUCAO: 'Devolução para ajuste',
    TRANSMISSAO: 'Transmissão com sucesso',
    MENSAGEM: 'Mensagem / anexo',
    ALTERACAO_STATUS: 'Atualização de status',
  };
  return mapa[tipo] || tipo;
}
