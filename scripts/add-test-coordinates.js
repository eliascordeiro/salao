const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Coordenadas aproximadas de cidades brasileiras
const cityCoordinates = {
  Araucaria: { lat: -25.5931, lon: -49.4089 }, // Araucária, PR (próximo a Curitiba)
  Curitiba: { lat: -25.4284, lon: -49.2733 },
  "São Paulo": { lat: -23.5505, lon: -46.6333 },
  "Rio de Janeiro": { lat: -22.9068, lon: -43.1729 },
  "Belo Horizonte": { lat: -19.9167, lon: -43.9345 },
  Brasília: { lat: -15.7939, lon: -47.8828 },
  "Porto Alegre": { lat: -30.0346, lon: -51.2177 },
  Salvador: { lat: -12.9714, lon: -38.5014 },
  Fortaleza: { lat: -3.7172, lon: -38.5433 },
  Recife: { lat: -8.0476, lon: -34.877 },
};

async function addTestCoordinates() {
  try {
    console.log("🚀 Adicionando coordenadas de teste aos salões...\n");

    const salons = await prisma.salon.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
      },
    });

    for (const salon of salons) {
      // Se já tem coordenadas, pular
      if (salon.latitude && salon.longitude) {
        console.log(`⏭️  ${salon.name} - já tem coordenadas`);
        continue;
      }

      // Tentar encontrar coordenadas pela cidade
      let coords = cityCoordinates[salon.city];

      // Se não encontrar pela cidade, usar coordenada padrão (Curitiba, pois um salão é de Araucária/PR)
      if (!coords) {
        coords = { lat: -25.4284, lon: -49.2733 };
        console.log(
          `⚠️  ${salon.name} - Cidade "${salon.city}" não encontrada, usando Curitiba como referência`
        );
      }

      // Adicionar pequena variação aleatória para evitar que todos fiquem no mesmo ponto
      const latVariation = (Math.random() - 0.5) * 0.1; // ~11km de variação
      const lonVariation = (Math.random() - 0.5) * 0.1;

      const finalLat = coords.lat + latVariation;
      const finalLon = coords.lon + lonVariation;

      // Atualizar no banco
      await prisma.salon.update({
        where: { id: salon.id },
        data: {
          latitude: finalLat,
          longitude: finalLon,
        },
      });

      console.log(`✅ ${salon.name}`);
      console.log(`   📍 Lat: ${finalLat.toFixed(6)}, Lon: ${finalLon.toFixed(6)}`);
      console.log(`   📌 ${salon.city}, ${salon.state}\n`);
    }

    console.log("\n✨ Coordenadas adicionadas com sucesso!");
    console.log("🧪 Agora teste o filtro GPS na página de salões");
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestCoordinates();
