const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkCorrectElias() {
  const userId = "cmhpdo1by0005of608xxk9y0i"; // elias@ig.com.br

  console.log("\n🔍 VERIFICANDO DADOS DO USUÁRIO elias@ig.com.br\n");
  console.log("=".repeat(70));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedSalons: {
        include: {
          services: { where: { active: true } },
          staff: { where: { active: true } },
        },
      },
    },
  });

  if (!user) {
    console.log("❌ Usuário não encontrado");
    return;
  }

  console.log("\n👤 USUÁRIO:");
  console.log(`   Nome: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   ID: ${user.id}\n`);

  if (user.ownedSalons.length === 0) {
    console.log("❌ Nenhum salão encontrado");
    return;
  }

  user.ownedSalons.forEach((salon, i) => {
    console.log(`\n🏪 SALÃO ${i + 1}:`);
    console.log(`   Nome: ${salon.name}`);
    console.log(`   Email: ${salon.email || "não cadastrado"}`);
    console.log(`   ID: ${salon.id}`);
    console.log(`   Serviços ativos: ${salon.services.length}`);
    console.log(`   Profissionais ativos: ${salon.staff.length}\n`);

    if (salon.staff.length > 0) {
      console.log("   👥 PROFISSIONAIS:");
      salon.staff.forEach((s, j) => {
        console.log(`      ${j + 1}. ${s.name}`);
        console.log(`         ID: ${s.id}`);
        console.log(`         Dias: ${s.workDays || "não configurado"}`);
        console.log(`         Horário: ${s.workStart || "?"} - ${s.workEnd || "?"}`);
      });
    }
  });

  // Buscar agendamentos do profissional correto
  const salonId = user.ownedSalons[0]?.id;
  if (!salonId) return;

  const staff = await prisma.staff.findMany({
    where: { salonId },
  });

  if (staff.length === 0) return;

  const staffId = staff[0].id;

  console.log("\n\n📅 AGENDAMENTOS DO PROFISSIONAL:");
  console.log("   ID do profissional:", staffId);
  console.log("");

  const bookings = await prisma.booking.findMany({
    where: { staffId },
    include: {
      client: { select: { name: true } },
      service: { select: { name: true, duration: true } },
    },
    orderBy: { date: "asc" },
  });

  if (bookings.length === 0) {
    console.log("   ❌ Nenhum agendamento encontrado\n");
    console.log("   💡 Isso explica por que todos os slots estão disponíveis!");
    return;
  }

  console.log(`   ✅ ${bookings.length} agendamento(s) encontrado(s):\n`);

  bookings.forEach((b, i) => {
    const date = new Date(b.date);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];
    const localTime = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });

    console.log(`   ${i + 1}. ${dayName} ${dateStr} às ${localTime}`);
    console.log(`      Cliente: ${b.client.name}`);
    console.log(`      Serviço: ${b.service.name} (${b.service.duration} min)`);
    console.log(`      Status: ${b.status}`);
    console.log("");
  });

  console.log("=".repeat(70) + "\n");
}

checkCorrectElias()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
