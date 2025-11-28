const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('💳 Criando/Atualizando planos de assinatura...\n');

  // Verificar planos existentes
  const existingPlans = await prisma.plan.findMany();
  console.log(`📋 Planos encontrados: ${existingPlans.length}`);
  
  if (existingPlans.length > 0) {
    console.log('Planos existentes:');
    existingPlans.forEach(p => {
      console.log(`  - ${p.name} (${p.slug}): R$ ${p.price}`);
    });
    console.log('');
  }

  // Criar ou atualizar Essencial
  const essencial = await prisma.plan.upsert({
    where: { slug: 'essencial' },
    update: {
      name: 'Essencial',
      description: 'Perfeito para salões pequenos que estão começando',
      price: 49.00,
      maxStaff: 2,
      maxUsers: 1,
      features: [
        'Até 2 profissionais',
        'Agendamentos ilimitados',
        'Catálogo de serviços',
        'Calendário e horários',
        'Notificações por email',
        '14 dias grátis'
      ],
      active: true,
    },
    create: {
      name: 'Essencial',
      slug: 'essencial',
      description: 'Perfeito para salões pequenos que estão começando',
      price: 49.00,
      maxStaff: 2,
      maxUsers: 1,
      features: [
        'Até 2 profissionais',
        'Agendamentos ilimitados',
        'Catálogo de serviços',
        'Calendário e horários',
        'Notificações por email',
        '14 dias grátis'
      ],
      active: true,
    },
  });

  console.log(`✅ Plano Essencial: ${essencial.id}`);

  // Criar ou atualizar Profissional
  const profissional = await prisma.plan.upsert({
    where: { slug: 'profissional' },
    update: {
      name: 'Profissional',
      description: 'Para salões que querem crescer e ter todos os recursos',
      price: 149.00,
      maxStaff: null,
      maxUsers: 5,
      features: [
        'Profissionais ilimitados',
        'Pagamentos online (Stripe)',
        'WhatsApp Business',
        'Relatórios financeiros',
        'Controle de despesas',
        'Multi-usuários (5 admins)',
        'Chat com IA',
        'Suporte prioritário',
        '14 dias grátis'
      ],
      active: true,
    },
    create: {
      name: 'Profissional',
      slug: 'profissional',
      description: 'Para salões que querem crescer e ter todos os recursos',
      price: 149.00,
      maxStaff: null,
      maxUsers: 5,
      features: [
        'Profissionais ilimitados',
        'Pagamentos online (Stripe)',
        'WhatsApp Business',
        'Relatórios financeiros',
        'Controle de despesas',
        'Multi-usuários (5 admins)',
        'Chat com IA',
        'Suporte prioritário',
        '14 dias grátis'
      ],
      active: true,
    },
  });

  console.log(`✅ Plano Profissional: ${profissional.id}`);

  // Desativar plano "Free" se existir
  const freePlan = await prisma.plan.findFirst({
    where: { 
      OR: [
        { slug: 'free' },
        { name: 'Free' }
      ]
    }
  });

  if (freePlan) {
    await prisma.plan.update({
      where: { id: freePlan.id },
      data: { active: false }
    });
    console.log(`⚠️  Plano Free desativado: ${freePlan.id}`);
  }

  console.log('\n✨ Planos criados/atualizados com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
