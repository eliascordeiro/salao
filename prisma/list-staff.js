const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Listando profissionais...\n");

  const staff = await prisma.staff.findMany({
    select: {
      id: true,
      name: true,
      specialty: true,
      active: true,
      workDays: true,
      workStart: true,
      workEnd: true,
      lunchStart: true,
      lunchEnd: true,
    },
  });

  console.log(`📊 Total de profissionais: ${staff.length}\n`);

  staff.forEach((member, index) => {
    console.log(`${index + 1}. ${member.name}`);
    console.log(`   ID: ${member.id}`);
    console.log(`   Especialidade: ${member.specialty || "N/A"}`);
    console.log(`   Status: ${member.active ? "✅ Ativo" : "❌ Inativo"}`);
    console.log(`   Dias de trabalho: ${member.workDays || "Não configurado"}`);
    console.log(`   Horário: ${member.workStart || "N/A"} - ${member.workEnd || "N/A"}`);
    if (member.lunchStart && member.lunchEnd) {
      console.log(`   Almoço: ${member.lunchStart} - ${member.lunchEnd}`);
    } else {
      console.log(`   Almoço: Não configurado`);
    }
    console.log();
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
