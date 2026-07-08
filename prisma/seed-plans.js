const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Preço por cadeira (profissional) por mês, em reais.
const PRICE_PER_SEAT = 39.9;

async function main() {
  console.log("🎯 Configurando plano único Premium (por cadeira)...");

  // Desativar planos antigos (mantém histórico das assinaturas existentes)
  await prisma.plan.updateMany({
    where: { slug: { not: "premium" } },
    data: { active: false },
  });

  const featuresTodas = {
    email: true,
    whatsapp: true,
    sms: true,
    maps: true,
    geolocation: true,
    basicReports: true,
    advancedReports: true,
    financialReports: true,
    multiUser: true,
    userPermissions: true,
    aiChat: true,
    customBranding: true,
    apiAccess: true,
    prioritySupport: true,
  };

  const featuresList = [
    "Profissionais ilimitados (cobrança por cadeira)",
    "Todas as funcionalidades liberadas",
    "Pagamentos online",
    "WhatsApp Business integrado",
    "Relatórios financeiros avançados",
    "Multi-usuários com permissões",
    "Chat IA (assistente virtual)",
    "Suporte prioritário",
  ];

  const premium = await prisma.plan.upsert({
    where: { slug: "premium" },
    update: {
      name: "Premium",
      description:
        "Todas as funcionalidades liberadas. Cobrança por cadeira de profissional.",
      price: PRICE_PER_SEAT,
      maxStaff: null, // ilimitado
      maxUsers: 999,
      features: featuresTodas,
      featuresList,
      active: true,
    },
    create: {
      name: "Premium",
      slug: "premium",
      description:
        "Todas as funcionalidades liberadas. Cobrança por cadeira de profissional.",
      price: PRICE_PER_SEAT,
      maxStaff: null,
      maxUsers: 999,
      features: featuresTodas,
      featuresList,
      active: true,
    },
  });

  console.log("✅ Plano Premium configurado!");
  console.log(`   • ${premium.name} - R$ ${premium.price.toFixed(2)}/cadeira/mês`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao configurar plano:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
