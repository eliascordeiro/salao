/**
 * Verificar dados reais do banco
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkData() {
  console.log("🔍 Verificando dados do banco...\n");

  // Buscar todos os agendamentos de amanhã
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  const bookings = await prisma.booking.findMany({
    where: {
      date: {
        gte: new Date(dateStr + "T00:00:00"),
        lte: new Date(dateStr + "T23:59:59"),
      },
    },
    include: {
      service: {
        select: {
          name: true,
          duration: true,
        },
      },
      staff: {
        select: {
          name: true,
        },
      },
      client: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  console.log(`📅 Agendamentos para ${dateStr}:\n`);

  if (bookings.length === 0) {
    console.log("❌ Nenhum agendamento encontrado para esta data");
    console.log("\n💡 Criando agendamento de teste...\n");

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

    // Criar agendamento às 10:00
    const bookingDate = new Date(dateStr + "T10:00:00");

    const newBooking = await prisma.booking.create({
      data: {
        clientId: client.id,
        serviceId: service.id,
        staffId: staff.id,
        salonId: salon.id,
        date: bookingDate,
        totalPrice: service.price,
        status: "CONFIRMED",
      },
      include: {
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
        staff: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log("✅ Agendamento criado:");
    console.log(`   ID: ${newBooking.id}`);
    console.log(`   Cliente: ${newBooking.client.name}`);
    console.log(`   Profissional: ${newBooking.staff.name}`);
    console.log(`   Serviço: ${newBooking.service.name} (${newBooking.service.duration}min)`);
    console.log(`   Data/Hora: ${newBooking.date.toISOString()}`);
    console.log(`   Status: ${newBooking.status}`);
    console.log("");

    // Calcular período ocupado
    const startMin = newBooking.date.getUTCHours() * 60 + newBooking.date.getUTCMinutes();
    const endMin = startMin + newBooking.service.duration;
    const formatTime = (min: number) => {
      const h = Math.floor(min / 60)
        .toString()
        .padStart(2, "0");
      const m = (min % 60).toString().padStart(2, "0");
      return `${h}:${m}`;
    };

    console.log("📊 Período ocupado:");
    console.log(`   Início: ${formatTime(startMin)}`);
    console.log(`   Fim: ${formatTime(endMin)}`);
    console.log("");

    console.log("🔴 Slots que devem ficar INATIVOS:");
    for (let time = startMin; time < endMin; time += 15) {
      console.log(`   ${formatTime(time)}`);
    }
    console.log("");
  } else {
    bookings.forEach((booking, index) => {
      console.log(`📅 AGENDAMENTO #${index + 1}`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   Cliente: ${booking.client.name}`);
      console.log(`   Profissional: ${booking.staff.name}`);
      console.log(`   Serviço: ${booking.service.name} (${booking.service.duration}min)`);
      console.log(`   Data/Hora: ${booking.date.toISOString()}`);
      console.log(`   Status: ${booking.status}`);
      console.log("");

      // Calcular período ocupado
      const startMin = booking.date.getUTCHours() * 60 + booking.date.getUTCMinutes();
      const endMin = startMin + booking.service.duration;
      const formatTime = (min: number) => {
        const h = Math.floor(min / 60)
          .toString()
          .padStart(2, "0");
        const m = (min % 60).toString().padStart(2, "0");
        return `${h}:${m}`;
      };

      console.log(`   📊 Período ocupado: ${formatTime(startMin)} - ${formatTime(endMin)}`);
      console.log(`   🔴 Slots que devem ficar INATIVOS:`);
      for (let time = startMin; time < endMin; time += 15) {
        console.log(`      ${formatTime(time)}`);
      }
      console.log("");
    });
  }

  await prisma.$disconnect();
}

checkData();
