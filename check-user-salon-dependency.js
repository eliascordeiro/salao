const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserSalonDependency() {
  try {
    const email = 'elias157508@gmail.com';
    
    // 1. Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleType: true,
        ownerId: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            ownedSalons: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true
              }
            }
          }
        },
        ownedSalons: {
          select: {
            id: true,
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
    console.log('ID:', user.id);
    console.log('Nome:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('RoleType:', user.roleType);
    console.log('OwnerId:', user.ownerId || 'Nenhum (usuário independente)');

    // 2. Verificar salões próprios
    if (user.ownedSalons && user.ownedSalons.length > 0) {
      console.log('\n=== SALÕES QUE O USUÁRIO POSSUI ===');
      user.ownedSalons.forEach((salon, index) => {
        console.log(`\nSalão ${index + 1}:`);
        console.log('  ID:', salon.id);
        console.log('  Nome:', salon.name);
        console.log('  Email:', salon.email);
        console.log('  Telefone:', salon.phone);
        console.log('  Endereço:', salon.address);
      });
    } else {
      console.log('\n⚠️  Usuário NÃO é proprietário de nenhum salão');
    }

    // 3. Verificar se é usuário gerenciado (criado por outro proprietário)
    if (user.ownerId && user.owner) {
      console.log('\n=== USUÁRIO GERENCIADO POR ===');
      console.log('Proprietário ID:', user.owner.id);
      console.log('Proprietário Nome:', user.owner.name);
      console.log('Proprietário Email:', user.owner.email);

      if (user.owner.ownedSalons && user.owner.ownedSalons.length > 0) {
        console.log('\n=== SALÕES DO PROPRIETÁRIO (onde os agendamentos devem ir) ===');
        user.owner.ownedSalons.forEach((salon, index) => {
          console.log(`\nSalão ${index + 1}:`);
          console.log('  ID:', salon.id);
          console.log('  Nome:', salon.name);
          console.log('  Email:', salon.email);
          console.log('  Telefone:', salon.phone);
          console.log('  Endereço:', salon.address);
        });
      }
    } else {
      console.log('\n✅ Usuário independente (não foi criado por outro proprietário)');
    }

    // 4. Buscar agendamentos deste usuário
    const bookings = await prisma.booking.findMany({
      where: { clientId: user.id },
      select: {
        id: true,
        date: true,
        status: true,
        salonId: true,
        salon: {
          select: {
            id: true,
            name: true,
            ownerId: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 5
    });

    console.log('\n=== ÚLTIMOS 5 AGENDAMENTOS ===');
    if (bookings.length === 0) {
      console.log('Nenhum agendamento encontrado');
    } else {
      bookings.forEach((booking, index) => {
        console.log(`\nAgendamento ${index + 1}:`);
        console.log('  ID:', booking.id);
        console.log('  Data:', booking.date.toLocaleString('pt-BR'));
        console.log('  Serviço:', booking.service.name);
        console.log('  Status:', booking.status);
        console.log('  Salão ID:', booking.salonId);
        console.log('  Salão Nome:', booking.salon.name);
        console.log('  Dono do Salão ID:', booking.salon.ownerId);
        
        // Verificar se está correto
        if (user.ownerId) {
          const isCorrect = booking.salon.ownerId === user.ownerId;
          console.log('  ✅ Atribuído corretamente?', isCorrect ? 'SIM' : '❌ NÃO');
        }
      });
    }

    // 5. Resumo
    console.log('\n=== RESUMO ===');
    if (user.ownerId) {
      console.log('✅ Este usuário foi criado pelo proprietário:', user.owner.name);
      console.log('✅ Todos os agendamentos devem ser no salão:', user.owner.ownedSalons[0]?.name);
      console.log('✅ ID do salão esperado:', user.owner.ownedSalons[0]?.id);
    } else {
      console.log('✅ Este usuário é independente ou proprietário');
      if (user.ownedSalons.length > 0) {
        console.log('✅ Possui salão próprio:', user.ownedSalons[0].name);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSalonDependency();
