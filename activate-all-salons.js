const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateAllSalons() {
  try {
    // Buscar salões inativos
    const inactiveSalons = await prisma.salon.findMany({
      where: { active: false },
      select: {
        id: true,
        name: true,
        active: true,
        city: true,
        state: true
      }
    });

    console.log('\n=== BUSCA POR SALÕES INATIVOS ===\n');
    
    if (inactiveSalons.length === 0) {
      console.log('✅ Nenhum salão inativo encontrado. Todos já estão ativos!');
      return;
    }

    console.log(`⚠️ Encontrado(s) ${inactiveSalons.length} salão(ões) inativo(s):\n`);
    inactiveSalons.forEach((salon, index) => {
      console.log(`${index + 1}. ${salon.name}`);
      console.log(`   ID: ${salon.id}`);
      console.log(`   Status: ❌ INATIVO`);
      console.log(`   Cidade: ${salon.city || 'N/A'}`);
      console.log('');
    });

    console.log('🔧 Ativando todos os salões inativos...\n');

    // Ativar todos os salões inativos
    const result = await prisma.salon.updateMany({
      where: { active: false },
      data: { active: true }
    });

    console.log(`✅ ${result.count} salão(ões) ativado(s) com sucesso!\n`);
    
    // Listar salões ativados
    const activatedSalons = await prisma.salon.findMany({
      where: {
        id: { in: inactiveSalons.map(s => s.id) }
      },
      select: {
        id: true,
        name: true,
        active: true
      }
    });

    console.log('📋 SALÕES AGORA ATIVOS:\n');
    activatedSalons.forEach((salon, index) => {
      console.log(`${index + 1}. ${salon.name}`);
      console.log(`   Status: ${salon.active ? '✅ ATIVO' : '❌ INATIVO'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

activateAllSalons();
