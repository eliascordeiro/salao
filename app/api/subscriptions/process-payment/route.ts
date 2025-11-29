import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentClient } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const {
      token,
      payment_method_id,
      issuer_id,
      email,
      amount,
      installments,
      identification,
      planSlug,
    } = await request.json();

    // Validar campos obrigatórios
    if (!token || !payment_method_id || !email || !amount || !planSlug) {
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

    // Processar pagamento no Mercado Pago
    const payment = await paymentClient.create({
      body: {
        token,
        issuer_id,
        payment_method_id,
        transaction_amount: amount,
        installments,
        payer: {
          email,
          identification: identification || undefined,
        },
        description: `Assinatura ${plan.name} - ${salon.name}`,
        statement_descriptor: plan.name.substring(0, 13),
        external_reference: salon.id,
        metadata: {
          salon_id: salon.id,
          plan_slug: planSlug,
        },
      },
    });

    console.log("💳 Pagamento processado:", payment);

    // Criar ou atualizar assinatura no banco
    const subscription = await prisma.subscription.upsert({
      where: { salonId: salon.id },
      update: {
        planId: plan.id,
        mpSubscriptionId: payment.id?.toString(),
        paymentMethod: 'credit_card',
        status: payment.status === 'approved' ? 'ACTIVE' : 'PENDING',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias trial
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
      create: {
        salonId: salon.id,
        planId: plan.id,
        mpSubscriptionId: payment.id?.toString(),
        paymentMethod: 'credit_card',
        status: payment.status === 'approved' ? 'ACTIVE' : 'PENDING',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Registrar pagamento
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        mpPaymentId: payment.id?.toString() || '',
        amount,
        status: payment.status || 'pending',
        paymentMethod: 'credit_card',
        paidAt: payment.status === 'approved' ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      status: payment.status,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
      },
    });

  } catch (error: any) {
    console.error("❌ Erro ao processar pagamento:", error);
    return NextResponse.json(
      { 
        error: error.message || "Erro ao processar pagamento",
        details: error.cause?.message || undefined,
      },
      { status: 500 }
    );
  }
}
