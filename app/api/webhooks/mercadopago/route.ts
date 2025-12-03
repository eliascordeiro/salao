import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Webhook do Mercado Pago para notificações de pagamento
 * Endpoint: POST /api/webhooks/mercadopago
 * 
 * Tipos de notificação:
 * - payment: Pagamento aprovado/rejeitado
 * - subscription_preapproval: Assinatura autorizada/cancelada
 * - subscription_authorized_payment: Cobrança recorrente processada
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("🔔 Webhook recebido:", JSON.stringify(body, null, 2));

    const { type, data, action } = body;

    // Validar assinatura do webhook (recomendado em produção)
    // const signature = request.headers.get('x-signature');
    // const requestId = request.headers.get('x-request-id');

    // Processar diferentes tipos de notificação
    if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
      await handlePaymentNotification(data.id);
    } else if (type === 'subscription_preapproval' || action === 'subscription_preapproval.updated') {
      await handleSubscriptionNotification(data.id);
    } else if (action === 'subscription_authorized_payment.created') {
      await handleAuthorizedPaymentNotification(data.id);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Processa notificação de pagamento único
 */
async function handlePaymentNotification(paymentId: string) {
  console.log("💳 Processando pagamento:", paymentId);

  // Buscar detalhes do pagamento no Mercado Pago
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    console.error("❌ Erro ao buscar pagamento");
    return;
  }

  const payment = await response.json();

  console.log("📊 Detalhes do pagamento:", {
    id: payment.id,
    status: payment.status,
    status_detail: payment.status_detail,
    transaction_amount: payment.transaction_amount,
  });

  // Buscar assinatura relacionada
  const subscription = await prisma.subscription.findFirst({
    where: { mpSubscriptionId: payment.id?.toString() },
    include: { salon: { include: { owner: true } }, plan: true },
  });

  if (!subscription) {
    console.log("⚠️ Assinatura não encontrada para pagamento:", paymentId);
    return;
  }

  // Atualizar status da assinatura
  let newStatus = subscription.status;
  
  if (payment.status === 'approved') {
    newStatus = 'ACTIVE';
    
    // Enviar email de confirmação
    await sendPaymentSuccessEmail(
      subscription.salon.owner.email || '',
      subscription.salon.name,
      subscription.plan.name,
      payment.transaction_amount
    );
  } else if (payment.status === 'rejected') {
    newStatus = 'SUSPENDED';
    
    // Enviar email de falha
    await sendPaymentFailureEmail(
      subscription.salon.owner.email || '',
      subscription.salon.name,
      payment.status_detail
    );
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: newStatus,
      lastPaymentDate: new Date(),
      lastPaymentAmount: payment.transaction_amount,
      lastPaymentStatus: payment.status,
    },
  });

  // Registrar pagamento
  await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      mpPaymentId: payment.id?.toString(),
      amount: payment.transaction_amount,
      mpStatus: payment.status,
      paymentMethod: 'credit_card',
      paidAt: payment.status === 'approved' ? new Date() : null,
    },
  });

  console.log("✅ Pagamento processado:", {
    subscriptionId: subscription.id,
    status: newStatus,
  });
}

/**
 * Processa notificação de assinatura (cancelamento, pausar, etc)
 */
async function handleSubscriptionNotification(preapprovalId: string) {
  console.log("📋 Processando assinatura:", preapprovalId);

  // Buscar detalhes da assinatura no Mercado Pago
  const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    console.error("❌ Erro ao buscar assinatura");
    return;
  }

  const preapproval = await response.json();

  console.log("📊 Detalhes da assinatura:", {
    id: preapproval.id,
    status: preapproval.status,
  });

  // Buscar assinatura no banco
  const subscription = await prisma.subscription.findFirst({
    where: { mpSubscriptionId: preapproval.id },
    include: { salon: { include: { owner: true } }, plan: true },
  });

  if (!subscription) {
    console.log("⚠️ Assinatura não encontrada:", preapprovalId);
    return;
  }

  // Mapear status do MP para nosso sistema
  let newStatus = subscription.status;
  
  switch (preapproval.status) {
    case 'authorized':
      newStatus = 'ACTIVE';
      break;
    case 'paused':
      newStatus = 'SUSPENDED';
      break;
    case 'cancelled':
      newStatus = 'CANCELED';
      await sendSubscriptionCanceledEmail(
        subscription.salon.owner.email || '',
        subscription.salon.name,
        subscription.plan.name
      );
      break;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: newStatus,
      canceledAt: preapproval.status === 'cancelled' ? new Date() : null,
    },
  });

  console.log("✅ Assinatura atualizada:", {
    subscriptionId: subscription.id,
    status: newStatus,
  });
}

/**
 * Processa notificação de cobrança recorrente autorizada
 */
