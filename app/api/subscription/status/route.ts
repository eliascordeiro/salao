import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  isInTrial, 
  getDaysLeftInTrial, 
  getTrialPercentage 
} from "@/lib/subscription-helper";
import { 
  getCurrentMonthRevenue, 
  shouldChargeSalon 
} from "@/lib/revenue-helper";

/**
 * GET /api/subscription/status
 * Retorna status completo da assinatura do salão
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar salão do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        ownedSalons: {
          include: { 
            subscription: {
              include: {
                plan: true,
                invoices: {
                  orderBy: { createdAt: "desc" },
                  take: 12, // Últimos 12 meses
                }
              }
            }
          }
        }
      },
    });

    if (!user || user.ownedSalons.length === 0) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const salon = user.ownedSalons[0];

    if (!salon.subscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    // Calcular informações do trial
    const trialActive = isInTrial(salon.subscription);
    const daysLeft = getDaysLeftInTrial(salon.subscription.trialEndsAt);
    const percentage = getTrialPercentage(salon.subscription);

    // Calcular receita do mês atual
    const currentMonthRevenue = await getCurrentMonthRevenue(salon.id);
    const willBeCharged = shouldChargeSalon(currentMonthRevenue);
    const nextChargeAmount = willBeCharged ? 39 : 0;

    // Preparar dados da resposta
    const response = {
      subscription: {
        id: salon.subscription.id,
        status: salon.subscription.status,
        stripeCustomerId: salon.subscription.stripeCustomerId,
        stripeSubscriptionId: salon.subscription.stripeSubscriptionId,
        trialStartedAt: salon.subscription.trialStartedAt,
        trialEndsAt: salon.subscription.trialEndsAt,
        currentPeriodStart: salon.subscription.currentPeriodStart,
        currentPeriodEnd: salon.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: salon.subscription.cancelAtPeriodEnd,
        canceledAt: salon.subscription.canceledAt,
      },
      plan: {
        name: salon.subscription.plan.name,
        price: salon.subscription.plan.price,
        interval: "mês", // Sempre mensal
      },
      revenue: {
        currentMonth: currentMonthRevenue,
        willBeCharged,
        nextChargeAmount,
      },
      trial: {
        isActive: trialActive,
        daysLeft,
        percentage,
      },
      invoices: salon.subscription.invoices.map((invoice) => ({
        id: invoice.id,
        amount: invoice.amount,
        status: invoice.status,
        monthlyRevenue: invoice.monthlyRevenue,
        wasCharged: invoice.wasCharged,
        paidAt: invoice.paidAt,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Erro ao buscar status da assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao buscar status da assinatura" },
      { status: 500 }
    );
  }
}
