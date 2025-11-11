import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBillingPortalSession } from "@/lib/stripe-helper";

/**
 * POST /api/subscription/billing-portal
 * Cria uma sessão do Stripe Billing Portal para o salão gerenciar sua assinatura
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

    // Verificar se tem customer no Stripe
    if (!salon.subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Salão ainda não tem customer no Stripe. Crie uma subscription primeiro." },
        { status: 400 }
      );
    }

    // Obter URL de retorno do corpo da requisição
    const { returnUrl } = await req.json();
    const finalReturnUrl = returnUrl || `${process.env.NEXTAUTH_URL}/dashboard/assinatura`;

    // Criar sessão do Billing Portal
    const portalSession = await createBillingPortalSession(
      salon.subscription.stripeCustomerId,
      finalReturnUrl
    );

    return NextResponse.json({
      url: portalSession.url,
      message: "Sessão do Billing Portal criada com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao criar sessão do Billing Portal:", error);
    return NextResponse.json(
      { error: "Erro ao criar sessão do Billing Portal" },
      { status: 500 }
    );
  }
}
