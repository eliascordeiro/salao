/**
 * Script de debug DETALHADO para investigar conflitos de horário
 * 
 * Execute: npx tsx scripts/debug-schedule-detailed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function checkConflict(
  slotStart: number,
  slotEnd: number,
  occupiedStart: number,
  occupiedEnd: number
): { conflicts: boolean; reason: string } {
  // CASO 1: Início do slot está dentro do período ocupado
  if (slotStart >= occupiedStart && slotStart < occupiedEnd) {
    return {
      conflicts: true,
      reason: `Início ${formatTime(slotStart)} está dentro de ${formatTime(occupiedStart)}-${formatTime(occupiedEnd)}`,
    };
  }

  // CASO 2: Fim do slot está dentro do período ocupado
  if (slotEnd > occupiedStart && slotEnd <= occupiedEnd) {
    return {
      conflicts: true,
      reason: `Fim ${formatTime(slotEnd)} está dentro de ${formatTime(occupiedStart)}-${formatTime(occupiedEnd)}`,
    };
  }

  // CASO 3: Slot envolve completamente o período ocupado
  if (slotStart <= occupiedStart && slotEnd >= occupiedEnd) {
    return {
      conflicts: true,
      reason: `Slot ${formatTime(slotStart)}-${formatTime(slotEnd)} envolve ${formatTime(occupiedStart)}-${formatTime(occupiedEnd)}`,
    };
  }

  return { conflicts: false, reason: "Sem conflito" };
}

async function debugSchedule() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🔍 DEBUG DETALHADO - SISTEMA DE HORÁRIOS");
  console.log("═══════════════════════════════════════════════════════\n");

  try {
    // 1. Buscar profissional
    const staff = await prisma.staff.findFirst({
      where: { active: true },
      include: {
        services: {
          include: { service: true },
        },
      },
    });

    if (!staff) {
      console.log("❌ Nenhum profissional encontrado");
      return;
    }

    console.log("👤 PROFISSIONAL");
    console.log("─────────────────────────────────────────────────────");
    console.log(`Nome: ${staff.name}`);
    console.log(`ID: ${staff.id}`);
    console.log(`Expediente: ${staff.workStart} - ${staff.workEnd}`);
    console.log(`Almoço: ${staff.lunchStart || "N/A"} - ${staff.lunchEnd || "N/A"}`);
    console.log(`Dias de trabalho: ${staff.workDays || "N/A"}`);
    console.log("");

    // 2. Buscar serviço
    const service = staff.services[0]?.service;
    if (!service) {
      console.log("❌ Profissional não tem serviços");
      return;
    }

    console.log("📦 SERVIÇO");
    console.log("─────────────────────────────────────────────────────");
    console.log(`Nome: ${service.name}`);
    console.log(`ID: ${service.id}`);
    console.log(`Duração: ${service.duration} minutos`);
    console.log(`Preço: R$ ${service.price}`);
    console.log("");

    // 3. Data de teste (amanhã)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    const dayOfWeek = tomorrow.getDay();
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    console.log("📅 DATA DE TESTE");
    console.log("─────────────────────────────────────────────────────");
    console.log(`Data: ${dateStr}`);
    console.log(`Dia da semana: ${dayNames[dayOfWeek]} (${dayOfWeek})`);
    console.log("");

    // Verificar se trabalha neste dia
    const workDaysArray = staff.workDays ? staff.workDays.split(",").map(Number) : [];
    if (!workDaysArray.includes(dayOfWeek)) {
      console.log("⚠️  ATENÇÃO: Profissional NÃO trabalha neste dia!");
      console.log(`   Dias de trabalho: ${workDaysArray.join(", ")}`);
      console.log(`   Dia selecionado: ${dayOfWeek}`);
      console.log("");
    }

    // 4. Buscar agendamentos
    const startOfDay = new Date(dateStr + "T00:00:00");
    const endOfDay = new Date(dateStr + "T23:59:59");

    const bookings = await prisma.booking.findMany({
      where: {
        staffId: staff.id,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    console.log("📊 AGENDAMENTOS EXISTENTES");
    console.log("─────────────────────────────────────────────────────");
    console.log(`Total: ${bookings.length}`);
    console.log("");

    const occupiedPeriods: Array<{ start: number; end: number; label: string }> = [];

    // Adicionar almoço
    if (staff.lunchStart && staff.lunchEnd) {
      const [lunchStartH, lunchStartM] = staff.lunchStart.split(":").map(Number);
      const [lunchEndH, lunchEndM] = staff.lunchEnd.split(":").map(Number);
      const lunchStartMin = lunchStartH * 60 + lunchStartM;
      const lunchEndMin = lunchEndH * 60 + lunchEndM;
      
      occupiedPeriods.push({
        start: lunchStartMin,
        end: lunchEndMin,
        label: "🍽️  ALMOÇO",
      });
      
      console.log(`🍽️  ALMOÇO: ${staff.lunchStart} - ${staff.lunchEnd}`);
      console.log(`   Início: ${lunchStartMin} minutos (${staff.lunchStart})`);
      console.log(`   Fim: ${lunchEndMin} minutos (${staff.lunchEnd})`);
      console.log(`   Duração: ${lunchEndMin - lunchStartMin} minutos`);
      console.log("");
    }

    // Adicionar agendamentos
    bookings.forEach((booking, index) => {
      const bookingDate = new Date(booking.date);
      // USAR UTC para manter consistência
      const bookingStartMin = bookingDate.getUTCHours() * 60 + bookingDate.getUTCMinutes();
      const serviceDuration = booking.service.duration;
      const bookingEndMin = bookingStartMin + serviceDuration;

      occupiedPeriods.push({
        start: bookingStartMin,
        end: bookingEndMin,
        label: `📅 AGENDAMENTO #${index + 1}`,
      });

      console.log(`📅 AGENDAMENTO #${index + 1}`);
      console.log(`   Cliente: ${booking.client.name}`);
      console.log(`   Serviço: ${booking.service.name}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Hora gravada: ${bookingDate.toISOString()}`);
      console.log(`   ⏰ Início: ${formatTime(bookingStartMin)} (${bookingStartMin} min)`);
      console.log(`   ⏱️  Duração: ${serviceDuration} minutos`);
      console.log(`   ⏰ Fim calculado: ${formatTime(bookingEndMin)} (${bookingEndMin} min)`);
      console.log(`   📊 Período ocupado: ${formatTime(bookingStartMin)} - ${formatTime(bookingEndMin)}`);
      console.log("");
    });

    // 5. Converter expediente
    if (!staff.workStart || !staff.workEnd) {
      console.log("❌ Horários de trabalho não configurados");
      return;
    }
    
    const [workStartH, workStartM] = staff.workStart.split(":").map(Number);
    const [workEndH, workEndM] = staff.workEnd.split(":").map(Number);
    const workStartMin = workStartH * 60 + workStartM;
    const workEndMin = workEndH * 60 + workEndM;

    console.log("⏰ EXPEDIENTE");
    console.log("─────────────────────────────────────────────────────");
    console.log(`Início: ${staff.workStart} (${workStartMin} min)`);
    console.log(`Fim: ${staff.workEnd} (${workEndMin} min)`);
    console.log(`Duração: ${workEndMin - workStartMin} minutos`);
    console.log("");

    // 6. Gerar grade de horários
    console.log("🎯 TESTE DE CONFLITOS (Serviço de " + service.duration + " minutos)");
    console.log("═══════════════════════════════════════════════════════");
    console.log("");

    const requestedDuration = service.duration;
    let availableCount = 0;
    let occupiedCount = 0;
    const conflictDetails: Array<{
      time: string;
      available: boolean;
      reason: string;
      details: string[];
    }> = [];

    for (let time = workStartMin; time < workEndMin; time += 15) {
      const endTime = time + requestedDuration;
      const timeStr = formatTime(time);
      const endTimeStr = formatTime(endTime);

      const details: string[] = [];
      let available = true;
      let reason = "";

      // Validação 1: Ultrapassa expediente?
      if (endTime > workEndMin) {
        available = false;
        reason = "⚫ Ultrapassa expediente";
        details.push(`Fim ${endTimeStr} > Expediente ${staff.workEnd}`);
        occupiedCount++;
      } else {
        // Validação 2: Verificar conflitos com períodos ocupados
        for (const occupied of occupiedPeriods) {
          const conflictCheck = checkConflict(time, endTime, occupied.start, occupied.end);

          if (conflictCheck.conflicts) {
            available = false;
            reason = `🔴 Conflito: ${occupied.label}`;
            details.push(conflictCheck.reason);
            occupiedCount++;
            break;
          }
        }

        if (available) {
          reason = "🟢 Disponível";
          availableCount++;
        }
      }

      conflictDetails.push({
        time: timeStr,
        available,
        reason,
        details,
      });
    }

    // Mostrar apenas alguns horários chave
    console.log("📋 ANÁLISE DE HORÁRIOS CHAVE:\n");

    // Mostrar horários ao redor dos agendamentos
    const keyTimes = new Set<number>();
    
    occupiedPeriods.forEach((occupied) => {
      // Adicionar horários antes, durante e depois do período ocupado
      for (let t = occupied.start - 30; t <= occupied.end + 30; t += 15) {
        if (t >= workStartMin && t < workEndMin) {
          keyTimes.add(t);
        }
      }
    });

    // Ordenar horários
    const sortedKeyTimes = Array.from(keyTimes).sort((a, b) => a - b);

    sortedKeyTimes.forEach((timeMin) => {
      const detail = conflictDetails.find((d) => {
        const [h, m] = d.time.split(":").map(Number);
        return h * 60 + m === timeMin;
      });

      if (detail) {
        console.log(`${detail.time} ${detail.reason}`);
        if (detail.details.length > 0) {
          detail.details.forEach((d) => {
            console.log(`   └─ ${d}`);
          });
        }
      }
    });

    console.log("");
    console.log("═══════════════════════════════════════════════════════");
    console.log("📊 RESUMO GERAL");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`Total de slots: ${conflictDetails.length}`);
    console.log(`🟢 Disponíveis: ${availableCount}`);
    console.log(`🔴 Ocupados: ${occupiedCount}`);
    console.log(`📊 Períodos bloqueados: ${occupiedPeriods.length}`);
    console.log("");

    // Mostrar todos os períodos ocupados
    console.log("🔒 PERÍODOS BLOQUEADOS:");
    occupiedPeriods.forEach((period) => {
      console.log(`   ${period.label}: ${formatTime(period.start)} - ${formatTime(period.end)}`);
    });
    console.log("");

    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ DEBUG CONCLUÍDO!");
    console.log("═══════════════════════════════════════════════════════");
    console.log("");
    console.log("💡 PRÓXIMO PASSO:");
    console.log("   1. Inicie o servidor: npm run dev");
    console.log("   2. Acesse: http://localhost:3000/agendar");
    console.log("   3. Escolha: Agendamento Dinâmico");
    console.log(`   4. Serviço: ${service.name}`);
    console.log(`   5. Profissional: ${staff.name}`);
    console.log(`   6. Data: ${dateStr}`);
    console.log("   7. Abra DevTools (F12) e veja o Console");
    console.log("");
  } catch (error) {
    console.error("❌ ERRO:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSchedule();
