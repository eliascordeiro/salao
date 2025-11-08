import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { constructWebhookEvent } from "@/lib/stripe";
import { sendBookingConfirmedEmail } from "@/lib/email";

/**
 * API de Webhook do Stripe
 * POST /api/payments/webhook
 * 
 * Recebe eventos do Stripe (pagamento confirmado, falhou, etc)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Assinatura não fornecida" },
        { status: 400 }
      );
    }

    // Verificar assinatura do webhook
    const result = constructWebhookEvent(body, signature);

    if (!result.success || !result.event) {
      console.error("Erro ao verificar webhook:", result.error);
      return NextResponse.json(
        { error: "Assinatura inválida" },
        { status: 400 }
      );
    }

    const event = result.event;

    console.log("Webhook recebido:", event.type);

    // Processar evento
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}

/**
 * Processar checkout.session.completed
 */
async function handleCheckoutSessionCompleted(session: any) {
  console.log("Checkout session completed:", session.id);

  const payment = await prisma.payment.findUnique({
    where: { stripeSessionId: session.id },
    include: {
      booking: {
        include: {
          client: true,
          service: true,
          staff: true,
          salon: true,
        },
      },
    },
  });

  if (!payment) {
    console.error("Pagamento não encontrado para session:", session.id);
    return;
  }

  // Atualizar pagamento
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PROCESSING",
      stripePaymentIntentId: session.payment_intent,
    },
  });

  // Criar transação
  await prisma.transaction.create({
    data: {
      externalId: session.payment_intent,
      status: "AUTHORIZED",
      amount: session.amount_total / 100, // Converter de centavos
      method: "CREDIT_CARD",
      paymentId: payment.id,
      processedAt: new Date(),
      metadata: JSON.stringify({
        sessionId: session.id,
        customerEmail: session.customer_email,
      }),
    },
  });
}

/**
 * Processar payment_intent.succeeded
 */
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log("Payment intent succeeded:", paymentIntent.id);

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: {
      booking: {
        include: {
          client: true,
          service: true,
          staff: true,
          salon: true,
        },
      },
    },
  });

  if (!payment) {
    console.error("Pagamento não encontrado para payment intent:", paymentIntent.id);
    return;
  }

  // Atualizar pagamento como completado
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "COMPLETED",
      paidAt: new Date(),
      method: getPaymentMethod(paymentIntent.payment_method_types[0]),
    },
  });

  // Atualizar booking para CONFIRMED
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: "CONFIRMED" },
  });

  // Atualizar transação
  await prisma.transaction.updateMany({
    where: {
      paymentId: payment.id,
      externalId: paymentIntent.id,
    },
    data: {
      status: "CAPTURED",
      processedAt: new Date(),
    },
  });

  // Enviar email de confirmação
  try {
    const booking = payment.booking;
    await sendBookingConfirmedEmail(
      {
        clientName: booking.client.name,
        clientEmail: booking.client.email,
        serviceName: booking.service.name,
        staffName: booking.staff.name,
        salonName: booking.salon.name,
        date: new Date(booking.date),
        duration: booking.service.duration,
        price: booking.totalPrice,
        notes: booking.notes || undefined,
      },
      booking.id
    );
  } catch (error) {
    console.error("Erro ao enviar email de confirmação:", error);
  }

  console.log(`Pagamento ${payment.id} confirmado com sucesso`);
}

/**
 * Processar payment_intent.payment_failed
 */
async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log("Payment intent failed:", paymentIntent.id);

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (!payment) {
    console.error("Pagamento não encontrado para payment intent:", paymentIntent.id);
    return;
  }

  // Atualizar pagamento como falho
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "FAILED" },
  });

  // Criar transação de falha
  await prisma.transaction.create({
    data: {
      externalId: paymentIntent.id,
      status: "FAILED",
      amount: paymentIntent.amount / 100,
      method: getPaymentMethod(paymentIntent.payment_method_types[0]),
      paymentId: payment.id,
      processedAt: new Date(),
      errorCode: paymentIntent.last_payment_error?.code,
      errorMessage: paymentIntent.last_payment_error?.message,
      metadata: JSON.stringify({
        error: paymentIntent.last_payment_error,
      }),
    },
  });

  console.log(`Pagamento ${payment.id} falhou`);
}

/**
 * Processar charge.refunded
 */
async function handleChargeRefunded(charge: any) {
  console.log("Charge refunded:", charge.id);

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: charge.payment_intent },
  });

  if (!payment) {
    console.error("Pagamento não encontrado para charge:", charge.id);
    return;
  }

  // Atualizar pagamento como reembolsado
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "REFUNDED" },
  });

  // Atualizar booking para CANCELLED
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: "CANCELLED" },
  });

  // Criar transação de reembolso
  await prisma.transaction.create({
    data: {
      externalId: charge.id,
      status: "REFUNDED",
      amount: charge.amount_refunded / 100,
      method: "CREDIT_CARD",
      paymentId: payment.id,
      processedAt: new Date(),
      metadata: JSON.stringify({
        refundReason: charge.refund_reason,
      }),
    },
  });

  console.log(`Pagamento ${payment.id} reembolsado`);
}

/**
 * Mapear método de pagamento do Stripe
 */
function getPaymentMethod(stripeMethod: string): string {
  const methodMap: Record<string, string> = {
    card: "CREDIT_CARD",
    pix: "PIX",
    boleto: "BOLETO",
  };

  return methodMap[stripeMethod] || "CREDIT_CARD";
}
