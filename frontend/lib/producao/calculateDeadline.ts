export function calculateDeadline(competenciaMonth: number, competenciaYear: number): Date {
  let mes = competenciaMonth + 1;
  let ano = competenciaYear;
  if (mes > 12) {
    mes = 1;
    ano += 1;
  }

  let diasUteis = 0;
  let dia = 1;

  while (diasUteis < 3) {
    const data = new Date(ano, mes - 1, dia);
    const diaSemana = data.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasUteis += 1;
    }
    if (diasUteis < 3) {
      dia += 1;
    }
  }

  const prazo = new Date(ano, mes - 1, dia);
  prazo.setHours(23, 59, 59, 999);
  return prazo;
}

export function isPrazoExpirado(prazoFinal: Date, referencia: Date = new Date()): boolean {
  const hoje = new Date(referencia);
  hoje.setHours(0, 0, 0, 0);
  const limite = new Date(prazoFinal);
  limite.setHours(0, 0, 0, 0);
  return hoje > limite;
}

export function formatarDataBR(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatarDataHoraBR(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MESES = [
  { valor: 1, label: 'Janeiro' },
  { valor: 2, label: 'Fevereiro' },
  { valor: 3, label: 'Março' },
  { valor: 4, label: 'Abril' },
  { valor: 5, label: 'Maio' },
  { valor: 6, label: 'Junho' },
  { valor: 7, label: 'Julho' },
  { valor: 8, label: 'Agosto' },
  { valor: 9, label: 'Setembro' },
  { valor: 10, label: 'Outubro' },
  { valor: 11, label: 'Novembro' },
  { valor: 12, label: 'Dezembro' },
];
