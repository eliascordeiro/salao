import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, subMonths } from "date-fns";
import { getUserSalon } from "@/lib/salon-helper";

// Força renderização dinâmica (usa headers para auth)
export const dynamic = 'force-dynamic';

/**
 * API de Estatísticas Gerais
 * GET /api/analytics/stats?period=7d|30d|3m|1y
 * 
 * Retorna métricas gerais do sistema:
 * - Total de agendamentos
 * - Receita total
 * - Taxa de conclusão
 * - Taxa de cancelamento
 * - Crescimento vs período anterior
 * - Agendamentos por status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas ADMIN pode acessar analytics
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // 🔒 FILTRO MULTI-TENANT: Obter salão do usuário
    const userSalon = await getUserSalon();
    
    if (!userSalon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    // Calcular datas baseado no período
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (period) {
      case "7d":
        startDate = subDays(now, 7);
        previousStartDate = subDays(now, 14);
        break;
      case "30d":
        startDate = subDays(now, 30);
        previousStartDate = subDays(now, 60);
        break;
      case "3m":
        startDate = subMonths(now, 3);
        previousStartDate = subMonths(now, 6);
        break;
      case "1y":
        startDate = subMonths(now, 12);
        previousStartDate = subMonths(now, 24);
        break;
      default:
        startDate = subDays(now, 30);
        previousStartDate = subDays(now, 60);
    }

    // Buscar agendamentos do período atual
    const currentBookings = await prisma.booking.findMany({
      where: {
        salonId: userSalon.id, // 🔒 FILTRO CRÍTICO
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        id: true,
        status: true,
        totalPrice: true,
        createdAt: true,
      },
    });

    // Buscar agendamentos do período anterior (para comparação)
    const previousBookings = await prisma.booking.findMany({
      where: {
        salonId: userSalon.id, // 🔒 FILTRO CRÍTICO
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
      select: {
        id: true,
        status: true,
        totalPrice: true,
      },
    });

    // Calcular métricas atuais
    const totalBookings = currentBookings.length;
    const completedBookings = currentBookings.filter(
      (b) => b.status === "COMPLETED"
    ).length;
    const cancelledBookings = currentBookings.filter(
      (b) => b.status === "CANCELLED" || b.status === "NO_SHOW"
    ).length;
    const pendingBookings = currentBookings.filter(
      (b) => b.status === "PENDING"
    ).length;
    const confirmedBookings = currentBookings.filter(
      (b) => b.status === "CONFIRMED"
    ).length;

    const totalRevenue = currentBookings
      .filter((b) => b.status === "COMPLETED")
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const completionRate =
      totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    const cancellationRate =
      totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    // Calcular métricas do período anterior
    const previousTotalBookings = previousBookings.length;
    const previousRevenue = previousBookings
      .filter((b) => b.status === "COMPLETED")
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // Calcular crescimento
    const bookingsGrowth =
      previousTotalBookings > 0
        ? ((totalBookings - previousTotalBookings) / previousTotalBookings) *
          100
        : 0;

    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    // Agendamentos por status
    const bookingsByStatus = {
      PENDING: pendingBookings,
      CONFIRMED: confirmedBookings,
      COMPLETED: completedBookings,
      CANCELLED: cancelledBookings,
    };

    // Receita média por agendamento
    const averageBookingValue =
      completedBookings > 0 ? totalRevenue / completedBookings : 0;

    // Agendamentos por dia (para sparkline)
    const bookingsPerDay: { [key: string]: number } = {};
    currentBookings.forEach((booking) => {
      const day = booking.createdAt.toISOString().split("T")[0];
      bookingsPerDay[day] = (bookingsPerDay[day] || 0) + 1;
    });

    const response = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      summary: {
        totalBookings,
        totalRevenue,
        completionRate: Math.round(completionRate * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
        averageBookingValue: Math.round(averageBookingValue * 100) / 100,
      },
      growth: {
        bookings: Math.round(bookingsGrowth * 100) / 100,
        revenue: Math.round(revenueGrowth * 100) / 100,
      },
      bookingsByStatus,
      bookingsPerDay: Object.entries(bookingsPerDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
      comparison: {
        current: {
          bookings: totalBookings,
          revenue: totalRevenue,
        },
        previous: {
          bookings: previousTotalBookings,
          revenue: previousRevenue,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
