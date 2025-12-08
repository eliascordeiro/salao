import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Força renderização dinâmica (usa request.url)
export const dynamic = 'force-dynamic';

/**
 * Gera slots de horário dinamicamente baseado na configuração do profissional
 * @param workStart Horário de início (ex: "09:00")
 * @param workEnd Horário de término (ex: "18:00")
 * @param lunchStart Horário de início do almoço (opcional, ex: "12:00")
 * @param lunchEnd Horário de término do almoço (opcional, ex: "13:00")
 * @param slotInterval Intervalo em minutos entre slots (padrão: 15)
 * @returns Array de horários no formato "HH:MM"
 */
function generateTimeSlots(
  workStart: string,
  workEnd: string,
  lunchStart: string | null,
  lunchEnd: string | null,
  slotInterval: number = 15
): string[] {
  const slots: string[] = [];
  
  // Converter horários para minutos desde meia-noite
  const parseTime = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const startMinutes = parseTime(workStart);
  const endMinutes = parseTime(workEnd);
  const lunchStartMinutes = lunchStart ? parseTime(lunchStart) : null;
  const lunchEndMinutes = lunchEnd ? parseTime(lunchEnd) : null;
  
  // Gerar slots do início ao fim, pulando horário de almoço
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotInterval) {
    // Pular horário de almoço
    if (lunchStartMinutes !== null && lunchEndMinutes !== null) {
      if (minutes >= lunchStartMinutes && minutes < lunchEndMinutes) {
        continue;
      }
    }
    
    // Converter minutos de volta para formato HH:MM
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    slots.push(timeStr);
  }
  
  return slots;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const date = searchParams.get("date"); // Format: YYYY-MM-DD
    const serviceId = searchParams.get("serviceId");

    if (!staffId || !date || !serviceId) {
      return NextResponse.json(
        { error: "staffId, date e serviceId são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar o serviço para saber a duração
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { duration: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 }
      );
    }

    // Buscar o profissional com horários de trabalho e configurações
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
        slotInterval: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      );
    }

    // Validar horários de trabalho configurados
    if (!staff.workStart || !staff.workEnd) {
      return NextResponse.json({ 
        availableSlots: [],
        message: "Profissional sem horários de trabalho configurados"
      });
    }

    // Extrair dia da semana da data selecionada
    const selectedDate = new Date(date + 'T12:00:00');
    const dayOfWeek = selectedDate.getDay();

    console.log('[available-slots-dynamic] Data info:');
    console.log('  String recebida:', date);
    console.log('  Dia da semana:', dayOfWeek, ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek]);
    console.log('  Horário trabalho:', staff.workStart, '-', staff.workEnd);
    console.log('  Almoço:', staff.lunchStart, '-', staff.lunchEnd);
    console.log('  Intervalo de slots:', staff.slotInterval, 'minutos');

    // Verificar se o profissional trabalha neste dia
    const workDaysArray = staff.workDays?.split(',').map(d => parseInt(d.trim())) || [];
    const professionalWorksThisDay = workDaysArray.includes(dayOfWeek);

    if (!professionalWorksThisDay) {
      console.log(`⚠️ Profissional não trabalha neste dia`);
      return NextResponse.json({ 
        availableSlots: [],
        message: "Profissional não trabalha neste dia da semana"
      });
    }

    // GERAÇÃO DINÂMICA: Criar todos os slots possíveis para o dia
    console.log('⚙️  Gerando slots dinamicamente:');
    console.log('   workStart:', staff.workStart);
    console.log('   workEnd:', staff.workEnd);
    console.log('   lunchStart:', staff.lunchStart);
    console.log('   lunchEnd:', staff.lunchEnd);
    console.log('   slotInterval:', staff.slotInterval, 'minutos');
    
    const allTimeSlots = generateTimeSlots(
      staff.workStart,
      staff.workEnd,
      staff.lunchStart,
      staff.lunchEnd,
      staff.slotInterval || 15 // Fallback para 15 se for null/undefined
    );

    console.log('  Slots gerados:', allTimeSlots.length);
    console.log('  Primeiros 5 slots:', allTimeSlots.slice(0, 5));

    // Buscar bloqueios específicos para este dia (tabela Block)
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    const blocks = await prisma.block.findMany({
      where: {
        staffId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    console.log('  Bloqueios encontrados:', blocks.length);

    // Buscar agendamentos existentes do profissional neste dia
    const existingBookings = await prisma.booking.findMany({
      where: {
        staffId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
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

    console.log('  Agendamentos existentes:', existingBookings.length);

    // Filtrar slots disponíveis
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = date === todayStr;
    const nowLocalHour = now.getHours();
    const nowLocalMinute = now.getMinutes();
    const nowLocalMinutes = nowLocalHour * 60 + nowLocalMinute;

    const availableSlots = allTimeSlots.filter(timeSlot => {
      const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
      const slotLocalMinutes = slotHour * 60 + slotMinute;
      const slotDateTimeStr = `${date}T${timeSlot}:00`;
      const slotDateTime = new Date(slotDateTimeStr);

      // 1. Verificar se está no passado (apenas se for hoje)
      if (isToday && slotLocalMinutes <= nowLocalMinutes) {
        return false;
      }

      // 2. Verificar se está em um bloco específico (Block)
      const isBlocked = blocks.some(block => {
        return timeSlot >= block.startTime && timeSlot < block.endTime;
      });
      if (isBlocked) {
        return false;
      }

      // 3. Verificar se conflita com agendamento existente
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = new Date(booking.date);
        const bookingEnd = new Date(booking.date);
        bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.service.duration);

        const slotEnd = new Date(slotDateTime);
        slotEnd.setMinutes(slotEnd.getMinutes() + service.duration);

        // Verificar sobreposição
        return (
          (slotDateTime >= bookingStart && slotDateTime < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotDateTime <= bookingStart && slotEnd >= bookingEnd)
        );
      });

      return !hasConflict;
    });

    console.log('  Slots disponíveis:', availableSlots.length);

    return NextResponse.json({ availableSlots });
  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);
    return NextResponse.json(
      { error: "Erro ao buscar horários disponíveis" },
      { status: 500 }
    );
  }
}
