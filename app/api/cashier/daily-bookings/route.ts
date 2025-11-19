import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalon } from "@/lib/salon-helper";
import { startOfDay, endOfDay } from "date-fns";

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

    // Busca o salão do usuário logado
    const salon = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    // Pega a data do dia (início e fim)
    const today = new Date();
    const startDate = startOfDay(today);
    const endDate = endOfDay(today);

    // Busca todas as sessões de caixa criadas hoje (agendamentos marcados como COMPLETED hoje)
    const cashierSessions = await prisma.cashierSession.findMany({
      where: {
        salonId: salon.id,
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
          subtotal: 0,
          hasOpenSession: cashierSession.status === "OPEN",
          sessionId: cashierSession.status === "OPEN" ? cashierSession.id : null,
        });
      }

      const clientData = clientsMap.get(clientId);

      // Adiciona os items da sessão como bookings
      for (const item of cashierSession.items) {
        const booking = bookingsMap.get(item.bookingId);
        if (booking) {
          clientData.bookings.push({
            id: booking.id,
            date: booking.date,
            service: booking.service,
            staff: booking.staff,
            price: item.price,
            status: booking.status,
          });
          clientData.subtotal += item.price;
        }
      }

      // Atualiza status da sessão (se já foi paga)
      if (cashierSession.status !== "OPEN") {
        clientData.hasOpenSession = false;
        clientData.sessionId = null;
      }
    }

    // Converte Map para Array
    const clients = Array.from(clientsMap.values());

    return NextResponse.json({
      success: true,
      date: today.toISOString(),
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
