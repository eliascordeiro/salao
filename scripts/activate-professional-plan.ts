import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function activateProfessionalPlan() {
  try {
    console.log("🚀 Ativando plano PROFISSIONAL para admin@agendasalao.com.br...\n");

    // 1. Buscar admin e salão
    const admin = await prisma.user.findUnique({
      where: { email: "admin@agendasalao.com.br" },
      include: {
        ownedSalons: true,
      },
    });

    if (!admin || admin.ownedSalons.length === 0) {
      console.log("❌ Admin ou salão não encontrado!");
      return;
    }

    const salon = admin.ownedSalons[0];
    console.log(`✅ Salão encontrado: ${salon.name} (${salon.id})\n`);

    // 2. Buscar ou criar plano PROFISSIONAL
    let professionalPlan = await prisma.plan.findFirst({
      where: { name: "Profissional" },
    });

    if (!professionalPlan) {
      console.log("📋 Criando plano PROFISSIONAL...");
      professionalPlan = await prisma.plan.create({
        data: {
          name: "Profissional",
          description: "Plano completo com todas as funcionalidades",
          price: 149.00,
          billingCycle: "MONTHLY",
          features: {
            email: true,
            whatsapp: true,
            sms: false,
            maps: true,
            geolocation: true,
            basicReports: true,
            advancedReports: true,
            financialReports: true,
            multiUser: true,
            userPermissions: true,
            aiChat: true,
            customBranding: false,
            apiAccess: false,
            prioritySupport: true,
          },
          stripeProductId: null,
          stripePriceId: null,
        },
      });
      console.log(`✅ Plano criado: ${professionalPlan.id}\n`);
    } else {
      console.log(`✅ Plano PROFISSIONAL encontrado: ${professionalPlan.id}\n`);
    }

    // 3. Verificar se já existe assinatura
    const existingSubscription = await prisma.subscription.findFirst({
      where: { salonId: salon.id },
    });

    if (existingSubscription) {
      console.log("♻️  Atualizando assinatura existente...");
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          planId: professionalPlan.id,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      });
      console.log("✅ Assinatura atualizada!\n");
    } else {
      console.log("📝 Criando nova assinatura...");
      await prisma.subscription.create({
        data: {
          salonId: salon.id,
          planId: professionalPlan.id,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          paymentMethod: "pix",
        },
      });
      console.log("✅ Assinatura criada!\n");
    }

    // 4. Verificar resultado
    const updatedSalon = await prisma.salon.findUnique({
      where: { id: salon.id },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (updatedSalon?.subscription) {
      console.log("✅ ASSINATURA ATIVA!");
      console.log(`   Plano: ${updatedSalon.subscription.plan.name}`);
      console.log(`   Status: ${updatedSalon.subscription.status}`);
      console.log(`   Válida até: ${updatedSalon.subscription.endDate?.toLocaleDateString('pt-BR') || 'N/A'}`);
      console.log(`   Próximo pagamento: ${updatedSalon.subscription.nextBillingDate?.toLocaleDateString('pt-BR') || 'N/A'}`);
      
      const features = updatedSalon.subscription.plan.features as Record<string, boolean>;
      console.log("\n✨ FEATURES ATIVADAS:");
      console.log(`   ✅ WhatsApp: ${features.whatsapp ? 'SIM' : 'NÃO'}`);
      console.log(`   ✅ Email: ${features.email ? 'SIM' : 'NÃO'}`);
      console.log(`   ✅ Relatórios Avançados: ${features.advancedReports ? 'SIM' : 'NÃO'}`);
      console.log(`   ✅ Relatórios Financeiros: ${features.financialReports ? 'SIM' : 'NÃO'}`);
      console.log(`   ✅ Multi-usuário: ${features.multiUser ? 'SIM' : 'NÃO'}`);
      console.log(`   ✅ Chat IA: ${features.aiChat ? 'SIM' : 'NÃO'}`);
    }

    console.log("\n🎉 Plano PROFISSIONAL ativado com sucesso!");
    console.log("   Agora o WhatsApp está disponível para notificações.");

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

activateProfessionalPlan();
