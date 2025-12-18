import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("[change-plan] Session:", session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { planSlug } = await req.json();
    console.log("[change-plan] planSlug:", planSlug);

    if (!planSlug) {
      return NextResponse.json({ error: "planSlug é obrigatório" }, { status: 400 });
    }

    // Buscar o novo plano
    const newPlan = await prisma.plan.findUnique({
      where: { slug: planSlug },
    });
    console.log("[change-plan] newPlan:", newPlan?.name);

    if (!newPlan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    // Buscar assinatura ativa do salão
    const salon = await prisma.salon.findFirst({
      where: { userId: session.user.id },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ["ACTIVE", "TRIALING"],
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    console.log("[change-plan] salon:", salon?.name);
    console.log("[change-plan] subscriptions count:", salon?.subscriptions?.length || 0);

    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const activeSubscription = salon.subscriptions?.[0];
    console.log("[change-plan] activeSubscription:", activeSubscription ? "EXISTS" : "NULL");

    if (!activeSubscription) {
      console.log("[change-plan] Sem assinatura ativa");
      // Sem assinatura ativa, pode criar nova normalmente
      return NextResponse.json({
        canProceed: true,
        action: "CREATE_NEW",
        message: "Você pode criar uma nova assinatura",
      });
    }

    // Buscar o plano atual da assinatura ativa
    console.log("[change-plan] Buscando plano atual com ID:", activeSubscription.planId);
    const currentPlan = await prisma.plan.findUnique({
      where: { id: activeSubscription.planId },
    });
    console.log("[change-plan] currentPlan:", currentPlan?.name);

    if (!currentPlan) {
      console.error("[change-plan] Plano atual não encontrado!");
      return NextResponse.json({ error: "Plano atual não encontrado" }, { status: 404 });
    }

    const isUpgrade = newPlan.price > currentPlan.price;
    const isSamePlan = newPlan.id === currentPlan.id;
    console.log("[change-plan] isUpgrade:", isUpgrade, "isSamePlan:", isSamePlan);

    if (isSamePlan) {
      return NextResponse.json({
        canProceed: false,
        action: "SAME_PLAN",
        message: "Você já está no plano " + newPlan.name,
      });
    }

    // Cancelar assinatura atual
    await prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
      },
    });

    return NextResponse.json({
      canProceed: true,
      action: isUpgrade ? "UPGRADE" : "DOWNGRADE",
      message: isUpgrade 
        ? `Upgrade de ${currentPlan.name} para ${newPlan.name}. Assinatura anterior cancelada.`
        : `Downgrade de ${currentPlan.name} para ${newPlan.name}. Assinatura anterior cancelada.`,
      previousPlan: {
        name: currentPlan.name,
        price: currentPlan.price,
      },
      newPlan: {
        name: newPlan.name,
        price: newPlan.price,
      },
    });
  } catch (error) {
    console.error("Erro ao processar mudança de plano:", error);
    return NextResponse.json(
      { error: "Erro ao processar mudança de plano" },
      { status: 500 }
    );
  }
}
