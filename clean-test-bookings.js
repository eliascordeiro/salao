const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanTestBookings() {
  const staffId = "cmhpfkxk10001ofyrulo7v169";

  console.log("\n🧹 LIMPANDO AGENDAMENTOS DE TESTE\n");
  console.log("=".repeat(70));

  const bookings = await prisma.booking.findMany({
    where: { staffId },
    include: {
      client: { select: { name: true } },
      service: { select: { name: true } },
    },
  });

  console.log(`\n📅 Total de agendamentos: ${bookings.length}\n`);

  if (bookings.length === 0) {
    console.log("✅ Nenhum agendamento para limpar\n");
    return;
  }

  console.log("⚠️  ATENÇÃO: Este script irá deletar TODOS os agendamentos de teste!");
  console.log("\nAgendamentos que serão deletados:\n");

  bookings.forEach((b, i) => {
    const date = new Date(b.date);
    const dateStr = date.toISOString().split("T")[0];
    const time = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });

    console.log(`   ${i + 1}. ${dateStr} às ${time} - ${b.client.name}`);
  });

  console.log("\n" + "=".repeat(70));
  console.log("\n🗑️  Deletando agendamentos...\n");

  const deleted = await prisma.booking.deleteMany({
    where: { staffId },
  });

  console.log(`✅ ${deleted.count} agendamento(s) deletado(s)\n`);
  console.log("💡 Agora todos os slots estarão disponíveis novamente!");
  console.log("   Você pode testar criando um novo agendamento.\n");
}

cleanTestBookings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
