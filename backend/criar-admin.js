const { PrismaClient } = require('@prisma/client');

const bcrypt = require('bcrypt'); 

const prisma = new PrismaClient();

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
      
      // 👇 Adicionando o status e a permissão exata que você pediu
      status: 'APROVADO',
      permissoes: ['admin']
    }
  });

  console.log('\n✅ Usuário criado com sucesso!');
  console.log(`✉️ Email: ${admin.email}`);
  console.log(`🔑 Senha: smsti321`);
  console.log(`🚦 Status: ${admin.status}`);
}

main()
  .catch((e) => console.error('\n❌ Erro ao criar:', e))
  .finally(async () => await prisma.$disconnect());