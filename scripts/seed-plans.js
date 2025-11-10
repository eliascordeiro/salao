// Script para popular planos de assinatura
// Rode com: node scripts/seed-plans.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed dos planos...');

  // Plano Free (sem cobrança)
  const freePlan = await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {},
    create: {
      name: 'Free',
      description: 'Plano gratuito para salões com faturamento abaixo de R$ 1.000/mês',
      price: 0,
      features: [
        'Agendamentos ilimitados',
        'Gestão de profissionais',
        'Gestão de serviços',
        'Notificações por email',
        'Dashboard básico',
        'Suporte por email',
      ],
      isActive: true,
    },
  });

  console.log('✅ Plano Free criado:', freePlan);

  // Plano Premium (R$ 39/mês)
  const premiumPlan = await prisma.plan.upsert({
    where: { name: 'Premium' },
    update: {},
    create: {
      name: 'Premium',
      description: 'Plano premium para salões com faturamento acima de R$ 1.000/mês',
      price: 39.0,
      stripePriceId: process.env.STRIPE_PRICE_ID || null, // Será configurado depois
      features: [
        'Todos os recursos do Free',
        'Agendamentos ilimitados',
        'Gestão de profissionais',
        'Gestão de serviços',
        'Notificações por email',
        'Dashboard avançado com analytics',
        'Relatórios financeiros',
        'Suporte prioritário',
        'Sem limite de faturamento',
      ],
      isActive: true,
    },
  });

  console.log('✅ Plano Premium criado:', premiumPlan);

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log(`
📊 Planos criados:
- Free: R$ ${freePlan.price.toFixed(2)}/mês
- Premium: R$ ${premiumPlan.price.toFixed(2)}/mês

💡 Próximo passo: Configure STRIPE_PRICE_ID no .env
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao fazer seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
