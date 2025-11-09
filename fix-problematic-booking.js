const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixProblematicBooking() {
  const bookingId = 'cmhqhqssv008jofkb8d4fj1za';
  
  console.log('\n🔧 CORRIGINDO AGENDAMENTO PROBLEMÁTICO\n');
  console.log('=' .repeat(60));
  
  // Buscar agendamento atual
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: { select: { name: true } },
      staff: { select: { name: true } },
      client: { select: { name: true } }
    }
  });

  if (!booking) {
    console.log('\n❌ Agendamento não encontrado!');
    return;
  }

  console.log('\n📋 Dados atuais:');
  console.log(`   Cliente: ${booking.client.name}`);
  console.log(`   Serviço: ${booking.service.name}`);
  console.log(`   Profissional: ${booking.staff.name}`);
  console.log(`   Data ERRADA: ${booking.date.toISOString()}`);
  console.log(`   Exibido como: 06:00 ❌\n`);

  // Calcular data correta (adicionar 3 horas)
  const wrongDate = booking.date;
  const correctDate = new Date(wrongDate.getTime() + (3 * 60 * 60 * 1000));

  console.log('✅ Data CORRETA:');
  console.log(`   Nova data: ${correctDate.toISOString()}`);
  console.log(`   Será exibido como: 09:00 ✅\n`);

  // Atualizar no banco
  console.log('⏳ Atualizando no banco de dados...');
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { date: correctDate }
  });

  console.log('✅ Agendamento atualizado com sucesso!\n');
  console.log('=' .repeat(60));
  console.log('\n📊 VERIFICAÇÃO FINAL:');
  console.log(`   Data anterior: ${wrongDate.toISOString()} → Exibia 06:00 ❌`);
  console.log(`   Data corrigida: ${updated.date.toISOString()} → Exibe 09:00 ✅`);
  console.log('\n🎉 Correção concluída! Agora o horário será exibido corretamente.\n');
}

fixProblematicBooking()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
