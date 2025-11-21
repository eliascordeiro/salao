/**
 * Script para adicionar coordenadas GPS a salões que não têm
 * Usa Nominatim (OpenStreetMap) para geocoding
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');
const prisma = new PrismaClient();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCoordinates(address, city, state) {
  return new Promise((resolve) => {
    try {
      // Montar query para Nominatim
      const query = `${address}, ${city}, ${state}, Brasil`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      
      console.log(`   🔍 Buscando: ${query}`);
      
      https.get(url, {
        headers: {
          'User-Agent': 'SalaoApp/1.0'
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            
            if (json && json[0]) {
              const lat = parseFloat(json[0].lat);
              const lon = parseFloat(json[0].lon);
              
              // Validar coordenadas (Brasil: lat -35 a 5, lon -75 a -30)
              if (lat >= -35 && lat <= 5 && lon >= -75 && lon <= -30) {
                resolve({ lat, lon });
              } else {
                console.warn(`   ⚠️  Coordenadas fora do Brasil: ${lat}, ${lon}`);
                resolve(null);
              }
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error(`   ❌ Erro ao parsear resposta:`, error.message);
            resolve(null);
          }
        });
      }).on('error', (error) => {
        console.error(`   ❌ Erro na requisição:`, error.message);
        resolve(null);
      });
    } catch (error) {
      console.error(`   ❌ Erro ao buscar coordenadas:`, error.message);
      resolve(null);
    }
  });
}

async function addMissingCoordinates() {
  console.log('🌍 Iniciando adição de coordenadas GPS...\n');

  try {
    // Buscar salões sem coordenadas
    const salons = await prisma.salon.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      select: {
        id: true,
        name: true,
        address: true,
        street: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
      }
    });

    console.log(`📊 Salões sem coordenadas: ${salons.length}\n`);

    if (salons.length === 0) {
      console.log('✅ Todos os salões já têm coordenadas!');
      return;
    }

    const results = {
      total: salons.length,
      success: 0,
      failed: 0,
      skipped: 0,
    };

    for (const salon of salons) {
      console.log(`\n🔄 Processando: ${salon.name}`);
      
      // Validar se tem dados suficientes
      if (!salon.city || !salon.state) {
        console.log(`   ⏭️  Pulado: sem cidade/estado`);
        results.skipped++;
        continue;
      }

      // Usar street se existir, senão usar address
      const addressToSearch = salon.street || salon.address;
      
      if (!addressToSearch) {
        console.log(`   ⏭️  Pulado: sem endereço`);
        results.skipped++;
        continue;
      }

      // Buscar coordenadas
      const coords = await getCoordinates(addressToSearch, salon.city, salon.state);
      
      if (coords) {
        // Atualizar no banco
        await prisma.salon.update({
          where: { id: salon.id },
          data: {
            latitude: coords.lat,
            longitude: coords.lon,
          }
        });
        
        console.log(`   ✅ Coordenadas adicionadas: ${coords.lat}, ${coords.lon}`);
        results.success++;
      } else {
        console.log(`   ❌ Não foi possível obter coordenadas`);
        results.failed++;
      }

      // Aguardar 1 segundo entre requisições (respeitar rate limit do Nominatim)
      await sleep(1000);
    }

    console.log(`\n\n📈 Resumo:`);
    console.log(`   ✅ Sucesso: ${results.success}`);
    console.log(`   ❌ Falha: ${results.failed}`);
    console.log(`   ⏭️  Pulados: ${results.skipped}`);
    console.log(`   📊 Total: ${results.total}`);

  } catch (error) {
    console.error('❌ Erro durante processamento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
addMissingCoordinates()
  .then(() => {
    console.log('\n✅ Processamento concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });
