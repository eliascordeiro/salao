const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function findAllProblematicBookings() {
  console.log('\n🔍 BUSCANDO TODOS OS AGENDAMENTOS PROBLEMÁTICOS\n');
  console.log('=' .repeat(70));
  
  // Buscar todos os agendamentos
  const allBookings = await prisma.booking.findMany({
    include: {
      service: { select: { name: true } },
      staff: { select: { name: true } },
      client: { select: { name: true } }
    },
    orderBy: { date: 'asc' }
  });

  console.log(`\n📊 Total de agendamentos no banco: ${allBookings.length}\n`);

  // Analisar cada agendamento
  const problematic = [];
  const correct = [];

  for (const booking of allBookings) {
    const dateUTC = booking.date;
    const hourUTC = dateUTC.getUTCHours();
    
    // Horários problemáticos: UTC entre 00:00 e 20:59 (que ao subtrair 3h ficam negativos ou muito baixos)
    // Horários corretos: UTC entre 03:00 e 23:59 (representando horários locais de 00:00 a 20:59)
    
    // Verificar se o horário UTC é "suspeito" (pode estar sem o offset)
    // Agendamentos típicos: 07:00 a 20:00 local = 10:00 a 23:00 UTC
    // Se está entre 00:00 e 09:59 UTC, provavelmente está errado
    
    const isSuspect = hourUTC >= 0 && hourUTC <= 9;
    
    if (isSuspect) {
      problematic.push({
        ...booking,
        displayTime: `${dateUTC.getUTCHours().toString().padStart(2, '0')}:${dateUTC.getUTCMinutes().toString().padStart(2, '0')}`
      });
    } else {
      correct.push(booking);
    }
  }

  console.log('✅ Agendamentos CORRETOS (UTC >= 10:00):');
  console.log(`   Total: ${correct.length}\n`);
  
  if (correct.length > 0) {
    console.log('   Exemplos:');
    correct.slice(0, 3).forEach(b => {
      const h = b.date.getUTCHours().toString().padStart(2, '0');
      const m = b.date.getUTCMinutes().toString().padStart(2, '0');
      console.log(`   - ${b.date.toISOString().split('T')[0]} ${h}:${m} UTC → Exibe ${(parseInt(h) - 3).toString().padStart(2, '0')}:${m} local`);
    });
    console.log('');
  }

  console.log('⚠️  Agendamentos SUSPEITOS (UTC < 10:00):');
  console.log(`   Total: ${problematic.length}\n`);

  if (problematic.length > 0) {
    console.log('   Lista detalhada:');
    console.log('   ' + '-'.repeat(66));
    console.log('   | ID                       | Data         | UTC  | Exibe | Cliente');
    console.log('   ' + '-'.repeat(66));
    
    problematic.forEach(b => {
      const date = b.date.toISOString().split('T')[0];
      const utcTime = b.displayTime;
      const localHour = b.date.getUTCHours() - 3;
      const displayTime = localHour < 0 
        ? `${(24 + localHour).toString().padStart(2, '0')}:${b.date.getUTCMinutes().toString().padStart(2, '0')}`
        : `${localHour.toString().padStart(2, '0')}:${b.date.getUTCMinutes().toString().padStart(2, '0')}`;
      
      console.log(`   | ${b.id.substring(0, 24)} | ${date} | ${utcTime} | ${displayTime} | ${b.client.name.substring(0, 15)}`);
    });
    console.log('   ' + '-'.repeat(66));
    console.log('\n   ⚠️  ATENÇÃO: Estes agendamentos podem estar com horário incorreto!');
    console.log('   Para corrigir TODOS de uma vez, executar:');
    console.log('   node fix-all-bookings.js\n');
  } else {
    console.log('   🎉 Nenhum agendamento suspeito encontrado!\n');
  }

  console.log('=' .repeat(70));
  console.log('\n💡 CRITÉRIO DE DETECÇÃO:');
  console.log('   - Horários típicos de trabalho: 07:00 a 20:00 (local)');
  console.log('   - Convertido para UTC (GMT-3): 10:00 a 23:00');
  console.log('   - Se UTC < 10:00 → Provavelmente está SEM o offset (+3h)');
  console.log('   - Exemplos:');
  console.log('     • 09:00 UTC = 06:00 local ❌ (deveria ser 12:00 UTC)');
  console.log('     • 12:00 UTC = 09:00 local ✅ (correto)\n');
}

findAllProblematicBookings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
