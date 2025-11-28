const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Verificar se já existem dados
  const existingUsers = await prisma.user.count();
  
  if (existingUsers > 0) {
    console.log('⚠️  Banco de dados já contém dados. Pulando seed.');
    return;
  }

  // 1. Criar usuários
  console.log('👤 Criando usuários...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const clientPassword = await bcrypt.hash('cliente123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@agendasalao.com.br',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const client1 = await prisma.user.create({
    data: {
      name: 'Pedro Silva',
      email: 'pedro@exemplo.com',
      password: clientPassword,
      role: 'CLIENT',
    },
  });

  const client2 = await prisma.user.create({
    data: {
      name: 'Maria Santos',
      email: 'maria@exemplo.com',
      password: clientPassword,
      role: 'CLIENT',
    },
  });

  console.log('✅ Usuários criados!');

  // 2. Criar salão
  console.log('🏢 Criando salão...');
  
  const salon = await prisma.salon.create({
    data: {
      name: 'Salão Elegance',
      address: 'Rua das Flores, 123 - Centro',
      phone: '(11) 98765-4321',
      email: 'contato@elegance.com.br',
      openTime: '09:00',
      closeTime: '19:00',
      workDays: '1,2,3,4,5,6', // Seg-Sáb
      active: true,
      ownerId: admin.id,
    },
  });

  console.log('✅ Salão criado!');

  // 3. Criar planos de assinatura
  console.log('💳 Criando planos de assinatura...');
  
  const planEssencial = await prisma.plan.create({
    data: {
      name: 'Essencial',
      slug: 'essencial',
      description: 'Perfeito para salões pequenos que estão começando',
      price: 49.00,
      maxStaff: 2,
      maxUsers: 1,
      features: [
        'Até 2 profissionais',
        'Agendamentos ilimitados',
        'Catálogo de serviços',
        'Calendário e horários',
        'Notificações por email',
        '14 dias grátis'
      ],
      active: true,
    },
  });

  const planProfissional = await prisma.plan.create({
    data: {
      name: 'Profissional',
      slug: 'profissional',
      description: 'Para salões que querem crescer e ter todos os recursos',
      price: 149.00,
      maxStaff: null, // ilimitado
      maxUsers: 5,
      features: [
        'Profissionais ilimitados',
        'Pagamentos online (Stripe)',
        'WhatsApp Business',
        'Relatórios financeiros',
        'Controle de despesas',
        'Multi-usuários (5 admins)',
        'Chat com IA',
        'Suporte prioritário',
        '14 dias grátis'
      ],
      active: true,
    },
  });

  console.log('✅ Planos criados!');

  // 4. Criar profissionais
  console.log('💇 Criando profissionais...');
  
  const staff1 = await prisma.staff.create({
    data: {
      name: 'João Silva',
      email: 'joao@elegance.com.br',
      phone: '(11) 91234-5678',
      specialty: 'Cortes Masculinos e Barba',
      active: true,
      salonId: salon.id,
    },
  });

  const staff2 = await prisma.staff.create({
    data: {
      name: 'Ana Costa',
      email: 'ana@elegance.com.br',
      phone: '(11) 91234-5679',
      specialty: 'Cortes Femininos e Coloração',
      active: true,
      salonId: salon.id,
    },
  });

  const staff3 = await prisma.staff.create({
    data: {
      name: 'Carlos Mendes',
      email: 'carlos@elegance.com.br',
      phone: '(11) 91234-5680',
      specialty: 'Barbeiro Especialista',
      active: true,
      salonId: salon.id,
    },
  });

  console.log('✅ Profissionais criados!');

  // 4. Criar serviços
  console.log('✂️  Criando serviços...');
  
  const service1 = await prisma.service.create({
    data: {
      name: 'Corte Masculino',
      description: 'Corte de cabelo masculino com acabamento profissional',
      duration: 30,
      price: 45.00,
      category: 'Corte',
      active: true,
      salonId: salon.id,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      name: 'Corte Feminino',
      description: 'Corte de cabelo feminino com lavagem e finalização',
      duration: 60,
      price: 80.00,
      category: 'Corte',
      active: true,
      salonId: salon.id,
    },
  });

  const service3 = await prisma.service.create({
    data: {
      name: 'Barba',
      description: 'Barba feita com navalha e acabamento',
      duration: 20,
      price: 30.00,
      category: 'Barba',
      active: true,
      salonId: salon.id,
    },
  });

  const service4 = await prisma.service.create({
    data: {
      name: 'Coloração',
      description: 'Coloração completa com produtos de qualidade',
      duration: 120,
      price: 150.00,
      category: 'Coloração',
      active: true,
      salonId: salon.id,
    },
  });

  const service5 = await prisma.service.create({
    data: {
      name: 'Hidratação',
      description: 'Tratamento de hidratação profunda',
      duration: 45,
      price: 60.00,
      category: 'Tratamento',
      active: true,
      salonId: salon.id,
    },
  });

  const service6 = await prisma.service.create({
    data: {
      name: 'Escova',
      description: 'Escova modeladora com secador',
      duration: 40,
      price: 50.00,
      category: 'Finalização',
      active: true,
      salonId: salon.id,
    },
  });

  console.log('✅ Serviços criados!');

  // 5. Associar profissionais aos serviços
  console.log('🔗 Associando profissionais aos serviços...');
  
  // João faz cortes masculinos e barba
  await prisma.serviceStaff.createMany({
    data: [
      { serviceId: service1.id, staffId: staff1.id },
      { serviceId: service3.id, staffId: staff1.id },
    ],
  });

  // Ana faz cortes femininos, coloração e hidratação
  await prisma.serviceStaff.createMany({
    data: [
      { serviceId: service2.id, staffId: staff2.id },
      { serviceId: service4.id, staffId: staff2.id },
      { serviceId: service5.id, staffId: staff2.id },
      { serviceId: service6.id, staffId: staff2.id },
    ],
  });

  // Carlos faz cortes masculinos e barba
  await prisma.serviceStaff.createMany({
    data: [
      { serviceId: service1.id, staffId: staff3.id },
      { serviceId: service3.id, staffId: staff3.id },
    ],
  });

  console.log('✅ Associações criadas!');

  console.log('\n✨ Seed concluído com sucesso!\n');
  console.log('📋 Dados criados:');
  console.log(`   • 3 usuários (1 admin, 2 clientes)`);
  console.log(`   • 1 salão`);
  console.log(`   • 2 planos de assinatura`);
  console.log(`   • 3 profissionais`);
  console.log(`   • 6 serviços`);
  console.log(`   • 10 associações serviço-profissional\n`);
  console.log('🔐 Credenciais de teste:');
  console.log(`   Admin: admin@agendasalao.com.br / admin123`);
  console.log(`   Cliente: pedro@exemplo.com / cliente123`);
  console.log(`   Cliente: maria@exemplo.com / cliente123\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
