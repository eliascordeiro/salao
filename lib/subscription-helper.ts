// Helper functions para gerenciar subscriptions e trials
import { prisma } from "./prisma";
import { addDays, differenceInDays, isAfter, isBefore } from "date-fns";

/**
 * Cria uma subscription para um salão novo (trial de 30 dias)
 */
export async function createTrialSubscription(salonId: string) {
  // Buscar plano Free
  const freePlan = await prisma.plan.findUnique({
    where: { name: "Free" },
  });

  if (!freePlan) {
    throw new Error("Plano Free não encontrado. Execute o seed primeiro.");
  }

  const now = new Date();
  const trialEnds = addDays(now, 30);

  // Criar subscription com trial de 30 dias
  const subscription = await prisma.subscription.create({
    data: {
      salonId,
      planId: freePlan.id,
      status: "trialing",
      stripeCustomerId: `temp_${salonId}`, // Será atualizado quando criar no Stripe
      trialStartedAt: now,
      trialEndsAt: trialEnds,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnds,
    },
  });

  console.log(`✅ Trial criado para salão ${salonId} - expira em ${trialEnds.toLocaleDateString()}`);
  
  return subscription;
}

/**
 * Verifica se uma subscription está em trial
 */
export function isInTrial(subscription: {
  status: string;
  trialEndsAt: Date | null;
}): boolean {
  if (subscription.status !== "trialing") return false;
  if (!subscription.trialEndsAt) return false;
  
  return isAfter(subscription.trialEndsAt, new Date());
}

/**
 * Calcula quantos dias restam do trial
 */
export function getDaysLeftInTrial(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  
  const daysLeft = differenceInDays(trialEndsAt, new Date());
  return Math.max(0, daysLeft);
}

/**
 * Verifica se o trial está acabando (menos de 3 dias)
 */
export function isTrialEnding(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  
  const daysLeft = getDaysLeftInTrial(trialEndsAt);
  return daysLeft > 0 && daysLeft <= 3;
}

/**
 * Verifica se o trial já expirou
 */
export function isTrialExpired(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  
  return isBefore(trialEndsAt, new Date());
}

/**
 * Busca subscription de um salão com informações do plano
 */
export async function getSalonSubscription(salonId: string) {
  return prisma.subscription.findUnique({
    where: { salonId },
    include: {
      plan: true,
      salon: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Atualiza status da subscription após trial expirar
 */
export async function handleTrialExpired(subscriptionId: string) {
  // Quando trial expira, verifica receita do mês
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { salon: true },
  });

  if (!subscription) {
    throw new Error("Subscription não encontrada");
  }

  // Calcular receita do mês (será implementado na Fase 4)
  // Por enquanto, apenas muda status para active
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "active",
    },
  });

  console.log(`✅ Trial expirado para subscription ${subscriptionId} - agora ativo`);
}

/**
 * Formata informações do trial para exibição
 */
export function formatTrialInfo(subscription: {
  status: string;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
}) {
  if (!subscription.trialEndsAt) {
    return {
      isActive: false,
      daysLeft: 0,
      percentage: 0,
      isEnding: false,
      isExpired: true,
    };
  }

  const daysLeft = getDaysLeftInTrial(subscription.trialEndsAt);
  const totalDays = 30;
  const percentage = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));

  return {
    isActive: isInTrial(subscription),
    daysLeft,
    percentage,
    isEnding: isTrialEnding(subscription.trialEndsAt),
    isExpired: isTrialExpired(subscription.trialEndsAt),
    endsAt: subscription.trialEndsAt,
  };
}
