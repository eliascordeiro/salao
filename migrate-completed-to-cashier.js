const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log("🔄 Migrando agendamentos COMPLETED para o caixa...\n");

    // Buscar todos os agendamentos COMPLETED sem sessão de caixa
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: "COMPLETED",
      },
      include: {
        service: { select: { name: true, price: true } },
        staff: { select: { name: true } },
        client: { select: { name: true } },
      },
    });

    console.log(`📋 Total de agendamentos COMPLETED: ${completedBookings.length}\n`);

    let created = 0;
    let skipped = 0;

    for (const booking of completedBookings) {
      // Verificar se já tem sessão
      const existingSession = await prisma.cashierSessionItem.findFirst({
        where: { bookingId: booking.id },
      });

      if (existingSession) {
        console.log(`⏭️  Pulado: ${booking.client.name} - ${booking.service.name} (já tem sessão)`);
        skipped++;
        continue;
      }

      // Criar sessão de caixa
      await prisma.cashierSession.create({
        data: {
          salonId: booking.salonId,
          clientId: booking.clientId,
          subtotal: booking.service.price,
          discount: 0,
          total: booking.service.price,
          status: "OPEN",
          items: {
            create: {
              bookingId: booking.id,
              serviceName: booking.service.name,
              staffName: booking.staff.name,
              price: booking.service.price,
              discount: 0,
            },
          },
        },
      });

      console.log(`✅ Criado: ${booking.client.name} - ${booking.service.name} (R$ ${booking.service.price.toFixed(2)})`);
      created++;
    }

    console.log("\n📊 RESUMO DA MIGRAÇÃO:");
    console.log(`✅ Sessões criadas: ${created}`);
    console.log(`⏭️  Sessões já existentes: ${skipped}`);
    console.log(`📋 Total processado: ${completedBookings.length}`);

    // Mostrar sessões abertas agora
    const openSessions = await prisma.cashierSession.count({
      where: { status: "OPEN" },
    });

    console.log(`\n💰 Total de sessões abertas agora: ${openSessions}`);
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
