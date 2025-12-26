import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addAdminPhone() {
  try {
    console.log("📱 Adicionando telefone para admin@agendasalao.com.br...\n");

    const phone = "5541988318343"; // Mesmo número do WhatsApp configurado

    const admin = await prisma.user.update({
      where: { email: "admin@agendasalao.com.br" },
      data: {
        phone: phone,
      },
    });

    console.log("✅ Telefone adicionado com sucesso!");
    console.log(`   Usuário: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Telefone: ${admin.phone}`);
    console.log("\n🎉 Agora o admin pode receber notificações WhatsApp!");

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addAdminPhone();
