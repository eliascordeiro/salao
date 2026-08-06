import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * GET /api/cashier/daily-bookings
 * 
 * Lista todas as sessões de caixa criadas hoje (agendamentos marcados como COMPLETED hoje)
 * 
 * @returns Array de clientes com suas sessões de caixa do dia
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const salonId = session.user.salonId;
    if (!salonId) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    // Pega a data da query string ou usa hoje como padrão
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    
    let startDate: Date;
    let endDate: Date;
    
    if (dateParam) {
      // Se foi passada uma data, cria as datas diretamente em UTC
      const [year, month, day] = dateParam.split('-').map(Number);
      startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    } else {
      // Senão, usa hoje (em UTC)
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const day = now.getUTCDate();
      startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    }
    
    const targetDate = startDate;

    console.log('📅 API daily-bookings - Parâmetros:', {
      dateParam,
      targetDate: targetDate.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Busca todas as sessões de caixa criadas hoje (agendamentos marcados como COMPLETED hoje)
    // IMPORTANTE: Filtra apenas sessões OPEN (aguardando pagamento)
    const cashierSessions = await prisma.cashierSession.findMany({
      where: {
        salonId,
        status: "OPEN", // Apenas sessões abertas
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Busca todos os bookings relacionados às sessões
    const bookingIds = cashierSessions.flatMap(session => 
      session.items.map(item => item.bookingId)
    );

    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
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
    });

    // Cria um mapa de bookings por ID
    const bookingsMap = new Map(bookings.map(b => [b.id, b]));

    // Converte as sessões de caixa para o formato esperado pelo frontend
    const clientsMap = new Map();

    for (const cashierSession of cashierSessions) {
      const clientId = cashierSession.client.id;

      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          client: cashierSession.client,
          bookings: [],
          bookingIds: new Set(), // Track já adicionados
          subtotal: 0,
          hasOpenSession: true, // Sempre true porque filtramos apenas OPEN
          sessionId: cashierSession.id, // ID da sessão para atualizar
        });
      }

      const clientData = clientsMap.get(clientId);

      // Adiciona os items da sessão como bookings (sem duplicar)
      for (const item of cashierSession.items) {
        const booking = bookingsMap.get(item.bookingId);
        if (booking && !clientData.bookingIds.has(booking.id)) {
          clientData.bookings.push({
            id: booking.id,
            date: booking.date,
            service: booking.service,
            staff: booking.staff,
            price: item.price,
            status: booking.status,
          });
          clientData.bookingIds.add(booking.id); // Marca como adicionado
          clientData.subtotal += item.price;
        }
      }
    }

    // Remove o Set temporário antes de retornar
    const clients = Array.from(clientsMap.values()).map(client => {
      const { bookingIds, ...rest } = client;
      return rest;
    });

    return NextResponse.json({
      success: true,
      date: targetDate.toISOString(),
      totalClients: clients.length,
      totalBookings: clients.reduce((sum, c) => sum + c.bookings.length, 0),
      clients,
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos do dia:", error);
    return NextResponse.json(
      { error: "Erro ao buscar agendamentos do dia" },
      { status: 500 }
    );
  }
}
