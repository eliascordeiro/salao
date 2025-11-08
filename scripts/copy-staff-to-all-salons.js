const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Copiando profissionais para todos os salões...\n');
  
  // Buscar salões sem profissionais
  const salonsWithoutStaff = await prisma.salon.findMany({
    where: {
      staff: {
        none: {}
      }
    }
  });
  
  console.log(`📊 Salões sem profissionais: ${salonsWithoutStaff.length}\n`);
  
  if (salonsWithoutStaff.length === 0) {
    console.log('✅ Todos os salões já têm profissionais!');
    await prisma.$disconnect();
    return;
  }
  
  // Template de profissionais
  const staffTemplate = [
    {
      name: 'Carlos Barbeiro',
      specialty: 'Cortes Clássicos e Barba',
      phone: '+5511987654321',
      email: null
    },
    {
      name: 'João Estilista',
      specialty: 'Cortes Modernos e Degradês',
      phone: '+5511987654322',
      email: null
    },
    {
      name: 'Maria Cabeleireira',
      specialty: 'Cortes Femininos e Coloração',
      phone: '+5511987654323',
      email: null
    }
  ];
  
  // Criar profissionais para cada salão
  for (const salon of salonsWithoutStaff) {
    console.log(`📍 Criando profissionais para: ${salon.name} (${salon.id})`);
    
    for (const staff of staffTemplate) {
      await prisma.staff.create({
        data: {
          ...staff,
          salonId: salon.id
        }
      });
      console.log(`   ✅ ${staff.name} criado`);
    }
    console.log('');
  }
  
  console.log('✅ Profissionais copiados com sucesso!\n');
  
  // Verificar resultado
  const allSalons = await prisma.salon.findMany({
    include: {
      staff: true
    }
  });
  
  console.log('📊 Resultado final:\n');
  allSalons.forEach((salon, i) => {
    console.log(`${i + 1}. ${salon.name}`);
    console.log(`   Profissionais: ${salon.staff.length}`);
    salon.staff.forEach(s => {
      console.log(`     - ${s.name}`);
    });
    console.log('');
  });
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
