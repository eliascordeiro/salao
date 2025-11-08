import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Força renderização dinâmica (usa request.url)
export const dynamic = 'force-dynamic';

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

    // Buscar o profissional
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { id: true, name: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      );
    }

    // Extrair dia da semana da data selecionada
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Domingo, 6 = Sábado

    // Buscar slots recorrentes cadastrados para este dia da semana
    const recurringSlots = await prisma.availability.findMany({
      where: {
        staffId,
        dayOfWeek,
        available: true,
        type: "RECURRING",
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Se não há slots cadastrados, retornar vazio
    if (recurringSlots.length === 0) {
      return NextResponse.json({ availableSlots: [] });
    }

    // Buscar agendamentos existentes do profissional neste dia
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

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

    // Converter slots recorrentes em lista de horários com status
    interface TimeSlot {
      time: string;
      available: boolean;
      reason?: string;
    }
    
    const allSlots: TimeSlot[] = [];
    const now = new Date();

    console.log('[available-slots] Debug info:');
    console.log('  Data selecionada:', date);
    console.log('  Dia da semana:', dayOfWeek);
    console.log('  Slots recorrentes encontrados:', recurringSlots.length);
    console.log('  Horário atual:', now.toISOString());

    for (const slot of recurringSlots) {
      // Criar data/hora do slot combinando a data selecionada com o horário
      const [hour, minute] = slot.startTime.split(":").map(Number);
      const slotDateTime = new Date(date + 'T' + slot.startTime + ':00');
      
      console.log(`  Checando slot ${slot.startTime}:`, {
        slotDateTime: slotDateTime.toISOString(),
        isPast: slotDateTime < now,
      });

      // Verificar se está no passado
      if (slotDateTime < now) {
        console.log(`    ❌ Slot no passado, marcando como indisponível`);
        allSlots.push({
          time: slot.startTime,
          available: false,
          reason: "Horário já passou"
        });
        continue;
      }

      // Verificar se o horário conflita com agendamentos existentes
      const conflictingBooking = existingBookings.find((booking) => {
        const bookingStart = new Date(booking.date);
        const bookingEnd = new Date(booking.date);
        bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.service.duration);

        const slotEnd = new Date(slotDateTime);
        slotEnd.setMinutes(slotEnd.getMinutes() + service.duration);

        // Verificar sobreposição
        const hasOverlap = (
          (slotDateTime >= bookingStart && slotDateTime < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotDateTime <= bookingStart && slotEnd >= bookingEnd)
        );

        if (hasOverlap) {
          console.log(`    ❌ Conflito com agendamento existente`);
        }

        return hasOverlap;
      });

      if (conflictingBooking) {
        console.log(`    🔴 Slot ocupado (agendamento existente)`);
        allSlots.push({
          time: slot.startTime,
          available: false,
          reason: "Horário ocupado"
        });
      } else {
        console.log(`    ✅ Slot disponível`);
        allSlots.push({
          time: slot.startTime,
          available: true
        });
      }
    }

    console.log('  Total de slots:', allSlots.length);
    console.log('  Slots disponíveis:', allSlots.filter(s => s.available).length);
    console.log('  Slots ocupados:', allSlots.filter(s => !s.available).length);

    // Retornar apenas os horários disponíveis (strings)
    const availableSlots = allSlots
      .filter(s => s.available)
      .map(s => s.time);

    return NextResponse.json({ availableSlots });
  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);
    return NextResponse.json(
      { error: "Erro ao buscar horários disponíveis" },
      { status: 500 }
    );
  }
}
