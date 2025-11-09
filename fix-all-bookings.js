const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixAllProblematicBookings() {
  console.log('\n🔧 CORREÇÃO EM MASSA DE AGENDAMENTOS PROBLEMÁTICOS\n');
  console.log('=' .repeat(70));
  
  // Buscar todos os agendamentos suspeitos (UTC < 10:00)
  const allBookings = await prisma.booking.findMany({
    include: {
      service: { select: { name: true } },
      staff: { select: { name: true } },
      client: { select: { name: true } }
    }
  });

  const problematic = allBookings.filter(b => {
    const hourUTC = b.date.getUTCHours();
    return hourUTC >= 0 && hourUTC <= 9;
  });

  if (problematic.length === 0) {
    console.log('\n✅ Nenhum agendamento problemático encontrado!\n');
    console.log('=' .repeat(70) + '\n');
    return;
  }

  console.log(`\n⚠️  Encontrados ${problematic.length} agendamentos com horário incorreto:\n`);

  // Mostrar lista antes de corrigir
  console.log('📋 AGENDAMENTOS QUE SERÃO CORRIGIDOS:');
  console.log('   ' + '-'.repeat(66));
  
  problematic.forEach((b, index) => {
    const date = b.date.toISOString().split('T')[0];
    const oldTime = `${b.date.getUTCHours().toString().padStart(2, '0')}:${b.date.getUTCMinutes().toString().padStart(2, '0')}`;
    const newDate = new Date(b.date.getTime() + (3 * 60 * 60 * 1000));
    const newTime = `${newDate.getUTCHours().toString().padStart(2, '0')}:${newDate.getUTCMinutes().toString().padStart(2, '0')}`;
    
    console.log(`   ${index + 1}. ${date} - ${b.client.name}`);
    console.log(`      ${oldTime} UTC → ${newTime} UTC (+3 horas)`);
  });
  
  console.log('   ' + '-'.repeat(66));

  // Confirmar (em produção, adicionar prompt aqui)
  console.log('\n⏳ Aplicando correções...\n');

  let corrected = 0;
  let errors = 0;

  for (const booking of problematic) {
    try {
      const correctDate = new Date(booking.date.getTime() + (3 * 60 * 60 * 1000));
      
      await prisma.booking.update({
        where: { id: booking.id },
        data: { date: correctDate }
      });

      const oldTime = `${booking.date.getUTCHours().toString().padStart(2, '0')}:${booking.date.getUTCMinutes().toString().padStart(2, '0')}`;
      const newTime = `${correctDate.getUTCHours().toString().padStart(2, '0')}:${correctDate.getUTCMinutes().toString().padStart(2, '0')}`;
      
      console.log(`   ✅ ${booking.id.substring(0, 12)}... | ${oldTime} → ${newTime}`);
      corrected++;
    } catch (error) {
      console.log(`   ❌ ${booking.id.substring(0, 12)}... | ERRO: ${error.message}`);
      errors++;
    }
  }

  console.log('\n' + '=' .repeat(70));
  console.log('\n📊 RESULTADO DA CORREÇÃO:');
  console.log(`   ✅ Corrigidos: ${corrected}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   📦 Total processados: ${problematic.length}`);
  
  if (corrected > 0) {
    console.log('\n🎉 Correção concluída! Os horários agora serão exibidos corretamente.');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Testar a interface "Meus Agendamentos"');
    console.log('   2. Verificar se os horários estão corretos');
    console.log('   3. Criar novos agendamentos e validar\n');
  }

  console.log('=' .repeat(70) + '\n');
}

fixAllProblematicBookings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
