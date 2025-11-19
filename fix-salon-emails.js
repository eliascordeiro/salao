const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMissingEmails() {
  console.log('\n🔧 CORRIGINDO EMAILS VAZIOS DOS SALÕES\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Buscar salões sem email
    const salonsWithoutEmail = await prisma.salon.findMany({
      where: {
        OR: [
          { email: null },
          { email: '' }
        ]
      },
      include: {
        owner: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`📊 Salões com email vazio: ${salonsWithoutEmail.length}\n`);

    if (salonsWithoutEmail.length === 0) {
      console.log('✅ Nenhum salão com email vazio encontrado!\n');
      return;
    }

    let fixed = 0;
    let failed = 0;

    for (const salon of salonsWithoutEmail) {
      console.log(`🏪 Processando: ${salon.name}`);
      
      // Tentar usar email do proprietário
      if (salon.owner && salon.owner.email) {
        try {
          await prisma.salon.update({
            where: { id: salon.id },
            data: { email: salon.owner.email }
          });
          console.log(`   ✅ Email atualizado para: ${salon.owner.email}`);
          fixed++;
        } catch (error) {
          console.log(`   ❌ Erro ao atualizar: ${error.message}`);
          failed++;
        }
      } else {
        console.log(`   ⚠️  Proprietário não encontrado ou sem email`);
        console.log(`   💡 Sugestão: Editar manualmente em "Meu Salão"`);
        failed++;
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📈 RESULTADO:\n');
    console.log(`   ✅ Corrigidos: ${fixed}`);
    console.log(`   ❌ Falhas: ${failed}`);
    console.log(`   📊 Total: ${salonsWithoutEmail.length}\n`);

    if (failed > 0) {
      console.log('💡 PRÓXIMOS PASSOS:');
      console.log('   Para os salões que falharam:');
      console.log('   1. Faça login com o proprietário do salão');
      console.log('   2. Acesse "Meu Salão" no painel administrativo');
      console.log('   3. Preencha o campo Email e salve\n');
    }

    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro ao corrigir emails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingEmails();
