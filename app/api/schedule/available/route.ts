import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - Buscar horários disponíveis dinamicamente para um profissional em uma data específica
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const date = searchParams.get("date"); // formato: YYYY-MM-DD
    const serviceDuration = searchParams.get("duration"); // em minutos

    if (!staffId || !date) {
      return NextResponse.json(
        { error: "staffId e date são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar profissional com horários de trabalho
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        name: true,
        workDays: true,
        workStart: true,
        workEnd: true,
        lunchStart: true,
        lunchEnd: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o profissional trabalha neste dia da semana
    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = dateObj.getDay();
    
    const workDaysArray = staff.workDays ? staff.workDays.split(",").map(Number) : [];
    if (!workDaysArray.includes(dayOfWeek)) {
      return NextResponse.json({
        available: false,
        message: "Profissional não trabalha neste dia da semana",
        slots: [],
      });
    }

    if (!staff.workStart || !staff.workEnd) {
      return NextResponse.json({
        available: false,
        message: "Horários de trabalho não configurados",
        slots: [],
      });
    }

    // Buscar todos os agendamentos confirmados do profissional nesta data
    const startOfDay = new Date(date + "T00:00:00");
    const endOfDay = new Date(date + "T23:59:59");

    const bookings = await prisma.booking.findMany({
      where: {
        staffId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["PENDING", "CONFIRMED"], // Considera agendamentos pendentes e confirmados
        },
      },
      include: {
        service: {
          select: {
            duration: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Converter horários de trabalho para minutos
    const [workStartH, workStartM] = staff.workStart.split(":").map(Number);
    const [workEndH, workEndM] = staff.workEnd.split(":").map(Number);
    const workStartMin = workStartH * 60 + workStartM;
    const workEndMin = workEndH * 60 + workEndM;

    // Converter horário de almoço para minutos (se existir)
    let lunchStartMin = 0;
    let lunchEndMin = 0;
    if (staff.lunchStart && staff.lunchEnd) {
      const [lunchStartH, lunchStartM] = staff.lunchStart.split(":").map(Number);
      const [lunchEndH, lunchEndM] = staff.lunchEnd.split(":").map(Number);
      lunchStartMin = lunchStartH * 60 + lunchStartM;
      lunchEndMin = lunchEndH * 60 + lunchEndM;
    }

    // Criar lista de períodos ocupados (incluindo almoço)
    const occupiedPeriods: Array<{ start: number; end: number }> = [];

    // Adicionar horário de almoço
    if (lunchStartMin > 0 && lunchEndMin > 0) {
      occupiedPeriods.push({
        start: lunchStartMin,
        end: lunchEndMin,
      });
    }

    // Adicionar agendamentos existentes COM detalhes do serviço
    bookings.forEach((booking) => {
      // IMPORTANTE: Usar UTC para evitar problemas de timezone
      // O banco está em UTC, então precisamos usar getUTCHours() e getUTCMinutes()
      const bookingTime = new Date(booking.date);
      const bookingStartMin = bookingTime.getUTCHours() * 60 + bookingTime.getUTCMinutes();
      const serviceDurationMin = booking.service.duration;
      const bookingEndMin = bookingStartMin + serviceDurationMin;
      
      occupiedPeriods.push({
        start: bookingStartMin,
        end: bookingEndMin,
      });

      console.log(`[AGENDAMENTO EXISTENTE] ${formatTime(bookingStartMin)} - ${formatTime(bookingEndMin)} (${serviceDurationMin}min) | UTC: ${bookingTime.toISOString()}`);
    });

    // Ordenar períodos ocupados
    occupiedPeriods.sort((a, b) => a.start - b.start);

    // Calcular lacunas disponíveis
    const availableSlots: Array<{
      start: string;
      end: string;
      startMinutes: number;
      endMinutes: number;
      durationMinutes: number;
      canFit: boolean; // Se o serviço solicitado cabe nesta lacuna
    }> = [];

    let currentTime = workStartMin;

    occupiedPeriods.forEach((occupied) => {
      // Se há tempo livre antes deste período ocupado
      if (currentTime < occupied.start) {
        const slotDuration = occupied.start - currentTime;
        const requestedDuration = serviceDuration ? parseInt(serviceDuration) : 0;
        
        availableSlots.push({
          start: formatTime(currentTime),
          end: formatTime(occupied.start),
          startMinutes: currentTime,
          endMinutes: occupied.start,
          durationMinutes: slotDuration,
          canFit: requestedDuration > 0 ? slotDuration >= requestedDuration : true,
        });
      }
      currentTime = Math.max(currentTime, occupied.end);
    });

    // Adicionar tempo livre após o último agendamento até o fim do expediente
    if (currentTime < workEndMin) {
      const slotDuration = workEndMin - currentTime;
      const requestedDuration = serviceDuration ? parseInt(serviceDuration) : 0;
      
      availableSlots.push({
        start: formatTime(currentTime),
        end: formatTime(workEndMin),
        startMinutes: currentTime,
        endMinutes: workEndMin,
        durationMinutes: slotDuration,
        canFit: requestedDuration > 0 ? slotDuration >= requestedDuration : true,
      });
    }

    // Gerar TODOS os horários (disponíveis E ocupados) para visualização completa
    const timeOptions: Array<{
      time: string;
      timeMinutes: number;
      available: boolean;
      reason?: string;
    }> = [];

    const requestedDuration = serviceDuration ? parseInt(serviceDuration) : 30;

    console.log("\n========================================");
    console.log(`[BUSCAR HORÁRIOS] Data: ${date}`);
    console.log(`[BUSCAR HORÁRIOS] Profissional: ${staff.name}`);
    console.log(`[BUSCAR HORÁRIOS] Expediente: ${staff.workStart} - ${staff.workEnd}`);
    console.log(`[BUSCAR HORÁRIOS] Duração solicitada: ${requestedDuration}min`);
    console.log(`[BUSCAR HORÁRIOS] Agendamentos existentes: ${bookings.length}`);
    console.log("========================================\n");

    /**
     * LÓGICA COMPLETA DE GERAÇÃO DE HORÁRIOS:
     * 
     * 1. Gera TODOS os horários em incrementos de 15min (expediente completo)
     * 2. Para cada horário, valida:
     *    a) Serviço cabe na lacuna disponível
     *    b) Não há conflito com períodos ocupados
     *    c) Não ultrapassa expediente
     * 3. Marca como available: true (verde) ou false (cinza/vermelho)
     * 4. Adiciona reason para slots indisponíveis
     * 
     * RESULTADO: Cliente vê grade completa do dia com status de cada horário
     */

    // Gerar todos os horários do expediente em incrementos de 15min
    for (let time = workStartMin; time < workEndMin; time += 15) {
      const endTime = time + requestedDuration;
      
      // VALIDAÇÃO 1: Serviço completo cabe antes do fim do expediente
      if (endTime > workEndMin) {
        timeOptions.push({
          time: formatTime(time),
          timeMinutes: time,
          available: false,
          reason: "Ultrapassa horário de expediente",
        });
        continue;
      }
      
      // VALIDAÇÃO 2: Verificar se está em uma lacuna disponível
      const slot = availableSlots.find(
        (s) => time >= s.startMinutes && endTime <= s.endMinutes && s.canFit
      );
      
      if (!slot) {
        // Não está em lacuna disponível - verificar motivo
        let reason = "Horário ocupado";
        
        // Verificar se conflita com almoço
        if (lunchStartMin > 0 && lunchEndMin > 0) {
          if (
            (time >= lunchStartMin && time < lunchEndMin) ||
            (endTime > lunchStartMin && endTime <= lunchEndMin) ||
            (time < lunchStartMin && endTime > lunchEndMin)
          ) {
            reason = "Horário de almoço";
          }
        }
        
        // Verificar se conflita com agendamento
        const conflictingBooking = occupiedPeriods.find((occupied) => {
          return (
            (time >= occupied.start && time < occupied.end) ||
            (endTime > occupied.start && endTime <= occupied.end) ||
            (time <= occupied.start && endTime >= occupied.end)
          );
        });
        
        if (conflictingBooking && reason === "Horário ocupado") {
          reason = "Já possui agendamento";
        }
        
        timeOptions.push({
          time: formatTime(time),
          timeMinutes: time,
          available: false,
          reason,
        });
        continue;
      }
      
      // VALIDAÇÃO 3: Verificar conflitos detalhados mesmo dentro da lacuna
      const hasConflict = occupiedPeriods.some((occupied) => {
        return (
          (time >= occupied.start && time < occupied.end) ||
          (endTime > occupied.start && endTime <= occupied.end) ||
          (time <= occupied.start && endTime >= occupied.end)
        );
      });
      
      if (hasConflict) {
        timeOptions.push({
          time: formatTime(time),
          timeMinutes: time,
          available: false,
          reason: "Já possui agendamento",
        });
        continue;
      }
      
      // ✅ HORÁRIO DISPONÍVEL
      timeOptions.push({
        time: formatTime(time),
        timeMinutes: time,
        available: true,
      });
    }

    // Estatísticas
    const availableCount = timeOptions.filter(t => t.available).length;
    const occupiedCount = timeOptions.filter(t => !t.available).length;

    console.log(`[RESULTADO] Horários disponíveis: ${availableCount}`);
    console.log(`[RESULTADO] Horários ocupados: ${occupiedCount}`);
    console.log(`[RESULTADO] Total na grade: ${timeOptions.length}\n`);

    return NextResponse.json({
      available: availableCount > 0,
      staff: {
        id: staff.id,
        name: staff.name,
        workStart: staff.workStart,
        workEnd: staff.workEnd,
      },
      date,
      requestedDuration,
      availableSlots, // Lacunas livres (para debug/visualização)
      timeOptions, // TODOS os horários com status
      statistics: {
        total: timeOptions.length,
        available: availableCount,
        occupied: occupiedCount,
        bookings: bookings.length,
      },
      occupiedPeriods: occupiedPeriods.map(p => ({ // Para debug
        start: formatTime(p.start),
        end: formatTime(p.end),
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);
    return NextResponse.json(
      { error: "Erro ao buscar horários disponíveis" },
      { status: 500 }
    );
  }
}

// Função auxiliar para formatar tempo (minutos → HH:mm)
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}
