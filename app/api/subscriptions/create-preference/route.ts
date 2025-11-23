import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscriptionPreference } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { planSlug, paymentMethod } = await request.json();

    if (!planSlug || !paymentMethod) {
      return NextResponse.json(
        { error: "planSlug e paymentMethod são obrigatórios" },
        { status: 400 }
      );
    }

    if (!['pix', 'credit_card'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "paymentMethod deve ser 'pix' ou 'credit_card'" },
        { status: 400 }
      );
    }

    // Buscar plano
    const plan = await prisma.plan.findUnique({
      where: { slug: planSlug },
    });

    if (!plan || !plan.active) {
      return NextResponse.json(
        { error: "Plano não encontrado ou inativo" },
        { status: 404 }
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

    // Verificar se já tem assinatura ativa
    const existingSubscription = await prisma.subscription.findUnique({
      where: { salonId: salon.id },
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      return NextResponse.json(
        { error: "Salão já possui assinatura ativa" },
        { status: 400 }
      );
    }

    // Criar preferência no Mercado Pago
    const preference = await createSubscriptionPreference({
      planName: plan.name,
      planPrice: plan.price,
      salonId: salon.id,
      salonName: salon.name,
      paymentMethod: paymentMethod as 'pix' | 'credit_card',
    });

    // Criar ou atualizar assinatura no banco (status PENDING)
    const subscription = await prisma.subscription.upsert({
      where: { salonId: salon.id },
      update: {
        planId: plan.id,
        mpPreferenceId: preference.id,
        paymentMethod,
        status: 'PENDING',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias trial
      },
      create: {
        salonId: salon.id,
        planId: plan.id,
        mpPreferenceId: preference.id,
        paymentMethod,
        status: 'PENDING',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias trial
      },
    });

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point, // URL de checkout do MP
      sandboxInitPoint: preference.sandbox_init_point, // Para testes
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
      },
    });

  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
