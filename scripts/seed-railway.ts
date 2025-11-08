#!/usr/bin/env tsx
/**
 * Script para popular o banco de dados Railway com dados iniciais
 * 
 * IMPORTANTE: Execute este script APÓS aplicar as migrações
 * 
 * Uso:
 * 1. Local: npx tsx scripts/seed-railway.ts
 * 2. Railway: railway run npx tsx scripts/seed-railway.ts
 */

import { PrismaClient } from '@prisma/client';
// @ts-ignore - bcryptjs types
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedRailway() {
  console.log('\n🌱 Populando banco de dados Railway...\n');

  try {
    // 1. Verificar se já existe usuário admin
    console.log('👤 Verificando usuário admin...');
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@agendasalao.com.br' }
    });

    let adminUser;
    if (existingAdmin) {
      console.log('✅ Admin já existe: admin@agendasalao.com.br');
      adminUser = existingAdmin;
    } else {
      console.log('📝 Criando usuário admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@agendasalao.com.br',
          password: hashedPassword,
          role: 'ADMIN',
          phone: '(11) 99999-9999',
        }
      });
      console.log('✅ Admin criado: admin@agendasalao.com.br / admin123');
    }

    // 2. Verificar se já existe salão
    console.log('\n🏢 Verificando salão...');
    const existingSalon = await prisma.salon.findFirst();

    let salon;
    if (existingSalon) {
      console.log('✅ Salão já existe:', existingSalon.name);
      salon = existingSalon;
    } else {
      console.log('📝 Criando salão padrão...');
      salon = await prisma.salon.create({
        data: {
          name: 'Salão Exemplo',
          description: 'Salão de beleza completo',
          address: 'Rua Exemplo, 123 - Centro',
          phone: '(11) 98888-8888',
          email: 'contato@salaoexemplo.com.br',
          openTime: '09:00',
          closeTime: '19:00',
          workDays: '1,2,3,4,5,6', // Seg-Sab
          bookingType: 'BOTH',
          active: true,
          ownerId: adminUser.id,
        }
      });
      console.log('✅ Salão criado:', salon.name);
    }

    // 3. Verificar profissionais
    console.log('\n👨‍💼 Verificando profissionais...');
    const existingStaff = await prisma.staff.findMany();

    if (existingStaff.length > 0) {
      console.log(`✅ ${existingStaff.length} profissional(is) já cadastrado(s)`);
    } else {
      console.log('📝 Criando profissionais...');
      
      const staff1 = await prisma.staff.create({
        data: {
          name: 'João Silva',
          email: 'joao@salaoexemplo.com.br',
          phone: '(11) 97777-7777',
          specialty: 'Cortes Masculinos',
          active: true,
          salonId: salon.id,
        }
      });

      const staff2 = await prisma.staff.create({
        data: {
          name: 'Maria Santos',
          email: 'maria@salaoexemplo.com.br',
          phone: '(11) 96666-6666',
          specialty: 'Manicure e Pedicure',
          active: true,
          salonId: salon.id,
        }
      });

      console.log('✅ Profissionais criados:');
      console.log(`   - ${staff1.name} (${staff1.specialty})`);
      console.log(`   - ${staff2.name} (${staff2.specialty})`);
    }

    // 4. Verificar serviços
    console.log('\n💇 Verificando serviços...');
    const existingServices = await prisma.service.findMany();

    if (existingServices.length > 0) {
      console.log(`✅ ${existingServices.length} serviço(s) já cadastrado(s)`);
    } else {
      console.log('📝 Criando serviços...');
      
      const staff = await prisma.staff.findMany({ where: { salonId: salon.id } });

      const service1 = await prisma.service.create({
        data: {
          name: 'Corte Masculino',
          description: 'Corte tradicional masculino',
          duration: 30,
          price: 35,
          category: 'Corte',
          active: true,
          salonId: salon.id,
          staff: {
            connect: staff.filter(s => s.specialty?.includes('Corte')).map(s => ({ id: s.id }))
          }
        }
      });

      const service2 = await prisma.service.create({
        data: {
          name: 'Manicure',
          description: 'Manicure completa com esmaltação',
          duration: 45,
          price: 30,
          category: 'Unhas',
          active: true,
          salonId: salon.id,
          staff: {
            connect: staff.filter(s => s.specialty?.includes('Manicure')).map(s => ({ id: s.id }))
          }
        }
      });

      const service3 = await prisma.service.create({
        data: {
          name: 'Barba',
          description: 'Barba completa com navalha',
          duration: 20,
          price: 25,
          category: 'Barba',
          active: true,
          salonId: salon.id,
          staff: {
            connect: staff.filter(s => s.specialty?.includes('Corte')).map(s => ({ id: s.id }))
          }
        }
      });

      console.log('✅ Serviços criados:');
      console.log(`   - ${service1.name} (${service1.duration}min - R$ ${service1.price})`);
      console.log(`   - ${service2.name} (${service2.duration}min - R$ ${service2.price})`);
      console.log(`   - ${service3.name} (${service3.duration}min - R$ ${service3.price})`);
    }

    // 5. Criar cliente de teste se não existir
    console.log('\n👤 Verificando cliente de teste...');
    const existingClient = await prisma.user.findUnique({
      where: { email: 'pedro@exemplo.com' }
    });

    if (existingClient) {
      console.log('✅ Cliente de teste já existe: pedro@exemplo.com');
    } else {
      console.log('📝 Criando cliente de teste...');
      const hashedPassword = await bcrypt.hash('cliente123', 10);
      await prisma.user.create({
        data: {
          name: 'Pedro Exemplo',
          email: 'pedro@exemplo.com',
          password: hashedPassword,
          role: 'CLIENT',
          phone: '(11) 95555-5555',
        }
      });
      console.log('✅ Cliente criado: pedro@exemplo.com / cliente123');
    }

    // 6. Resumo final
    console.log('\n📊 RESUMO DO BANCO:');
    console.log('═'.repeat(60));

    const counts = {
      users: await prisma.user.count(),
      salons: await prisma.salon.count(),
      staff: await prisma.staff.count(),
      services: await prisma.service.count(),
      bookings: await prisma.booking.count(),
    };

    console.log(`👥 Usuários:       ${counts.users}`);
    console.log(`🏢 Salões:         ${counts.salons}`);
    console.log(`👨‍💼 Profissionais: ${counts.staff}`);
    console.log(`💇 Serviços:       ${counts.services}`);
    console.log(`📅 Agendamentos:   ${counts.bookings}`);

    console.log('\n✅ Banco populado com sucesso!\n');
    console.log('🔑 Credenciais de acesso:');
    console.log('   Admin:   admin@agendasalao.com.br / admin123');
    console.log('   Cliente: pedro@exemplo.com / cliente123\n');

  } catch (error) {
    console.error('\n❌ Erro ao popular banco:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar seed
seedRailway()
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
