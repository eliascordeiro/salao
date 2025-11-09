const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkAllEliasBookings() {
  const staffId = "cmhovyy2f0001ofuy71lwwwna";

  console.log("\n🔍 TODOS OS AGENDAMENTOS DO ELIAS CORDEIRO\n");
  console.log("=".repeat(70));

  const bookings = await prisma.booking.findMany({
    where: { staffId },
    include: {
      client: { select: { name: true } },
      service: { select: { name: true, duration: true } },
    },
    orderBy: { date: 'asc' },
  });

  console.log(`\n📊 Total: ${bookings.length} agendamento(s)\n`);

  if (bookings.length === 0) {
    console.log("❌ Nenhum agendamento encontrado!");
    console.log("\n💡 Isso explica por que os slots estão todos disponíveis.");
    console.log("   Você precisa criar um agendamento primeiro.\n");
    return;
  }

  const byDate = {};
  
  bookings.forEach(b => {
    const date = b.date.toISOString().split('T')[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(b);
  });

  Object.keys(byDate).sort().forEach(dateStr => {
    const bookingsOnDate = byDate[dateStr];
    const date = new Date(dateStr + 'T12:00:00');
    const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];
    
    console.log(`\n${dayName} ${dateStr}: ${bookingsOnDate.length} agendamento(s)`);
    console.log("-".repeat(70));

    bookingsOnDate.forEach((b, i) => {
      const bookingDate = new Date(b.date);
      const localTime = bookingDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });

      console.log(`   ${i + 1}. ${localTime} - ${b.client.name}`);
      console.log(`      Serviço: ${b.service.name} (${b.service.duration} min)`);
      console.log(`      Status: ${b.status}`);
      console.log(`      ID: ${b.id}`);
      console.log("");
    });
  });

  console.log("=".repeat(70) + "\n");
}

checkAllEliasBookings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
