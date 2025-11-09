const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSlots() {
  const eliasId = 'cmhpfkxk10001ofyrulo7v169';
  
  console.log('🔍 VERIFICANDO SLOTS DO ELIAS\n');
  
  // Buscar profissional
  const staff = await prisma.staff.findUnique({
    where: { id: eliasId },
    select: { name: true, workDays: true }
  });
  
  console.log('👤 Profissional:', staff.name);
  console.log('📅 WorkDays configurado:', staff.workDays);
  console.log('   Array:', staff.workDays.split(',').map(Number));
  console.log('');
  
  // Buscar slots recorrentes
  const slots = await prisma.availability.findMany({
    where: {
      staffId: eliasId,
      type: 'RECURRING'
    },
    select: {
      dayOfWeek: true,
      startTime: true,
      endTime: true
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  });
  
  // Agrupar por dia
  const slotsByDay = {};
  slots.forEach(slot => {
    if (!slotsByDay[slot.dayOfWeek]) {
      slotsByDay[slot.dayOfWeek] = [];
    }
    slotsByDay[slot.dayOfWeek].push(slot);
  });
  
  console.log('📊 SLOTS NO BANCO (RECURRING):');
  console.log('');
  
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const workDaysArray = staff.workDays.split(',').map(Number);
  
  for (let day = 0; day <= 6; day++) {
    const dayName = daysOfWeek[day];
    const slotsForDay = slotsByDay[day] || [];
    const shouldWork = workDaysArray.includes(day);
    
    if (slotsForDay.length > 0) {
      const status = shouldWork ? '✅' : '❌';
      console.log(`${status} ${dayName} (${day}): ${slotsForDay.length} slots`);
      
      if (!shouldWork) {
        console.log(`   ⚠️ PROBLEMA: Profissional NÃO trabalha neste dia!`);
        console.log(`   Exemplos: ${slotsForDay.slice(0, 3).map(s => s.startTime).join(', ')}`);
      }
    } else if (shouldWork) {
      console.log(`⚠️ ${dayName} (${day}): 0 slots`);
      console.log(`   PROBLEMA: Profissional TRABALHA mas não tem slots!`);
    }
  }
  
  console.log('');
  console.log('📋 RESUMO:');
  console.log(`Total de slots: ${slots.length}`);
  console.log(`Dias configurados para trabalhar: ${workDaysArray.join(', ')}`);
  console.log(`Dias com slots: ${Object.keys(slotsByDay).join(', ')}`);
  
  // Identificar slots incorretos
  const wrongDaySlots = slots.filter(s => !workDaysArray.includes(s.dayOfWeek));
  if (wrongDaySlots.length > 0) {
    console.log(`\n❌ SLOTS INCORRETOS: ${wrongDaySlots.length} slots em dias não trabalhados`);
    const wrongDays = [...new Set(wrongDaySlots.map(s => s.dayOfWeek))];
    console.log(`   Dias: ${wrongDays.map(d => daysOfWeek[d]).join(', ')}`);
  }
  
  // Identificar dias sem slots
  const missingDays = workDaysArray.filter(d => !slotsByDay[d]);
  if (missingDays.length > 0) {
    console.log(`\n⚠️ DIAS SEM SLOTS: ${missingDays.map(d => daysOfWeek[d]).join(', ')}`);
  }
}

checkSlots()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
