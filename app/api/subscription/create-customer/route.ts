import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStripeCustomer, createStripeSubscription } from "@/lib/stripe-helper";

/**
 * POST /api/subscription/create-customer
 * Cria um customer no Stripe e uma subscription com trial de 30 dias
 */
export async function POST(req: NextRequest) {
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
          include: { subscription: true }
        }
      },
    });

    if (!user || user.ownedSalons.length === 0) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const salon = user.ownedSalons[0];

    // Verificar se já tem subscription
    if (salon.subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Salão já possui customer no Stripe" },
        { status: 400 }
      );
    }

    // Buscar plano Premium (R$ 39)
    const premiumPlan = await prisma.plan.findFirst({
      where: { name: "Premium" },
    });

    if (!premiumPlan || !premiumPlan.stripePriceId) {
      return NextResponse.json(
        { error: "Plano Premium não encontrado" },
        { status: 500 }
      );
    }

    // 1. Criar customer no Stripe
    const customer = await createStripeCustomer(
      salon.id,
      salon.email || user.email,
      salon.name
    );

    console.log(`✅ Customer criado: ${customer.id}`);

    // 2. Criar subscription com trial de 30 dias
    const subscription = await createStripeSubscription(
      customer.id,
      salon.id,
      premiumPlan.stripePriceId
    );

    console.log(`✅ Subscription criada: ${subscription.id}`);

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      subscriptionId: subscription.id,
      message: "Customer e subscription criados com sucesso! Trial de 30 dias iniciado.",
    });
  } catch (error) {
    console.error("❌ Erro ao criar customer:", error);
    return NextResponse.json(
      { error: "Erro ao criar customer no Stripe" },
      { status: 500 }
    );
  }
}
