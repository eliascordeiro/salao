import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalon } from "@/lib/salon-helper";

// Função auxiliar para calcular comissão
function calculateCommission(
  servicePrice: number,
  commissionType: string,
  percentageValue: number | null,
  fixedValue: number | null
): number {
  switch (commissionType) {
    case "PERCENTAGE":
      return servicePrice * ((percentageValue || 0) / 100);
    case "FIXED":
      return fixedValue || 0;
    case "MIXED":
      return (fixedValue || 0) + servicePrice * ((percentageValue || 0) / 100);
    default:
      return 0;
  }
}

// GET - Listar comissões com filtros
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const salon = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // PENDING, PAID, CANCELLED
    const staffId = searchParams.get("staffId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = { salonId: salon.id };

    if (status) where.status = status;
    if (staffId) where.staffId = staffId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        booking: {
          select: {
            id: true,
            date: true,
            status: true,
            client: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular totais
    const totals = {
      pending: commissions
        .filter((c) => c.status === "PENDING")
        .reduce((sum, c) => sum + c.calculatedValue, 0),
      paid: commissions
        .filter((c) => c.status === "PAID")
        .reduce((sum, c) => sum + c.calculatedValue, 0),
      total: commissions.reduce((sum, c) => sum + c.calculatedValue, 0),
    };

    return NextResponse.json({ commissions, totals });
  } catch (error) {
    console.error("Erro ao listar comissões:", error);
    return NextResponse.json({ error: "Erro ao listar comissões" }, { status: 500 });
  }
}

// POST - Calcular e criar comissão para um agendamento
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const salon = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId é obrigatório" }, { status: 400 });
    }

    // Buscar agendamento
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        salonId: salon.id,
      },
      include: {
        service: true,
        staff: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    // Verificar se já existe comissão para este agendamento
    const existingCommission = await prisma.commission.findFirst({
      where: {
        bookingId,
        staffId: booking.staffId,
      },
    });

    if (existingCommission) {
      return NextResponse.json(
        { error: "Comissão já calculada para este agendamento" },
        { status: 400 }
      );
    }

    // Buscar configuração de comissão do profissional
    const staffConfig = await prisma.staffCommissionConfig.findUnique({
      where: { staffId: booking.staffId },
      include: {
        serviceOverrides: {
          where: { serviceId: booking.serviceId },
        },
      },
    });

    if (!staffConfig) {
      return NextResponse.json(
        { error: "Profissional não possui configuração de comissão" },
        { status: 400 }
      );
    }

    // Usar override se existir, senão usar configuração padrão
    const config =
      staffConfig.serviceOverrides.length > 0
        ? staffConfig.serviceOverrides[0]
        : staffConfig;

    // Calcular comissão
    const calculatedValue = calculateCommission(
      booking.totalPrice,
      config.commissionType,
      config.percentageValue,
      config.fixedValue
    );

    // Criar registro de comissão
    const commission = await prisma.commission.create({
      data: {
        bookingId,
        staffId: booking.staffId,
        salonId: salon.id,
        serviceId: booking.serviceId,
        servicePrice: booking.totalPrice,
        commissionType: config.commissionType,
        percentageValue: config.percentageValue,
        fixedValue: config.fixedValue,
        calculatedValue,
        status: "PENDING",
      },
      include: {
        staff: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(commission);
  } catch (error) {
    console.error("Erro ao calcular comissão:", error);
    return NextResponse.json({ error: "Erro ao calcular comissão" }, { status: 500 });
  }
}
