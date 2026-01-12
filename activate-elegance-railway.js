const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:bfzNahVPyVcwzIewNotORAKWJFOZiFpW@gondola.proxy.rlwy.net:20615/railway'
    }
  }
});

async function activateElegance() {
  try {
    const salon = await prisma.salon.findFirst({
      where: {
        name: { contains: 'Elegance', mode: 'insensitive' }
      }
    });

    if (!salon) {
      console.log('❌ Salão não encontrado');
      return;
    }

    console.log(`🔧 Ativando "${salon.name}" no Railway...\n`);

    const updated = await prisma.salon.update({
      where: { id: salon.id },
      data: { active: true }
    });

    console.log(`✅ Salão "${updated.name}" ativado com sucesso no Railway!`);
    console.log(`   Status: ${updated.active ? '✅ ATIVO' : '❌ INATIVO'}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

activateElegance();
