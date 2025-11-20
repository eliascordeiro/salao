import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalon } from "@/lib/salon-helper";

export const dynamic = 'force-dynamic';

/**
 * GET /api/cashier/history
 * 
 * Lista todas as sessões de caixa FECHADAS (pagas) na data especificada
 * 
 * @param date - Data no formato YYYY-MM-DD (opcional, padrão: hoje)
 * @returns Array de clientes com suas sessões pagas do dia
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const salon = await getUserSalon();
    if (!salon) {
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

    console.log('📅 API history - Parâmetros:', {
      dateParam,
      targetDate: targetDate.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Busca todas as sessões FECHADAS (pagas hoje)
    const cashierSessions = await prisma.cashierSession.findMany({
      where: {
        salonId: salon.id,
        status: "CLOSED",
        paidAt: {
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
        paidAt: "desc",
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

    const bookingsMap = new Map(bookings.map(b => [b.id, b]));

    // Converte cada sessão CLOSED em um item separado (não agrupa por cliente)
    const sessions = cashierSessions.map(cashierSession => {
      const sessionBookings = [];
      let subtotal = 0;

      // Adiciona os bookings da sessão
      for (const item of cashierSession.items) {
        const booking = bookingsMap.get(item.bookingId);
        if (booking) {
          sessionBookings.push({
            id: booking.id,
            date: booking.date,
            service: booking.service,
            staff: booking.staff,
            price: item.price,
            status: booking.status,
          });
          subtotal += item.price;
        }
      }

      return {
        sessionId: cashierSession.id,
        client: cashierSession.client,
        bookings: sessionBookings,
        subtotal,
        discount: cashierSession.discount,
        total: cashierSession.total,
        paymentMethod: cashierSession.paymentMethod,
        paidAt: cashierSession.paidAt,
      };
    });

    return NextResponse.json({
      success: true,
      date: targetDate.toISOString(),
      totalClients: new Set(sessions.map(s => s.client.id)).size,
      totalSessions: sessions.length,
      totalBookings: sessions.reduce((sum, s) => sum + s.bookings.length, 0),
      totalRevenue: sessions.reduce((sum, s) => sum + s.total, 0),
      clients: sessions, // Mantém nome "clients" por compatibilidade com frontend
    });
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}
