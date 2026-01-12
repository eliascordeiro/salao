const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixElegance() {
  try {
    const salon = await prisma.salon.findFirst({
      where: {
        name: { contains: 'elegance', mode: 'insensitive' }
      }
    });

    if (!salon) {
      console.log('❌ Salão não encontrado');
      return;
    }

    console.log('🔧 Atualizando Salão Elegance...\n');

    const updated = await prisma.salon.update({
      where: { id: salon.id },
      data: {
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        description: 'Salão de beleza completo com profissionais experientes e atendimento de qualidade.',
        latitude: -23.5505199,
        longitude: -46.6333094,
        publishedAt: new Date(),
        featured: true,
        verified: true,
      }
    });

    console.log('✅ Salão atualizado com sucesso!\n');
    console.log('📋 DADOS ATUALIZADOS:');
    console.log(`   Cidade: ${updated.city}`);
    console.log(`   Estado: ${updated.state}`);
    console.log(`   CEP: ${updated.zipCode}`);
    console.log(`   Descrição: ${updated.description?.substring(0, 50)}...`);
    console.log(`   Latitude: ${updated.latitude}`);
    console.log(`   Longitude: ${updated.longitude}`);
    console.log(`   PublishedAt: ${updated.publishedAt}`);
    console.log(`   Featured: ${updated.featured ? '✅ SIM' : 'NÃO'}`);
    console.log(`   Verified: ${updated.verified ? '✅ SIM' : 'NÃO'}`);
    console.log('\n✅ Salão agora deve aparecer na busca pública!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixElegance();
