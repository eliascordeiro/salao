const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedLocal() {
  try {
    console.log('🌱 Populando banco de dados local...\n');

    // 1. Criar Usuário Admin
    console.log('👤 Criando usuário admin...');
    const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@agendasalao.com.br' },
      update: {},
      create: {
        name: 'Administrador',
        email: 'admin@agendasalao.com.br',
        password: hashedPasswordAdmin,
        role: 'ADMIN',
      }
    });
    console.log('   ✅ Admin criado: admin@agendasalao.com.br / admin123\n');

    // 2. Criar Salão
    console.log('🏢 Criando salão...');
    const salon = await prisma.salon.upsert({
      where: { id: 'salon-demo-1' },
      update: {},
      create: {
        id: 'salon-demo-1',
        name: 'Barbearia Estilo & Corte',
        description: 'A melhor barbearia da região com profissionais qualificados',
        address: 'Rua das Flores, 123 - Centro - São Paulo/SP',
        phone: '(11) 98888-7777',
        email: 'contato@estiloecorte.com.br',
        openTime: '09:00',
        closeTime: '19:00',
        workDays: '1,2,3,4,5,6', // Seg-Sáb
        ownerId: admin.id,
      }
    });
    console.log('   ✅ Salão criado!\n');

    // 3. Criar Cliente de Teste
    console.log('👤 Criando cliente de teste...');
    const hashedPasswordClient = await bcrypt.hash('cliente123', 10);
    const client = await prisma.user.upsert({
      where: { email: 'cliente@exemplo.com' },
      update: {},
      create: {
        name: 'Pedro Silva',
        email: 'cliente@exemplo.com',
        phone: '(11) 91234-5678',
        password: hashedPasswordClient,
        role: 'CLIENT',
      }
    });
    console.log('   ✅ Cliente criado: cliente@exemplo.com / cliente123\n');

    // 4. Criar Profissionais
    console.log('👨‍💼 Criando profissionais...');
    const staff1 = await prisma.staff.upsert({
      where: { id: 'staff-demo-1' },
      update: {},
      create: {
        id: 'staff-demo-1',
        name: 'Carlos Barbeiro',
        email: 'carlos@estiloecorte.com.br',
        phone: '(11) 98888-1111',
        specialty: 'Cortes Clássicos e Barba',
        bio: 'Mais de 10 anos de experiência em cortes clássicos e modernos',
        workDays: '1,2,3,4,5,6', // Seg-Sáb
        workStart: '09:00',
        workEnd: '18:00',
        lunchStart: '12:00',
        lunchEnd: '13:00',
        salonId: salon.id,
        active: true,
      }
    });

    const staff2 = await prisma.staff.upsert({
      where: { id: 'staff-demo-2' },
      update: {},
      create: {
        id: 'staff-demo-2',
        name: 'João Estilista',
        email: 'joao@estiloecorte.com.br',
        phone: '(11) 98888-2222',
        specialty: 'Cortes Modernos e Degradês',
        bio: 'Especialista em cortes modernos e tendências',
        workDays: '1,2,3,4,5', // Seg-Sex
        workStart: '10:00',
        workEnd: '19:00',
        lunchStart: '13:00',
        lunchEnd: '14:00',
        salonId: salon.id,
        active: true,
      }
    });
    console.log('   ✅ 2 profissionais criados!\n');

    // 5. Criar Serviços
    console.log('💈 Criando serviços...');
    const service1 = await prisma.service.upsert({
      where: { id: 'service-demo-1' },
      update: {},
      create: {
        id: 'service-demo-1',
        name: 'Corte de Cabelo',
        description: 'Corte masculino tradicional ou moderno',
        duration: 30,
        price: 40.00,
        salonId: salon.id,
        active: true,
      }
    });

    const service2 = await prisma.service.upsert({
      where: { id: 'service-demo-2' },
      update: {},
      create: {
        id: 'service-demo-2',
        name: 'Barba',
        description: 'Aparar e modelar barba',
        duration: 20,
        price: 25.00,
        salonId: salon.id,
        active: true,
      }
    });

    const service3 = await prisma.service.upsert({
      where: { id: 'service-demo-3' },
      update: {},
      create: {
        id: 'service-demo-3',
        name: 'Corte + Barba',
        description: 'Pacote completo: corte de cabelo e barba',
        duration: 50,
        price: 60.00,
        salonId: salon.id,
        active: true,
      }
    });

    const service4 = await prisma.service.upsert({
      where: { id: 'service-demo-4' },
      update: {},
      create: {
        id: 'service-demo-4',
        name: 'Degradê',
        description: 'Corte degradê profissional',
        duration: 40,
        price: 50.00,
        salonId: salon.id,
        active: true,
      }
    });
    console.log('   ✅ 4 serviços criados!\n');

    // 6. Associar Serviços aos Profissionais
    console.log('🔗 Associando serviços aos profissionais...');
    
    // Carlos: todos os serviços
    await prisma.serviceStaff.upsert({
      where: { 
        serviceId_staffId: {
          serviceId: service1.id,
          staffId: staff1.id
        }
      },
      update: {},
      create: {
        serviceId: service1.id,
        staffId: staff1.id,
      }
    });

    await prisma.serviceStaff.upsert({
      where: { 
        serviceId_staffId: {
          serviceId: service2.id,
          staffId: staff1.id
        }
      },
      update: {},
      create: {
        serviceId: service2.id,
        staffId: staff1.id,
      }
    });

    await prisma.serviceStaff.upsert({
      where: { 
        serviceId_staffId: {
          serviceId: service3.id,
          staffId: staff1.id
        }
      },
      update: {},
      create: {
        serviceId: service3.id,
        staffId: staff1.id,
      }
    });

    // João: corte e degradê
    await prisma.serviceStaff.upsert({
      where: { 
        serviceId_staffId: {
          serviceId: service1.id,
          staffId: staff2.id
        }
      },
      update: {},
      create: {
        serviceId: service1.id,
        staffId: staff2.id,
      }
    });

    await prisma.serviceStaff.upsert({
      where: { 
        serviceId_staffId: {
          serviceId: service4.id,
          staffId: staff2.id
        }
      },
      update: {},
      create: {
        serviceId: service4.id,
        staffId: staff2.id,
      }
    });

    console.log('   ✅ Associações criadas!\n');

    console.log('✅ Banco populado com sucesso!\n');
    console.log('📊 RESUMO:');
    console.log('   - 1 salão');
    console.log('   - 1 admin (admin@agendasalao.com.br / admin123)');
    console.log('   - 1 cliente (cliente@exemplo.com / cliente123)');
    console.log('   - 2 profissionais');
    console.log('   - 4 serviços');
    console.log('   - 5 associações serviço-profissional\n');
    console.log('🌐 Acesse: http://localhost:3000');
    console.log('🔐 Login: admin@agendasalao.com.br / admin123\n');
    console.log('🎉 Processo finalizado!');

  } catch (error) {
    console.error('❌ Erro ao popular banco:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedLocal()
  .catch((error) => {
    console.error('💥 Falha:', error);
    process.exit(1);
  });
