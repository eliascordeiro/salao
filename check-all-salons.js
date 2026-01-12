const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllSalons() {
  try {
    const salons = await prisma.salon.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        active: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        publishedAt: true,
        description: true,
        zipCode: true
      }
    });

    console.log('\n=== ANÁLISE DE TODOS OS SALÕES ATIVOS ===\n');
    console.log(`Total: ${salons.length} salão(ões) ativo(s)\n`);

    const incomplete = [];

    salons.forEach((salon, index) => {
      const issues = [];
      if (!salon.city) issues.push('Sem cidade');
      if (!salon.state) issues.push('Sem estado');
      if (!salon.latitude || !salon.longitude) issues.push('Sem GPS');
      if (!salon.publishedAt) issues.push('Não publicado');
      if (!salon.description) issues.push('Sem descrição');
      if (!salon.zipCode) issues.push('Sem CEP');

      console.log(`${index + 1}. ${salon.name}`);
      console.log(`   Status: ${salon.active ? '✅ ATIVO' : '❌ INATIVO'}`);
      
      if (issues.length > 0) {
        console.log(`   ⚠️ Problemas: ${issues.join(', ')}`);
        incomplete.push({ ...salon, issues });
      } else {
        console.log(`   ✅ Completo e pronto para busca pública`);
      }
      console.log('');
    });

    if (incomplete.length > 0) {
      console.log(`\n⚠️ ${incomplete.length} salão(ões) com dados incompletos:\n`);
      incomplete.forEach(s => {
        console.log(`- ${s.name}: ${s.issues.join(', ')}`);
      });
      console.log('\n💡 Esses salões NÃO aparecerão na busca pública até completar os dados.');
    } else {
      console.log('✅ Todos os salões estão completos e aparecerão na busca pública!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllSalons();
