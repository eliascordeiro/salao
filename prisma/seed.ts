import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuário admin
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@agendasalao.com.br' },
    update: {},
    create: {
      email: 'admin@agendasalao.com.br',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
      phone: '(11) 99999-9999'
    }
  })
  console.log('✅ Admin criado:', admin.email)

  // Criar salão de exemplo
  const salon = await prisma.salon.upsert({
    where: { id: 'salon-demo-1' },
    update: {},
    create: {
      id: 'salon-demo-1',
      name: 'Barbearia Estilo & Corte',
      description: 'A melhor barbearia da região! Cortes modernos, ambiente descontraído e profissionais experientes.',
      address: 'Rua das Flores, 123 - Centro - São Paulo/SP',
      phone: '(11) 98888-7777',
      email: 'contato@estiloecorte.com.br',
      openTime: '09:00',
      closeTime: '19:00',
      workDays: '1,2,3,4,5,6', // Segunda a Sábado
      ownerId: admin.id
    }
  })
  console.log('✅ Salão criado:', salon.name)

  // Criar profissionais
  const staff1 = await prisma.staff.create({
    data: {
      name: 'Carlos Silva',
      email: 'carlos@estiloecorte.com.br',
      phone: '(11) 97777-6666',
      specialty: 'Cortes Modernos e Barbas',
      salonId: salon.id
    }
  })

  const staff2 = await prisma.staff.create({
    data: {
      name: 'João Pedro',
      email: 'joao@estiloecorte.com.br',
      phone: '(11) 96666-5555',
      specialty: 'Degradês e Pigmentação',
      salonId: salon.id
    }
  })
  console.log('✅ Profissionais criados:', staff1.name, '+', staff2.name)

  // Criar serviços
  const service1 = await prisma.service.create({
    data: {
      name: 'Corte Masculino Completo',
      description: 'Corte moderno com acabamento profissional, lavagem e finalização',
      duration: 45,
      price: 50.00,
      category: 'Corte',
      salonId: salon.id
    }
  })

  const service2 = await prisma.service.create({
    data: {
      name: 'Barba Completa',
      description: 'Aparar, modelar e hidratar a barba com produtos premium',
      duration: 30,
      price: 35.00,
      category: 'Barba',
      salonId: salon.id
    }
  })

  const service3 = await prisma.service.create({
    data: {
      name: 'Corte + Barba',
      description: 'Combo completo: corte de cabelo + barba com desconto',
      duration: 60,
      price: 75.00,
      category: 'Combo',
      salonId: salon.id
    }
  })

  const service4 = await prisma.service.create({
    data: {
      name: 'Sobrancelha',
      description: 'Design e limpeza de sobrancelha masculina',
      duration: 15,
      price: 20.00,
      category: 'Estética',
      salonId: salon.id
    }
  })

  const service5 = await prisma.service.create({
    data: {
      name: 'Degradê + Desenho',
      description: 'Corte degradê com desenhos artísticos na lateral',
      duration: 60,
      price: 70.00,
      category: 'Corte',
      salonId: salon.id
    }
  })
  console.log('✅ Serviços criados: 5 serviços')

  // Associar serviços aos profissionais
  await prisma.serviceStaff.create({ data: { serviceId: service1.id, staffId: staff1.id } })
  await prisma.serviceStaff.create({ data: { serviceId: service1.id, staffId: staff2.id } })
  await prisma.serviceStaff.create({ data: { serviceId: service2.id, staffId: staff1.id } })
  await prisma.serviceStaff.create({ data: { serviceId: service3.id, staffId: staff1.id } })
  await prisma.serviceStaff.create({ data: { serviceId: service3.id, staffId: staff2.id } })
  await prisma.serviceStaff.create({ data: { serviceId: service4.id, staffId: staff2.id } })
  await prisma.serviceStaff.create({ data: { serviceId: service5.id, staffId: staff2.id } })
  console.log('✅ Serviços associados aos profissionais')

  // Criar alguns clientes de exemplo
  const clientPassword = await bcrypt.hash('cliente123', 10)
  
  const client1 = await prisma.user.create({
    data: {
      name: 'Pedro Santos',
      email: 'pedro@exemplo.com',
      password: clientPassword,
      phone: '(11) 95555-4444',
      role: 'CLIENT'
    }
  })

  const client2 = await prisma.user.create({
    data: {
      name: 'Lucas Oliveira',
      email: 'lucas@exemplo.com',
      password: clientPassword,
      phone: '(11) 94444-3333',
      role: 'CLIENT'
    }
  })
  console.log('✅ Clientes de exemplo criados')

  // Criar alguns agendamentos de exemplo
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  await prisma.booking.create({
    data: {
      date: tomorrow,
      status: 'CONFIRMED',
      totalPrice: service1.price,
      clientId: client1.id,
      salonId: salon.id,
      serviceId: service1.id,
      staffId: staff1.id
    }
  })

  const afternoon = new Date(tomorrow)
  afternoon.setHours(14, 30, 0, 0)

  await prisma.booking.create({
    data: {
      date: afternoon,
      status: 'PENDING',
      totalPrice: service3.price,
      clientId: client2.id,
      salonId: salon.id,
      serviceId: service3.id,
      staffId: staff2.id
    }
  })
  console.log('✅ Agendamentos de exemplo criados')

  console.log('')
  console.log('🎉 Seed concluído com sucesso!')
  console.log('')
  console.log('📝 Credenciais de acesso:')
  console.log('   Admin: admin@agendasalao.com.br / admin123')
  console.log('   Cliente: pedro@exemplo.com / cliente123')
  console.log('')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