async function handleAuthorizedPaymentNotification(paymentId: string) {
  console.log("🔄 Processando cobrança recorrente:", paymentId);

  // Buscar detalhes do pagamento autorizado
  const response = await fetch(`https://api.mercadopago.com/authorized_payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    console.error("❌ Erro ao buscar cobrança autorizada");
    return;
  }

  const authorizedPayment = await response.json();

  console.log("📊 Detalhes da cobrança:", {
    id: authorizedPayment.id,
    status: authorizedPayment.status,
    transaction_amount: authorizedPayment.transaction_amount,
    preapproval_id: authorizedPayment.preapproval_id,
  });

  // Buscar assinatura relacionada
  const subscription = await prisma.subscription.findFirst({
    where: { mpSubscriptionId: authorizedPayment.preapproval_id },
    include: { salon: { include: { owner: true } }, plan: true },
  });

  if (!subscription) {
    console.log("⚠️ Assinatura não encontrada para cobrança:", paymentId);
    return;
  }

  // Atualizar próxima data de cobrança (30 dias)
  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + 30);

  // Atualizar status baseado no resultado
  let newStatus = subscription.status;
  
  if (authorizedPayment.status === 'approved') {
    newStatus = 'ACTIVE';
    
    await sendPaymentSuccessEmail(
      subscription.salon.owner.email || '',
      subscription.salon.name,
      subscription.plan.name,
      authorizedPayment.transaction_amount
    );
  } else if (authorizedPayment.status === 'rejected') {
    newStatus = 'SUSPENDED';
    
    await sendPaymentFailureEmail(
      subscription.salon.owner.email || '',
      subscription.salon.name,
      authorizedPayment.status_detail
    );
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: newStatus,
      lastPaymentDate: new Date(),
      lastPaymentAmount: authorizedPayment.transaction_amount,
      lastPaymentStatus: authorizedPayment.status,
      nextBillingDate: authorizedPayment.status === 'approved' ? nextBilling : subscription.nextBillingDate,
    },
  });

  // Registrar pagamento
  await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      mpPaymentId: authorizedPayment.id?.toString(),
      amount: authorizedPayment.transaction_amount,
      mpStatus: authorizedPayment.status,
      paymentMethod: 'credit_card',
      paidAt: authorizedPayment.status === 'approved' ? new Date() : null,
    },
  });

  console.log("✅ Cobrança recorrente processada:", {
    subscriptionId: subscription.id,
    status: newStatus,
    nextBilling: nextBilling.toISOString(),
  });
}

/**
 * Envia email de pagamento aprovado
 */
async function sendPaymentSuccessEmail(
  email: string,
  salonName: string,
  planName: string,
  amount: number
) {
  try {
    await resend.emails.send({
      from: process.env.SMTP_FROM || 'noreply@agendahora.com',
      to: email,
      subject: '✅ Pagamento Confirmado - AgendaHora',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">✅ Pagamento Confirmado</h2>
          <p>Olá, ${salonName}!</p>
          <p>Seu pagamento foi confirmado com sucesso.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Plano:</strong> ${planName}</p>
            <p><strong>Valor:</strong> R$ ${amount.toFixed(2)}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          
          <p>Sua assinatura continua ativa. Obrigado por usar o AgendaHora!</p>
          
          <a href="${process.env.NEXTAUTH_URL}/dashboard" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Acessar Dashboard
          </a>
        </div>
      `,
    });
    console.log("✅ Email de sucesso enviado para:", email);
  } catch (error) {
    console.error("❌ Erro ao enviar email de sucesso:", error);
  }
}

/**
 * Envia email de falha no pagamento
 */
async function sendPaymentFailureEmail(
  email: string,
  salonName: string,
  reason: string
) {
  try {
    await resend.emails.send({
      from: process.env.SMTP_FROM || 'noreply@agendahora.com',
      to: email,
      subject: '⚠️ Falha no Pagamento - AgendaHora',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">⚠️ Falha no Pagamento</h2>
          <p>Olá, ${salonName}!</p>
          <p>Não conseguimos processar seu pagamento.</p>
          
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p><strong>Motivo:</strong> ${reason}</p>
          </div>
          
          <p>Por favor, atualize seus dados de pagamento para manter sua assinatura ativa.</p>
          
          <a href="${process.env.NEXTAUTH_URL}/dashboard/assinatura" 
             style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Atualizar Forma de Pagamento
          </a>
        </div>
      `,
    });
    console.log("✅ Email de falha enviado para:", email);
  } catch (error) {
    console.error("❌ Erro ao enviar email de falha:", error);
  }
}

/**
 * Envia email de assinatura cancelada
 */
async function sendSubscriptionCanceledEmail(
  email: string,
  salonName: string,
  planName: string
) {
  try {
    await resend.emails.send({
      from: process.env.SMTP_FROM || 'noreply@agendahora.com',
      to: email,
      subject: '❌ Assinatura Cancelada - AgendaHora',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6b7280;">Assinatura Cancelada</h2>
          <p>Olá, ${salonName}!</p>
          <p>Sua assinatura do plano <strong>${planName}</strong> foi cancelada.</p>
          
          <p>Sentiremos sua falta! Se precisar, você pode reativar sua assinatura a qualquer momento.</p>
          
          <a href="${process.env.NEXTAUTH_URL}/planos" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Ver Planos
          </a>
        </div>
      `,
    });
    console.log("✅ Email de cancelamento enviado para:", email);
  } catch (error) {
    console.error("❌ Erro ao enviar email de cancelamento:", error);
  }
}

// Suportar GET para validação do webhook (Mercado Pago pode fazer um GET inicial)
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
