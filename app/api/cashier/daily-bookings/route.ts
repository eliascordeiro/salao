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
 * Lista todos os agendamentos do dia atual agrupados por cliente
 * Apenas agendamentos com status CONFIRMED são considerados (serviços já prestados)
 * 
 * @returns Array de clientes com seus agendamentos do dia
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

    // Busca todos os agendamentos CONFIRMADOS ou COMPLETED do dia
    const bookings = await prisma.booking.findMany({
      where: {
        salonId: salon.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["CONFIRMED", "COMPLETED"] // Serviços prestados ou já pagos
        }
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
      orderBy: {
        date: "asc",
      },
    });

    // Agrupa agendamentos por cliente
    const clientsMap = new Map();

    bookings.forEach((booking) => {
      const clientId = booking.client.id;

      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          client: booking.client,
          bookings: [],
          subtotal: 0,
        });
      }

      const clientData = clientsMap.get(clientId);
      clientData.bookings.push({
        id: booking.id,
        date: booking.date,
        service: booking.service,
        staff: booking.staff,
        price: booking.totalPrice,
        status: booking.status,
      });
      clientData.subtotal += booking.totalPrice;
    });

    // Converte Map para Array
    const clients = Array.from(clientsMap.values());

    // Verifica se cada cliente já tem uma sessão de caixa aberta
    for (const client of clients) {
      const existingSession = await prisma.cashierSession.findFirst({
        where: {
          salonId: salon.id,
          clientId: client.client.id,
          status: "OPEN",
        },
      });

      client.hasOpenSession = !!existingSession;
      client.sessionId = existingSession?.id || null;
    }

    return NextResponse.json({
      success: true,
      date: today.toISOString(),
      totalClients: clients.length,
      totalBookings: bookings.length,
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
