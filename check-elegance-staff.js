const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEleganceStaff() {
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
      console.log('❌ Salão Elegance não encontrado');
      return;
    }

    console.log('\n=== PROFISSIONAIS DO SALÃO ELEGANCE ===\n');
    console.log(`Salão: ${salon.name}`);
    console.log(`Total de profissionais cadastrados: ${salon.staff.length}\n`);

    if (salon.staff.length === 0) {
      console.log('❌ Nenhum profissional cadastrado');
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

    // Verificar se Elias está cadastrado
    const elias = salon.staff.find(s => s.name.toLowerCase().includes('elias'));
    if (elias) {
      console.log('⚠️ ELIAS ENCONTRADO:');
      console.log(`   Nome: ${elias.name}`);
      console.log(`   Status: ${elias.active ? '✅ ATIVO' : '❌ INATIVO'}`);
    } else {
      console.log('✅ Elias NÃO está cadastrado neste salão');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEleganceStaff();
