#!/usr/bin/env node

/**
 * Script para verificar agendamentos disponíveis para teste de pagamento
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando agendamentos disponíveis para teste...\n');

  // Busca agendamentos do cliente pedro@exemplo.com que ainda não foram pagos
  const bookings = await prisma.booking.findMany({
    where: {
      client: {
        email: 'pedro@exemplo.com'
      },
      status: 'CONFIRMED',
      payment: null // Agendamentos sem pagamento
    },
    include: {
      client: {
        select: {
          name: true,
          email: true
        }
      },
      service: {
        select: {
          name: true,
          price: true,
          duration: true
        }
      },
      staff: {
        select: {
          name: true,
          specialty: true
        }
      },
      salon: {
        select: {
          name: true,
          address: true
        }
      },
      payment: true
    },
    orderBy: {
      date: 'desc'
    }
  });

  if (bookings.length === 0) {
    console.log('❌ Nenhum agendamento encontrado para teste.');
    console.log('\n💡 Sugestões:');
    console.log('1. Crie um novo agendamento em: http://localhost:3000/agendar');
    console.log('2. Ou use o cliente pedro@exemplo.com para criar um agendamento');
    console.log('\nCredenciais:');
    console.log('  Email: pedro@exemplo.com');
    console.log('  Senha: cliente123\n');
    return;
  }

  console.log(`✅ Encontrados ${bookings.length} agendamento(s) disponível(is) para teste:\n`);

  bookings.forEach((booking, index) => {
    console.log(`📋 Agendamento #${index + 1}`);
    console.log(`   ID: ${booking.id}`);
    console.log(`   Cliente: ${booking.client.name} (${booking.client.email})`);
    console.log(`   Serviço: ${booking.service.name}`);
    console.log(`   Duração: ${booking.service.duration} min`);
    console.log(`   Valor: R$ ${booking.service.price.toFixed(2)}`);
    console.log(`   Profissional: ${booking.staff.name} (${booking.staff.specialty})`);
    console.log(`   Data: ${new Date(booking.date).toLocaleString('pt-BR')}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Pagamento: ${booking.payment ? '✅ Pago' : '❌ Pendente'}`);
    console.log(`   Local: ${booking.salon.name}`);
    console.log(`   Endereço: ${booking.salon.address}`);
    console.log(`   Link de teste: http://localhost:3000/agendar/checkout/${booking.id}`);
    console.log('');
  });

  console.log('\n🎯 Para testar o pagamento:');
  console.log('1. Acesse: http://localhost:3000');
  console.log('2. Faça login com: pedro@exemplo.com / cliente123');
  console.log('3. Vá em "Meus Agendamentos"');
  console.log('4. Clique em "💳 Pagar Agendamento"');
  console.log('5. Use o cartão de teste: 4242 4242 4242 4242\n');
}

main()
  .catch((error) => {
    console.error('❌ Erro ao buscar agendamentos:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
