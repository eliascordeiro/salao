import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getUserSalon } from "@/lib/salon-helper";

// Força renderização dinâmica (usa headers para auth)
export const dynamic = 'force-dynamic';

/**
 * API de Agendamentos ao Longo do Tempo
 * GET /api/analytics/bookings-over-time?days=30
 * 
 * Retorna série temporal de agendamentos criados por dia
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 🔒 FILTRO MULTI-TENANT
    const userSalon = await getUserSalon();
    if (!userSalon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Buscar todos os agendamentos do período
    const bookings = await prisma.booking.findMany({
      where: {
        salonId: userSalon.id, // 🔒 FILTRO CRÍTICO
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
        totalPrice: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Criar array com todos os dias do período
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Agrupar por dia
    const dataByDay = allDays.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayBookings = bookings.filter(
        (b) => format(new Date(b.createdAt), "yyyy-MM-dd") === dayStr
      );

      return {
        date: dayStr,
        label: format(day, "dd/MM", { locale: ptBR }),
        fullDate: format(day, "dd 'de' MMMM", { locale: ptBR }),
        total: dayBookings.length,
        completed: dayBookings.filter((b) => b.status === "COMPLETED").length,
        cancelled: dayBookings.filter(
          (b) => b.status === "CANCELLED" || b.status === "NO_SHOW"
        ).length,
        pending: dayBookings.filter((b) => b.status === "PENDING").length,
        confirmed: dayBookings.filter((b) => b.status === "CONFIRMED").length,
        revenue: dayBookings
          .filter((b) => b.status === "COMPLETED")
          .reduce((sum, b) => sum + b.totalPrice, 0),
      };
    });

    return NextResponse.json({
      period: `${days} dias`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      data: dataByDay,
      totals: {
        bookings: bookings.length,
        revenue: bookings
          .filter((b) => b.status === "COMPLETED")
          .reduce((sum, b) => sum + b.totalPrice, 0),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos ao longo do tempo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados" },
      { status: 500 }
    );
  }
}
