import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { resolveSeats, calculateAmount } from "@/lib/seat-pricing";

// Configurar cliente do Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});

/**
 * Cria primeiro pagamento e configura assinatura recorrente
 * Estratégia: Usar pagamento único + salvar cartão para cobranças futuras via webhook
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

    const { planSlug, paymentMethodId, cardToken, seats: requestedSeats } = await request.json();

    console.log("📥 Criando assinatura recorrente:", { planSlug, paymentMethodId });

    // Validar campos obrigatórios
    if (!planSlug || !cardToken) {
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

    // Calcular cadeiras e valor mensal (cobrança por cadeira)
    const seats = await resolveSeats(salon.id, requestedSeats);
    const amount = calculateAmount(plan.price, seats);

    // PASSO 1: Buscar ou criar Customer no Mercado Pago
    console.log("👤 Buscando/criando customer no MP...");
    
    // Primeiro, tentar buscar customer existente
    let customerId: string;
    const searchResponse = await fetch(`https://api.mercadopago.com/v1/customers/search?email=${encodeURIComponent(session.user.email)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    const searchData = await searchResponse.json();

    if (searchData.results && searchData.results.length > 0) {
      // Customer já existe
      customerId = searchData.results[0].id;
      console.log("✅ Customer encontrado:", customerId);
    } else {
      // Criar novo customer
      const customerBody = {
        email: session.user.email,
        first_name: session.user.name?.split(' ')[0] || 'Cliente',
        last_name: session.user.name?.split(' ').slice(1).join(' ') || 'Salão',
      };

      const customerResponse = await fetch('https://api.mercadopago.com/v1/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(customerBody),
      });

      const customerData = await customerResponse.json();

      if (!customerResponse.ok) {
        console.error("❌ Erro ao criar customer:", customerData);
        throw new Error(customerData.message || 'Erro ao criar customer');
      }

      customerId = customerData.id;
      console.log("✅ Customer criado:", customerId);
    }

    // NOTA: Não salvamos o cartão separadamente porque o token será consumido
    // pelo Preapproval. O MP salva o cartão automaticamente no preapproval.

    // PASSO 2: Criar Preapproval Plan (template de assinatura)
    console.log("📋 Criando preapproval plan...");
    const planBody = {
      reason: `Assinatura ${plan.name}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "BRL",
        free_trial: {
          frequency: 14,
          frequency_type: "days",
        },
      },
      back_url: `${process.env.NEXTAUTH_URL}/dashboard/assinatura/sucesso`,
    };

    const planResponse = await fetch('https://api.mercadopago.com/preapproval_plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(planBody),
    });

    const planData = await planResponse.json();

    if (!planResponse.ok) {
      console.error("❌ Erro ao criar preapproval plan:", planData);
      throw new Error(planData.message || 'Erro ao criar plano de assinatura');
    }

    console.log("✅ Preapproval plan criado:", planData.id);

    // PASSO 4: Criar assinatura vinculada ao plan
    const preapprovalBody = {
      preapproval_plan_id: planData.id,
      reason: `Assinatura ${plan.name} - ${salon.name}`,
      external_reference: salon.id,
      payer_email: session.user.email,
      card_token_id: cardToken, // Usa o token original, não o card_id
      status: "authorized",
    };

    console.log("📦 Criando preapproval:", JSON.stringify(preapprovalBody, null, 2));

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preapprovalBody),
    });

    const responseData = await response.json();

    console.log("📥 Resposta do MP:", {
      status: response.status,
      data: JSON.stringify(responseData, null, 2),
    });

    if (!response.ok) {
      console.error("❌ Erro ao criar assinatura:", responseData);
      throw new Error(responseData.message || 'Erro ao criar assinatura recorrente');
    }

    const preapproval = responseData;
    console.log("✅ Preapproval criado:", preapproval.id);

    // Salvar assinatura no banco
    const subscription = await prisma.subscription.upsert({
      where: { salonId: salon.id },
      update: {
        planId: plan.id,
        seats,
        amount,
        mpSubscriptionId: preapproval.id,
        paymentMethod: 'credit_card',
        status: preapproval.status === 'authorized' ? 'ACTIVE' : 'PENDING',
        startDate: now,
        trialEndsAt: trialEnd,
        nextBillingDate: firstBilling,
      },
      create: {
        salonId: salon.id,
        planId: plan.id,
        seats,
        amount,
        mpSubscriptionId: preapproval.id,
        paymentMethod: 'credit_card',
        status: preapproval.status === 'authorized' ? 'ACTIVE' : 'PENDING',
        startDate: now,
        trialEndsAt: trialEnd,
        nextBillingDate: firstBilling,
      },
    });

    console.log("✅ Assinatura recorrente criada:", {
      subscriptionId: subscription.id,
      mpSubscriptionId: preapproval.id,
      status: subscription.status,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      mpSubscriptionId: preapproval.id,
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt,
      nextBillingDate: subscription.nextBillingDate,
    });

  } catch (error: any) {
    console.error("❌ Erro ao criar assinatura recorrente:", error);
    return NextResponse.json(
      { 
        error: error.message || "Erro ao criar assinatura",
        details: error.cause,
      },
      { status: 500 }
    );
  }
}
