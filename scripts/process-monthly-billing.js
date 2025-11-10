// Script para processar cobrança mensal automaticamente
// Este script deve ser executado por um cron job no último dia de cada mês
// Exemplo de cron: 0 23 28-31 * * [ $(date -d tomorrow +\%d) -eq 1 ] && node scripts/process-monthly-billing.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Importar funções helper (simulado para Node.js)
async function calculateLastMonthRevenue(salonId) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59);

  const result = await prisma.booking.aggregate({
    where: {
      salonId,
      status: 'COMPLETED',
      date: {
        gte: startOfLastMonth,
        lte: endOfLastMonth,
      },
    },
    _sum: {
      totalPrice: true,
    },
  });

  return result._sum.totalPrice || 0;
}

async function processMonthlyBilling() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 PROCESSAMENTO DE COBRANÇA MENSAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}\n`);

  // Buscar todas as subscriptions ativas ou em trial
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: {
        in: ['trialing', 'active'],
      },
    },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      plan: true,
    },
  });

  console.log(`📊 Total de subscriptions para processar: ${subscriptions.length}\n`);

  if (subscriptions.length === 0) {
    console.log('⚠️  Nenhuma subscription encontrada para processar.');
    return;
  }

  const results = {
    charged: [],
    free: [],
    errors: [],
  };

  for (const subscription of subscriptions) {
    try {
      console.log(`\n┌─────────────────────────────────────────────────────`);
      console.log(`│ 🏢 Salão: ${subscription.salon.name}`);
      console.log(`│ 📧 Email: ${subscription.salon.email || 'N/A'}`);
      console.log(`│ 📋 Plano Atual: ${subscription.plan.name}`);
      console.log(`├─────────────────────────────────────────────────────`);

      // Calcular receita do mês anterior
      const monthlyRevenue = await calculateLastMonthRevenue(subscription.salonId);
      const shouldCharge = monthlyRevenue > 1000;
      const amount = shouldCharge ? 39 : 0;

      console.log(`│ 💰 Receita do mês anterior: R$ ${monthlyRevenue.toFixed(2)}`);
      console.log(`│ 📊 Threshold: R$ 1.000,00`);
      console.log(`│ ${shouldCharge ? '💳' : '🆓'} Deve cobrar? ${shouldCharge ? 'SIM' : 'NÃO'}`);
      console.log(`│ 💵 Valor: R$ ${amount.toFixed(2)}`);

      // Criar registro de invoice
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const periodStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const periodEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59);

      const invoice = await prisma.invoice.create({
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
        console.log(`│ ✅ Invoice criada: ${invoice.id}`);
        console.log(`│ 📈 Excedeu em: R$ ${(monthlyRevenue - 1000).toFixed(2)}`);
        results.charged.push({
          salon: subscription.salon.name,
          revenue: monthlyRevenue,
          amount,
        });
        // Aqui será integrado com Stripe Billing na Fase 5
        // await createStripeInvoice(subscription, amount);
      } else {
        console.log(`│ ✅ Invoice registrada (FREE)`);
        console.log(`│ 📉 Faltam: R$ ${(1000 - monthlyRevenue).toFixed(2)}`);
        results.free.push({
          salon: subscription.salon.name,
          revenue: monthlyRevenue,
        });
      }

      console.log(`└─────────────────────────────────────────────────────`);
    } catch (error) {
      console.error(`\n❌ Erro ao processar salão ${subscription.salon.name}:`);
      console.error(error);
      results.errors.push({
        salon: subscription.salon.name,
        error: error.message,
      });
    }
  }

  // Resumo final
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO DO PROCESSAMENTO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`💳 SALÕES COBRADOS (${results.charged.length}):`);
  if (results.charged.length > 0) {
    results.charged.forEach((item) => {
      console.log(`   • ${item.salon}: R$ ${item.amount.toFixed(2)} (receita: R$ ${item.revenue.toFixed(2)})`);
    });
  } else {
    console.log('   Nenhum salão cobrado.');
  }

  console.log(`\n🆓 SALÕES FREE (${results.free.length}):`);
  if (results.free.length > 0) {
    results.free.forEach((item) => {
      console.log(`   • ${item.salon}: R$ 0.00 (receita: R$ ${item.revenue.toFixed(2)})`);
    });
  } else {
    console.log('   Nenhum salão no plano FREE.');
  }

  if (results.errors.length > 0) {
    console.log(`\n❌ ERROS (${results.errors.length}):`);
    results.errors.forEach((item) => {
      console.log(`   • ${item.salon}: ${item.error}`);
    });
  }

  const totalRevenue = [...results.charged, ...results.free].reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`💰 RECEITA TOTAL DA PLATAFORMA: R$ ${totalRevenue.toFixed(2)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('✅ Processamento concluído!');
  console.log('📧 Próximo passo: Enviar emails de notificação (Fase 5)\n');

  return results;
}

// Executar
processMonthlyBilling()
  .catch((e) => {
    console.error('\n❌ ERRO FATAL:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
