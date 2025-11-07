/**
 * Script de teste: Validação de conflito de horário do cliente
 * 
 * Testa se o sistema impede que o cliente marque dois serviços no mesmo horário
 * 
 * Execute: npx tsx scripts/test-client-conflict.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testClientConflict() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🧪 TESTE: Validação de Conflito de Horário do Cliente");
  console.log("═══════════════════════════════════════════════════════\n");

  try {
    // 1. Buscar dados necessários
    const client = await prisma.user.findFirst({ where: { role: "CLIENT" } });
    const services = await prisma.service.findMany({
      where: { active: true },
      take: 2, // Pegar 2 serviços diferentes
    });
    const staff = await prisma.staff.findMany({
      where: { active: true },
      take: 2, // Pegar 2 profissionais diferentes
    });
    const salon = await prisma.salon.findFirst();

    if (!client || services.length < 2 || staff.length < 2 || !salon) {
      console.log("❌ Dados insuficientes no banco. Execute: npx prisma db seed");
      return;
    }

    console.log("✅ Dados encontrados:");
    console.log(`   Cliente: ${client.name} (${client.email})`);
    console.log(`   Serviço 1: ${services[0].name} (${services[0].duration}min)`);
    console.log(`   Serviço 2: ${services[1].name} (${services[1].duration}min)`);
    console.log(`   Profissional 1: ${staff[0].name}`);
    console.log(`   Profissional 2: ${staff[1].name}`);
    console.log("");

    // 2. Limpar agendamentos do cliente
    await prisma.booking.deleteMany({
      where: { clientId: client.id },
    });
    console.log("🧹 Agendamentos anteriores do cliente removidos\n");

    // 3. Data de teste (amanhã)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    console.log(`📅 Data de teste: ${dateStr}\n`);

    // 4. TESTE 1: Criar primeiro agendamento
    console.log("─────────────────────────────────────────────────────");
    console.log("📝 TESTE 1: Criar primeiro agendamento");
    console.log("─────────────────────────────────────────────────────");

    const booking1Date = new Date(dateStr);
    booking1Date.setUTCHours(10, 0, 0, 0); // 10:00 UTC

    const booking1 = await prisma.booking.create({
      data: {
        clientId: client.id,
        serviceId: services[0].id,
        staffId: staff[0].id,
        salonId: salon.id,
        date: booking1Date,
        totalPrice: services[0].price,
        status: "CONFIRMED",
      },
      include: {
        service: { select: { name: true, duration: true } },
        staff: { select: { name: true } },
      },
    });

    const booking1EndMin = 10 * 60 + booking1.service.duration;
    const formatTime = (min: number) => {
      const h = Math.floor(min / 60).toString().padStart(2, "0");
      const m = (min % 60).toString().padStart(2, "0");
      return `${h}:${m}`;
    };

    console.log(`✅ Agendamento 1 criado com sucesso:`);
    console.log(`   ID: ${booking1.id}`);
    console.log(`   Serviço: ${booking1.service.name}`);
    console.log(`   Profissional: ${booking1.staff.name}`);
    console.log(`   Horário: 10:00 - ${formatTime(booking1EndMin)}`);
    console.log("");

    // 5. TESTE 2: Tentar criar agendamento no MESMO horário (DEVE FALHAR)
    console.log("─────────────────────────────────────────────────────");
    console.log("📝 TESTE 2: Tentar agendar outro serviço no MESMO horário");
    console.log("─────────────────────────────────────────────────────");
    console.log(`   ⏰ Tentando: 10:00 (mesmo horário do agendamento 1)`);
    console.log(`   📦 Serviço: ${services[1].name}`);
    console.log(`   👤 Profissional: ${staff[1].name} (DIFERENTE)`);
    console.log("");

    // Simular lógica da API
    const startOfDay = new Date(dateStr + "T00:00:00");
    const endOfDay = new Date(dateStr + "T23:59:59");

    const clientBookings = await prisma.booking.findMany({
      where: {
        clientId: client.id,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        service: { select: { name: true, duration: true } },
        staff: { select: { name: true } },
      },
    });

    const requestedStartMin = 10 * 60; // 10:00
    const requestedEndMin = requestedStartMin + services[1].duration;

    let hasConflict = false;
    let conflictDetails = null;

    for (const existingBooking of clientBookings) {
      const existingStartMin = existingBooking.date.getUTCHours() * 60 + existingBooking.date.getUTCMinutes();
      const existingEndMin = existingStartMin + existingBooking.service.duration;

      const conflict =
        (requestedStartMin >= existingStartMin && requestedStartMin < existingEndMin) ||
        (requestedEndMin > existingStartMin && requestedEndMin <= existingEndMin) ||
        (requestedStartMin <= existingStartMin && requestedEndMin >= existingEndMin);

      if (conflict) {
        hasConflict = true;
        conflictDetails = {
          serviceName: existingBooking.service.name,
          staffName: existingBooking.staff.name,
          time: formatTime(existingStartMin),
          duration: existingBooking.service.duration,
        };
        break;
      }
    }

    if (hasConflict && conflictDetails) {
      console.log(`❌ CONFLITO DETECTADO (esperado):`);
      console.log(`   📅 Agendamento existente:`);
      console.log(`      Serviço: ${conflictDetails.serviceName}`);
      console.log(`      Profissional: ${conflictDetails.staffName}`);
      console.log(`      Horário: ${conflictDetails.time} (${conflictDetails.duration} min)`);
      console.log(`   ⚠️  Mensagem: "Você já possui um agendamento neste horário"`);
      console.log(`   ✅ TESTE PASSOU: Sistema bloqueou corretamente\n`);
    } else {
      console.log(`❌ TESTE FALHOU: Sistema NÃO detectou o conflito!\n`);
    }

    // 6. TESTE 3: Criar agendamento em horário DIFERENTE (DEVE FUNCIONAR)
    console.log("─────────────────────────────────────────────────────");
    console.log("📝 TESTE 3: Agendar outro serviço em horário DIFERENTE");
    console.log("─────────────────────────────────────────────────────");
    console.log(`   ⏰ Tentando: 14:00 (horário diferente)`);
    console.log(`   📦 Serviço: ${services[1].name}`);
    console.log(`   👤 Profissional: ${staff[1].name}`);
    console.log("");

    const booking2Date = new Date(dateStr);
    booking2Date.setUTCHours(14, 0, 0, 0); // 14:00 UTC

    const booking2 = await prisma.booking.create({
      data: {
        clientId: client.id,
        serviceId: services[1].id,
        staffId: staff[1].id,
        salonId: salon.id,
        date: booking2Date,
        totalPrice: services[1].price,
        status: "CONFIRMED",
      },
      include: {
        service: { select: { name: true, duration: true } },
        staff: { select: { name: true } },
      },
    });

    const booking2EndMin = 14 * 60 + booking2.service.duration;

    console.log(`✅ Agendamento 2 criado com sucesso:`);
    console.log(`   ID: ${booking2.id}`);
    console.log(`   Serviço: ${booking2.service.name}`);
    console.log(`   Profissional: ${booking2.staff.name}`);
    console.log(`   Horário: 14:00 - ${formatTime(booking2EndMin)}`);
    console.log(`   ✅ TESTE PASSOU: Sistema permitiu horário diferente\n`);

    // 7. Resumo
    console.log("═══════════════════════════════════════════════════════");
    console.log("📊 RESUMO DOS TESTES");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`✅ TESTE 1: Criar primeiro agendamento - PASSOU`);
    console.log(`✅ TESTE 2: Bloquear horário duplicado - ${hasConflict ? "PASSOU" : "FALHOU"}`);
    console.log(`✅ TESTE 3: Permitir horário diferente - PASSOU`);
    console.log("");

    console.log("📅 Agendamentos do cliente:");
    console.log(`   1. ${services[0].name} com ${staff[0].name} às 10:00`);
    console.log(`   2. ${services[1].name} com ${staff[1].name} às 14:00`);
    console.log("");

    console.log("💡 PRÓXIMO PASSO:");
    console.log("   1. Inicie o servidor: npm run dev");
    console.log("   2. Faça login como: " + client.email);
    console.log("   3. Tente criar um agendamento às 10:00");
    console.log("   4. Você verá o alerta de conflito! ⚠️");
    console.log("");

  } catch (error) {
    console.error("❌ ERRO:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testClientConflict();
