// Helper functions para cálculo de receita e lógica de cobrança condicional
import { prisma } from "./prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

/**
 * Calcula a receita total de um salão em um período específico
 */
export async function calculateSalonRevenue(
  salonId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await prisma.booking.aggregate({
    where: {
      salonId,
      status: "COMPLETED",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      totalPrice: true,
    },
  });

  return result._sum.totalPrice || 0;
}

/**
 * Calcula a receita do mês atual
 */
export async function getCurrentMonthRevenue(salonId: string): Promise<number> {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  return calculateSalonRevenue(salonId, start, end);
}

/**
 * Calcula a receita do mês anterior
 */
export async function getLastMonthRevenue(salonId: string): Promise<number> {
  const lastMonth = subMonths(new Date(), 1);
  const start = startOfMonth(lastMonth);
  const end = endOfMonth(lastMonth);

  return calculateSalonRevenue(salonId, start, end);
}

/**
 * Verifica se o salão deve ser cobrado baseado no threshold de R$ 1.000
 */
export function shouldChargeSalon(monthlyRevenue: number): boolean {
  const REVENUE_THRESHOLD = 1000; // R$ 1.000
  return monthlyRevenue > REVENUE_THRESHOLD;
}

/**
 * Calcula quanto deve ser cobrado do salão
 * Retorna R$ 39 se receita > R$ 1.000, caso contrário R$ 0
 */
export function calculateSubscriptionAmount(monthlyRevenue: number): number {
  const SUBSCRIPTION_PRICE = 39; // R$ 39/mês
  return shouldChargeSalon(monthlyRevenue) ? SUBSCRIPTION_PRICE : 0;
}

/**
 * Busca estatísticas de receita de um salão
 */
export async function getSalonRevenueStats(salonId: string) {
  const currentMonth = await getCurrentMonthRevenue(salonId);
  const lastMonth = await getLastMonthRevenue(salonId);
  
  const shouldCharge = shouldChargeSalon(currentMonth);
  const chargeAmount = calculateSubscriptionAmount(currentMonth);
  
  // Calcular crescimento
  const growth = lastMonth > 0 
    ? ((currentMonth - lastMonth) / lastMonth) * 100 
    : 0;

  // Calcular quanto falta para atingir o threshold
  const THRESHOLD = 1000;
  const remaining = Math.max(0, THRESHOLD - currentMonth);
  const percentageToThreshold = Math.min(100, (currentMonth / THRESHOLD) * 100);

  return {
    currentMonth,
    lastMonth,
    growth,
    shouldCharge,
    chargeAmount,
    threshold: THRESHOLD,
    remaining,
    percentageToThreshold,
    willBeFree: !shouldCharge,
  };
}

/**
 * Processa cobrança mensal de todos os salões
 * Esta função deve ser chamada por um cron job no final de cada mês
 */
export async function processMonthlyBilling() {
  console.log('🔄 Iniciando processamento de cobrança mensal...');

  // Buscar todas as subscriptions ativas ou em trial
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: {
        in: ['trialing', 'active'],
      },
    },
    include: {
      salon: true,
      plan: true,
    },
  });

  console.log(`📊 Total de subscriptions para processar: ${subscriptions.length}`);

  const results = {
    charged: 0,
    free: 0,
    errors: 0,
  };

  for (const subscription of subscriptions) {
    try {
      // Calcular receita do mês anterior (mês completo)
      const monthlyRevenue = await getLastMonthRevenue(subscription.salonId);
      const shouldCharge = shouldChargeSalon(monthlyRevenue);
      const amount = calculateSubscriptionAmount(monthlyRevenue);

      console.log(`
📍 Salão: ${subscription.salon.name}
💰 Receita do mês: R$ ${monthlyRevenue.toFixed(2)}
💳 Deve cobrar? ${shouldCharge ? 'SIM' : 'NÃO'}
💵 Valor: R$ ${amount.toFixed(2)}
      `);

      // Criar registro de invoice
      const now = new Date();
      const lastMonth = subMonths(now, 1);
      const periodStart = startOfMonth(lastMonth);
      const periodEnd = endOfMonth(lastMonth);

      await prisma.invoice.create({
        data: {
          subscriptionId: subscription.id,
          amount,
          status: shouldCharge ? 'open' : 'void',
          monthlyRevenue,
          wasCharged: shouldCharge,
          dueDate: now,
          periodStart,
          periodEnd,
        },
      });

      if (shouldCharge) {
        results.charged++;
        console.log(`✅ Cobrança a processar: R$ ${amount.toFixed(2)}`);
      } else {
        results.free++;
        console.log(`✅ Salão continua no plano gratuito (receita < R$ 1.000)`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar salão ${subscription.salon.name}:`, error);
      results.errors++;
    }
  }

  console.log(`
🎉 Processamento concluído!

📊 Resumo:
- 💳 Salões cobrados: ${results.charged}
- 🆓 Salões FREE: ${results.free}
- ❌ Erros: ${results.errors}
  `);

  return results;
}

/**
 * Formata informações de receita para exibição
 */
export function formatRevenueInfo(stats: {
  currentMonth: number;
  lastMonth: number;
  growth: number;
  shouldCharge: boolean;
  chargeAmount: number;
  threshold: number;
  remaining: number;
  percentageToThreshold: number;
  willBeFree: boolean;
}) {
  return {
    current: `R$ ${stats.currentMonth.toFixed(2)}`,
    last: `R$ ${stats.lastMonth.toFixed(2)}`,
    growth: `${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}%`,
    charge: `R$ ${stats.chargeAmount.toFixed(2)}`,
    threshold: `R$ ${stats.threshold.toFixed(2)}`,
    remaining: `R$ ${stats.remaining.toFixed(2)}`,
    percentage: `${stats.percentageToThreshold.toFixed(1)}%`,
    status: stats.willBeFree ? 'FREE' : 'PREMIUM',
    message: stats.willBeFree
      ? `Você ainda precisa de R$ ${stats.remaining.toFixed(2)} para atingir R$ 1.000`
      : `Sua receita passou de R$ 1.000! Cobrança: R$ ${stats.chargeAmount.toFixed(2)}/mês`,
  };
}
