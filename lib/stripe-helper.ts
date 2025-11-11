// Helper functions para integração com Stripe Billing
import Stripe from "stripe";
import { prisma } from "./prisma";

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

/**
 * Cria um Customer no Stripe e atualiza a subscription
 */
export async function createStripeCustomer(
  salonId: string,
  email: string,
  name: string
) {
  try {
    // Criar customer no Stripe
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        salonId,
      },
    });

    console.log(`✅ Stripe Customer criado: ${customer.id}`);

    // Atualizar subscription com o Customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { salonId },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { salonId },
        data: {
          stripeCustomerId: customer.id,
        },
      });
      console.log(`✅ Subscription atualizada com Customer ID`);
    }

    return customer;
  } catch (error) {
    console.error("❌ Erro ao criar Stripe Customer:", error);
    throw error;
  }
}

/**
 * Cria uma Subscription no Stripe com trial de 30 dias
 */
export async function createStripeSubscription(
  customerId: string,
  salonId: string,
  priceId: string
) {
  try {
    // Criar subscription no Stripe com trial
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: 30,
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      metadata: {
        salonId,
      },
    });

    console.log(`✅ Stripe Subscription criada: ${subscription.id}`);

    // Atualizar subscription no banco com Stripe Subscription ID
    await prisma.subscription.update({
      where: { salonId },
      data: {
        stripeSubscriptionId: subscription.id,
        status: "trialing",
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      },
    });

    console.log(`✅ Subscription no banco atualizada com Stripe Subscription ID`);

    return subscription;
  } catch (error) {
    console.error("❌ Erro ao criar Stripe Subscription:", error);
    throw error;
  }
}

/**
 * Cancela uma subscription no Stripe
 */
export async function cancelStripeSubscription(stripeSubscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(stripeSubscriptionId);
    console.log(`✅ Stripe Subscription cancelada: ${subscription.id}`);
    return subscription;
  } catch (error) {
    console.error("❌ Erro ao cancelar Stripe Subscription:", error);
    throw error;
  }
}

/**
 * Atualiza o plano de uma subscription no Stripe
 */
export async function updateStripeSubscriptionPlan(
  stripeSubscriptionId: string,
  newPriceId: string
) {
  try {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    
    const updatedSubscription = await stripe.subscriptions.update(
      stripeSubscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
      }
    );

    console.log(`✅ Plano atualizado: ${updatedSubscription.id}`);
    return updatedSubscription;
  } catch (error) {
    console.error("❌ Erro ao atualizar plano:", error);
    throw error;
  }
}

/**
 * Cria uma sessão do Billing Portal para o cliente gerenciar sua assinatura
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log(`✅ Billing Portal Session criada: ${session.id}`);
    return session;
  } catch (error) {
    console.error("❌ Erro ao criar Billing Portal Session:", error);
    throw error;
  }
}

/**
 * Busca informações de uma invoice no Stripe
 */
export async function getStripeInvoice(invoiceId: string) {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return invoice;
  } catch (error) {
    console.error("❌ Erro ao buscar invoice no Stripe:", error);
    throw error;
  }
}

/**
 * Busca informações de uma subscription no Stripe
 */
export async function getStripeSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error("❌ Erro ao buscar subscription no Stripe:", error);
    throw error;
  }
}

/**
 * Aplica cupom de 100% desconto para salões com faturamento < R$ 1.000
 * @param stripeSubscriptionId - ID da subscription no Stripe
 * @param couponId - ID do cupom (ex: "FREE_UNDER_1000")
 */
export async function applyStripeCoupon(
  stripeSubscriptionId: string,
  couponId: string
) {
  try {
    const subscription = await stripe.subscriptions.update(
      stripeSubscriptionId,
      {
        discounts: [{ coupon: couponId }],
      }
    );

    return subscription;
  } catch (error) {
    console.error("Erro ao aplicar cupom:", error);
    throw new Error(`Falha ao aplicar cupom: ${error}`);
  }
}

/**
 * Remove cupom de desconto
 * @param stripeSubscriptionId - ID da subscription no Stripe
 */
export async function removeStripeCoupon(stripeSubscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(
      stripeSubscriptionId,
      {
        discounts: [],
      }
    );

    return subscription;
  } catch (error) {
    console.error("Erro ao remover cupom:", error);
    throw new Error(`Falha ao remover cupom: ${error}`);
  }
}

/**
 * Sincroniza subscription do Stripe com o banco de dados
 */
export async function syncStripeSubscription(stripeSubscriptionId: string) {
  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    
    // Buscar subscription no banco
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
    });

    if (!dbSubscription) {
      throw new Error("Subscription não encontrada no banco");
    }

    // Atualizar dados no banco
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: stripeSubscription.status,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : null,
      },
    });

    console.log(`✅ Subscription sincronizada: ${stripeSubscriptionId}`);
    return stripeSubscription;
  } catch (error) {
    console.error("❌ Erro ao sincronizar subscription:", error);
    throw error;
  }
}

/**
 * Cria uma invoice no Stripe (para cobrança manual se necessário)
 */
export async function createStripeInvoice(customerId: string, amount: number) {
  try {
    // Criar invoice item
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(amount * 100), // Converter para centavos
      currency: "brl",
      description: "Assinatura Plataforma de Agendamento",
    });

    // Criar e finalizar invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true,
    });

    await stripe.invoices.finalizeInvoice(invoice.id);

    console.log(`✅ Invoice criada: ${invoice.id}`);
    return invoice;
  } catch (error) {
    console.error("❌ Erro ao criar invoice:", error);
    throw error;
  }
}

// Exportar instância do Stripe para uso direto se necessário
export { stripe };
