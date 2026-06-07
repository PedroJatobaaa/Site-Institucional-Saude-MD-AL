export function limparNumeros(valor: string | null | undefined): string {
  if (!valor) return '';
  return valor.replace(/\D/g, '');
}

function todosDigitosIguais(digitos: string): boolean {
  return /^(\d)\1+$/.test(digitos);
}

export function validarCPF(cpf: string | null | undefined): boolean {
  const digitos = limparNumeros(cpf);
  if (digitos.length !== 11 || todosDigitosIguais(digitos)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(digitos[i], 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(digitos[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(digitos[i], 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(digitos[10], 10);
}

export function validarPisPasep(pis: string | null | undefined): boolean {
  const digitos = limparNumeros(pis);
  if (digitos.length !== 11 || todosDigitosIguais(digitos)) return false;

  const pesos = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(digitos[i], 10) * pesos[i];
  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  return dv === parseInt(digitos[10], 10);
}

function validarCNSProvvisorio(digitos: string): boolean {
  let soma = 0;
  for (let i = 0; i < 15; i++) {
    soma += parseInt(digitos[i], 10) * (15 - i);
  }
  return soma % 11 === 0;
}

function validarCNSDefinitivo(digitos: string): boolean {
  const pis = digitos.substring(0, 11);
  let soma = 0;
  for (let i = 0; i < 11; i++) {
    soma += parseInt(pis[i], 10) * (15 - i);
  }
  const resto = soma % 11;
  const dv = resto === 0 ? 0 : 11 - resto;
  const resultado = `${pis}${dv === 10 ? '001' : `00${dv}`}`.substring(0, 15);
  return resultado === digitos;
}

export function validarCNS(cns: string | null | undefined): boolean {
  const digitos = limparNumeros(cns);
  if (digitos.length !== 15 || !/^[1-9]/.test(digitos)) return false;

  const primeiro = digitos[0];
  if (primeiro === '1' || primeiro === '2') {
    return validarCNSProvvisorio(digitos);
  }
  if (primeiro === '7' || primeiro === '8' || primeiro === '9') {
    return validarCNSDefinitivo(digitos);
  }
  return false;
}

export function normalizarCPF(cpf: string): string {
  return limparNumeros(cpf);
}

export function normalizarCNS(cns: string): string {
  return limparNumeros(cns);
}

export function normalizarPIS(pis: string): string {
  return limparNumeros(pis);
}

export function formatarCPF(cpf: string): string {
  const d = limparNumeros(cpf);
  if (d.length !== 11) return cpf;
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatarCNS(cns: string): string {
  const d = limparNumeros(cns);
  if (d.length !== 15) return cns;
  return d.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
}

export function formatarPIS(pis: string): string {
  const d = limparNumeros(pis);
  if (d.length !== 11) return pis;
  return d.replace(/(\d{3})(\d{5})(\d{2})(\d{1})/, '$1.$2.$3-$4');
}
