const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAnaSalonEmail() {
  try {
    const staff = await prisma.staff.findFirst({
      where: {
        name: { contains: 'Ana Costa', mode: 'insensitive' }
      },
      include: {
        salon: {
          include: {
            owner: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!staff) {
      console.log('❌ Ana Costa não encontrada');
      return;
    }

    console.log('\n=== INFORMAÇÕES DO SALÃO ===\n');
    console.log(`Salão: ${staff.salon.name}`);
    console.log(`Proprietário: ${staff.salon.owner?.name || 'N/A'}`);
    console.log(`Email: ${staff.salon.owner?.email || 'N/A'}`);
    console.log(`Telefone do Salão: ${staff.salon.phone || 'N/A'}`);
    console.log(`Endereço: ${staff.salon.address || 'N/A'}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getAnaSalonEmail();
