const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestBookings() {
  try {
    console.log('🔍 Buscando dados necessários...');
    
    // Buscar um salão
    const salon = await prisma.salon.findFirst({
      where: { active: true }
    });
    
    if (!salon) {
      console.log('❌ Nenhum salão encontrado');
      return;
    }
    
    console.log(`✅ Salão: ${salon.name}`);
    
    // Buscar um cliente
    const client = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });
    
    if (!client) {
      console.log('❌ Nenhum cliente encontrado');
      return;
    }
    
    console.log(`✅ Cliente: ${client.name}`);
    
    // Buscar serviços e profissionais
    const services = await prisma.service.findMany({
      where: { salonId: salon.id, active: true },
      take: 3
    });
    
    const staff = await prisma.staff.findMany({
      where: { salonId: salon.id, active: true },
      take: 2
    });
    
    if (services.length === 0 || staff.length === 0) {
      console.log('❌ Sem serviços ou profissionais');
      return;
    }
    
    console.log(`✅ ${services.length} serviços e ${staff.length} profissionais encontrados`);
    
    // Criar agendamentos para hoje com status CONFIRMED
    const today = new Date();
    today.setHours(10, 0, 0, 0); // 10:00 AM
    
    console.log('\n📅 Criando agendamentos para hoje...');
    
    const bookings = [];
    
    // Agendamento 1: Corte de cabelo
    const booking1 = await prisma.booking.create({
      data: {
        clientId: client.id,
        salonId: salon.id,
        serviceId: services[0].id,
        staffId: staff[0].id,
        date: new Date(today.getTime()), // 10:00
        status: 'CONFIRMED', // Cliente já foi atendido
        totalPrice: services[0].price,
        notes: 'Cliente atendido - aguardando pagamento'
      }
    });
    bookings.push(booking1);
    console.log(`  ✓ ${services[0].name} - R$ ${services[0].price} (${staff[0].name})`);
    
    // Agendamento 2: Barba (mesmo cliente, 1h depois)
    if (services.length > 1) {
      const time2 = new Date(today.getTime());
      time2.setHours(11, 0, 0, 0); // 11:00 AM
      
      const booking2 = await prisma.booking.create({
        data: {
          clientId: client.id,
          salonId: salon.id,
          serviceId: services[1].id,
          staffId: staff[0].id,
          date: time2,
          status: 'CONFIRMED',
          totalPrice: services[1].price,
          notes: 'Cliente atendido - aguardando pagamento'
        }
      });
      bookings.push(booking2);
      console.log(`  ✓ ${services[1].name} - R$ ${services[1].price} (${staff[0].name})`);
    }
    
    // Buscar outro cliente para criar mais agendamentos
    const client2 = await prisma.user.findFirst({
      where: { 
        role: 'CLIENT',
        id: { not: client.id }
      }
    });
    
    if (client2 && services.length > 2 && staff.length > 1) {
      const time3 = new Date(today.getTime());
      time3.setHours(14, 0, 0, 0); // 14:00 PM
      
      const booking3 = await prisma.booking.create({
        data: {
          clientId: client2.id,
          salonId: salon.id,
          serviceId: services[2].id,
          staffId: staff[1].id,
          date: time3,
          status: 'CONFIRMED',
          totalPrice: services[2].price,
          notes: 'Cliente atendido - aguardando pagamento'
        }
      });
      bookings.push(booking3);
      console.log(`  ✓ ${services[2].name} - R$ ${services[2].price} (${staff[1].name}) - Cliente: ${client2.name}`);
    }
    
    console.log(`\n✅ ${bookings.length} agendamentos criados com sucesso!`);
    console.log('\n💡 Acesse /dashboard/caixa para visualizar os atendimentos do dia');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestBookings();
