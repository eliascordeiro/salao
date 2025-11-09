const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function encontrarSalaoDoElias() {
  try {
    const elias = await prisma.staff.findFirst({
      where: {
        name: { contains: 'Elias Cordeiro', mode: 'insensitive' }
      },
      include: {
        salon: true
      }
    });

    if (!elias) {
      console.log('❌ Elias não encontrado');
      return;
    }

    console.log('✅ Elias encontrado!');
    console.log('ID do Elias:', elias.id);
    console.log('Nome:', elias.name);
    console.log('Ativo?:', elias.active);
    console.log('\n🏢 Salão:');
    console.log('ID:', elias.salon.id);
    console.log('Nome:', elias.salon.name);
    console.log('Email:', elias.salon.email);
    console.log('Publicado?:', elias.salon.publishedAt ? 'Sim' : 'Não');

    console.log('\n📋 IDs para usar nos testes:');
    console.log(`const ELIAS_ID = '${elias.id}';`);
    console.log(`const SALON_ID = '${elias.salon.id}';`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

encontrarSalaoDoElias();
