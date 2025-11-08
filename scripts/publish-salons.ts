import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando salões no banco...');
  
  const salons = await prisma.salon.findMany({
    select: { 
      id: true, 
      name: true, 
      publishedAt: true,
      ownerId: true
    }
  });
  
  console.log(`📊 Total de salões: ${salons.length}`);
  console.log('Salões:', JSON.stringify(salons, null, 2));
  
  // Publicar todos os salões não publicados
  const unpublished = salons.filter(s => !s.publishedAt);
  
  if (unpublished.length > 0) {
    console.log(`\n📢 Publicando ${unpublished.length} salões...`);
    
    const result = await prisma.salon.updateMany({
      where: { publishedAt: null },
      data: { publishedAt: new Date() }
    });
    
    console.log(`✅ ${result.count} salões publicados com sucesso!`);
  } else {
    console.log('\n✅ Todos os salões já estão publicados!');
  }
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
