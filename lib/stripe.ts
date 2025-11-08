import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não está definida nas variáveis de ambiente");
}

// Inicializar Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-10-28.acacia",
  typescript: true,
});

/**
 * Criar sessão de checkout
 */
export async function createCheckoutSession({
  amount,
  bookingId,
  clientEmail,
  clientName,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  amount: number;
  bookingId: string;
  clientEmail: string;
  clientName: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Agendamento - AgendaSalão",
              description: `Pagamento do agendamento #${bookingId}`,
            },
            unit_amount: Math.round(amount * 100), // Converter para centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: clientEmail,
      client_reference_id: bookingId,
      metadata: {
        bookingId,
        clientName,
        ...metadata,
      },
      payment_intent_data: {
        metadata: {
          bookingId,
          clientName,
          ...metadata,
        },
      },
      locale: "pt-BR",
      billing_address_collection: "auto",
    });

    return { success: true, session };
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Recuperar sessão de checkout
 */
export async function retrieveCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return { success: true, session };
  } catch (error) {
    console.error("Erro ao recuperar sessão:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Recuperar Payment Intent
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { success: true, paymentIntent };
  } catch (error) {
    console.error("Erro ao recuperar payment intent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Criar reembolso
 */
export async function createRefund(paymentIntentId: string, amount?: number) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
    return { success: true, refund };
  } catch (error) {
    console.error("Erro ao criar reembolso:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Verificar assinatura do webhook
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET não está definida nas variáveis de ambiente"
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    return { success: true, event };
  } catch (error) {
    console.error("Erro ao verificar webhook:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Status de pagamento mapeados
 */
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;

/**
 * Métodos de pagamento
 */
export const PAYMENT_METHODS = {
  CREDIT_CARD: "CREDIT_CARD",
  DEBIT_CARD: "DEBIT_CARD",
  PIX: "PIX",
  BOLETO: "BOLETO",
} as const;
