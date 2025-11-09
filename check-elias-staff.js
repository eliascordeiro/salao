const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkElias() {
  const staff = await prisma.staff.findFirst({
    where: { name: "Elias Cordeiro" },
    include: { 
      salon: { select: { name: true, email: true } },
      services: {
        include: {
          service: { select: { name: true, duration: true } }
        }
      }
    }
  });

  if (!staff) {
    console.log("❌ Profissional não encontrado");
    return;
  }

  console.log("\n📋 PROFISSIONAL: " + staff.name);
  console.log("   ID:", staff.id);
  console.log("   Salão:", staff.salon.name, "(" + staff.salon.email + ")");
  console.log("   Ativo:", staff.active);
  console.log("   Dias de trabalho:", staff.workDays);
  console.log("   Horário:", staff.workStart, "-", staff.workEnd);
  console.log("   Almoço:", staff.lunchStart || "não configurado", "-", staff.lunchEnd || "não configurado");
  console.log("");

  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  console.log("   workDays decodificado:");
  if (staff.workDays) {
    const workDaysArray = staff.workDays.split(",");
    workDaysArray.forEach((d) => {
      const dayIndex = parseInt(d);
      console.log("      -", days[dayIndex], `(${dayIndex})`);
    });
    console.log("");
    console.log("   Segunda-feira está incluída?", workDaysArray.includes("1") ? "✅ SIM" : "❌ NÃO");
  } else {
    console.log("      ⚠️  workDays está NULL");
  }

  console.log("\n   Serviços associados:");
  staff.services.forEach(s => {
    console.log(`      - ${s.service.name} (${s.service.duration} min)`);
  });
}

checkElias()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
