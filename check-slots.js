const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSlots() {
  try {
    console.log('\n🔍 Verificando slots do profissional...\n');
    
    const staffId = 'cmhpfkxk10001ofyrulo7v169';
    
    // Buscar profissional
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { 
        id: true, 
        name: true, 
        salonId: true,
        salon: {
          select: { name: true }
        }
      }
    });
    
    if (!staff) {
      console.log('❌ Profissional não encontrado!');
      return;
    }
    
    console.log('✅ Profissional encontrado:');
    console.log('   Nome:', staff.name);
    console.log('   Salão:', staff.salon.name);
    console.log('   ID:', staff.id);
    console.log('');
    
    // Buscar slots recorrentes
    const slots = await prisma.availability.findMany({
      where: {
        staffId: staffId,
        type: 'RECURRING'
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
    
    console.log(`📅 Total de slots cadastrados: ${slots.length}\n`);
    
    if (slots.length === 0) {
      console.log('⚠️  PROBLEMA: Nenhum slot cadastrado para este profissional!');
      console.log('');
      console.log('💡 Solução:');
      console.log('   1. Acesse: http://localhost:3000/dashboard/profissionais/cmhpfkxk10001ofyrulo7v169/slots');
      console.log('   2. Cadastre os horários disponíveis do profissional');
      console.log('');
    } else {
      console.log('Slots por dia da semana:');
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      
      slots.forEach(slot => {
        const day = dayNames[slot.dayOfWeek];
        const status = slot.available ? '✅ Disponível' : '❌ Indisponível';
        console.log(`   ${day}: ${slot.startTime} - ${slot.endTime} ${status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlots();
