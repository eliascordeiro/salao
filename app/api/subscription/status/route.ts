import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  isInTrial, 
  getDaysLeftInTrial, 
  getTrialPercentage 
} from "@/lib/subscription-helper";

export const dynamic = 'force-dynamic';

export const dynamic = 'force-dynamic';

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

    // Buscar usuário atual
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

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Se o usuário é gerenciado (tem ownerId), buscar o salão do proprietário
    let salon;
    if (user.ownerId) {
      // Usuário gerenciado - buscar salão do owner
      const owner = await prisma.user.findUnique({
        where: { id: user.ownerId },
        include: {
          ownedSalons: {
            include: {
              subscription: {
                include: {
                  plan: true,
                  invoices: {
                    orderBy: { createdAt: "desc" },
                    take: 12,
                  }
                }
              }
            }
          }
        }
      });

      if (!owner || owner.ownedSalons.length === 0) {
        return NextResponse.json({ error: "Salão do proprietário não encontrado" }, { status: 404 });
      }

      salon = owner.ownedSalons[0];
    } else {
      // Proprietário - usar próprios salões
      if (user.ownedSalons.length === 0) {
        return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
      }

      salon = user.ownedSalons[0];
    }

    // Se não tem subscription, criar uma automaticamente com trial de 30 dias
    if (!salon.subscription) {
      // Buscar plano Free
      let freePlan = await prisma.plan.findFirst({
        where: { name: "Free" }
      });

      // Se não existe plano Free, criar
      if (!freePlan) {
        freePlan = await prisma.plan.create({
          data: {
            name: "Free",
            price: 39,
            stripePriceId: null,
            features: [
              "30 dias grátis",
              "Agendamentos ilimitados",
              "Profissionais ilimitados",
              "Serviços ilimitados",
              "Relatórios e analytics",
              "Suporte prioritário"
            ]
          }
        });
      }

      // Criar subscription com trial
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30); // 30 dias de trial

      // Criar um stripeCustomerId temporário (será substituído ao configurar Stripe)
      const tempCustomerId = `cus_temp_${salon.id}`;

      const newSubscription = await prisma.subscription.create({
        data: {
          salonId: salon.id,
          planId: freePlan.id,
          status: "trialing",
          stripeCustomerId: tempCustomerId,
          trialStartedAt: trialStart,
          trialEndsAt: trialEnd,
          currentPeriodStart: trialStart,
          currentPeriodEnd: trialEnd,
        },
        include: {
          plan: true,
          invoices: true
        }
      });

      // Recarregar o salão com a subscription
      const updatedSalon = await prisma.salon.findUnique({
        where: { id: salon.id },
        include: {
          subscription: {
            include: {
              plan: true,
              invoices: {
                orderBy: { createdAt: "desc" },
                take: 12,
              }
            }
          }
        }
      });

      if (!updatedSalon?.subscription) {
        return NextResponse.json(
          { error: "Erro ao criar assinatura" },
          { status: 500 }
        );
      }

      // Substituir referência
      salon.subscription = updatedSalon.subscription;
    }

    if (!salon.subscription) {
      return NextResponse.json(
        { error: "Erro ao criar assinatura" },
        { status: 500 }
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
