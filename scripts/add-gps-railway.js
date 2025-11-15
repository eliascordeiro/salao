const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addGPSCoordinates() {
  console.log('🗺️  Adicionando coordenadas GPS aos salões...');

  try {
    // Buscar todos os salões
    const salons = await prisma.salon.findMany();
    
    console.log(`📍 Encontrados ${salons.length} salões`);

    // Coordenadas de exemplo em Curitiba
    const coordinates = [
      { latitude: -25.384593, longitude: -49.303067 }, // Batel, Curitiba
      { latitude: -25.551552, longitude: -49.386864 }, // Araucária
    ];

    // Atualizar cada salão
    for (let i = 0; i < salons.length; i++) {
      const salon = salons[i];
      const coord = coordinates[i % coordinates.length];
      
      await prisma.salon.update({
        where: { id: salon.id },
        data: {
          latitude: coord.latitude,
          longitude: coord.longitude,
        },
      });

      console.log(`✅ ${salon.name}: ${coord.latitude}, ${coord.longitude}`);
    }

    console.log('\n✨ Coordenadas GPS adicionadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addGPSCoordinates();
