const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limparAgendamentosAntigos() {
  console.log('🧹 Iniciando limpeza de agendamentos antigos...\n');

  try {
    // Listar todos os agendamentos
    const todosAgendamentos = await prisma.booking.findMany({
      include: {
        staff: { select: { name: true } },
        service: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    console.log(`📊 Total de agendamentos: ${todosAgendamentos.length}\n`);

    if (todosAgendamentos.length > 0) {
      console.log('📋 Listagem de agendamentos:\n');
      todosAgendamentos.forEach((booking, index) => {
        const data = new Date(booking.date);
        console.log(`${index + 1}. ${booking.staff.name} - ${booking.service.name}`);
        console.log(`   Data: ${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
        console.log(`   Cliente: ${booking.customerName || 'N/A'} (${booking.customerEmail || 'N/A'})`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   ID: ${booking.id}\n`);
      });
    }

    // Perguntar o que fazer
    console.log('\n⚠️  ATENÇÃO: Esta ação é irreversível!\n');
    console.log('Opções:');
    console.log('1. Deletar TODOS os agendamentos');
    console.log('2. Deletar apenas agendamentos PASSADOS');
    console.log('3. Cancelar\n');

    // Para executar automaticamente (descomente a linha desejada):
    
    // OPÇÃO 1: Deletar TODOS
    // const opcao = 1;
    
    // OPÇÃO 2: Deletar apenas PASSADOS
    const opcao = 2;
    
    // OPÇÃO 3: Cancelar
    // const opcao = 3;

    if (opcao === 1) {
      const resultado = await prisma.booking.deleteMany({});
      console.log(`✅ ${resultado.count} agendamentos deletados com sucesso!`);
    } else if (opcao === 2) {
      const agora = new Date();
      const resultado = await prisma.booking.deleteMany({
        where: {
          date: {
            lt: agora
          }
        }
      });
      console.log(`✅ ${resultado.count} agendamentos passados deletados!`);
    } else {
      console.log('❌ Operação cancelada.');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

limparAgendamentosAntigos();
