import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUserPhones() {
  try {
    console.log("🔍 Verificando telefones cadastrados dos usuários...\n");

    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Total de usuários: ${users.length}\n`);

    // Separar por status de telefone
    const usersWithPhone = users.filter(u => u.phone && u.phone.trim() !== '');
    const usersWithoutPhone = users.filter(u => !u.phone || u.phone.trim() === '');

    console.log("✅ USUÁRIOS COM TELEFONE:");
    console.log(`   Total: ${usersWithPhone.length}`);
    usersWithPhone.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
      console.log(`     Telefone: ${user.phone}`);
      console.log(`     Role: ${user.role}`);
      console.log("");
    });

    console.log("\n❌ USUÁRIOS SEM TELEFONE:");
    console.log(`   Total: ${usersWithoutPhone.length}`);
    usersWithoutPhone.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
      console.log(`     Role: ${user.role}`);
      console.log("");
    });

    // Buscar agendamentos recentes
    console.log("\n📅 ÚLTIMOS 5 AGENDAMENTOS:");
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
        staff: {
          select: {
            name: true,
          },
        },
      },
    });

    recentBookings.forEach((booking, index) => {
      console.log(`\n   ${index + 1}. Agendamento ID: ${booking.id}`);
      console.log(`      Cliente: ${booking.client.name} (${booking.client.email})`);
      console.log(`      Telefone: ${booking.client.phone || '❌ NÃO CADASTRADO'}`);
      console.log(`      Serviço: ${booking.service.name}`);
      console.log(`      Profissional: ${booking.staff.name}`);
      console.log(`      Data: ${booking.date.toLocaleString('pt-BR')}`);
      console.log(`      Status: ${booking.status}`);
    });

    // Estatísticas
    console.log("\n📈 ESTATÍSTICAS:");
    console.log(`   Usuários com telefone: ${usersWithPhone.length} (${((usersWithPhone.length / users.length) * 100).toFixed(1)}%)`);
    console.log(`   Usuários sem telefone: ${usersWithoutPhone.length} (${((usersWithoutPhone.length / users.length) * 100).toFixed(1)}%)`);

    // Verificar se admin tem telefone
    const admin = users.find(u => u.email === 'admin@agendasalao.com.br');
    if (admin) {
      console.log(`\n👤 ADMIN (admin@agendasalao.com.br):`);
      console.log(`   Nome: ${admin.name}`);
      console.log(`   Telefone: ${admin.phone || '❌ NÃO CADASTRADO'}`);
      
      if (!admin.phone) {
        console.log("\n⚠️  AÇÃO NECESSÁRIA:");
        console.log("   O admin NÃO tem telefone cadastrado!");
        console.log("   Para receber notificações WhatsApp, cadastre um telefone.");
      }
    }

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPhones();
