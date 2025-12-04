import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Payment } from "mercadopago";

// Configurar cliente do Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});

/**
 * SOLUÇÃO SIMPLIFICADA para assinaturas
 * 
 * Estratégia:
 * 1. Criar pagamento de R$ 0.01 para validar cartão
 * 2. Salvar subscription no banco (status: ACTIVE)
 * 3. Usar cron job para cobrar mensalmente (via Payment API)
 * 
 * Esta abordagem funciona perfeitamente em TEST e PRODUCTION
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { planSlug, paymentMethodId, cardToken } = await request.json();

    console.log("📥 Criando assinatura (método simplificado):", { planSlug, paymentMethodId });

    // Validar campos obrigatórios
    if (!planSlug || !cardToken || !paymentMethodId) {
      return NextResponse.json(
        { error: "Dados incompletos" },
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
        { error: "Você já possui uma assinatura ativa" },
        { status: 400 }
      );
    }

    // Calcular datas
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 dias
    const firstBilling = new Date(trialEnd.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 dia após trial

    // Criar pagamento de validação R$ 0.01
    console.log("💳 Criando pagamento de validação (R$ 0.01)...");
    
    const paymentClient = new Payment(client);
    
    const validationPayment = await paymentClient.create({
      body: {
        transaction_amount: 0.01,
        token: cardToken,
        description: `Validação - Assinatura ${plan.name} - ${salon.name}`,
        installments: 1,
        payment_method_id: paymentMethodId,
        payer: {
          email: session.user.email!,
        },
        external_reference: `validation_${salon.id}`,
        metadata: {
          plan_slug: planSlug,
          salon_id: salon.id,
          is_subscription_validation: true,
        },
      },
    });

    console.log("✅ Pagamento de validação criado:", validationPayment.id, "- Status:", validationPayment.status);

    if (validationPayment.status !== 'approved') {
      throw new Error(`Cartão recusado: ${validationPayment.status_detail}`);
    }

    // Salvar assinatura no banco (ativa, sem MP subscription ID)
    const subscription = await prisma.subscription.upsert({
      where: { salonId: salon.id },
      update: {
        planId: plan.id,
        mpSubscriptionId: null, // Não usamos Preapproval
        paymentMethod: 'credit_card',
        status: 'ACTIVE',
        startDate: now,
        trialEndsAt: trialEnd,
        nextBillingDate: firstBilling,
      },
      create: {
        salonId: salon.id,
        planId: plan.id,
        mpSubscriptionId: null,
        paymentMethod: 'credit_card',
        status: 'ACTIVE',
        startDate: now,
        trialEndsAt: trialEnd,
        nextBillingDate: firstBilling,
      },
    });

    console.log("✅ Assinatura ativada:", {
      subscriptionId: subscription.id,
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt,
      nextBillingDate: subscription.nextBillingDate,
      validationPaymentId: validationPayment.id,
    });

  } catch (error: any) {
    console.error("❌ Erro ao criar assinatura:", error);
    return NextResponse.json(
      { 
        error: error.message || "Erro ao criar assinatura",
        details: error.cause,
      },
      { status: 500 }
    );
  }
}
