const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function atualizarSlotIntervalProfissionais() {
  console.log('🔧 Verificando profissionais sem slotInterval configurado...\n');

  try {
    // Buscar todos os profissionais
    const profissionais = await prisma.staff.findMany({
      select: {
        id: true,
        name: true,
        slotInterval: true,
        workStart: true,
        workEnd: true
      }
    });

    console.log(`📊 Total de profissionais: ${profissionais.length}\n`);

    // Listar profissionais e seus intervalos
    console.log('📋 Configuração atual:\n');
    profissionais.forEach((prof, index) => {
      console.log(`${index + 1}. ${prof.name}`);
      console.log(`   slotInterval: ${prof.slotInterval || 'NÃO CONFIGURADO'} minutos`);
      console.log(`   Horário: ${prof.workStart || 'N/A'} - ${prof.workEnd || 'N/A'}`);
      console.log(`   ID: ${prof.id}\n`);
    });

    // Atualizar profissionais sem slotInterval (null ou 0)
    const semIntervalo = profissionais.filter(p => !p.slotInterval || p.slotInterval === 0);

    if (semIntervalo.length === 0) {
      console.log('✅ Todos os profissionais já têm slotInterval configurado!');
      return;
    }

    console.log(`⚠️  Encontrados ${semIntervalo.length} profissionais sem slotInterval configurado.\n`);
    console.log('🔄 Atualizando para 5 minutos (padrão)...\n');

    for (const prof of semIntervalo) {
      await prisma.staff.update({
        where: { id: prof.id },
        data: { slotInterval: 5 }
      });
      console.log(`✅ ${prof.name} - slotInterval atualizado para 5 minutos`);
    }

    console.log(`\n✅ ${semIntervalo.length} profissionais atualizados com sucesso!`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

atualizarSlotIntervalProfissionais();
