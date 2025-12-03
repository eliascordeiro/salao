import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentClient } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("🔐 Sessão:", { userId: session?.user?.id, role: session?.user?.role });
    
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
      amount,
      installments,
      identification,
      planSlug,
    } = await request.json();

    console.log("📥 Dados recebidos:", {
      token: token?.substring(0, 20) + "...",
      payment_method_id,
      issuer_id,
      amount,
      installments,
      identification,
      planSlug,
    });

    // Validar campos obrigatórios
    if (!token || !payment_method_id || !amount || !planSlug) {
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

    // Usar email do usuário logado (não precisa enviar ao Mercado Pago)
    const payerEmail = session.user.email || 'noreply@agendahora.com';

    console.log("💳 Criando pagamento no Mercado Pago:", {
      amount,
      payment_method_id,
      issuer_id,
      installments,
      identification,
      token: token?.substring(0, 20) + "...",
    });

    // Processar pagamento no Mercado Pago
    // Campos obrigatórios segundo a documentação oficial
    // Testando com payload mínimo primeiro
    const paymentBody: any = {
      token,
      payment_method_id,
      transaction_amount: Number(amount),
      installments: Number(installments) || 1,
    };

    // Adicionar issuer_id se fornecido (converter para número)
    if (issuer_id) {
      paymentBody.issuer_id = Number(issuer_id);
    }

    // Adicionar payer com identification se fornecido
    if (identification?.type && identification?.number) {
      paymentBody.payer = {
        identification: {
          type: identification.type,
          number: identification.number,
        },
      };
    }

    console.log("📦 Payload final (mínimo):", JSON.stringify(paymentBody, null, 2));

    // Testar com API REST direta ao invés do SDK
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `${salon.id}-${Date.now()}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const responseData = await response.json();
    
    console.log("📥 Resposta do Mercado Pago:", {
      status: response.status,
      statusText: response.statusText,
      data: JSON.stringify(responseData, null, 2),
    });

    if (!response.ok) {
      console.error("❌ Erro detalhado do MP:", responseData);
      throw new Error(responseData.message || 'Erro ao processar pagamento');
    }

    const payment = responseData;

    console.log("✅ Pagamento criado:", {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
    });

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
        mpStatus: payment.status || 'pending',
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
    console.error("❌ Detalhes completos do erro:", JSON.stringify({
      message: error.message,
      cause: error.cause,
      stack: error.stack?.split('\n').slice(0, 5),
      name: error.name,
      response: error.response,
    }, null, 2));
    
    return NextResponse.json(
      { 
        error: error.message || "Erro ao processar pagamento",
        details: error.cause || error.response || undefined,
      },
      { status: 500 }
    );
  }
}
