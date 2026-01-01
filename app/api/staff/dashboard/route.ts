import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se é profissional
    if (session.user.roleType !== "STAFF" && session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar perfil do profissional
    const staffProfile = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      include: { salon: true },
    });

    if (!staffProfile) {
      return NextResponse.json(
        { error: "Perfil de profissional não encontrado" },
        { status: 404 }
      );
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Buscar comissões do profissional
    const [
      todayCommissions,
      weekCommissions,
      monthCommissions,
      pendingCommissions,
      upcomingBookings,
      recentCommissions,
    ] = await Promise.all([
      // Comissões de hoje (pagas)
      prisma.commission.aggregate({
        where: {
          staffId: staffProfile.id,
          status: "PAID",
          paidAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _sum: { calculatedValue: true },
      }),

      // Comissões da semana (pagas)
      prisma.commission.aggregate({
        where: {
          staffId: staffProfile.id,
          status: "PAID",
          paidAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        _sum: { calculatedValue: true },
      }),

      // Comissões do mês (pagas)
      prisma.commission.aggregate({
        where: {
          staffId: staffProfile.id,
          status: "PAID",
          paidAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: { calculatedValue: true },
      }),

      // Comissões pendentes
      prisma.commission.aggregate({
        where: {
          staffId: staffProfile.id,
          status: "PENDING",
        },
        _sum: { calculatedValue: true },
      }),

      // Próximos agendamentos
      prisma.booking.findMany({
        where: {
          staffId: staffProfile.id,
          date: { gte: now },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        include: {
          service: { select: { name: true } },
          client: { select: { name: true } },
        },
        orderBy: { date: "asc" },
        take: 10,
      }),

      // Comissões recentes
      prisma.commission.findMany({
        where: { staffId: staffProfile.id },
        include: {
          service: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      todayEarnings: todayCommissions._sum.calculatedValue || 0,
      weekEarnings: weekCommissions._sum.calculatedValue || 0,
      monthEarnings: monthCommissions._sum.calculatedValue || 0,
      pendingCommissions: pendingCommissions._sum.calculatedValue || 0,
      todayBookings: 0,
      upcomingBookings,
      recentCommissions,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}
