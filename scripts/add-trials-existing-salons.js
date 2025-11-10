// Script para adicionar trial a salões existentes que não têm subscription
// Rode com: node scripts/add-trials-existing-salons.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando salões sem subscription...');

  // Buscar todos os salões
  const salons = await prisma.salon.findMany({
    include: {
      subscription: true,
    },
  });

  console.log(`📊 Total de salões: ${salons.length}`);

  // Buscar plano Free
  const freePlan = await prisma.plan.findUnique({
    where: { name: 'Free' },
  });

  if (!freePlan) {
    throw new Error('❌ Plano Free não encontrado. Execute seed-plans.js primeiro.');
  }

  let created = 0;
  let skipped = 0;

  for (const salon of salons) {
    if (salon.subscription) {
      console.log(`⏭️  Salão "${salon.name}" já tem subscription. Pulando...`);
      skipped++;
      continue;
    }

    const now = new Date();
    const trialEnds = new Date(now);
    trialEnds.setDate(trialEnds.getDate() + 30);

    await prisma.subscription.create({
      data: {
        salonId: salon.id,
        planId: freePlan.id,
        status: 'trialing',
        stripeCustomerId: `temp_${salon.id}`,
        trialStartedAt: now,
        trialEndsAt: trialEnds,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnds,
      },
    });

    console.log(`✅ Trial criado para "${salon.name}" - expira em ${trialEnds.toLocaleDateString()}`);
    created++;
  }

  console.log(`
🎉 Processo concluído!

📊 Resumo:
- ✅ Subscriptions criadas: ${created}
- ⏭️  Salões já com subscription: ${skipped}
- 📅 Trial: 30 dias a partir de hoje
- 📋 Plano: ${freePlan.name} (R$ ${freePlan.price.toFixed(2)}/mês)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao adicionar trials:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
