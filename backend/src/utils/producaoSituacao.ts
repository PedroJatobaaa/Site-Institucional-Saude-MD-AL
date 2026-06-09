export type SituacaoPrazo = 'EM_ABERTO' | 'NO_PRAZO' | 'ATRASADO' | 'FORA_DO_PRAZO';

type EventoEnvio = {
  tipo: string;
  createdAt: Date;
};

type EntregaComEventos = {
  prazoFinal: Date;
  eventos: EventoEnvio[];
};

export function calcularSituacaoPrazo(
  entrega: EntregaComEventos,
  prazoExpirado: boolean
): SituacaoPrazo {
  const primeiroEnvio = entrega.eventos.find((e) => e.tipo === 'ENVIO_ARQUIVO');
  if (primeiroEnvio) {
    return new Date(primeiroEnvio.createdAt) <= new Date(entrega.prazoFinal)
      ? 'NO_PRAZO'
      : 'FORA_DO_PRAZO';
  }
  if (prazoExpirado) {
    return 'ATRASADO';
  }
  return 'EM_ABERTO';
}

export function entregaFoiEnviada(eventos: EventoEnvio[]): boolean {
  return eventos.some((e) => e.tipo === 'ENVIO_ARQUIVO');
}

export function dataPrimeiroEnvio(eventos: EventoEnvio[]): Date | null {
  const primeiroEnvio = eventos.find((e) => e.tipo === 'ENVIO_ARQUIVO');
  return primeiroEnvio ? new Date(primeiroEnvio.createdAt) : null;
}
