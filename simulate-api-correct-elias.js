const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function simulateAPICall() {
  const staffId = "cmhpfkxk10001ofyrulo7v169"; // Elias correto
  const date = "2025-11-10"; // Segunda-feira com agendamento às 09:00
  const serviceId = "service-barba-cabelo-bigode"; // Precisa buscar o ID real

  console.log("\n🧪 SIMULANDO CHAMADA DA API /api/available-slots\n");
  console.log("=".repeat(70));

  // Buscar serviço
  const service = await prisma.service.findFirst({
    where: { salonId: "cmhpdo1c40007of60yed697zp" },
  });

  if (!service) {
    console.log("❌ Serviço não encontrado");
    return;
  }

  console.log(`\n📋 PARÂMETROS:`);
  console.log(`   staffId: ${staffId}`);
  console.log(`   date: ${date}`);
  console.log(`   serviceId: ${service.id}`);
  console.log(`   Duração: ${service.duration} min\n`);

  // Buscar profissional
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      workDays: true,
      workStart: true,
      workEnd: true,
      lunchStart: true,
      lunchEnd: true,
    },
  });

  // Verificar dia da semana
  const selectedDate = new Date(date + "T12:00:00");
  const dayOfWeek = selectedDate.getDay();
  console.log(`✅ Dia da semana: ${dayOfWeek} (${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek]})`);

  const workDaysArray = staff.workDays?.split(",").map((d) => parseInt(d.trim())) || [];
  console.log(`✅ Profissional trabalha? ${workDaysArray.includes(dayOfWeek) ? "SIM" : "NÃO"}\n`);

  // Buscar slots recorrentes
  const recurringSlots = await prisma.availability.findMany({
    where: {
      staffId,
      dayOfWeek,
      available: true,
      type: "RECURRING",
    },
    orderBy: { startTime: "asc" },
    take: 10,
  });

  console.log(`📊 Slots recorrentes encontrados: ${recurringSlots.length}`);
  console.log(`   Primeiros slots: ${recurringSlots.slice(0, 5).map(s => s.startTime).join(", ")}\n`);

  // Buscar agendamentos do dia
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingBookings = await prisma.booking.findMany({
    where: {
      staffId,
      date: { gte: startOfDay, lte: endOfDay },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: {
      service: { select: { duration: true } },
    },
  });

  console.log(`📅 Agendamentos existentes no dia: ${existingBookings.length}`);
  if (existingBookings.length > 0) {
    existingBookings.forEach((b) => {
      const time = b.date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
      console.log(`   - ${time} (${b.service.duration} min) - Status: ${b.status}`);
      console.log(`     Data UTC: ${b.date.toISOString()}`);
    });
  }
  console.log("");

  // Simular verificação dos slots
  console.log("🔍 VERIFICAÇÃO DE SLOTS:\n");

  const slotsToCheck = ["08:45", "09:00", "09:15", "09:30"];
  
  for (const slotTime of slotsToCheck) {
    // Criar datetime do slot
    const slotDateTimeStr = `${date}T${slotTime}:00`;
    const slotDateTime = new Date(slotDateTimeStr);
    
    console.log(`   Slot ${slotTime}:`);
    console.log(`      DateTime criado: ${slotDateTime.toISOString()}`);

    // Verificar conflito
    let hasConflict = false;
    for (const booking of existingBookings) {
      const bookingStart = new Date(booking.date);
      const bookingEnd = new Date(booking.date);
      bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.service.duration);

      const slotEnd = new Date(slotDateTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + service.duration);

      const hasOverlap =
        (slotDateTime >= bookingStart && slotDateTime < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (slotDateTime <= bookingStart && slotEnd >= bookingEnd);

      if (hasOverlap) {
        console.log(`      🔴 CONFLITO com agendamento ${bookingStart.toISOString()}`);
        console.log(`         Booking: ${bookingStart.toISOString()} - ${bookingEnd.toISOString()}`);
        console.log(`         Slot: ${slotDateTime.toISOString()} - ${slotEnd.toISOString()}`);
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      console.log(`      ✅ Disponível`);
    }
    console.log("");
  }

  console.log("=".repeat(70) + "\n");
}

simulateAPICall()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
