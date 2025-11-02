import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  subDays,
  subMonths,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * API de Receita por Período
 * GET /api/analytics/revenue-by-period?days=30&groupBy=day
 * 
 * Retorna série temporal de receita com agrupamento configurável
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month

    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Buscar todos os agendamentos do período
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        date: true,
        totalPrice: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    let intervals: Date[] = [];
    let formatPattern = "";
    let groupLabel = "";

    // Definir intervalos baseado no agrupamento
    if (groupBy === "week") {
      intervals = eachWeekOfInterval(
        { start: startDate, end: endDate },
        { weekStartsOn: 0 }
      );
      formatPattern = "'Semana' w";
      groupLabel = "semanas";
    } else if (groupBy === "month") {
      intervals = eachMonthOfInterval({ start: startDate, end: endDate });
      formatPattern = "MMM/yyyy";
      groupLabel = "meses";
    } else {
      // day (padrão)
      intervals = eachDayOfInterval({ start: startDate, end: endDate });
      formatPattern = "dd/MM";
      groupLabel = "dias";
    }

    // Agrupar dados
    const data = intervals.map((date) => {
      let periodStart: Date;
      let periodEnd: Date;
      let label: string;

      if (groupBy === "week") {
        periodStart = startOfWeek(date, { weekStartsOn: 0 });
        periodEnd = endOfWeek(date, { weekStartsOn: 0 });
        label = format(periodStart, formatPattern, { locale: ptBR });
      } else if (groupBy === "month") {
        periodStart = startOfMonth(date);
        periodEnd = endOfMonth(date);
        label = format(date, formatPattern, { locale: ptBR });
      } else {
        periodStart = date;
        periodEnd = date;
        label = format(date, formatPattern, { locale: ptBR });
      }

      // Filtrar agendamentos do período
      const periodBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= periodStart && bookingDate <= periodEnd;
      });

      // Calcular métricas
      const total = periodBookings.length;
      const completed = periodBookings.filter(
        (b) => b.status === "COMPLETED"
      ).length;
      const cancelled = periodBookings.filter(
        (b) => b.status === "CANCELLED"
      ).length;

      // Receita total
      const totalRevenue = periodBookings.reduce(
        (sum, b) => sum + (b.totalPrice || 0),
        0
      );

      // Receita apenas de agendamentos completados
      const completedRevenue = periodBookings
        .filter((b) => b.status === "COMPLETED")
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      // Receita pendente (agendamentos confirmados ou pendentes)
      const pendingRevenue = periodBookings
        .filter((b) => b.status === "CONFIRMED" || b.status === "PENDING")
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      return {
        date: format(periodStart, "yyyy-MM-dd"),
        label,
        fullLabel:
          groupBy === "week"
            ? `${format(periodStart, "dd/MM", { locale: ptBR })} - ${format(
                periodEnd,
                "dd/MM",
                { locale: ptBR }
              )}`
            : groupBy === "month"
            ? format(date, "MMMM 'de' yyyy", { locale: ptBR })
            : format(date, "dd 'de' MMMM", { locale: ptBR }),
        totalBookings: total,
        completedBookings: completed,
        cancelledBookings: cancelled,
        totalRevenue,
        completedRevenue,
        pendingRevenue,
        averageTicket: completed > 0 ? completedRevenue / completed : 0,
      };
    });

    // Calcular totais gerais
    const totals = {
      bookings: data.reduce((sum, d) => sum + d.totalBookings, 0),
      completed: data.reduce((sum, d) => sum + d.completedBookings, 0),
      cancelled: data.reduce((sum, d) => sum + d.cancelledBookings, 0),
      totalRevenue: data.reduce((sum, d) => sum + d.totalRevenue, 0),
      completedRevenue: data.reduce((sum, d) => sum + d.completedRevenue, 0),
      pendingRevenue: data.reduce((sum, d) => sum + d.pendingRevenue, 0),
    };

    return NextResponse.json({
      period: `${days} ${groupLabel}`,
      groupBy,
      startDate: format(startDate, "dd/MM/yyyy"),
      endDate: format(endDate, "dd/MM/yyyy"),
      data,
      totals: {
        ...totals,
        averageTicket:
          totals.completed > 0 ? totals.completedRevenue / totals.completed : 0,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar receita por período:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados" },
      { status: 500 }
    );
  }
}
