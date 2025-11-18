import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, addMinutes, format, parse } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const staffId = searchParams.get("staffId");
    const date = searchParams.get("date");

    if (!serviceId || !staffId || !date) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios: serviceId, staffId, date" },
        { status: 400 }
      );
    }

    // Buscar serviço para pegar duração
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

    // Buscar horários do profissional
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        name: true,
        workDays: true,
        workStart: true,
        workEnd: true,
        lunchStart: true,
        lunchEnd: true,
      },
    });

    console.log("Staff encontrado:", staff);

    if (!staff) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      );
    }

    const selectedDate = new Date(date + "T00:00:00");
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday

    // Converter workDays (string "1,2,3,4,5") para array de números
    const workDaysArray = staff.workDays
      ? staff.workDays.split(",").map((d) => parseInt(d.trim()))
      : [1, 2, 3, 4, 5]; // Segunda a Sexta por padrão

    console.log("Dia da semana:", dayOfWeek);
    console.log("Dias de trabalho:", workDaysArray);

    // Verificar se o profissional trabalha neste dia
    if (!workDaysArray.includes(dayOfWeek)) {
      return NextResponse.json({
        slots: [],
        message: "Profissional não trabalha neste dia",
        dayOfWeek,
        workDays: workDaysArray,
      });
    }

    // Gerar slots
    const startTime = staff.workStart || "09:00";
    const endTime = staff.workEnd || "18:00";
    const lunchStart = staff.lunchStart;
    const lunchEnd = staff.lunchEnd;

    console.log("Horários:", { startTime, endTime, lunchStart, lunchEnd });

    const slots: { time: string; available: boolean }[] = [];
    let currentTime = parse(startTime, "HH:mm", selectedDate);
    const endDateTime = parse(endTime, "HH:mm", selectedDate);

    // Buscar agendamentos existentes para este dia e profissional
    const startOfDayDate = startOfDay(selectedDate);
    const endOfDayDate = new Date(startOfDayDate);
    endOfDayDate.setDate(endOfDayDate.getDate() + 1);

    const existingBookings = await prisma.booking.findMany({
      where: {
        staffId: staffId,
        date: {
          gte: startOfDayDate,
          lt: endOfDayDate,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        date: true,
        service: {
          select: {
            duration: true,
          },
        },
      },
    });

    // Gerar todos os slots possíveis
    while (currentTime < endDateTime) {
      const timeStr = format(currentTime, "HH:mm");

      // Verificar se está no horário de almoço
      const isLunchTime =
        lunchStart &&
        lunchEnd &&
        timeStr >= lunchStart &&
        timeStr < lunchEnd;

      if (!isLunchTime) {
        // Verificar se há conflito com agendamentos existentes
        const hasConflict = existingBookings.some((booking) => {
          const bookingTime = new Date(booking.date);
          const bookingEnd = addMinutes(
            bookingTime,
            booking.service.duration
          );
          const slotEnd = addMinutes(currentTime, service.duration);

          // Verifica se há sobreposição
          return (
            (currentTime >= bookingTime && currentTime < bookingEnd) ||
            (slotEnd > bookingTime && slotEnd <= bookingEnd) ||
            (currentTime <= bookingTime && slotEnd >= bookingEnd)
          );
        });

        slots.push({
          time: timeStr,
          available: !hasConflict,
        });
      }

      // Avançar 30 minutos
      currentTime = addMinutes(currentTime, 30);
    }

    console.log("Total de slots gerados:", slots.length);
    console.log("Slots disponíveis:", slots.filter(s => s.available).length);

    return NextResponse.json({
      slots,
      date,
      staffId,
      serviceId,
      serviceDuration: service.duration,
      debug: {
        totalSlots: slots.length,
        availableSlots: slots.filter(s => s.available).length,
        startTime,
        endTime,
        dayOfWeek,
        workDaysArray,
      }
    });
  } catch (error) {
    console.error("Erro ao buscar slots disponíveis:", error);
    return NextResponse.json(
      { error: "Erro ao buscar horários disponíveis", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
