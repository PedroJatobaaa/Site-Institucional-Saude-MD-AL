import 'dotenv/config'; 
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Configurando o adaptador do Postgres com a URL do seu .env
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

// 2. Passando o adaptador para o PrismaClient
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando o plantio de dados (Seed)...');

  // 3. Limpar o banco antes de popular
  await prisma.aviso.deleteMany();
  await prisma.coordenacao.deleteMany();
  await prisma.comunicadoCarrossel.deleteMany();

  // 4. Criar as Coordenações já com alguns Avisos embutidos
  await prisma.coordenacao.create({
    data: {
      nome: 'Atenção Primária à Saúde',
      sigla: 'APS',
      descricao: 'A porta de entrada do SUS. Coordena os postos de saúde, prevenção de doenças e acompanhamento familiar em Marechal Deodoro.',
      icone: 'HeartPulse',
      ordem_exibicao: 1,
      avisos: {
        create: [
          { titulo: 'Cronograma de Vacinação contra Influenza atualizado' },
          { titulo: 'Nova escala de médicos nos PSFs da região central' }
        ]
      }
    }
  });

  await prisma.coordenacao.create({
    data: {
      nome: 'Atenção Especializada à Saúde',
      sigla: 'AES',
      descricao: 'Gerenciamento de consultas com especialistas, exames de média e alta complexidade e encaminhamentos.',
      icone: 'Stethoscope',
      ordem_exibicao: 2,
      avisos: {
        create: [
          { titulo: 'Mutirão de Oftalmologia neste final de semana' }
        ]
      }
    }
  });

  await prisma.coordenacao.create({
    data: {
      nome: 'Vigilância em Saúde',
      sigla: 'Vigilância',
      descricao: 'Ações de vigilância epidemiológica, sanitária e ambiental para controle de surtos e fiscalização.',
      icone: 'ShieldAlert',
      ordem_exibicao: 3,
      avisos: {
        create: [
          { titulo: 'Boletim Epidemiológico Mensal - Casos de Dengue' },
          { titulo: 'Novas normas para renovação de Alvará Sanitário' }
        ]
      }
    }
  });

  await prisma.coordenacao.create({
    data: {
      nome: 'Assistência Farmacêutica',
      sigla: 'Farmácia',
      descricao: 'Garantia de acesso aos medicamentos básicos e de uso contínuo para a população.',
      icone: 'Pill',
      ordem_exibicao: 4,
      avisos: {
        create: [
          { titulo: 'Lista atualizada de medicamentos disponíveis na Farmácia Central' }
        ]
      }
    }
  });

  await prisma.coordenacao.create({
    data: {
      nome: 'Administrativo',
      sigla: 'Administração',
      descricao: 'Gestão de recursos humanos, licitações, contratos e infraestrutura da Secretaria de Saúde.',
      icone: 'FileText',
      ordem_exibicao: 5,
      avisos: {
        create: [
          { titulo: 'Edital de chamamento público para prestadores de serviço' }
        ]
      }
    }
  });

  await prisma.coordenacao.create({
    data: {
      nome: 'Tecnologia da Informação',
      sigla: 'TI',
      descricao: 'Suporte técnico, infraestrutura de redes e desenvolvimento do ecossistema de sistemas e indicadores da Secretaria.',
      icone: 'Monitor',
      ordem_exibicao: 6,
      avisos: {
        create: [
          { titulo: 'Lançamento do novo Portal Institucional da Saúde' },
          { titulo: 'Manutenção programada nos servidores neste domingo' }
        ]
      }
    }
  });

  // 5. Criar um Banner para o Carrossel Inicial
  await prisma.comunicadoCarrossel.create({
    data: {
      titulo: 'Campanha de Combate à Dengue 2026',
      imagem_url: 'https://placehold.co/1200x400/blue/white?text=Campanha+Dengue+Marechal+Deodoro',
      ordem_exibicao: 1,
    }
  });

  await prisma.comunicadoCarrossel.create({
    data: {
      titulo: 'Campanha de Vacinação H1N1',
      imagem_url: 'https://placehold.co/1200x400/emerald/white?text=Vacinacao+H1N1+Postos+de+Saude',
      ordem_exibicao: 2,
    }
  });

  console.log('✅ Banco de dados populado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });