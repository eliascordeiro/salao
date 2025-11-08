const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando profissionais no banco...');
  
  const staff = await prisma.staff.findMany({
    select: { 
      id: true, 
      name: true,
      salonId: true,
      specialty: true
    }
  });
  
  console.log(`📊 Total de profissionais: ${staff.length}`);
  console.log('Profissionais:', JSON.stringify(staff, null, 2));
  
  // Verificar salões
  const salons = await prisma.salon.findMany({
    select: { 
      id: true, 
      name: true,
      ownerId: true
    }
  });
  
  console.log(`\n🏪 Total de salões: ${salons.length}`);
  console.log('Salões:', JSON.stringify(salons, null, 2));
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
