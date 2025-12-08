/**
 * Script para atualizar o slotInterval de todos os profissionais
 * de 5 minutos para 15 minutos (novo padrão mínimo)
 * 
 * Se o profissional presta apenas UM serviço, usa a duração desse serviço como intervalo.
 * Caso contrário, usa 15 minutos como padrão.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function atualizarSlotIntervals() {
  try {
    console.log('🔄 Iniciando atualização de slotInterval...\n');

    // Buscar todos os profissionais com seus serviços
    const profissionais = await prisma.staff.findMany({
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                duration: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Total de profissionais encontrados: ${profissionais.length}\n`);

    let atualizados = 0;
    let comCalculoInteligente = 0;

    for (const prof of profissionais) {
      const slotAtual = prof.slotInterval || 5;
      let novoSlot = 15; // Padrão mínimo
      let motivo = 'padrão mínimo (15 min)';

      // Se tem apenas UM serviço, usar a duração dele
      if (prof.services.length === 1) {
        const servicoDuracao = prof.services[0].service.duration;
        novoSlot = servicoDuracao;
        motivo = `baseado no serviço único "${prof.services[0].service.name}" (${servicoDuracao} min)`;
        comCalculoInteligente++;
      }

      // Atualizar apenas se for diferente do atual
      if (slotAtual !== novoSlot) {
        await prisma.staff.update({
          where: { id: prof.id },
          data: { slotInterval: novoSlot }
        });

        console.log(`✅ ${prof.name}`);
        console.log(`   Anterior: ${slotAtual} min → Novo: ${novoSlot} min`);
        console.log(`   Motivo: ${motivo}`);
        console.log(`   Serviços: ${prof.services.length} (${prof.services.map(s => s.service.name).join(', ') || 'nenhum'})\n`);
        
        atualizados++;
      } else {
        console.log(`⏭️  ${prof.name} - já está em ${slotAtual} min (sem alteração)\n`);
      }
    }

    console.log('━'.repeat(60));
    console.log(`\n✨ Atualização concluída!`);
    console.log(`   📊 Total analisado: ${profissionais.length}`);
    console.log(`   ✅ Atualizados: ${atualizados}`);
    console.log(`   🎯 Com cálculo inteligente (baseado no serviço): ${comCalculoInteligente}`);
    console.log(`   ⏭️  Sem alteração: ${profissionais.length - atualizados}\n`);

  } catch (error) {
    console.error('❌ Erro ao atualizar slotIntervals:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
atualizarSlotIntervals()
  .then(() => {
    console.log('🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
