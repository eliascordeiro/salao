import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Força rendering dinâmico (usa session)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar salão do usuário
    const salon = await prisma.salon.findFirst({
      where: {
        ownerId: session.user.id,
      },
    });

    if (!salon) {
      console.log("⚠️ Usuário não tem salão:", session.user.id);
      // Retornar null ao invés de erro - usuário pode não ter salão cadastrado
      return NextResponse.json({ subscription: null }, { status: 200 });
    }

    // Buscar assinatura do salão
    const subscription = await prisma.subscription.findUnique({
      where: {
        salonId: salon.id,
      },
      include: {
        plan: true,
      },
    });

    // Se não houver assinatura, retornar null (não é erro, apenas não tem)
    if (!subscription) {
      console.log("⚠️ Salão não tem subscription:", salon.id);
      return NextResponse.json({ subscription: null }, { status: 200 });
    }

    // Retornar dados da assinatura
    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planName: subscription.plan.name,
        planPrice: subscription.plan.price,
        startDate: subscription.startDate,
        trialEndsAt: subscription.trialEndsAt,
        nextBillingDate: subscription.nextBillingDate,
        paymentMethod: subscription.paymentMethod,
        lastPaymentDate: subscription.lastPaymentDate,
        lastPaymentAmount: subscription.lastPaymentAmount,
        lastPaymentStatus: subscription.lastPaymentStatus,
      }
    });
  } catch (error) {
    console.error("❌ Erro ao buscar status da assinatura:", error);
    // Retornar detalhes do erro apenas em desenvolvimento
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error as Error).message 
      : "Erro ao buscar status da assinatura";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
