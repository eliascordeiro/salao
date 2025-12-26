import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdminWhatsApp() {
  try {
    console.log("🔍 Verificando configuração WhatsApp para admin@agendasalao.com.br...\n");

    // 1. Buscar usuário admin
    const admin = await prisma.user.findUnique({
      where: { email: "admin@agendasalao.com.br" },
      include: {
        ownedSalons: {
          include: {
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!admin) {
      console.log("❌ Usuário admin@agendasalao.com.br não encontrado!");
      return;
    }

    console.log("👤 USUÁRIO");
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nome: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);

    if (admin.ownedSalons.length === 0) {
      console.log("\n❌ Admin não tem salões cadastrados!");
      return;
    }

    const salon = admin.ownedSalons[0];

    console.log("\n🏪 SALÃO");
    console.log(`   ID: ${salon.id}`);
    console.log(`   Nome: ${salon.name}`);
    console.log(`   Email: ${salon.email}`);
    console.log(`   Telefone: ${salon.phone}`);

    if (!salon.subscription) {
      console.log("\n❌ Salão NÃO tem assinatura ativa!");
      console.log("   Para ativar WhatsApp, é necessário ter assinatura PROFISSIONAL");
      return;
    }

    console.log("\n📋 ASSINATURA");
    console.log(`   ID: ${salon.subscription.id}`);
    console.log(`   Status: ${salon.subscription.status}`);
    console.log(`   Plano: ${salon.subscription.plan.name}`);
    console.log(`   Preço: R$ ${salon.subscription.plan.price}`);

    // Features do plano
    const features = salon.subscription.plan.features as Record<string, boolean>;
    console.log("\n✨ FEATURES DO PLANO:");
    console.log(`   WhatsApp: ${features.whatsapp ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   Email: ${features.email ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   Relatórios Avançados: ${features.advancedReports ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   Relatórios Financeiros: ${features.financialReports ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   Multi-usuário: ${features.multiUser ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   Chat IA: ${features.aiChat ? '✅ SIM' : '❌ NÃO'}`);

    // Verificar se assinatura está ativa
    if (salon.subscription.status !== "ACTIVE") {
      console.log("\n⚠️  ASSINATURA NÃO ESTÁ ATIVA!");
      console.log(`   Status atual: ${salon.subscription.status}`);
      console.log("   WhatsApp só funciona com status ACTIVE");
    }

    // Verificar feature WhatsApp
    if (!features.whatsapp) {
      console.log("\n❌ PLANO NÃO TEM WHATSAPP!");
      console.log("   Para ativar, faça upgrade para PROFISSIONAL");
    } else if (salon.subscription.status === "ACTIVE") {
      console.log("\n✅ WHATSAPP ATIVO! Configuração OK");
    }

    // Verificar variáveis de ambiente
    console.log("\n🔧 VARIÁVEIS DE AMBIENTE:");
    console.log(`   WHATSAPP_PHONE_NUMBER_ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log(`   WHATSAPP_ACCESS_TOKEN: ${process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);

    if (process.env.NODE_ENV === 'development') {
      console.log("\n⚠️  MODO DESENVOLVIMENTO:");
      console.log("   Todas as features liberadas automaticamente!");
      console.log("   Em produção, apenas features do plano serão permitidas.");
    }

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminWhatsApp();
