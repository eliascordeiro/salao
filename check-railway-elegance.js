const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:bfzNahVPyVcwzIewNotORAKWJFOZiFpW@gondola.proxy.rlwy.net:20615/railway'
    }
  }
});

async function checkRailwayElegance() {
  try {
    const salon = await prisma.salon.findFirst({
      where: {
        name: { contains: 'Elegance', mode: 'insensitive' }
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            active: true,
            specialty: true
          }
        }
      }
    });

    if (!salon) {
      console.log('❌ Salão Elegance não encontrado no Railway');
      return;
    }

    console.log('\n=== PROFISSIONAIS NO RAILWAY - SALÃO ELEGANCE ===\n');
    console.log(`Salão: ${salon.name}`);
    console.log(`ID: ${salon.id}`);
    console.log(`Status: ${salon.active ? '✅ ATIVO' : '❌ INATIVO'}`);
    console.log(`Total de profissionais: ${salon.staff.length}\n`);

    if (salon.staff.length === 0) {
      console.log('❌ Nenhum profissional cadastrado no Railway');
    } else {
      salon.staff.forEach((staff, index) => {
        console.log(`${index + 1}. ${staff.name}`);
        console.log(`   ID: ${staff.id}`);
        console.log(`   Email: ${staff.email || 'N/A'}`);
        console.log(`   Especialidade: ${staff.specialty || 'N/A'}`);
        console.log(`   Status: ${staff.active ? '✅ ATIVO' : '❌ INATIVO'}`);
        console.log('');
      });
    }

    // Verificar Elias
    const elias = salon.staff.find(s => s.name.toLowerCase().includes('elias'));
    if (elias) {
      console.log('⚠️ ELIAS ENCONTRADO NO RAILWAY:');
      console.log(`   Nome: ${elias.name}`);
      console.log(`   Status: ${elias.active ? '✅ ATIVO' : '❌ INATIVO'}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRailwayElegance();
