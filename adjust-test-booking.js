const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function adjustTestBooking() {
  try {
    // Calcular data exatamente 24h no futuro
    const now = new Date();
    const exactlyIn24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log(`⏰ Agora: ${now.toISOString()}`);
    console.log(`📅 24h no futuro: ${exactlyIn24Hours.toISOString()}`);

    // Buscar o último agendamento criado
    const booking = await prisma.booking.findFirst({
      where: {
        notes: 'Teste de lembrete automático',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!booking) {
      console.log('❌ Agendamento de teste não encontrado');
      return;
    }

    // Atualizar para 24h no futuro
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        date: exactlyIn24Hours,
        reminderSent: false,
      },
    });

    console.log('✅ Agendamento ajustado!');
    console.log({
      id: updated.id,
      dataOriginal: booking.date,
      dataNova: updated.date,
      horasNoFuturo: ((updated.date.getTime() - now.getTime()) / (1000 * 60 * 60)).toFixed(1),
    });

    console.log('\n🧪 Execute o cron novamente:');
    console.log('curl -X POST http://localhost:3000/api/cron/send-reminders \\');
    console.log('  -H "Authorization: Bearer 25d4b84d53586901b947c705b755302a2ad3f97392f383ce9e738661fa1ca008"');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

adjustTestBooking();
