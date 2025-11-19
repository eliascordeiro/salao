const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Buscar usuários criados a partir do salão
    const users = await prisma.user.findMany({
      where: {
        roleType: { in: ['STAFF', 'CUSTOM'] },
        ownerId: { not: null }
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📊 USUÁRIOS CRIADOS A PARTIR DO SALÃO:\n');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`Total de usuários: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado.\n');
      console.log('Os usuários do salão devem ter:');
      console.log('  - roleType: "STAFF" ou "CUSTOM"');
      console.log('  - ownerId: ID do proprietário\n');
    } else {
      // Estatísticas
      const ativos = users.filter(u => u.active).length;
      const inativos = users.filter(u => !u.active).length;
      const staff = users.filter(u => u.roleType === 'STAFF').length;
      const custom = users.filter(u => u.roleType === 'CUSTOM').length;

      console.log('📈 ESTATÍSTICAS:');
      console.log(`   Ativos: ${ativos}`);
      console.log(`   Inativos: ${inativos}`);
      console.log(`   Tipo STAFF: ${staff}`);
      console.log(`   Tipo CUSTOM: ${custom}\n`);

      console.log('👥 LISTA DE USUÁRIOS:\n');

      users.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👔 Tipo: ${user.roleType === 'STAFF' ? 'Funcionário' : 'Personalizado'}`);
        console.log(`   👤 Proprietário: ${user.owner?.name} (${user.owner?.email})`);
        console.log(`   ${user.active ? '✅' : '❌'} Status: ${user.active ? 'Ativo' : 'Inativo'}`);
        console.log(`   🔐 Permissões: ${user.permissions.length} configuradas`);
        console.log(`   📅 Criado em: ${new Date(user.createdAt).toLocaleString('pt-BR')}`);
        console.log(`   🔑 ID: ${user.id}`);
        console.log('');
      });
    }

    // Buscar também usuários OWNER (proprietários de salão)
    const owners = await prisma.user.findMany({
      where: {
        roleType: 'OWNER'
      },
      include: {
        managedUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            roleType: true,
            active: true
          }
        }
      }
    });

    if (owners.length > 0) {
      console.log('═══════════════════════════════════════════════════════\n');
      console.log('👔 PROPRIETÁRIOS E SEUS USUÁRIOS:\n');
      
      owners.forEach((owner, i) => {
        console.log(`${i + 1}. ${owner.name} (${owner.email})`);
        console.log(`   Usuários gerenciados: ${owner.managedUsers.length}`);
        if (owner.managedUsers.length > 0) {
          owner.managedUsers.forEach(u => {
            console.log(`     - ${u.name} (${u.email}) - ${u.roleType} ${u.active ? '✅' : '❌'}`);
          });
        }
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro ao consultar banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
