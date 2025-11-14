const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkCoordinates() {
  try {
    console.log("🔍 Verificando coordenadas dos salões...\n");

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

    console.log(`📊 Total de salões: ${salons.length}\n`);

    let withCoordinates = 0;
    let withoutCoordinates = 0;

    salons.forEach((salon) => {
      if (salon.latitude && salon.longitude) {
        withCoordinates++;
        console.log(`✅ ${salon.name}`);
        console.log(`   📍 Lat: ${salon.latitude}, Lon: ${salon.longitude}`);
        console.log(`   📌 ${salon.city}, ${salon.state}\n`);
      } else {
        withoutCoordinates++;
        console.log(`❌ ${salon.name}`);
        console.log(`   ⚠️  Sem coordenadas`);
        console.log(`   📌 ${salon.city}, ${salon.state}\n`);
      }
    });

    console.log("\n📈 Resumo:");
    console.log(`✅ Com coordenadas: ${withCoordinates}`);
    console.log(`❌ Sem coordenadas: ${withoutCoordinates}`);
    console.log(
      `📊 Porcentagem: ${((withCoordinates / salons.length) * 100).toFixed(1)}%`
    );

    // Sugestão de coordenadas para cidades brasileiras comuns (teste)
    if (withoutCoordinates > 0) {
      console.log("\n💡 Coordenadas de exemplo para cidades brasileiras:");
      console.log("São Paulo: -23.5505, -46.6333");
      console.log("Rio de Janeiro: -22.9068, -43.1729");
      console.log("Belo Horizonte: -19.9167, -43.9345");
      console.log("Brasília: -15.7939, -47.8828");
      console.log("Curitiba: -25.4284, -49.2733");
      console.log("Porto Alegre: -30.0346, -51.2177");
      console.log("Salvador: -12.9714, -38.5014");
      console.log("Fortaleza: -3.7172, -38.5433");
      console.log("Recife: -8.0476, -34.8770");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoordinates();
