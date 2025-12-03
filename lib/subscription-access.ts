import { prisma } from "@/lib/prisma";

/**
 * Verifica se o salão tem assinatura ativa
 * Usado no middleware ou em páginas protegidas
 */
export async function checkSubscriptionAccess(salonId: string): Promise<{
  hasAccess: boolean;
  subscription: any | null;
  reason?: string;
}> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { salonId },
      include: { plan: true },
    });

    // Sem assinatura = sem acesso (exceto durante trial)
    if (!subscription) {
      return {
        hasAccess: false,
        subscription: null,
        reason: "Nenhuma assinatura encontrada",
      };
    }

    // Assinatura cancelada = sem acesso
    if (subscription.status === 'CANCELED') {
      return {
        hasAccess: false,
        subscription,
        reason: "Assinatura cancelada",
      };
    }

    // Assinatura suspensa = sem acesso
    if (subscription.status === 'SUSPENDED') {
      return {
        hasAccess: false,
        subscription,
        reason: "Assinatura suspensa por falha no pagamento",
      };
    }

    // Trial expirado sem pagamento = sem acesso
    if (subscription.trialEndsAt && new Date() > subscription.trialEndsAt) {
      if (subscription.status === 'PENDING') {
        return {
          hasAccess: false,
          subscription,
          reason: "Período de teste expirado. Por favor, ative sua assinatura.",
        };
      }
    }

    // Assinatura ativa ou trial válido = acesso liberado
    return {
      hasAccess: true,
      subscription,
    };

  } catch (error) {
    console.error("Erro ao verificar assinatura:", error);
    return {
      hasAccess: false,
      subscription: null,
      reason: "Erro ao verificar assinatura",
    };
  }
}

/**
 * Verifica se o salão pode usar uma feature específica
 */
export async function checkFeatureAccess(
  salonId: string,
  feature: string
): Promise<boolean> {
  try {
    const { hasAccess, subscription } = await checkSubscriptionAccess(salonId);

    if (!hasAccess || !subscription) {
      return false;
    }

    // Verificar se o plano inclui a feature
    return subscription.plan.features.includes(feature);

  } catch (error) {
    console.error("Erro ao verificar feature:", error);
    return false;
  }
}

/**
 * Retorna lista de features bloqueadas
 */
export async function getBlockedFeatures(salonId: string): Promise<string[]> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { salonId },
      include: { plan: true },
    });

    if (!subscription) {
      return ["payments", "whatsapp", "reports", "expenses", "multi_users"];
    }

    // Features premium não incluídas no plano
    const allFeatures = ["payments", "whatsapp", "reports", "expenses", "multi_users"];
    const planFeatures = subscription.plan.features;

    return allFeatures.filter(f => !planFeatures.includes(f));

  } catch (error) {
    console.error("Erro ao buscar features bloqueadas:", error);
    return [];
  }
}
