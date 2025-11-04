/**
 * Script para Popular Slots - Cadastra slots para todos os profissionais
 * 
 * Cria slots de 30 em 30 minutos para Segunda a Sexta:
 * - Manhã: 09:00 às 12:00
 * - Tarde: 14:00 às 18:00
 * 
 * Sábado:
 * - 09:00 às 13:00
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Gerar slots de 30 em 30 minutos
function generateTimeSlots(startHour, startMin, endHour, endMin) {
  const slots = [];
  let currentHour = startHour;
  let currentMin = startMin;
  
  const endInMinutes = endHour * 60 + endMin;
  
  while (currentHour * 60 + currentMin < endInMinutes) {
    const start = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    
    // Próximo slot (30 min depois)
    currentMin += 30;
    if (currentMin >= 60) {
      currentHour += 1;
      currentMin = 0;
    }
    
    const end = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    
    slots.push({ start, end });
  }
  
  return slots;
}

async function seedSlots() {
  console.log('🌱 Populando slots para todos os profissionais...\n');
  
  try {
    // Buscar todos os profissionais ativos
    const staff = await prisma.staff.findMany({
      where: { active: true },
      select: { id: true, name: true },
    });
    
    if (staff.length === 0) {
      console.log('⚠️  Nenhum profissional ativo encontrado');
      return;
    }
    
    console.log(`👥 Encontrados ${staff.length} profissionais ativos\n`);
    
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    // Slots para cada dia
    const weekdaySlots = [
      ...generateTimeSlots(9, 0, 12, 0),   // 09:00-12:00
      ...generateTimeSlots(14, 0, 18, 0),  // 14:00-18:00
    ];
    
    const saturdaySlots = generateTimeSlots(9, 0, 13, 0); // 09:00-13:00
    
    let totalCreated = 0;
    
    for (const member of staff) {
      console.log(`📋 Profissional: ${member.name}`);
      
      // Limpar slots recorrentes antigos deste profissional
      const deleted = await prisma.availability.deleteMany({
        where: {
          staffId: member.id,
          type: 'RECURRING',
        },
      });
      
      if (deleted.count > 0) {
        console.log(`   🧹 ${deleted.count} slots antigos removidos`);
      }
      
      // Segunda a Sexta (1-5)
      for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
        console.log(`   📅 ${dayNames[dayOfWeek]}: ${weekdaySlots.length} slots`);
        
        for (const slot of weekdaySlots) {
          await prisma.availability.create({
            data: {
              staffId: member.id,
              dayOfWeek,
              startTime: slot.start,
              endTime: slot.end,
              available: true,
              type: 'RECURRING',
            },
          });
          totalCreated++;
        }
      }
      
      // Sábado (6)
      console.log(`   📅 ${dayNames[6]}: ${saturdaySlots.length} slots`);
      for (const slot of saturdaySlots) {
        await prisma.availability.create({
          data: {
            staffId: member.id,
            dayOfWeek: 6,
            startTime: slot.start,
            endTime: slot.end,
            available: true,
            type: 'RECURRING',
          },
        });
        totalCreated++;
      }
      
      console.log('');
    }
    
    console.log('═'.repeat(60));
    console.log(`🎉 Sucesso! ${totalCreated} slots criados para ${staff.length} profissionais`);
    console.log('═'.repeat(60));
    console.log('\n📊 Resumo:');
    console.log(`   • Segunda a Sexta: ${weekdaySlots.length} slots/dia`);
    console.log(`   • Sábado: ${saturdaySlots.length} slots/dia`);
    console.log(`   • Total por profissional: ${weekdaySlots.length * 5 + saturdaySlots.length} slots`);
    console.log('\n✅ Agora os clientes podem agendar de Segunda a Sábado!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedSlots();
