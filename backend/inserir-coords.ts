import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando a injeção de Coordenações...');

  // Agora sim, passando o Nome e a Sigla exatamente como o banco exige!
  const coordenacoes = [
    { nome: 'Gabinete da Secretaria', sigla: 'GAB' },
    { nome: 'Atenção Primária à Saúde', sigla: 'APS' },
    { nome: 'Vigilância em Saúde', sigla: 'VISA' },
    { nome: 'Regulação, Controle e Avaliação', sigla: 'CORA' },
    { nome: 'Assistência Farmacêutica', sigla: 'CAF' },
    { nome: 'Saúde Mental', sigla: 'CAPS' },
    { nome: 'Tecnologia da Informação', sigla: 'TI' },
    { nome: 'Gestão de Pessoas', sigla: 'RH' },
    { nome: 'Assessoria de Comunicação', sigla: 'ASCOM' }
  ];

  await prisma.coordenacao.createMany({
    data: coordenacoes,
    skipDuplicates: true, 
  });

  console.log('✅ Todas as Coordenações foram inseridas com sucesso!');
}

main()
  .catch((e) => {
    console.error('Ocorreu um erro:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });