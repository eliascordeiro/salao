/**
 * Limpar agendamentos antigos e criar novo com timezone UTC correto
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetBookings() {
  console.log("🧹 Limpando agendamentos antigos...\n");

  // Deletar todos os agendamentos
  const deleted = await prisma.booking.deleteMany({});
  console.log(`✅ ${deleted.count} agendamentos deletados\n`);

  // Buscar dados necessários
  const staff = await prisma.staff.findFirst({ where: { active: true } });
  const service = await prisma.service.findFirst({ where: { active: true } });
  const client = await prisma.user.findFirst({ where: { role: "CLIENT" } });
  const salon = await prisma.salon.findFirst();

  if (!staff || !service || !client || !salon) {
    console.log("❌ Faltam dados no banco. Execute: npx prisma db seed");
    await prisma.$disconnect();
    return;
  }

  // Criar 3 agendamentos de teste para amanhã
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  const testBookings = [
    { time: "10:00", service: service },
    { time: "14:00", service: service },
    { time: "16:30", service: service },
  ];

  console.log(`📅 Criando agendamentos de teste para ${dateStr}:\n`);

  for (const test of testBookings) {
    // Correção timezone: criar data local que será automaticamente convertida para UTC
    const localDateTimeStr = `${dateStr}T${test.time}:00`;
    const bookingDate = new Date(localDateTimeStr);

    const booking = await prisma.booking.create({
      data: {
        clientId: client.id,
        serviceId: test.service.id,
        staffId: staff.id,
        salonId: salon.id,
        date: bookingDate,
        totalPrice: test.service.price,
        status: "CONFIRMED",
      },
      include: {
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
      },
    });

    const startMin = bookingDate.getUTCHours() * 60 + bookingDate.getUTCMinutes();
    const endMin = startMin + booking.service.duration;
    const formatTime = (min: number) => {
      const h = Math.floor(min / 60)
        .toString()
        .padStart(2, "0");
      const m = (min % 60).toString().padStart(2, "0");
      return `${h}:${m}`;
    };

    console.log(`✅ Agendamento criado:`);
    console.log(`   Horário: ${test.time} (UTC)`);
    console.log(`   Serviço: ${booking.service.name} (${booking.service.duration}min)`);
    console.log(`   Gravado: ${bookingDate.toISOString()}`);
    console.log(`   Período ocupado: ${formatTime(startMin)} - ${formatTime(endMin)}`);
    console.log("");
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ Agendamentos criados com UTC correto!");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("🧪 Executar testes:");
  console.log("   1. npx tsx scripts/check-database.ts");
  console.log("   2. npm run dev");
  console.log("   3. Acessar: http://localhost:3000/agendar-dinamico");
  console.log(`   4. Selecionar data: ${dateStr}`);
  console.log("   5. Verificar slots VERMELHOS: 10:00, 10:15, 10:30, 14:00, 14:15, 14:30, 16:30, 16:45");
  console.log("");

  await prisma.$disconnect();
}

resetBookings();
