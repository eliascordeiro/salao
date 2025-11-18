const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserSalon() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'elias157508@gmail.com' },
      select: {
        name: true,
        email: true,
        role: true,
        roleType: true,
        ownedSalons: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('\n=== INFORMAÇÕES DO USUÁRIO ===');
    console.log('Nome:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('RoleType:', user.roleType);
    
    if (user.ownedSalons && user.ownedSalons.length > 0) {
      console.log('\n=== SALÕES ATRIBUÍDOS ===');
      user.ownedSalons.forEach((salon, index) => {
        console.log(`\nSalão ${index + 1}:`);
        console.log('  Nome:', salon.name);
        console.log('  Email:', salon.email);
        console.log('  Telefone:', salon.phone);
        console.log('  Endereço:', salon.address);
      });
    } else {
      console.log('\n⚠️  Usuário NÃO é proprietário de nenhum salão');
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSalon();
