// Script para listar usuários no banco Railway
// Execute: npx tsx scripts/list-users-railway.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:bfzNahVPyVcwzIewNotORAKWJFOZiFpW@gondola.proxy.rlwy.net:20615/railway'
    }
  }
});

async function listUsers() {
  try {
    console.log('📋 Conectando ao banco Railway...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            ownedSalons: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados');
      return;
    }

    console.log(`✅ Total de usuários: ${users.length}\n`);

    // Procurar especificamente pelo email
    const targetUser = users.find(u => u.email === 'agendahorasalao@gmail.com');
    
    if (targetUser) {
      console.log('🎯 USUÁRIO ENCONTRADO:');
      console.log(`   📧 Email: ${targetUser.email}`);
      console.log(`   👤 Nome: ${targetUser.name}`);
      console.log(`   🆔 ID: ${targetUser.id}`);
      console.log(`   🏢 Salões: ${targetUser._count.ownedSalons}`);
      console.log('\n');
    } else {
      console.log('❌ Email "agendahorasalao@gmail.com" NÃO encontrado\n');
    }

    console.log('📋 Todos os usuários:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Sem nome'}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(`   ✅ Ativo: ${user.active ? 'Sim' : 'Não'}`);
      console.log(`   🏢 Salões: ${user._count.ownedSalons}`);
      console.log(`   📅 Criado em: ${user.createdAt.toLocaleDateString('pt-BR')}`);
      console.log('');
    });

  } catch (error: any) {
    console.error('❌ Erro ao conectar:', error.message);
    console.error('\n⚠️  Possíveis causas:');
    console.error('   1. URL do banco incorreta');
    console.error('   2. Banco Railway não acessível de fora (railway.internal)');
    console.error('   3. Credenciais inválidas');
    console.error('\n💡 Solução: Use a URL pública do Railway ou execute via Railway CLI');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
listUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
