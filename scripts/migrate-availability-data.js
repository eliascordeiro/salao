/**
 * Script de migração: Availability → Staff (workStart/workEnd)
 * 
 * Este script extrai os horários de trabalho dos slots existentes
 * na tabela Availability e atualiza os registros Staff correspondentes.
 * 
 * Como funciona:
 * 1. Para cada profissional (Staff)
 * 2. Busca o primeiro e último slot de cada dia da semana
 * 3. Calcula workStart (horário mais cedo) e workEnd (horário mais tarde)
 * 4. Atualiza o registro Staff com esses horários
 * 
 * IMPORTANTE: Execute este script ANTES de dropar a tabela Availability
 * 
 * Uso: node scripts/migrate-availability-data.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateAvailabilityData() {
  console.log('🔄 Iniciando migração de dados Availability → Staff\n');

  try {
    // Buscar todos os profissionais
    const allStaff = await prisma.staff.findMany({
      select: {
        id: true,
        name: true,
        workStart: true,
        workEnd: true,
        workDays: true,
      },
    });

    console.log(`📋 Encontrados ${allStaff.length} profissionais\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const staff of allStaff) {
      console.log(`\n👤 Processando: ${staff.name} (${staff.id})`);

      // Verificar se já tem horários configurados
      if (staff.workStart && staff.workEnd) {
        console.log(`  ⏭️  Já possui horários: ${staff.workStart} - ${staff.workEnd}`);
        skippedCount++;
        continue;
      }

      // Buscar todos os slots recorrentes deste profissional
      const availabilitySlots = await prisma.availability.findMany({
        where: {
          staffId: staff.id,
          type: 'RECURRING',
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      if (availabilitySlots.length === 0) {
        console.log('  ⚠️  Nenhum slot encontrado');
        skippedCount++;
        continue;
      }

      // Extrair dias de trabalho únicos
      const uniqueDays = [...new Set(availabilitySlots.map(s => s.dayOfWeek))];
      
      // Extrair horário mais cedo e mais tarde
      const allStartTimes = availabilitySlots.map(s => s.startTime);
      const workStart = allStartTimes.sort()[0]; // Primeiro horário alfabeticamente
      
      // Calcular workEnd baseado no último slot + duração estimada (15min)
      const lastSlot = availabilitySlots[availabilitySlots.length - 1];
      const [lastHour, lastMinute] = lastSlot.startTime.split(':').map(Number);
      const endMinutes = lastHour * 60 + lastMinute + 15; // +15min após último slot
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      const workEnd = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

      // Converter array de dias para string (formato: "1,2,3,4,5")
      const workDays = uniqueDays.sort((a, b) => a - b).join(',');

      console.log(`  📊 Dados extraídos:`);
      console.log(`     - Slots encontrados: ${availabilitySlots.length}`);
      console.log(`     - Dias de trabalho: ${workDays} (${uniqueDays.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ')})`);
      console.log(`     - Horário início: ${workStart}`);
      console.log(`     - Horário fim: ${workEnd}`);

      // Atualizar registro Staff
      await prisma.staff.update({
        where: { id: staff.id },
        data: {
          workStart,
          workEnd,
          workDays,
        },
      });

      console.log(`  ✅ Staff atualizado com sucesso`);
      updatedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migração concluída!');
    console.log(`   - Profissionais atualizados: ${updatedCount}`);
    console.log(`   - Profissionais pulados: ${skippedCount}`);
    console.log('='.repeat(60) + '\n');

    // Mostrar resumo dos dados migrados
    console.log('📊 Resumo dos dados migrados:\n');
    const updatedStaff = await prisma.staff.findMany({
      where: {
        workStart: { not: null },
        workEnd: { not: null },
      },
      select: {
        name: true,
        workDays: true,
        workStart: true,
        workEnd: true,
        lunchStart: true,
        lunchEnd: true,
      },
    });

    updatedStaff.forEach(s => {
      const days = s.workDays?.split(',').map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][parseInt(d)]).join(', ') || 'N/A';
      console.log(`   ${s.name}:`);
      console.log(`      Dias: ${days}`);
      console.log(`      Expediente: ${s.workStart} - ${s.workEnd}`);
      if (s.lunchStart && s.lunchEnd) {
        console.log(`      Almoço: ${s.lunchStart} - ${s.lunchEnd}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('\n❌ Erro durante migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateAvailabilityData()
  .then(() => {
    console.log('🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no script:', error);
    process.exit(1);
  });
