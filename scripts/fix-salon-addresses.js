/**
 * Script para migrar endereços antigos (campo único 'address')
 * para campos separados (street, number, neighborhood, city, state, zipCode)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSalonAddresses() {
  console.log('🔧 Iniciando migração de endereços...\n');

  try {
    // Buscar todos os salões
    const salons = await prisma.salon.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        street: true,
        number: true,
        complement: true,
        neighborhood: true,
        city: true,
        state: true,
        zipCode: true,
      }
    });

    console.log(`📊 Total de salões encontrados: ${salons.length}\n`);

    let updated = 0;
    let skipped = 0;

    for (const salon of salons) {
      // Pular se já tem street preenchido
      if (salon.street) {
        console.log(`⏭️  Salão "${salon.name}" - já tem campos separados`);
        skipped++;
        continue;
      }

      // Pular se não tem address para processar
      if (!salon.address) {
        console.log(`⚠️  Salão "${salon.name}" - sem endereço`);
        skipped++;
        continue;
      }

      console.log(`\n🔄 Processando: ${salon.name}`);
      console.log(`   Endereço atual: ${salon.address}`);

      // Tentar parsear o endereço
      const parsed = parseAddress(salon.address);

      // Atualizar apenas se conseguimos extrair pelo menos a rua
      if (parsed.street) {
        await prisma.salon.update({
          where: { id: salon.id },
          data: {
            street: parsed.street,
            number: parsed.number || null,
            neighborhood: parsed.neighborhood || null,
            // Manter city/state/zipCode originais se existirem
            ...(salon.city ? {} : { city: parsed.city || null }),
            ...(salon.state ? {} : { state: parsed.state || null }),
          }
        });

        console.log(`   ✅ Atualizado:`);
        console.log(`      - Rua: ${parsed.street}`);
        if (parsed.number) console.log(`      - Número: ${parsed.number}`);
        if (parsed.neighborhood) console.log(`      - Bairro: ${parsed.neighborhood}`);
        if (parsed.city && !salon.city) console.log(`      - Cidade: ${parsed.city}`);
        if (parsed.state && !salon.state) console.log(`      - Estado: ${parsed.state}`);

        updated++;
      } else {
        console.log(`   ⚠️  Não foi possível parsear o endereço`);
        skipped++;
      }
    }

    console.log(`\n\n📈 Resumo da migração:`);
    console.log(`   ✅ Atualizados: ${updated}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   📊 Total: ${salons.length}`);

  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Tenta parsear um endereço em formato completo
 * Formatos suportados:
 * - "Rua X, 123"
 * - "Rua X, 123 - Bairro"
 * - "Rua X, 123 - Bairro - Cidade/UF"
 * - "Rua X - Bairro"
 */
function parseAddress(address) {
  const result = {
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: ''
  };

  try {
    // Remover espaços extras
    address = address.trim();

    // Tentar detectar formato "Rua, Número"
    if (address.includes(',')) {
      const parts = address.split(',');
      result.street = parts[0].trim();
      
      // Processar o restante após a vírgula
      const rest = parts.slice(1).join(',').trim();
      
      // Verificar se tem número no início do rest
      const numberMatch = rest.match(/^(\d+[A-Za-z]?)\b/);
      if (numberMatch) {
        result.number = numberMatch[1];
        
        // O que sobra após o número
        const afterNumber = rest.substring(numberMatch[0].length).trim();
        
        // Verificar se tem hífen (separador de bairro/cidade)
        if (afterNumber.startsWith('-')) {
          const segments = afterNumber.substring(1).split('-').map(s => s.trim());
          
          if (segments.length >= 1) {
            result.neighborhood = segments[0];
          }
          
          if (segments.length >= 2) {
            // Último segmento pode ser Cidade/Estado
            const lastSegment = segments[segments.length - 1];
            if (lastSegment.includes('/')) {
              const [city, state] = lastSegment.split('/').map(s => s.trim());
              result.city = city;
              result.state = state;
            } else {
              result.city = lastSegment;
            }
          }
        }
      }
    } 
    // Formato sem vírgula: "Rua X - Bairro - Cidade"
    else if (address.includes(' - ')) {
      const segments = address.split(' - ').map(s => s.trim());
      
      if (segments.length >= 1) {
        result.street = segments[0];
      }
      
      if (segments.length >= 2) {
        result.neighborhood = segments[1];
      }
      
      if (segments.length >= 3) {
        const lastSegment = segments[2];
        if (lastSegment.includes('/')) {
          const [city, state] = lastSegment.split('/').map(s => s.trim());
          result.city = city;
          result.state = state;
        } else {
          result.city = lastSegment;
        }
      }
    }
    // Formato simples: só rua
    else {
      result.street = address;
    }

  } catch (error) {
    console.error('Erro ao parsear endereço:', error);
  }

  return result;
}

// Executar
fixSalonAddresses()
  .then(() => {
    console.log('\n✅ Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na migração:', error);
    process.exit(1);
  });
