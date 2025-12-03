import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Retorna histórico de pagamentos da assinatura
 * GET /api/subscriptions/payments
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar salão do usuário
    const salon = await prisma.salon.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!salon) {
      return NextResponse.json(
        { error: "Salão não encontrado" },
        { status: 404 }
      );
    }

    // Buscar assinatura
    const subscription = await prisma.subscription.findUnique({
      where: { salonId: salon.id },
    });

    if (!subscription) {
      return NextResponse.json({ payments: [] });
    }

    // Buscar pagamentos
    const payments = await prisma.subscriptionPayment.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payments });

  } catch (error: any) {
    console.error("❌ Erro ao buscar pagamentos:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
