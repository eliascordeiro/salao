/**
 * Script de teste para verificar se a API de horários está funcionando
 * 
 * Execute com: npx tsx scripts/test-schedule-api.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testScheduleAPI() {
  console.log("🧪 Testando lógica de horários disponíveis...\n");

  try {
    // 1. Buscar um profissional
    const staff = await prisma.staff.findFirst({
      where: { active: true },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!staff) {
      console.log("❌ Nenhum profissional encontrado. Execute: npx prisma db seed");
      return;
    }

    console.log(`✅ Profissional: ${staff.name}`);
    console.log(`   Expediente: ${staff.workStart} - ${staff.workEnd}`);
    console.log(`   Almoço: ${staff.lunchStart || "N/A"} - ${staff.lunchEnd || "N/A"}`);
    console.log(`   Dias: ${staff.workDays}\n`);

    // 2. Buscar um serviço
    const service = staff.services[0]?.service;
    if (!service) {
      console.log("❌ Profissional não tem serviços vinculados");
      return;
    }

    console.log(`✅ Serviço: ${service.name}`);
    console.log(`   Duração: ${service.duration} minutos`);
    console.log(`   Preço: R$ ${service.price}\n`);

    // 3. Verificar agendamentos existentes para amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    console.log(`📅 Verificando agendamentos para: ${dateStr}\n`);

    const bookings = await prisma.booking.findMany({
      where: {
        staffId: staff.id,
        date: {
          gte: new Date(dateStr + "T00:00:00"),
          lte: new Date(dateStr + "T23:59:59"),
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      include: {
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    console.log(`📊 Agendamentos encontrados: ${bookings.length}\n`);

    if (bookings.length > 0) {
      console.log("Agendamentos existentes:");
      bookings.forEach((booking, index) => {
        const time = booking.date.toISOString().split("T")[1].substring(0, 5);
        const endMinutes = booking.date.getHours() * 60 + booking.date.getMinutes() + booking.service.duration;
        const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;
        
        console.log(`   ${index + 1}. ${time} - ${endTime} | ${booking.service.name} (${booking.service.duration}min) | Status: ${booking.status}`);
      });
      console.log("");
    } else {
      console.log("ℹ️  Nenhum agendamento para esta data\n");
      
      // Criar um agendamento de teste
      console.log("➕ Criando agendamento de teste às 10:00...\n");
      
      // Buscar um cliente
      const client = await prisma.user.findFirst({
        where: { role: "CLIENT" },
      });

      if (!client) {
        console.log("❌ Nenhum cliente encontrado");
        return;
      }

      // Buscar o salão
      const salon = await prisma.salon.findFirst();
      if (!salon) {
        console.log("❌ Nenhum salão encontrado");
        return;
      }

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
        },
      });

      const endMinutes = 10 * 60 + newBooking.service.duration;
      const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

      console.log(`✅ Agendamento criado!`);
      console.log(`   Horário: 10:00 - ${endTime}`);
      console.log(`   Serviço: ${newBooking.service.name} (${newBooking.service.duration}min)`);
      console.log(`   Status: ${newBooking.status}\n`);
    }

    // 4. Simular chamada da API
    console.log("🔍 Simulando lógica da API de horários...\n");

    const [workStartH, workStartM] = staff.workStart.split(":").map(Number);
    const [workEndH, workEndM] = staff.workEnd.split(":").map(Number);
    const workStartMin = workStartH * 60 + workStartM;
    const workEndMin = workEndH * 60 + workEndM;

    // Calcular períodos ocupados
    const occupiedPeriods: Array<{ start: number; end: number }> = [];

    // Adicionar almoço
    if (staff.lunchStart && staff.lunchEnd) {
      const [lunchStartH, lunchStartM] = staff.lunchStart.split(":").map(Number);
      const [lunchEndH, lunchEndM] = staff.lunchEnd.split(":").map(Number);
      occupiedPeriods.push({
        start: lunchStartH * 60 + lunchStartM,
        end: lunchEndH * 60 + lunchEndM,
      });
    }

    // Adicionar agendamentos
    const allBookings = await prisma.booking.findMany({
      where: {
        staffId: staff.id,
        date: {
          gte: new Date(dateStr + "T00:00:00"),
          lte: new Date(dateStr + "T23:59:59"),
        },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        service: {
          select: { duration: true },
        },
      },
    });

    allBookings.forEach((booking) => {
      const startMin = booking.date.getHours() * 60 + booking.date.getMinutes();
      const endMin = startMin + booking.service.duration;
      occupiedPeriods.push({ start: startMin, end: endMin });
    });

    console.log("Períodos ocupados:");
    occupiedPeriods.forEach((period) => {
      const startTime = `${Math.floor(period.start / 60).toString().padStart(2, "0")}:${(period.start % 60).toString().padStart(2, "0")}`;
      const endTime = `${Math.floor(period.end / 60).toString().padStart(2, "0")}:${(period.end % 60).toString().padStart(2, "0")}`;
      console.log(`   ${startTime} - ${endTime}`);
    });
    console.log("");

    // Gerar grade de horários
    const requestedDuration = service.duration;
    let availableCount = 0;
    let occupiedCount = 0;

    console.log(`Grade de horários (Duração solicitada: ${requestedDuration}min):\n`);

    for (let time = workStartMin; time < workEndMin; time += 15) {
      const endTime = time + requestedDuration;
      const timeStr = `${Math.floor(time / 60).toString().padStart(2, "0")}:${(time % 60).toString().padStart(2, "0")}`;

      // Verificar conflito
      const hasConflict = occupiedPeriods.some((occupied) => {
        return (
          (time >= occupied.start && time < occupied.end) ||
          (endTime > occupied.start && endTime <= occupied.end) ||
          (time <= occupied.start && endTime >= occupied.end)
        );
      });

      if (endTime > workEndMin) {
        console.log(`   ${timeStr} ⚫ Ultrapassa expediente`);
        occupiedCount++;
      } else if (hasConflict) {
        console.log(`   ${timeStr} 🔴 Ocupado`);
        occupiedCount++;
      } else {
        console.log(`   ${timeStr} 🟢 Disponível`);
        availableCount++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   🟢 Disponíveis: ${availableCount}`);
    console.log(`   🔴 Ocupados: ${occupiedCount}`);
    console.log(`   📊 Total: ${availableCount + occupiedCount}\n`);

    console.log("✅ Teste concluído!\n");
    console.log("💡 Agora teste no navegador:");
    console.log(`   1. Acesse: http://localhost:3000/agendar`);
    console.log(`   2. Escolha: Agendamento Dinâmico`);
    console.log(`   3. Selecione: ${service.name}`);
    console.log(`   4. Selecione: ${staff.name}`);
    console.log(`   5. Escolha a data: ${dateStr}`);
    console.log(`   6. Veja os horários ocupados em VERMELHO 🔴\n`);

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testScheduleAPI();
