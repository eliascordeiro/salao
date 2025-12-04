import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Cria assinatura recorrente no Mercado Pago
 * Endpoint: POST /api/subscriptions/create-recurring
 * 
 * A API de Preapproval permite cobranças automáticas mensais
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

    // PASSO 2: Salvar cartão do customer
    console.log("💳 Salvando cartão...");
    const cardBody = {
      token: cardToken,
    };

    const cardResponse = await fetch(`https://api.mercadopago.com/v1/customers/${customerId}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(cardBody),
    });

    const cardData = await cardResponse.json();

    if (!cardResponse.ok) {
      console.error("❌ Erro ao salvar cartão:", cardData);
      throw new Error(cardData.message || 'Erro ao salvar cartão');
    }

    console.log("✅ Cartão salvo:", cardData.id);

    // PASSO 3: Criar assinatura recorrente
    const preapprovalBody = {
      reason: `Assinatura ${plan.name} - ${salon.name}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plan.price,
        currency_id: "BRL",
        free_trial: {
          frequency: 14,
          frequency_type: "days",
        },
      },
      back_url: `${process.env.NEXTAUTH_URL}/dashboard/assinatura/sucesso`,
      payer_email: session.user.email,
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

    // PASSO 4: Associar método de pagamento (cartão) ao preapproval
    console.log("🔗 Associando método de pagamento...");
    const updateBody = {
      card_id: parseInt(cardData.id),
    };

    const updateResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapproval.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(updateBody),
    });

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      console.error("⚠️ Erro ao associar cartão (continuando mesmo assim):", updateData);
      // Não falha se não conseguir associar, pois a assinatura já foi criada
    } else {
      console.log("✅ Método de pagamento associado!");
    }

    // Salvar assinatura no banco
    const subscription = await prisma.subscription.upsert({
      where: { salonId: salon.id },
      update: {
        planId: plan.id,
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
