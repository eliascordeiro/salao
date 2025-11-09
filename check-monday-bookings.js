const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkMondayBookings() {
  console.log("\n🔍 VERIFICANDO AGENDAMENTOS DE SEGUNDA-FEIRA\n");
  console.log("=".repeat(70));

  const staffId = "cmhovyy2f0001ofuy71lwwwna"; // Elias

  // Buscar próximas segundas-feiras
  const today = new Date();
  const mondayDates = [];
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (date.getDay() === 1) {
      mondayDates.push(date.toISOString().split('T')[0]);
    }
    if (mondayDates.length >= 3) break;
  }

  console.log("\n📅 Próximas segundas-feiras:", mondayDates.join(", "));
  console.log("");

  for (const dateStr of mondayDates) {
    console.log(`\n📋 Segunda-feira ${dateStr}:`);
    console.log("-".repeat(70));

    const startOfDay = new Date(dateStr + 'T00:00:00');
    const endOfDay = new Date(dateStr + 'T23:59:59');

    const bookings = await prisma.booking.findMany({
      where: {
        staffId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        client: { select: { name: true } },
        service: { select: { name: true, duration: true } },
      },
      orderBy: { date: 'asc' },
    });

    if (bookings.length === 0) {
      console.log("   ✅ Nenhum agendamento neste dia");
      continue;
    }

    console.log(`   🔴 ${bookings.length} agendamento(s) encontrado(s):\n`);

    bookings.forEach((b, i) => {
      const bookingDate = new Date(b.date);
      
      // Mostrar em ambos formatos para debug
      const utcTime = `${bookingDate.getUTCHours().toString().padStart(2, '0')}:${bookingDate.getUTCMinutes().toString().padStart(2, '0')}`;
      const localTime = bookingDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });

      console.log(`   ${i + 1}. Cliente: ${b.client.name}`);
      console.log(`      Serviço: ${b.service.name} (${b.service.duration} min)`);
      console.log(`      Status: ${b.status}`);
      console.log(`      Data no banco (UTC): ${b.date.toISOString()}`);
      console.log(`      Horário UTC: ${utcTime}`);
      console.log(`      Horário Local (GMT-3): ${localTime}`);
      console.log(`      ${b.status === 'PENDING' || b.status === 'CONFIRMED' ? '🔴 DEVERIA BLOQUEAR SLOT' : '⚪ Não bloqueia'}`);
      console.log("");
    });
  }

  console.log("=".repeat(70) + "\n");
}

checkMondayBookings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
