const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Análise de relacionamento Staff ↔ Salon ↔ User\n');
  
  // Buscar todos os usuários ADMIN
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    include: {
      ownedSalons: true
    }
  });
  
  console.log(`👥 Total de ADMINs: ${admins.length}\n`);
  
  admins.forEach((user, i) => {
    console.log(`${i + 1}. ${user.name} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Salões: ${user.ownedSalons.length}`);
    user.ownedSalons.forEach(salon => {
      console.log(`     - ${salon.name} (${salon.id})`);
    });
    console.log('');
  });
  
  // Buscar todos os profissionais agrupados por salão
  const salons = await prisma.salon.findMany({
    include: {
      owner: true,
      staff: true
    }
  });
  
  console.log(`\n🏪 Total de salões: ${salons.length}\n`);
  
  salons.forEach((salon, i) => {
    console.log(`${i + 1}. ${salon.name} (${salon.id})`);
    console.log(`   Owner: ${salon.owner?.name} (${salon.ownerId})`);
    console.log(`   Profissionais: ${salon.staff.length}`);
    salon.staff.forEach(staff => {
      console.log(`     - ${staff.name} (${staff.id})`);
    });
    console.log('');
  });
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
