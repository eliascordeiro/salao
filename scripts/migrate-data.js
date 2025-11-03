const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// Cliente para PostgreSQL Railway (destino)
const prismaTarget = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_PRODUCTION
    }
  }
});

// Conexão SQLite (origem)
const db = new sqlite3.Database('./prisma/dev.db');
const dbAll = promisify(db.all.bind(db));

async function migrarDados() {
  try {
    console.log('🔄 Iniciando migração de dados...\n');

    // 1. Migrar Usuários
    console.log('👤 Migrando usuários...');
    const users = await dbAll('SELECT * FROM User');
    console.log(`   Encontrados: ${users.length} usuários`);
    
    for (const user of users) {
      await prismaTarget.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        }
      });
    }
    console.log('   ✅ Usuários migrados!\n');

    // 2. Migrar Salões
    console.log('🏢 Migrando salões...');
    const salons = await dbAll('SELECT * FROM Salon');
    console.log(`   Encontrados: ${salons.length} salões`);
    
    for (const salon of salons) {
      await prismaTarget.salon.upsert({
        where: { id: salon.id },
        update: {},
        create: {
          id: salon.id,
          name: salon.name,
          address: salon.address,
          phone: salon.phone,
          email: salon.email,
          createdAt: new Date(salon.createdAt),
          updatedAt: new Date(salon.updatedAt),
        }
      });
    }
    console.log('   ✅ Salões migrados!\n');

    // 3. Migrar Serviços
    console.log('💈 Migrando serviços...');
    const services = await dbAll('SELECT * FROM Service');
    console.log(`   Encontrados: ${services.length} serviços`);
    
    for (const service of services) {
      await prismaTarget.service.upsert({
        where: { id: service.id },
        update: {},
        create: {
          id: service.id,
          salonId: service.salonId,
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          active: service.active === 1,
          createdAt: new Date(service.createdAt),
          updatedAt: new Date(service.updatedAt),
        }
      });
    }
    console.log('   ✅ Serviços migrados!\n');

    // 4. Migrar Profissionais
    console.log('👨‍💼 Migrando profissionais...');
    const staff = await dbAll('SELECT * FROM Staff');
    console.log(`   Encontrados: ${staff.length} profissionais`);
    
    for (const person of staff) {
      await prismaTarget.staff.upsert({
        where: { id: person.id },
        update: {},
        create: {
          id: person.id,
          salonId: person.salonId,
          name: person.name,
          email: person.email,
          phone: person.phone,
          specialty: person.specialty,
          active: person.active === 1,
          createdAt: new Date(person.createdAt),
          updatedAt: new Date(person.updatedAt),
        }
      });
    }
    console.log('   ✅ Profissionais migrados!\n');

    // 5. Migrar ServiceStaff (relação N:N)
    console.log('🔗 Migrando relações serviço-profissional...');
    const serviceStaff = await dbAll('SELECT * FROM ServiceStaff');
    console.log(`   Encontradas: ${serviceStaff.length} relações`);
    
    for (const relation of serviceStaff) {
      await prismaTarget.serviceStaff.upsert({
        where: {
          serviceId_staffId: {
            serviceId: relation.serviceId,
            staffId: relation.staffId
          }
        },
        update: {},
        create: {
          serviceId: relation.serviceId,
          staffId: relation.staffId,
        }
      });
    }
    console.log('   ✅ Relações migradas!\n');

    // 6. Migrar Agendamentos
    console.log('📅 Migrando agendamentos...');
    const bookings = await dbAll('SELECT * FROM Booking');
    console.log(`   Encontrados: ${bookings.length} agendamentos`);
    
    for (const booking of bookings) {
      await prismaTarget.booking.upsert({
        where: { id: booking.id },
        update: {},
        create: {
          id: booking.id,
          userId: booking.userId,
          serviceId: booking.serviceId,
          staffId: booking.staffId,
          salonId: booking.salonId,
          dateTime: new Date(booking.dateTime),
          status: booking.status,
          notes: booking.notes,
          createdAt: new Date(booking.createdAt),
          updatedAt: new Date(booking.updatedAt),
        }
      });
    }
    console.log('   ✅ Agendamentos migrados!\n');

    // 7. Migrar Notificações (se existir)
    console.log('📧 Migrando notificações...');
    try {
      const notifications = await dbAll('SELECT * FROM Notification');
      console.log(`   Encontradas: ${notifications.length} notificações`);
      
      for (const notification of notifications) {
        await prismaTarget.notification.create({
          data: {
            id: notification.id,
            bookingId: notification.bookingId,
            type: notification.type,
            status: notification.status,
            sentAt: notification.sentAt ? new Date(notification.sentAt) : null,
            error: notification.error,
            createdAt: new Date(notification.createdAt),
          }
        });
      }
      console.log('   ✅ Notificações migradas!\n');
    } catch (e) {
      console.log('   ⚠️ Tabela Notification não existe (ignorado)\n');
    }

    // 8. Migrar Pagamentos (se existir)
    console.log('💳 Migrando pagamentos...');
    try {
      const payments = await dbAll('SELECT * FROM Payment');
      console.log(`   Encontrados: ${payments.length} pagamentos`);
      
      for (const payment of payments) {
        await prismaTarget.payment.upsert({
          where: { id: payment.id },
          update: {},
          create: {
            id: payment.id,
            bookingId: payment.bookingId,
            amount: payment.amount,
            status: payment.status,
            stripePaymentIntentId: payment.stripePaymentIntentId,
            stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
            paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
            refundedAt: payment.refundedAt ? new Date(payment.refundedAt) : null,
            createdAt: new Date(payment.createdAt),
            updatedAt: new Date(payment.updatedAt),
          }
        });
      }
      console.log('   ✅ Pagamentos migrados!\n');
    } catch (e) {
      console.log('   ⚠️ Tabela Payment não existe (ignorado)\n');
    }

    // 9. Migrar Disponibilidades (se existir)
    console.log('🚫 Migrando bloqueios de disponibilidade...');
    try {
      const availabilities = await dbAll('SELECT * FROM Availability');
      console.log(`   Encontrados: ${availabilities.length} bloqueios`);
      
      for (const availability of availabilities) {
        await prismaTarget.availability.create({
          data: {
            id: availability.id,
            staffId: availability.staffId,
            startDateTime: new Date(availability.startDateTime),
            endDateTime: new Date(availability.endDateTime),
            reason: availability.reason,
            createdAt: new Date(availability.createdAt),
            updatedAt: new Date(availability.updatedAt),
          }
        });
      }
      console.log('   ✅ Bloqueios migrados!\n');
    } catch (e) {
      console.log('   ⚠️ Tabela Availability não existe (ignorado)\n');
    }

    console.log('✅ Migração concluída com sucesso!\n');
    
    // Resumo
    console.log('📊 RESUMO DA MIGRAÇÃO:');
    console.log(`   - ${users.length} usuários`);
    console.log(`   - ${salons.length} salões`);
    console.log(`   - ${services.length} serviços`);
    console.log(`   - ${staff.length} profissionais`);
    console.log(`   - ${serviceStaff.length} relações serviço-profissional`);
    console.log(`   - ${bookings.length} agendamentos`);
    console.log(`   - ${notifications.length} notificações`);
    console.log(`   - ${payments.length} pagamentos`);
    console.log(`   - ${availabilities.length} bloqueios de disponibilidade`);

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    db.close();
    await prismaTarget.$disconnect();
  }
}

// Executar migração
migrarDados()
  .then(() => {
    console.log('\n🎉 Processo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Falha na migração:', error);
    process.exit(1);
  });
