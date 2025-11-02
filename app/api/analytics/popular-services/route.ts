import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

/**
 * API de Serviços Mais Populares
 * GET /api/analytics/popular-services?days=30&limit=10
 * 
 * Retorna ranking de serviços por número de agendamentos
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const limit = parseInt(searchParams.get("limit") || "10");

    const startDate = subDays(new Date(), days);

    // Buscar agendamentos agrupados por serviço
    const bookingsByService = await prisma.booking.groupBy({
      by: ["serviceId"],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalPrice: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: limit,
    });

    // Buscar detalhes dos serviços
    const serviceIds = bookingsByService.map((b) => b.serviceId);
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: serviceIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        duration: true,
      },
    });

    // Combinar dados
    const popularServices = bookingsByService.map((booking) => {
      const service = services.find((s) => s.id === booking.serviceId);
      return {
        serviceId: booking.serviceId,
        name: service?.name || "Serviço Desconhecido",
        category: service?.category,
        price: service?.price || 0,
        duration: service?.duration || 0,
        bookings: booking._count.id,
        revenue: booking._sum.totalPrice || 0,
      };
    });

    // Calcular totais
    const totalBookings = popularServices.reduce(
      (sum, s) => sum + s.bookings,
      0
    );
    const totalRevenue = popularServices.reduce((sum, s) => sum + s.revenue, 0);

    // Adicionar percentuais
    const servicesWithPercentage = popularServices.map((service) => ({
      ...service,
      percentage: totalBookings > 0 ? (service.bookings / totalBookings) * 100 : 0,
      revenuePercentage:
        totalRevenue > 0 ? (service.revenue / totalRevenue) * 100 : 0,
    }));

    return NextResponse.json({
      period: `${days} dias`,
      data: servicesWithPercentage,
      totals: {
        services: servicesWithPercentage.length,
        bookings: totalBookings,
        revenue: totalRevenue,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar serviços populares:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados" },
      { status: 500 }
    );
  }
}
