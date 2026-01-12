const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findElegance() {
  try {
    const salons = await prisma.salon.findMany({
      where: {
        OR: [
          { name: { contains: 'elegance', mode: 'insensitive' } },
          { name: { contains: 'Elegance', mode: 'insensitive' } },
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('\n=== RESULTADOS DA BUSCA POR "ELEGANCE" ===\n');
    
    if (salons.length === 0) {
      console.log('❌ Nenhum salão encontrado com "elegance" no nome');
    } else {
      console.log(`✅ Encontrado(s) ${salons.length} salão(ões):\n`);
      
      salons.forEach((salon, index) => {
        console.log(`${index + 1}. ${salon.name}`);
        console.log(`   ID: ${salon.id}`);
        console.log(`   Ativo: ${salon.active ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`   Owner: ${salon.owner?.name || 'N/A'} (${salon.owner?.email || 'N/A'})`);
        console.log(`   Endereço: ${salon.address || 'N/A'}`);
        console.log(`   Telefone: ${salon.phone || 'N/A'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findElegance();
