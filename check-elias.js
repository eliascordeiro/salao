const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkElias() {
  try {
    // Buscar profissional Elias Cordeiro
    const elias = await prisma.staff.findFirst({
      where: {
        name: { contains: 'Elias Cordeiro', mode: 'insensitive' }
      },
      include: {
        salon: true
      }
    });

    if (!elias) {
      console.log('❌ Elias não encontrado!');
      return;
    }

    console.log('\n📋 DADOS DO ELIAS:');
    console.log('ID:', elias.id);
    console.log('Nome:', elias.name);
    console.log('Email:', elias.email);
    console.log('Salão:', elias.salon?.name, '(' + elias.salon?.email + ')');
    console.log('WorkDays:', elias.workDays);
    console.log('WorkStart:', elias.workStart);
    console.log('WorkEnd:', elias.workEnd);
    console.log('LunchStart:', elias.lunchStart);
    console.log('LunchEnd:', elias.lunchEnd);

    // Interpretar workDays
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const workDaysArray = elias.workDays ? elias.workDays.split(',') : [];
    console.log('\n📅 DIAS DE TRABALHO:');
    workDaysArray.forEach(day => {
      console.log(`  - ${days[parseInt(day)]} (${day})`);
    });

    // Buscar slots
    console.log('\n🕒 SLOTS EXISTENTES:');
    const slots = await prisma.availability.findMany({
      where: {
        staffId: elias.id,
        type: 'RECURRING'
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    const slotsByDay = {};
    slots.forEach(slot => {
      if (!slotsByDay[slot.dayOfWeek]) {
        slotsByDay[slot.dayOfWeek] = [];
      }
      slotsByDay[slot.dayOfWeek].push(slot);
    });

    Object.keys(slotsByDay).sort().forEach(dayNum => {
      const daySlots = slotsByDay[dayNum];
      console.log(`\n  ${days[dayNum]} (${dayNum}): ${daySlots.length} slots`);
      console.log(`    Primeiro: ${daySlots[0].startTime} - ${daySlots[0].endTime}`);
      console.log(`    Último: ${daySlots[daySlots.length-1].startTime} - ${daySlots[daySlots.length-1].endTime}`);
    });

    console.log('\n📊 RESUMO:');
    console.log(`Total de slots: ${slots.length}`);
    console.log(`Dias com slots: ${Object.keys(slotsByDay).join(', ')}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkElias();
