const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkProblematicBooking() {
  const bookingId = 'cmhqhqssv008jofkb8d4fj1za';
  
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: { select: { name: true } },
      staff: { select: { name: true } },
      client: { select: { name: true } }
    }
  });

  if (!booking) {
    console.log('❌ Agendamento não encontrado (pode ter sido deletado)');
    return;
  }
  
  console.log('\n📅 AGENDAMENTO PROBLEMÁTICO ENCONTRADO:\n');
  console.log('ID:', booking.id);
  console.log('Cliente:', booking.client.name);
  console.log('Serviço:', booking.service.name);
  console.log('Profissional:', booking.staff.name);
  console.log('Status:', booking.status);
  console.log('\n⚠️  Data ERRADA no banco:');
  console.log('   ', booking.date.toISOString());
  console.log('   Exibido como: 06:00 (09:00 UTC - 3h)');
  console.log('\n✅ Data CORRETA seria:');
  console.log('   2025-11-11T12:00:00.000Z');
  console.log('   Exibiria como: 09:00 (12:00 UTC - 3h)');
  console.log('\n🔧 Para corrigir este agendamento, executar:');
  console.log(`   node fix-problematic-booking.js\n`);
}

checkProblematicBooking()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
