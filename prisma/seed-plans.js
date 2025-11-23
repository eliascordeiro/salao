const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🎯 Criando planos de assinatura...");

  // Limpar planos existentes
  await prisma.plan.deleteMany({});

  // Plano Essencial
  const essencial = await prisma.plan.create({
    data: {
      name: "Essencial",
      slug: "essencial",
      description: "Ideal para salões pequenos e independentes que estão começando",
      price: 49.00,
      maxStaff: 2,
      maxUsers: 1,
      features: [
        "Até 2 profissionais",
        "Agendamentos ilimitados",
        "Catálogo de serviços",
        "Calendário e horários",
        "Perfil público do salão",
        "Notificações por email",
        "Suporte por email",
      ],
      active: true,
    },
  });

  // Plano Profissional
  const profissional = await prisma.plan.create({
    data: {
      name: "Profissional",
      slug: "profissional",
      description: "Para salões estabelecidos que querem crescer e escalar",
      price: 149.00,
      maxStaff: null, // ilimitado
      maxUsers: 5,
      features: [
        "Profissionais ilimitados",
        "Pagamentos online (Stripe)",
        "WhatsApp Business integrado",
        "Relatórios financeiros avançados",
        "Controle de despesas/receitas",
        "Multi-usuários (até 5)",
        "Permissões personalizadas",
        "Chat IA (assistente virtual)",
        "Suporte prioritário",
        "Analytics e insights",
      ],
      active: true,
    },
  });

  console.log("✅ Planos criados com sucesso!");
  console.log("\n📋 Planos disponíveis:");
  console.log(`   • ${essencial.name} - R$ ${essencial.price}/mês`);
  console.log(`   • ${profissional.name} - R$ ${profissional.price}/mês`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao criar planos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
