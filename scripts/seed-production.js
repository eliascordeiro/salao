const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_PRODUCTION
    }
  }
});

async function popularBanco() {
  try {
    console.log('🌱 Populando banco de dados em produção...\n');

    // 1. Criar Usuário Admin (precisa existir antes do salão)
    console.log('👤 Criando usuário admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@agendasalao.com.br' },
      update: {},
      create: {
        name: 'Administrador',
        email: 'admin@agendasalao.com.br',
        password: hashedPassword,
        role: 'ADMIN',
      }
    });
    console.log('   ✅ Admin criado: admin@agendasalao.com.br / admin123\n');

    // 2. Criar Salão (agora com ownerId)
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
    const clientPassword = await bcrypt.hash('cliente123', 10);
    const client = await prisma.user.upsert({
      where: { email: 'cliente@exemplo.com' },
      update: {},
      create: {
        name: 'Pedro Silva',
        email: 'cliente@exemplo.com',
        password: clientPassword,
        role: 'CLIENT',
        phone: '(11) 99999-8888',
      }
    });
    console.log('   ✅ Cliente criado: cliente@exemplo.com / cliente123\n');

    // 4. Criar Profissionais
    console.log('👨‍💼 Criando profissionais...');
    const staff1 = await prisma.staff.upsert({
      where: { id: 'staff-1' },
      update: {},
      create: {
        id: 'staff-1',
        name: 'Carlos Barbeiro',
        email: 'carlos@estiloecorte.com.br',
        phone: '(11) 98765-4321',
        specialty: 'Cortes Clássicos e Barba',
        salonId: salon.id,
        active: true,
      }
    });

    const staff2 = await prisma.staff.upsert({
      where: { id: 'staff-2' },
      update: {},
      create: {
        id: 'staff-2',
        name: 'João Estilista',
        email: 'joao@estiloecorte.com.br',
        phone: '(11) 98765-4322',
        specialty: 'Cortes Modernos e Degradês',
        salonId: salon.id,
        active: true,
      }
    });
    console.log('   ✅ 2 profissionais criados!\n');

    // 5. Criar Serviços
    console.log('💈 Criando serviços...');
    const service1 = await prisma.service.upsert({
      where: { id: 'service-1' },
      update: {},
      create: {
        id: 'service-1',
        name: 'Corte de Cabelo',
        description: 'Corte profissional com acabamento',
        duration: 30,
        price: 40.00,
        salonId: salon.id,
        active: true,
      }
    });

    const service2 = await prisma.service.upsert({
      where: { id: 'service-2' },
      update: {},
      create: {
        id: 'service-2',
        name: 'Barba',
        description: 'Barba completa com toalha quente',
        duration: 20,
        price: 25.00,
        salonId: salon.id,
        active: true,
      }
    });

    const service3 = await prisma.service.upsert({
      where: { id: 'service-3' },
      update: {},
      create: {
        id: 'service-3',
        name: 'Corte + Barba',
        description: 'Pacote completo de corte e barba',
        duration: 50,
        price: 60.00,
        salonId: salon.id,
        active: true,
      }
    });

    const service4 = await prisma.service.upsert({
      where: { id: 'service-4' },
      update: {},
      create: {
        id: 'service-4',
        name: 'Degradê',
        description: 'Degradê moderno com máquina',
        duration: 40,
        price: 50.00,
        salonId: salon.id,
        active: true,
      }
    });
    console.log('   ✅ 4 serviços criados!\n');

    // 6. Associar Serviços aos Profissionais
    console.log('🔗 Associando serviços aos profissionais...');
    
    // Carlos faz todos os serviços
    await prisma.serviceStaff.upsert({
      where: { serviceId_staffId: { serviceId: service1.id, staffId: staff1.id } },
      update: {},
      create: { serviceId: service1.id, staffId: staff1.id }
    });
    await prisma.serviceStaff.upsert({
      where: { serviceId_staffId: { serviceId: service2.id, staffId: staff1.id } },
      update: {},
      create: { serviceId: service2.id, staffId: staff1.id }
    });
    await prisma.serviceStaff.upsert({
      where: { serviceId_staffId: { serviceId: service3.id, staffId: staff1.id } },
      update: {},
      create: { serviceId: service3.id, staffId: staff1.id }
    });

    // João faz cortes modernos
    await prisma.serviceStaff.upsert({
      where: { serviceId_staffId: { serviceId: service1.id, staffId: staff2.id } },
      update: {},
      create: { serviceId: service1.id, staffId: staff2.id }
    });
    await prisma.serviceStaff.upsert({
      where: { serviceId_staffId: { serviceId: service4.id, staffId: staff2.id } },
      update: {},
      create: { serviceId: service4.id, staffId: staff2.id }
    });
    
    console.log('   ✅ Associações criadas!\n');

    console.log('✅ Banco populado com sucesso!\n');
    
    // Resumo
    console.log('📊 RESUMO:');
    console.log('   - 1 salão');
    console.log('   - 1 admin (admin@agendasalao.com.br / admin123)');
    console.log('   - 1 cliente (cliente@exemplo.com / cliente123)');
    console.log('   - 2 profissionais');
    console.log('   - 4 serviços');
    console.log('   - 5 associações serviço-profissional\n');

    console.log('🌐 Acesse: https://salao-production.up.railway.app');
    console.log('🔐 Login: admin@agendasalao.com.br / admin123');

  } catch (error) {
    console.error('❌ Erro ao popular banco:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
popularBanco()
  .then(() => {
    console.log('\n🎉 Processo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Falha:', error);
    process.exit(1);
  });
