import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendBookingCreatedEmail,
  formatBookingDataForEmail,
} from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientOnly = searchParams.get("clientOnly");

    // Se for cliente buscando apenas seus agendamentos
    if (clientOnly === "true" && session.user.role === "CLIENT") {
      const bookings = await prisma.booking.findMany({
        where: {
          clientId: session.user.id,
        },
        include: {
          service: {
            select: {
              name: true,
              duration: true,
              price: true,
            },
          },
          staff: {
            select: {
              name: true,
              specialty: true,
            },
          },
          salon: {
            select: {
              name: true,
              address: true,
              phone: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      return NextResponse.json(bookings);
    }

    // Apenas ADMIN pode listar todos os agendamentos
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const status = searchParams.get("status");
    const staffId = searchParams.get("staffId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Construir filtros dinamicamente
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        client: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
            price: true,
          },
        },
        staff: {
          select: {
            name: true,
            specialty: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    return NextResponse.json(
      { error: "Erro ao listar agendamentos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[bookings POST] Body recebido:", body);
    console.log("[bookings POST] Session user:", session.user);
    
    const { serviceId, staffId, salonId, date, time, notes } = body;

    // Validações
    if (!serviceId || !staffId || !salonId || !date || !time) {
      console.error("[bookings POST] Campos obrigatórios faltando:", {
        serviceId: !!serviceId,
        staffId: !!staffId,
        salonId: !!salonId,
        date: !!date,
        time: !!time,
      });
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar o serviço para pegar o preço
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { price: true, duration: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 }
      );
    }

    // Combinar data e hora
    console.log("[bookings POST] Combinando data/hora:", { date, time });
    
    // CORREÇÃO TIMEZONE: O horário vem no fuso local (GMT-3)
    // Criar como data local e deixar o JavaScript converter automaticamente para UTC
    const localDateTimeStr = `${date}T${time}:00`;
    const correctedDate = new Date(localDateTimeStr);
    
    console.log("[bookings POST] String de data/hora local:", localDateTimeStr);
    console.log("[bookings POST] Data convertida para UTC:", correctedDate.toISOString());

    // VALIDAÇÃO 1: Verificar se o profissional já tem agendamento neste horário
    const existingBookingStaff = await prisma.booking.findFirst({
      where: {
        staffId,
        date: correctedDate,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
    });

    if (existingBookingStaff) {
      return NextResponse.json(
        { error: "Horário não disponível para este profissional" },
        { status: 409 }
      );
    }

    // VALIDAÇÃO 2: Verificar se o CLIENTE já tem agendamento no mesmo horário
    // (mesmo que seja com outro profissional ou outro serviço)
    const startOfDay = new Date(date + "T00:00:00");
    const endOfDay = new Date(date + "T23:59:59");

    const clientBookings = await prisma.booking.findMany({
      where: {
        clientId: session.user.id,
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
            name: true,
            duration: true,
          },
        },
        staff: {
          select: {
            name: true,
          },
        },
      },
    });

    // Verificar conflito de horário com agendamentos do cliente
    const requestedStartMin = correctedDate.getUTCHours() * 60 + correctedDate.getUTCMinutes();
    const requestedEndMin = requestedStartMin + service.duration;

    for (const clientBooking of clientBookings) {
      const existingStartMin = clientBooking.date.getUTCHours() * 60 + clientBooking.date.getUTCMinutes();
      const existingEndMin = existingStartMin + clientBooking.service.duration;

      // Verificar se há sobreposição de horários
      const hasConflict =
        (requestedStartMin >= existingStartMin && requestedStartMin < existingEndMin) || // Início dentro
        (requestedEndMin > existingStartMin && requestedEndMin <= existingEndMin) || // Fim dentro
        (requestedStartMin <= existingStartMin && requestedEndMin >= existingEndMin); // Envolve

      if (hasConflict) {
        const formatTime = (min: number) => {
          const h = Math.floor(min / 60).toString().padStart(2, "0");
          const m = (min % 60).toString().padStart(2, "0");
          return `${h}:${m}`;
        };

        return NextResponse.json(
          {
            error: "Conflito de horário",
            message: `Você já possui um agendamento neste horário:\n${clientBooking.service.name} com ${clientBooking.staff.name}\nHorário: ${formatTime(existingStartMin)} - ${formatTime(existingEndMin)}`,
            conflictingBooking: {
              id: clientBooking.id,
              serviceName: clientBooking.service.name,
              staffName: clientBooking.staff.name,
              time: formatTime(existingStartMin),
              duration: clientBooking.service.duration,
            },
          },
          { status: 409 }
        );
      }
    }

    // Criar o agendamento
    console.log("[bookings POST] Criando booking com dados:", {
      clientId: session.user.id,
      serviceId,
      staffId,
      salonId,
      date: correctedDate,
      totalPrice: service.price,
      status: "PENDING",
      notes: notes || null,
    });
    
    const booking = await prisma.booking.create({
      data: {
        clientId: session.user.id,
        serviceId,
        staffId,
        salonId,
        date: correctedDate,
        totalPrice: service.price,
        status: "PENDING",
        notes: notes || null,
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
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
        salon: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    // Enviar email de confirmação de criação (sem aguardar)
    sendBookingCreatedEmail(formatBookingDataForEmail(booking), booking.id).catch(
      (error) => console.error("Erro ao enviar email de criação:", error)
    );

    console.log("[bookings POST] Booking criado com sucesso:", booking.id);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("[bookings POST] Erro ao criar agendamento:", error);
    console.error("[bookings POST] Stack trace:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { 
        error: "Erro ao criar agendamento",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
