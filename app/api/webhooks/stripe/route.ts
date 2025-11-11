import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Webhook para receber eventos do Stripe
 * Eventos processados:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.paid
 * - invoice.payment_failed
 * - invoice.payment_action_required
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  console.log(`🔔 Webhook recebido: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_action_required":
        await handleInvoicePaymentActionRequired(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`ℹ️ Evento não processado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`❌ Erro ao processar webhook ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Processa atualização de subscription
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log(`📝 Atualizando subscription: ${subscription.id}`);

  const salonId = subscription.metadata.salonId;
  if (!salonId) {
    console.error("❌ salonId não encontrado no metadata");
    return;
  }

  // Buscar subscription no banco
  const dbSubscription = await prisma.subscription.findFirst({
    where: { 
      OR: [
        { stripeSubscriptionId: subscription.id },
        { salonId }
      ]
    },
  });

  if (!dbSubscription) {
    console.error(`❌ Subscription não encontrada para salonId: ${salonId}`);
    return;
  }

  // Mapear status do Stripe para status do banco
  let status: "trialing" | "active" | "past_due" | "canceled" | "paused" = "active";
  
  if (subscription.status === "trialing") status = "trialing";
  else if (subscription.status === "active") status = "active";
  else if (subscription.status === "past_due") status = "past_due";
  else if (subscription.status === "canceled") status = "canceled";
  else if (subscription.status === "paused") status = "paused";

  // Atualizar dados no banco
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      stripeSubscriptionId: subscription.id,
      status,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
  });

  console.log(`✅ Subscription atualizada: ${subscription.id} - Status: ${status}`);
}

/**
 * Processa cancelamento de subscription
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`🗑️ Cancelando subscription: ${subscription.id}`);

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    console.error(`❌ Subscription não encontrada: ${subscription.id}`);
    return;
  }

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: "canceled",
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`✅ Subscription cancelada: ${subscription.id}`);
}

/**
 * Processa pagamento de invoice
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`💰 Invoice paga: ${invoice.id}`);

  const subscriptionId = typeof (invoice as any).subscription === 'string' 
    ? (invoice as any).subscription 
    : (invoice as any).subscription?.id;
    
  if (!subscriptionId) {
    console.error("❌ subscriptionId não encontrado no invoice");
    return;
  }

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    include: { salon: true },
  });

  if (!dbSubscription) {
    console.error(`❌ Subscription não encontrada: ${subscriptionId}`);
    return;
  }

  // Criar registro de invoice no banco
  await prisma.invoice.create({
    data: {
      subscriptionId: dbSubscription.id,
      stripeInvoiceId: invoice.id,
      amount: (invoice.amount_paid || 0) / 100, // Converter de centavos para reais
      monthlyRevenue: 0, // Será calculado depois pelo job mensal
      wasCharged: (invoice.amount_paid || 0) > 0,
      status: "paid",
      paidAt: new Date(),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : new Date(),
      periodStart: new Date(((invoice as any).period_start || (invoice as any).lines?.data?.[0]?.period?.start || Date.now() / 1000) * 1000),
      periodEnd: new Date(((invoice as any).period_end || (invoice as any).lines?.data?.[0]?.period?.end || Date.now() / 1000) * 1000),
    },
  });

  // Atualizar status da subscription para active
  if (dbSubscription.status === "trialing" || dbSubscription.status === "past_due") {
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: { status: "active" },
    });
  }

  console.log(`✅ Invoice registrada: ${invoice.id} - Valor: R$ ${((invoice.amount_paid || 0) / 100).toFixed(2)}`);
}

/**
 * Processa falha de pagamento
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`❌ Pagamento falhou: ${invoice.id}`);

  const subscriptionId = typeof (invoice as any).subscription === 'string' 
    ? (invoice as any).subscription 
    : (invoice as any).subscription?.id;
    
  if (!subscriptionId) {
    console.error("❌ subscriptionId não encontrado no invoice");
    return;
  }

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    include: { salon: true },
  });

  if (!dbSubscription) {
    console.error(`❌ Subscription não encontrada: ${subscriptionId}`);
    return;
  }

  // Atualizar status para past_due
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: { status: "past_due" },
  });

  console.log(`⚠️ Subscription marcada como past_due: ${subscriptionId}`);

  // TODO: Enviar email notificando falha de pagamento
}

/**
 * Processa quando ação é necessária para pagamento
 */
async function handleInvoicePaymentActionRequired(invoice: Stripe.Invoice) {
  console.log(`⚠️ Ação necessária para pagamento: ${invoice.id}`);

  const subscriptionId = typeof (invoice as any).subscription === 'string' 
    ? (invoice as any).subscription 
    : (invoice as any).subscription?.id;
    
  if (!subscriptionId) {
    console.error("❌ subscriptionId não encontrado no invoice");
    return;
  }

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    include: { salon: true },
  });

  if (!dbSubscription) {
    console.error(`❌ Subscription não encontrada: ${subscriptionId}`);
    return;
  }

  console.log(`ℹ️ Aguardando ação do usuário para invoice: ${invoice.id}`);

  // TODO: Enviar email notificando ação necessária (ex: 3D Secure)
}
