const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkServices() {
  console.log('🔍 Verificando serviços no banco de dados...\n');

  const services = await prisma.service.findMany({
    include: {
      salon: true,
      staff: {
        include: {
          staff: true
        }
      }
    }
  });

  console.log(`📊 Total de serviços: ${services.length}\n`);

  services.forEach((service, index) => {
    console.log(`${index + 1}. ${service.name}`);
    console.log(`   Status: ${service.active ? '✅ Ativo' : '❌ Inativo'}`);
    console.log(`   Duração: ${service.duration} minutos`);
    console.log(`   Preço: R$ ${service.price.toFixed(2)}`);
    console.log(`   Categoria: ${service.category || 'Sem categoria'}`);
    console.log(`   Profissionais: ${service.staff.length}`);
    if (service.staff.length > 0) {
      service.staff.forEach(s => {
        console.log(`      - ${s.staff.name} (${s.staff.active ? 'Ativo' : 'Inativo'})`);
      });
    }
    console.log('');
  });

  // Verificar serviços ativos
  const activeServices = services.filter(s => s.active);
  console.log(`\n✅ Serviços ativos: ${activeServices.length}`);
  console.log(`❌ Serviços inativos: ${services.length - activeServices.length}`);
}

checkServices()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
