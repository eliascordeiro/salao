const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSlots() {
  const eliasId = 'cmhpfkxk10001ofyrulo7v169';
  
  console.log('🔧 CORRIGINDO SLOTS DO ELIAS\n');
  
  // Buscar profissional
  const staff = await prisma.staff.findUnique({
    where: { id: eliasId },
    select: { name: true, workDays: true }
  });
  
  console.log('👤 Profissional:', staff.name);
  console.log('📅 Dias de trabalho configurados:', staff.workDays);
  
  const workDaysArray = staff.workDays.split(',').map(Number);
  console.log('   Array:', workDaysArray);
  console.log('');
  
  // Buscar slots em dias NÃO trabalhados
  const wrongSlots = await prisma.availability.findMany({
    where: {
      staffId: eliasId,
      type: 'RECURRING',
      dayOfWeek: {
        notIn: workDaysArray
      }
    }
  });
  
  console.log(`🔍 Encontrados ${wrongSlots.length} slots em dias não trabalhados`);
  
  if (wrongSlots.length === 0) {
    console.log('✅ Nenhum slot incorreto encontrado!');
    return;
  }
  
  // Agrupar por dia para mostrar
  const slotsByDay = {};
  wrongSlots.forEach(slot => {
    if (!slotsByDay[slot.dayOfWeek]) {
      slotsByDay[slot.dayOfWeek] = 0;
    }
    slotsByDay[slot.dayOfWeek]++;
  });
  
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  console.log('\n📊 Slots a remover:');
  Object.entries(slotsByDay).forEach(([day, count]) => {
    console.log(`   ${daysOfWeek[day]} (${day}): ${count} slots`);
  });
  
  // Remover slots incorretos
  console.log('\n🗑️ Removendo slots...');
  
  const result = await prisma.availability.deleteMany({
    where: {
      staffId: eliasId,
      type: 'RECURRING',
      dayOfWeek: {
        notIn: workDaysArray
      }
    }
  });
  
  console.log(`✅ ${result.count} slots removidos com sucesso!`);
  
  // Verificar resultado
  console.log('\n📋 VERIFICAÇÃO FINAL:');
  
  const remainingSlots = await prisma.availability.groupBy({
    by: ['dayOfWeek'],
    where: {
      staffId: eliasId,
      type: 'RECURRING'
    },
    _count: true
  });
  
  console.log('Slots restantes por dia:');
  remainingSlots.forEach(group => {
    const dayName = daysOfWeek[group.dayOfWeek];
    const shouldWork = workDaysArray.includes(group.dayOfWeek);
    const status = shouldWork ? '✅' : '❌';
    console.log(`${status} ${dayName} (${group.dayOfWeek}): ${group._count} slots`);
  });
  
  console.log('\n✨ CORREÇÃO CONCLUÍDA!');
}

fixSlots()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Erro:', e);
    prisma.$disconnect();
    process.exit(1);
  });
