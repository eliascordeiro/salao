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
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
      },
      orderBy: [
        { date: "asc" }, // Ordem cronológica crescente
      ],
    });

    // Ordenar por prioridade de status: PENDING → CONFIRMED → COMPLETED → CANCELLED → NO_SHOW
    const statusPriority: { [key: string]: number } = {
      PENDING: 1,
      CONFIRMED: 2,
      COMPLETED: 3,
      CANCELLED: 4,
      NO_SHOW: 5,
    };

    const sortedBookings = bookings.sort((a, b) => {
      // Primeiro, ordenar por prioridade de status
      const statusDiff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
      if (statusDiff !== 0) return statusDiff;
      
      // Se status for igual, ordenar por data (crescente - mais antigos primeiro)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return NextResponse.json(sortedBookings);
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
    
    const { clientId, serviceId, staffId, salonId, date, notes } = body;

    // Determinar qual clientId usar
    // Se admin/staff está criando para outro cliente, usa o clientId do body
    // Se cliente está criando para si mesmo, usa session.user.id
    const finalClientId = clientId || session.user.id;
    
    console.log("[bookings POST] Cliente final:", finalClientId);

    // Validações
    if (!finalClientId || !serviceId || !staffId || !date) {
      console.error("[bookings POST] Campos obrigatórios faltando:", {
        clientId: !!finalClientId,
        serviceId: !!serviceId,
        staffId: !!staffId,
        date: !!date,
      });
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos" },
        { status: 400 }
      );
    }

    // Buscar o salão do profissional se não foi fornecido
    let finalSalonId = salonId;
    if (!finalSalonId) {
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        select: { salonId: true },
      });
      
      if (!staff) {
        return NextResponse.json(
          { error: "Profissional não encontrado" },
          { status: 404 }
        );
      }
      
      finalSalonId = staff.salonId;
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
    console.log("[bookings POST] Data recebida:", date);
    
    // Se date já é ISO string completo (2024-11-16T14:30:00.000Z)
    let correctedDate: Date;
    if (date.includes('T') && date.includes(':')) {
      correctedDate = new Date(date);
    } else {
      // Fallback para formato antigo (caso ainda seja usado)
      return NextResponse.json(
        { error: "Formato de data inválido. Use ISO string completo." },
        { status: 400 }
      );
    }
    
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
    const startOfDay = new Date(correctedDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(correctedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const clientBookings = await prisma.booking.findMany({
      where: {
        clientId: finalClientId,
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
      clientId: finalClientId,
      serviceId,
      staffId,
      salonId: finalSalonId,
      date: correctedDate,
      totalPrice: service.price,
      status: "PENDING",
      notes: notes || null,
    });
    
    const booking = await prisma.booking.create({
      data: {
        clientId: finalClientId,
        serviceId,
        staffId,
        salonId: finalSalonId,
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
