const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSalon333() {
  try {
    const salon = await prisma.salon.findFirst({
      where: { name: 'salao 333' }
    });

    if (!salon) {
      console.log('❌ Salão 333 não encontrado');
      return;
    }

    console.log('🔧 Atualizando salao 333...\n');

    const updated = await prisma.salon.update({
      where: { id: salon.id },
      data: {
        description: 'Salão de beleza com serviços completos e profissionais qualificados.',
        publishedAt: new Date(),
      }
    });

    console.log('✅ Salão 333 atualizado com sucesso!\n');
    console.log('📋 DADOS ATUALIZADOS:');
    console.log(`   Nome: ${updated.name}`);
    console.log(`   Descrição: ${updated.description}`);
    console.log(`   PublishedAt: ${updated.publishedAt}`);
    console.log(`   Cidade: ${updated.city}`);
    console.log(`   Estado: ${updated.state}`);
    console.log('\n✅ Salão agora está completo e aparecerá na busca pública!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixSalon333();
