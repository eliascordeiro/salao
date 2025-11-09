const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkEliasSlots() {
  const staffId = 'cmhovyy2f0001ofuy71lwwwna';
  
  console.log("\n🔍 VERIFICANDO SLOTS RECORRENTES DO ELIAS\n");
  console.log("=".repeat(60));

  // Buscar slots por dia da semana
  for (let day = 0; day <= 6; day++) {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    
    const slots = await prisma.availability.findMany({
      where: {
        staffId,
        dayOfWeek: day,
        type: "RECURRING",
      },
      orderBy: { startTime: "asc" },
    });

    console.log(`\n${days[day]} (${day}): ${slots.length} slots`);
    
    if (day === 1 && slots.length > 0) {
      console.log("   Primeiros 5 slots:");
      slots.slice(0, 5).forEach(slot => {
        console.log(`      - ${slot.startTime} (disponível: ${slot.available})`);
      });
    }
  }

  console.log("\n" + "=".repeat(60));
  
  // Verificar se há slots de segunda
  const mondaySlots = await prisma.availability.findMany({
    where: {
      staffId,
      dayOfWeek: 1,
      type: "RECURRING",
    },
  });

  console.log("\n📊 DIAGNÓSTICO:");
  if (mondaySlots.length === 0) {
    console.log("   ❌ PROBLEMA: Não há slots recorrentes cadastrados para SEGUNDA-FEIRA");
    console.log("   Solução: Gerar slots recorrentes para segunda-feira");
  } else {
    console.log(`   ✅ Existem ${mondaySlots.length} slots para segunda-feira`);
    console.log("   Problema pode ser:");
    console.log("      1. Timezone na exibição");
    console.log("      2. Filtro na interface");
    console.log("      3. Data no passado");
  }
}

checkEliasSlots()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
