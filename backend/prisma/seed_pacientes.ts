import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  const csvFilePath = path.resolve(__dirname, 'pacientes.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error("❌ Arquivo 'pacientes.csv' não encontrado!");
    return;
  }

  const registros: any[] = [];
  let totalProcessado = 0;
  let primeiraLinha = true;

  const parser = fs.createReadStream(csvFilePath).pipe(
    parse({
      columns: true, 
      skip_empty_lines: true,
      delimiter: ',', // <-- VOLTAMOS PARA A VÍRGULA!
      trim: true,
    })
  );

  console.log("⏳ Iniciando a super importação...");

  for await (const record of parser) {
    if (primeiraLinha) {
      console.log("\n🧐 RAIO-X DA PRIMEIRA LINHA:");
      console.log(record);
      console.log("-----------------------------------\n");
      primeiraLinha = false;
    }

    // Se o CPF for "0", transformamos em vazio. Depois tiramos os pontos.
    const cpfCru = record.cpf === '0' ? '' : record.cpf;
    const cpfLimpo = cpfCru ? cpfCru.replace(/\D/g, '') : null;
    
    const cnsLimpo = record.cns ? record.cns.replace(/\D/g, '') : null;

    registros.push({
      nome: record.nome ? record.nome.toUpperCase().trim() : 'NOME NÃO INFORMADO',
      cpf: cpfLimpo && cpfLimpo.length > 0 ? cpfLimpo : null,
      cns: cnsLimpo && cnsLimpo.length > 0 ? cnsLimpo : null,
      data_nascimento: record.data_nascimento || null,
      idade: null, // <-- PRISMA FELIZ!
    });

    if (registros.length >= 1000) {
      await prisma.paciente.createMany({
        data: registros,
        skipDuplicates: true, 
      });
      
      totalProcessado += registros.length;
      console.log(`✅ ${totalProcessado} pacientes injetados...`);
      registros.length = 0; 
    }
  }

  if (registros.length > 0) {
    await prisma.paciente.createMany({
      data: registros,
      skipDuplicates: true,
    });
    totalProcessado += registros.length;
  }

  console.log(`🚀 SUCESSO ABSOLUTO! ${totalProcessado} pacientes salvos no banco de dados!`);
}

main()
  .catch((e) => {
    console.error("❌ Erro fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });