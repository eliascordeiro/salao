const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEliasWorkDays() {
  try {
    // Buscar Elias
    const elias = await prisma.staff.findFirst({
      where: {
        name: { contains: 'Elias Cordeiro', mode: 'insensitive' }
      }
    });

    if (!elias) {
      console.log('❌ Elias não encontrado');
      return;
    }

    console.log('\n📋 CONFIGURAÇÃO ATUAL:');
    console.log('Nome:', elias.name);
    console.log('WorkDays:', elias.workDays);
    
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const workDaysArray = elias.workDays?.split(',').map(d => parseInt(d.trim())) || [];
    console.log('Dias:', workDaysArray.map(d => days[d]).join(', '));

    // Perguntar se deve corrigir
    console.log('\n❓ O correto seria:');
    console.log('   Opção 1: 1,2,3,4,5 (Segunda a Sexta)');
    console.log('   Opção 2: 1,2,3,4,5,6 (Segunda a Sábado) ← ATUAL');
    
    // Verificar slots existentes
    console.log('\n📊 SLOTS NO BANCO:');
    for (let day = 0; day <= 6; day++) {
      const count = await prisma.availability.count({
        where: {
          staffId: elias.id,
          dayOfWeek: day,
          type: 'RECURRING'
        }
      });
      if (count > 0) {
        console.log(`  ${days[day]} (${day}): ${count} slots`);
      }
    }

    // Se quiser corrigir para Seg-Sex:
    console.log('\n🔧 Para corrigir para Segunda a Sexta, execute:');
    console.log(`   UPDATE "Staff" SET "workDays" = '1,2,3,4,5' WHERE id = '${elias.id}';`);
    console.log('\nOu via Prisma:');
    console.log(`   await prisma.staff.update({`);
    console.log(`     where: { id: '${elias.id}' },`);
    console.log(`     data: { workDays: '1,2,3,4,5' }`);
    console.log(`   });`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEliasWorkDays();
