require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Gerando senha criptografada...');
  const senhaHash = await bcrypt.hash('smsti321', 10);

  console.log('Criando usuário no banco de dados...');
  const admin = await prisma.usuario.upsert({
    where: { email: 'smsti@gmail.com' },
    update: {},
    create: {
      nome: 'Administrador TI',
      email: 'smsti@gmail.com',
      senha: senhaHash,
      cargo: 'Gestor de TI',
      status: 'APROVADO',
      permissoes: ['admin'],
    },
  });

  console.log('\n✅ Usuário criado com sucesso!');
  console.log(`✉️ Email: ${admin.email}`);
  console.log(`🔑 Senha: smsti321`);
  console.log(`🚦 Status: ${admin.status}`);
}

main()
  .catch((e) => console.error('\n❌ Erro ao criar:', e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
