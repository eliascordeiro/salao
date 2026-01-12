const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAnaCostaSalon() {
  try {
    const staff = await prisma.staff.findFirst({
      where: {
        name: { contains: 'Ana Costa', mode: 'insensitive' }
      },
      include: {
        salon: true
      }
    });

    if (!staff) {
      console.log('❌ Profissional "Ana Costa" não encontrada');
      return;
    }

    console.log('\n=== PROFISSIONAL ENCONTRADA ===\n');
    console.log(`Nome: ${staff.name}`);
    console.log(`ID: ${staff.id}`);
    console.log(`Ativa: ${staff.active ? '✅ SIM' : '❌ NÃO'}`);
    
    console.log('\n=== SALÃO ASSOCIADO ===\n');
    console.log(`Nome: ${staff.salon.name}`);
    console.log(`ID: ${staff.salon.id}`);
    console.log(`Status Atual: ${staff.salon.active ? '✅ ATIVO' : '❌ INATIVO'}`);

    if (!staff.salon.active) {
      console.log('\n🔧 Ativando salão...\n');
      
      const updated = await prisma.salon.update({
        where: { id: staff.salon.id },
        data: { active: true }
      });

      console.log(`✅ Salão "${updated.name}" ativado com sucesso!`);
    } else {
      console.log('\n✅ Salão já está ativo!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findAnaCostaSalon();
